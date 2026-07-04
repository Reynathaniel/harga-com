import { NextRequest, NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'

export const revalidate = 3600 // 1 hour cache

// Map URL slug or label → DB category label
const CATEGORY_MAP: Record<string, string> = {
  'rumah-bekas':  'Rumah Bekas',
  'tanah-bekas':  'Tanah Bekas',
  'Rumah Bekas':  'Rumah Bekas',
  'Tanah Bekas':  'Tanah Bekas',
}

function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.,]/g, '').replace(',', '.')
    const n = parseFloat(cleaned)
    return isNaN(n) ? null : n
  }
  return null
}

function extractCity(specs: Record<string, unknown>): string | null {
  if (typeof specs.city === 'string' && specs.city.trim()) return specs.city.trim()
  if (typeof specs.city_detail === 'string' && specs.city_detail.trim()) return specs.city_detail.trim()
  const lokasi = specs['Lokasi'] ?? specs['lokasi'] ?? specs['location']
  if (typeof lokasi === 'string' && lokasi.trim()) {
    const parts = lokasi.split(',').map((s: string) => s.trim()).filter(Boolean)
    return parts[parts.length - 1] || parts[0] || null
  }
  return null
}

function extractLandArea(specs: Record<string, unknown>): number | null {
  if (specs.land_area_m2 !== undefined) return parseNumber(specs.land_area_m2)
  const v = specs['Luas Tanah'] ?? specs['luas_tanah'] ?? specs['land_area']
  if (v !== undefined) return parseNumber(v)
  return null
}

function extractBuildingArea(specs: Record<string, unknown>): number | null {
  if (specs.building_area_m2 !== undefined) return parseNumber(specs.building_area_m2)
  const v = specs['Luas Bangunan'] ?? specs['luas_bangunan'] ?? specs['building_area']
  if (v !== undefined) return parseNumber(v)
  return null
}

interface ProductWithOffer {
  specifications: Record<string, unknown> | null
  offers: Array<{ price: number }>
}

interface CityStat {
  city: string
  avg_price_per_m2_land: number
  avg_price_per_m2_building: number | null
  count: number
  min_price: number
  max_price: number
}

export async function GET(req: NextRequest) {
  const rawCategory = req.nextUrl.searchParams.get('category') || 'Rumah Bekas'
  const dbCategory  = CATEGORY_MAP[rawCategory] ?? rawCategory
  const isRumah     = dbCategory === 'Rumah Bekas'

  const supabase = tryGetServerClient()
  if (!supabase) return NextResponse.json({ stats: [] })

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawData, error } = await (supabase as any)
      .from('products')
      .select('specifications, offers!inner(price)')
      .eq('category', dbCategory)
      .not('specifications', 'is', null)
      .limit(5000)

    if (error || !rawData) {
      return NextResponse.json({ category: dbCategory, stats: [] })
    }

    const data = rawData as ProductWithOffer[]

    const cityMap: Record<string, {
      pricesPerM2Land: number[]
      pricesPerM2Building: number[]
      prices: number[]
    }> = {}

    for (const row of data) {
      const specs = row.specifications
      if (!specs) continue

      const offers = row.offers
      if (!offers || offers.length === 0) continue
      const price = offers[0].price
      if (!price || price <= 0) continue
      if (price >= 2_000_000_000) continue

      const city = extractCity(specs)
      if (!city) continue

      const landArea = extractLandArea(specs)
      const buildingArea = isRumah ? extractBuildingArea(specs) : null

      let ppm2Land: number | null = null
      if (landArea && landArea > 0) {
        ppm2Land = price / landArea
      } else {
        const v = specs['Harga/m\u00b2'] ?? specs['price_per_m2'] ?? specs['harga_per_m2']
        if (v !== undefined) ppm2Land = parseNumber(v)
      }

      if (!ppm2Land) continue
      if (ppm2Land < 100_000 || ppm2Land > 100_000_000) continue

      if (!cityMap[city]) cityMap[city] = { pricesPerM2Land: [], pricesPerM2Building: [], prices: [] }
      cityMap[city].pricesPerM2Land.push(ppm2Land)
      cityMap[city].prices.push(price)

      if (isRumah && buildingArea && buildingArea > 0) {
        const ppm2Building = price / buildingArea
        if (ppm2Building >= 100_000 && ppm2Building <= 100_000_000) {
          cityMap[city].pricesPerM2Building.push(ppm2Building)
        }
      }
    }

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

    const stats: CityStat[] = Object.entries(cityMap)
      .filter(([, v]) => v.pricesPerM2Land.length >= 2)
      .map(([city, v]) => ({
        city,
        avg_price_per_m2_land: Math.round(avg(v.pricesPerM2Land)),
        avg_price_per_m2_building: v.pricesPerM2Building.length >= 2
          ? Math.round(avg(v.pricesPerM2Building))
          : null,
        count: v.pricesPerM2Land.length,
        min_price: Math.min(...v.prices),
        max_price: Math.max(...v.prices),
      }))
      .sort((a, b) => b.avg_price_per_m2_land - a.avg_price_per_m2_land)

    return NextResponse.json({ category: dbCategory, stats })
  } catch {
    return NextResponse.json({ category: dbCategory, stats: [] })
  }
}
