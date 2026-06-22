/**
 * GET /api/products/[slug]/history
 * Returns price history for chart rendering.
 *
 * Query params:
 *   days - number of days to look back (default 30, max 90)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getProductBySlug } from '@/lib/db/products'
import { getPriceHistory } from '@/lib/db/price-history'
import { format } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params
  const rawDays = Number(request.nextUrl.searchParams.get('days') ?? 30)
  const days = Math.min(Math.max(rawDays, 7), 90)

  try {
    const product = await getProductBySlug(slug)
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    const history = await getPriceHistory(product.id, days)

    const chartData = history.map(h => ({
      date: format(h.date, 'd MMM'),
      ...h.prices,
    }))

    const allPrices = history.flatMap(h =>
      Object.values(h.prices).filter((p): p is number => p != null)
    )
    const lowestInPeriod  = allPrices.length ? Math.min(...allPrices) : null
    const highestInPeriod = allPrices.length ? Math.max(...allPrices) : null

    return NextResponse.json({
      success: true,
      data: {
        productId: product.id,
        days,
        chartData,
        stats: {
          lowestInPeriod,
          highestInPeriod,
          priceDeltaPct: lowestInPeriod && highestInPeriod
            ? Math.round(((highestInPeriod - lowestInPeriod) / lowestInPeriod) * 100)
            : 0,
        },
      },
    })
  } catch (err) {
    console.error('[GET /api/products/:slug/history]', err)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil riwayat harga' },
      { status: 500 }
    )
  }
}
