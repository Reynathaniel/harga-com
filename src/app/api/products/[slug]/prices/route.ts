/**
 * GET /api/products/[slug]/prices
 * Returns all current offers, sorted cheapest first.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getProductBySlug } from '@/lib/db/products'
import { tryGetServerClient } from '@/lib/supabase'
import { PLATFORMS } from '@/lib/platforms'

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  try {
    const product = await getProductBySlug(slug)
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    const db = tryGetServerClient()
    let cashbackRates: Record<string, number> = {}

    if (db) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rates } = await (db as any)
        .from('cashback_rates')
        .select('*, merchant:merchants(platform_id)')
        .is('category', null)

      if (rates) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(rates as any[]).forEach((r: any) => {
          const pid = r.merchant?.platform_id
          if (pid) cashbackRates[pid] = r.rate_percent
        })
      }
    } else {
      Object.values(PLATFORMS).forEach(p => {
        cashbackRates[p.id] = p.cashbackPct
      })
    }

    const offers = product.listings.map(listing => ({
      ...listing,
      cashbackPct: cashbackRates[listing.platformId] ?? PLATFORMS[listing.platformId]?.cashbackPct ?? 0,
      cashbackAmount: Math.round(
        listing.price * (cashbackRates[listing.platformId] ?? PLATFORMS[listing.platformId]?.cashbackPct ?? 0) / 100
      ),
      platformName:  PLATFORMS[listing.platformId]?.name ?? listing.platformId,
      platformColor: PLATFORMS[listing.platformId]?.color ?? '#888',
    }))

    return NextResponse.json({
      success: true,
      data: {
        productId:          product.id,
        productName:        product.name,
        offers,
        cheapestPrice:      Math.min(...offers.map(o => o.price)),
        mostExpensivePrice: Math.max(...offers.map(o => o.price)),
        maxCashbackPct:     Math.max(...offers.map(o => o.cashbackPct)),
      },
    })
  } catch (err) {
    console.error('[GET /api/products/:slug/prices]', err)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data harga' },
      { status: 500 }
    )
  }
}
