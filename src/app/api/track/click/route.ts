import { NextRequest, NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * POST /api/track/click
 * Body: { productId: string, offerId?: string, platform?: string }
 *
 * Increments click_count on the product and marks it as popular
 * when it crosses the threshold (10 clicks).
 */
export async function POST(req: NextRequest) {
  try {
    const { productId, offerId, platform } = await req.json()
    if (!productId) return NextResponse.json({ ok: false }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = tryGetServerClient() as any
    if (!db) return NextResponse.json({ ok: false })

    // Atomically increment click count via RPC
    await db.rpc('increment_product_clicks', { product_uuid: productId })

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
