export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/search?q=...
 *
 * Full-text search across products. Returns top 10 matches.
 * Uses Supabase full-text search (search_vector) when available,
 * falls back to ilike on name + brand.
 * Results are ordered by relevance (title-match quality) then price.
 */

import { NextRequest, NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'
import { MOCK_PRODUCTS, searchProducts as mockSearch } from '@/lib/mock-data'

function scoreRelevance(name: string, query: string): number {
  const n = name.toLowerCase()
  const q = query.toLowerCase()
  const words = q.split(/\s+/).filter(Boolean)
  if (n.startsWith(q)) return 3
  if (words.length > 1 && words.every(w => n.includes(w))) return 2
  if (words.some(w => n.includes(w))) return 1
  return 0
}

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
        .limit(20)

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
        const results = (ftsData as any[])
          .map((p: any) => ({
            id:         p.id,
            name:       p.name,
            slug:       p.slug,
            brand:      p.brand,
            category:   p.category,
            image_url:  p.image_url,
            best_price: priceMap[p.id] ?? null,
            _score:     scoreRelevance(p.name, query),
          }))
          .sort((a, b) => b._score - a._score || (a.best_price ?? Infinity) - (b.best_price ?? Infinity))
          .slice(0, 10)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map(({ _score, ...p }: any) => p)

        return NextResponse.json({ success: true, data: results })
      }

      // Fallback to ilike if FTS returns nothing or errors
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: likeData } = await (db as any)
        .from('products_with_best_offer')
        .select('id, name, slug, brand, category, image_url, best_price')
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
        .limit(30)

      if (likeData) {
        // Sort by relevance in JS, then price as tiebreaker
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sorted = (likeData as any[])
          .map((item: any) => ({ ...item, _score: scoreRelevance(item.name, query) }))
          .sort((a, b) => b._score - a._score || (a.best_price ?? Infinity) - (b.best_price ?? Infinity))
          .slice(0, 10)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map(({ _score, ...item }: any) => item)

        return NextResponse.json({ success: true, data: sorted })
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
