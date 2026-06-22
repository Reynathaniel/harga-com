export const dynamic = 'force-dynamic'

/**
 * GET /api/vehicles/[brand]/[model]/[year]
 *
 * Returns all listings for a given brand/model/year from different sellers,
 * sorted by price ascending. Supports vehicle comparison feature.
 *
 * Example: /api/vehicles/toyota/avanza/2020
 */

import { NextRequest, NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'

interface Params {
  brand: string
  model: string
  year: string
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Params }
) {
  const brand = decodeURIComponent(params.brand).toLowerCase()
  const model = decodeURIComponent(params.model).toLowerCase()
  const year  = parseInt(params.year, 10)

  if (!brand || !model || isNaN(year)) {
    return NextResponse.json(
      { ok: false, error: 'brand, model, and year are required' },
      { status: 400 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = tryGetServerClient() as any
  if (!db) {
    return NextResponse.json({ ok: false, error: 'DB not configured' }, { status: 503 })
  }

  try {
    // Find matching products by vehicle columns
    const { data: products, error: pErr } = await db
      .from('products')
      .select(`
        id, name, slug, image_url,
        vehicle_brand, vehicle_model, vehicle_year, vehicle_type,
        vehicle_mileage, vehicle_transmission, vehicle_color, vehicle_location
      `)
      .ilike('vehicle_brand', `%${brand}%`)
      .ilike('vehicle_model', `%${model}%`)
      .eq('vehicle_year', year)
      .limit(50)

    if (pErr) {
      // If vehicle columns don't exist yet, fall back to category search
      const { data: fallback } = await db
        .from('products')
        .select('id, name, slug, image_url')
        .ilike('name', `%${brand}%${model}%${year}%`)
        .limit(20)
      return NextResponse.json({ ok: true, listings: fallback ?? [], source: 'name-fallback', year, brand, model })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ ok: true, listings: [], year, brand, model })
    }

    // Fetch best offer for each product
    const ids = products.map((p: { id: string }) => p.id)
    const { data: offers } = await db
      .from('offers')
      .select(`
        product_id, price, url, affiliate_url, location, condition,
        merchants ( name, slug, color, logo_url )
      `)
      .in('product_id', ids)
      .eq('in_stock', true)
      .order('price', { ascending: true })

    // Join
    const offersByProduct: Record<string, typeof offers> = {}
    for (const o of (offers ?? [])) {
      if (!offersByProduct[o.product_id]) offersByProduct[o.product_id] = []
      offersByProduct[o.product_id].push(o)
    }

    const listings = products.map((p: {
      id: string
      name: string
      slug: string
      image_url: string | null
      vehicle_brand: string | null
      vehicle_model: string | null
      vehicle_year: number | null
      vehicle_type: string | null
      vehicle_mileage: number | null
      vehicle_transmission: string | null
      vehicle_color: string | null
      vehicle_location: string | null
    }) => ({
      ...p,
      offers: (offersByProduct[p.id] ?? []).sort(
        (a: { price: number }, b: { price: number }) => a.price - b.price
      ),
      lowestPrice: offersByProduct[p.id]?.[0]?.price ?? null,
    })).sort((a: { lowestPrice: number | null }, b: { lowestPrice: number | null }) => {
      if (a.lowestPrice === null) return 1
      if (b.lowestPrice === null) return -1
      return a.lowestPrice - b.lowestPrice
    })

    return NextResponse.json({
      ok: true,
      brand: params.brand,
      model: params.model,
      year,
      total: listings.length,
      listings,
    })
  } catch (err) {
    console.error('[GET /api/vehicles]', err)
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    )
  }
}
