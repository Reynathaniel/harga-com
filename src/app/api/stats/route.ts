/**
 * GET /api/stats
 *
 * Homepage stats: total products, merchants, avg savings, price comparisons.
 * Falls back to mock data if Supabase unavailable.
 */

import { NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { PLATFORMS } from '@/lib/platforms'

const MOCK_STATS = {
  totalProducts:         MOCK_PRODUCTS.length,
  totalMerchants:        Object.keys(PLATFORMS).length,
  avgSavingsPct:         18,
  totalPriceComparisons: 1_000_000,
}

export async function GET() {
  try {
    const db = tryGetServerClient()

    if (db) {
      const [productsRes, merchantsRes, clicksRes] = await Promise.allSettled([
        db.from('products').select('id', { count: 'exact', head: true }),
        db.from('merchants').select('id', { count: 'exact', head: true }).eq('active', true),
        db.from('click_tracking').select('id', { count: 'exact', head: true }),
      ])

      const totalProducts  = productsRes.status  === 'fulfilled' ? (productsRes.value.count  ?? MOCK_STATS.totalProducts)  : MOCK_STATS.totalProducts
      const totalMerchants = merchantsRes.status === 'fulfilled' ? (merchantsRes.value.count ?? MOCK_STATS.totalMerchants) : MOCK_STATS.totalMerchants
      const totalClicks    = clicksRes.status    === 'fulfilled' ? (clicksRes.value.count    ?? 0)                         : 0

      // Estimate avg savings from cashback rates
      let avgSavingsPct = MOCK_STATS.avgSavingsPct
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rates } = await (db as any)
          .from('cashback_rates')
          .select('rate_percent')
          .is('category', null)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (rates && (rates as any[]).length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sum = (rates as any[]).reduce((acc: number, r: any) => acc + r.rate_percent, 0)
          avgSavingsPct = Math.round(sum / rates.length)
        }
      } catch { /* use default */ }

      return NextResponse.json({
        success: true,
        data: {
          totalProducts,
          totalMerchants,
          avgSavingsPct,
          totalPriceComparisons: totalClicks + MOCK_STATS.totalPriceComparisons,
        },
      })
    }

    return NextResponse.json({ success: true, data: MOCK_STATS })
  } catch (err) {
    console.error('[GET /api/stats]', err)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil statistik' },
      { status: 500 }
    )
  }
}
