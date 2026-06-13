export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/trending
 *
 * Returns top 10 trending products by affiliate click count (last 7 days).
 * Falls back to most-reviewed mock products if Supabase unavailable.
 */

import { NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'
import { MOCK_PRODUCTS } from '@/lib/mock-data'

export async function GET() {
  try {
    const db = tryGetServerClient()

    if (db) {
      // Count clicks per offer in last 7 days, join back to products
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: clicks, error } = await (db as any)
        .from('click_tracking')
        .select('offer_id')
        .gte('clicked_at', since)

      if (!error && clicks && clicks.length > 0) {
        // Count per offer_id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const offerCounts: Record<string, number> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(clicks as any[]).forEach((c: any) => {
          if (c.offer_id) offerCounts[c.offer_id] = (offerCounts[c.offer_id] ?? 0) + 1
        })

        const topOfferIds = Object.entries(offerCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([id]) => id)

        if (topOfferIds.length > 0) {
          // Get product_ids for these offers
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: offers } = await (db as any)
            .from('offers')
            .select('id, product_id')
            .in('id', topOfferIds)

          if (offers && offers.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const offerToProduct: Record<string, string> = {}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(offers as any[]).forEach((o: any) => { offerToProduct[o.id] = o.product_id })

            // Aggregate click counts per product
            const productCounts: Record<string, number> = {}
            topOfferIds.forEach(offerId => {
              const pid = offerToProduct[offerId]
              if (pid) productCounts[pid] = (productCounts[pid] ?? 0) + (offerCounts[offerId] ?? 0)
            })

            const topProductIds = Object.entries(productCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([id]) => id)

            // Fetch product details
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: products } = await (db as any)
              .from('products_with_best_offer')
              .select('id, name, slug, image_url, best_price')
              .in('id', topProductIds)

            if (products && products.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const trending = (products as any[]).map((p: any) => ({
                product_id:  p.id,
                name:        p.name,
                slug:        p.slug,
                image_url:   p.image_url,
                best_price:  p.best_price,
                click_count: productCounts[p.id] ?? 0,
              })).sort((a: { click_count: number }, b: { click_count: number }) => b.click_count - a.click_count)

              return NextResponse.json({ success: true, data: trending })
            }
          }
        }
      }
    }

    // Mock fallback — use most-reviewed products
    const trending = [...MOCK_PRODUCTS]
      .sort((a, b) => b.totalReviews - a.totalReviews)
      .slice(0, 10)
      .map((p, i) => ({
        product_id:  p.id,
        name:        p.name,
        slug:        p.slug,
        image_url:   p.images[0] ?? null,
        best_price:  p.lowestPrice,
        click_count: Math.max(0, 500 - i * 40),
      }))

    return NextResponse.json({ success: true, data: trending })
  } catch (err) {
    console.error('[GET /api/trending]', err)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data trending' },
      { status: 500 }
    )
  }
}
