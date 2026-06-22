/**
 * GET /api/products
 *
 * Query params:
 *   q        - search query
 *   category - category filter
 *   platform - platform filter (tokopedia|shopee|lazada|bukalapak|blibli|tiktok)
 *   min      - minimum price (IDR)
 *   max      - maximum price (IDR)
 *   sort     - lowest | highest | rating | popular | newest
 *   limit    - results per page (default 40, max 100)
 *   offset   - pagination offset (default 0)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/db/products'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const query    = searchParams.get('q')        ?? ''
  const category = searchParams.get('category') ?? undefined
  const platform = searchParams.get('platform') ?? undefined
  const minPrice = searchParams.get('min')  ? Number(searchParams.get('min'))  : undefined
  const maxPrice = searchParams.get('max')  ? Number(searchParams.get('max'))  : undefined
  const rawSort  = searchParams.get('sort') ?? 'lowest'
  const limit    = Math.min(Number(searchParams.get('limit')  ?? 40), 100)
  const offset   = Number(searchParams.get('offset') ?? 0)

  const sort = ['lowest', 'highest', 'rating', 'popular', 'newest'].includes(rawSort)
    ? rawSort as 'lowest' | 'highest' | 'rating' | 'popular' | 'newest'
    : 'lowest'

  try {
    const result = await getProducts({ query, category, platform, minPrice, maxPrice, sort, limit, offset })

    return NextResponse.json({
      success: true,
      data: {
        products: result.products,
        total:    result.total,
        source:   result.source,
        limit,
        offset,
        hasMore:  offset + limit < result.total,
      },
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    })
  } catch (err) {
    console.error('[GET /api/products]', err)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data produk' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
