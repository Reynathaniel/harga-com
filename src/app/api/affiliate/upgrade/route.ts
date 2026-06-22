import { NextRequest, NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/affiliate/upgrade?limit=50
 *
 * Returns popular products whose offers still lack affiliate URLs.
 * Call this (manually or via cron) after adding affiliate credentials to
 * identify which products deserve affiliate URL generation first.
 *
 * When you add AFFILIATE_SHOPEE_ID / AFFILIATE_TOKOPEDIA_ID etc. to env,
 * run a script that fetches this list and updates offer.affiliate_url for each.
 */
export async function GET(req: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = tryGetServerClient() as any
  if (!db) return NextResponse.json({ ok: false, error: 'DB unavailable' }, { status: 503 })

  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 50), 200)

  try {
    // Popular products ordered by click count
    const { data: popular, error: popErr } = await db
      .from('products')
      .select('id, name, click_count, popular_since')
      .eq('is_popular', true)
      .order('click_count', { ascending: false })
      .limit(limit)

    if (popErr) throw popErr

    const productIds = (popular ?? []).map((p: { id: string }) => p.id)

    if (productIds.length === 0) {
      return NextResponse.json({
        ok: true,
        popular_count: 0,
        products: [],
        offers_ready_for_affiliate: [],
      })
    }

    // Offers that belong to popular products but still have no affiliate URL
    const { data: offers, error: offErr } = await db
      .from('offers')
      .select('id, product_id, merchant_id, url, affiliate_url')
      .in('product_id', productIds)

    if (offErr) throw offErr

    const offersWithoutAffiliate = (offers ?? []).filter(
      (o: { affiliate_url: string | null }) => !o.affiliate_url
    )

    return NextResponse.json({
      ok: true,
      popular_count: popular?.length ?? 0,
      products: popular ?? [],
      offers_ready_for_affiliate: offersWithoutAffiliate,
      // Convenience: unique merchant IDs that need affiliate setup
      merchants_needed: Array.from(
        new Set(
          offersWithoutAffiliate.map((o: { merchant_id: string }) => o.merchant_id)
        )
      ),
    })
  } catch (err) {
    console.error('[GET /api/affiliate/upgrade]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
