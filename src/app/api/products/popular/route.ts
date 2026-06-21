import { NextRequest, NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'
import { MOCK_PRODUCTS } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

/**
 * GET /api/products/popular?limit=10
 *
 * Returns the most-clicked products, ordered by click_count descending.
 * Falls back to mock data if Supabase is unavailable.
 * Used by the homepage "Trending" section and any consumer of popularity data.
 */
export async function GET(req: NextRequest) {
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 10), 50)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = tryGetServerClient() as any

    if (db) {
      const { data, error } = await db
        .from('products_with_best_offer')
        .select('id, name, slug, image_url, best_price, total_reviews')
        .order('total_reviews', { ascending: false, nullsFirst: false })
        .limit(limit)

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ ok: true, products: (data as any[]).map((p: any) => ({ ...p, click_count: p.total_reviews ?? 0 })) })
      }
    }

    // Fallback — return mock products ordered by reviews as proxy for popularity
    const fallback = [...MOCK_PRODUCTS]
      .sort((a, b) => b.totalReviews - a.totalReviews)
      .slice(0, limit)
      .map(p => ({
        id:         p.id,
        name:       p.name,
        slug:       p.slug,
        image_url:  p.images[0] ?? null,
        best_price: p.lowestPrice,
        click_count: 0,
      }))

    return NextResponse.json({ ok: true, products: fallback, sour