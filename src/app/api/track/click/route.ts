import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { tryGetServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * POST /api/track/click
 * Body: { productId: string, offerId?: string, platform?: string }
 *
 * 1. Atomically increments click_count on the product
 * 2. Inserts a row into click_tracking (for trending/stats analytics)
 * 3. Graduates product to popular when threshold reached
 */
export async function POST(req: NextRequest) {
  try {
    const { productId, offerId, platform } = await req.json()
    if (!productId) return NextResponse.json({ ok: false }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = tryGetServerClient() as any
    if (!db) return NextResponse.json({ ok: false })

    // Hash IP for privacy-safe analytics
    const rawIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'
    const ipHash = createHash('sha256')
      .update(rawIp + (process.env.IP_HASH_SALT ?? 'harga-salt'))
      .digest('hex')

    // Run in parallel: increment click_count + insert click_tracking row
    await Promise.allSettled([
      // 1. Atomically increment click count via RPC
      db.rpc('increment_product_clicks', { product_uuid: productId }),

      // 2. Insert into click_tracking for analytics (only when offerId is known)
      offerId
        ? db.from('click_tracking').insert({
            offer_id:   offerId,
            ip_hash:    ipHash,
            session_id: req.headers.get('x-session-id') ?? null,
            user_agent: req.headers.get('user-agent')   ?? null,
            referer:    req.headers.get('referer')       ?? null,
          })
        : Promise.resolve(),
    ])

    // Read updated count
    const { data: product } = await db
      .from('products')
      .select('click_count, is_popular')
      .eq('id', productId)
      .single()

    // Graduate to popular when threshold reached
    const POPULARITY_THRESHOLD = 10
    if (product && product.click_count >= POPULARITY_THRESHOLD && !product.is_popular) {
      await db
        .from('products')
        .update({ is_popular: true, popular_since: new Date().toISOString() })
        .eq('id', productId)
    }

    return NextResponse.json({
      ok: true,
      clicks: product?.click_count ?? null,
      is_popular: product?.is_popular ?? false,
    })
  } catch (err) {
    console.error('[POST /api/track/click]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
