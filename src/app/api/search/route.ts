/**
 * GET /api/search?q=...
 *
 * Full-text search across products. Returns top 10 matches.
 * Uses Supabase full-text search (search_vector) when available,
 * falls back to ilike on name + brand.
 */

import { NextRequest, NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'
import { MOCK_PRODUCTS, searchProducts as mockSearch } from '@/lib/mock-data'

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (!query) {
    return NextResponse.json({ success: true, data: [] })
  }

  try {
    const db = tryGetServerClient()

    if (db) {
      // Try full-text search first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: ftsData, error: ftsError } = await (db as any)
        .from('products')
        .select('id, name, slug, brand, category, image_url')
        .textSearch('search_vector', query, { type: 'websearch', config: 'indonesian' })
        .limit(10)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!ftsError && ftsData && (ftsData as any[]).length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ids = (ftsData as any[]).map((p: any) => p.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: priceData } = await (db as any)
          .from('products_with_best_offer')
          .select('id, best_price')
          .in('id', ids)

        const priceMap: Record<string, number | null> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(priceData ?? []).forEach((r: any) => { priceMap[r.id] = r.best_price })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results = (ftsData as any[]).map((p: any) => ({
          id:         p.id,
          name:       p.name,
          slug:       p.slug,
          brand:      p.brand,
          category:   p.category,
          image_url:  p.image_url,
          best_price: priceMap[p.id] ?? null,
        }))

        return NextResponse.json({ success: true, data: results })
      }

      // Fallback to ilike if FTS returns nothing or errors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: likeData } = await (db as any)
        .from('products_with_best_offer')
        .select('id, name, slug, brand, category, image_url, best_price')
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
        .order('best_price', { ascending: true })
        .limit(10)

      if (likeData) {
        return NextResponse.json({ success: true, data: likeData })
      }
    }

    // Mock fallback
    const results = mockSearch(query).slice(0, 10).map(p => ({
      id:         p.id,
      name:       p.name,
      slug:       p.slug,
      brand:      p.brand,
      category:   p.category,
      image_url:  p.images[0] ?? null,
      best_price: p.lowestPrice,
    }))

    return NextResponse.json({ success: true, data: results })
  } catch (err) {
    console.error('[GET /api/search]', err)
    return NextResponse.json(
      { success: false, error: 'Gagal melakukan pencarian' },
      { status: 500 }
    )
  }
}
