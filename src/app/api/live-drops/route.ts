import { NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'
import { cleanProductName } from '@/lib/utils'

export const runtime = 'nodejs'

export interface LiveDrop {
  name:        string
  drop:        string
  platform:    string
  price:       string
  productId:   string
  productSlug: string
}

const FALLBACK: LiveDrop[] = [
  { name: 'Sony WH-1000XM5', drop: '-12.5%', platform: 'Shopee', price: 'Rp 3.990.000', productId: '', productSlug: '' },
  { name: 'iPhone 15 128GB', drop: '-8.2%', platform: 'Tokopedia', price: 'Rp 12.499.000', productId: '', productSlug: '' },
  { name: 'Dyson V15 Detect', drop: '-15.3%', platform: 'Lazada', price: 'Rp 6.999.000', productId: '', productSlug: '' },
  { name: 'Samsung Galaxy S24', drop: '-6.8%', platform: 'Blibli', price: 'Rp 11.999.000', productId: '', productSlug: '' },
  { name: 'Nintendo Switch OLED', drop: '-9.1%', platform: 'TikTok Shop', price: 'Rp 3.899.000', productId: '', productSlug: '' },
  { name: 'MacBook Air M2', drop: '-5.4%', platform: 'Tokopedia', price: 'Rp 14.999.000', productId: '', productSlug: '' },
  { name: 'ASUS ROG Zephyrus G14', drop: '-11.2%', platform: 'Shopee', price: 'Rp 18.499.000', productId: '', productSlug: '' },
  { name: 'Xiaomi 14 Ultra', drop: '-7.6%', platform: 'Lazada', price: 'Rp 9.799.000', productId: '', productSlug: '' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDrops(rows: any[]): LiveDrop[] {
  return rows.map((row: any) => {
    const rawName: string = cleanProductName(row.product_name ?? '')
    return {
      name:        rawName.length > 45 ? rawName.slice(0, 45) + '…' : rawName,
      drop:        `-${row.drop_pct}%`,
      platform:    row.platform_name,
      price:       'Rp ' + Number(row.current_price).toLocaleString('id-ID'),
      productId:   row.product_id,
      productSlug: row.product_slug ?? '',
    }
  })
}

// Direct-table fallback used when the get_live_drops() RPC is unavailable or empty.
// Finds offers whose most recent price_history entry is lower than the one before it,
// i.e. a real, recorded price drop — no synthetic data.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRealLiveDrops(supabase: any, limit = 8): Promise<LiveDrop[]> {
  const { data: historyRows, error: historyErr } = await supabase
    .from('price_history')
    .select('offer_id, price, recorded_at')
    .order('recorded_at', { ascending: false })
    .limit(500)

  if (historyErr || !historyRows || historyRows.length === 0) return []

  // Keep the two most recent price_history rows per offer
  const byOffer = new Map<string, { price: number; recorded_at: string }[]>()
  for (const row of historyRows as any[]) {
    const arr = byOffer.get(row.offer_id) ?? []
    if (arr.length < 2) arr.push(row)
    byOffer.set(row.offer_id, arr)
  }

  const candidates: { offerId: string; newPrice: number; dropPct: number }[] = []
  byOffer.forEach((rows, offerId) => {
    if (rows.length < 2) return
    const [current, previous] = rows
    if (previous.price > current.price && previous.price > 0) {
      const dropPct = ((previous.price - current.price) / previous.price) * 100
      if (dropPct >= 1) {
        candidates.push({ offerId, newPrice: current.price, dropPct })
      }
    }
  })

  if (candidates.length === 0) return []

  candidates.sort((a, b) => b.dropPct - a.dropPct)
  const top = candidates.slice(0, limit)

  const { data: offerRows } = await supabase
    .from('offers')
    .select('id, product_id, merchant:merchants(name, platform_id)')
    .in('id', top.map(c => c.offerId))

  const offerMap = new Map<string, any>()
  ;((offerRows as any[]) ?? []).forEach((o: any) => offerMap.set(o.id, o))

  const productIds = Array.from(
    new Set(top.map(c => offerMap.get(c.offerId)?.product_id).filter(Boolean))
  ) as string[]
  if (productIds.length === 0) return []

  const { data: productRows } = await supabase
    .from('products')
    .select('id, name, slug')
    .in('id', productIds)

  const productMap = new Map<string, any>()
  ;((productRows as any[]) ?? []).forEach((p: any) => productMap.set(p.id, p))

  const drops: LiveDrop[] = []
  for (const c of top) {
    const offer = offerMap.get(c.offerId)
    const product = offer ? productMap.get(offer.product_id) : null
    if (!offer || !product) continue
    const rawName = cleanProductName(product.name ?? '')
    drops.push({
      name:        rawName.length > 45 ? rawName.slice(0, 45) + '…' : rawName,
      drop:        `-${c.dropPct.toFixed(1)}%`,
      platform:    offer.merchant?.name ?? offer.merchant?.platform_id ?? '',
      price:       'Rp ' + Number(c.newPrice).toLocaleString('id-ID'),
      productId:   product.id,
      productSlug: product.slug ?? '',
    })
  }
  return drops
}

export async function GET() {
  const headers = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
  const supabase = tryGetServerClient()

  if (!supabase) {
    return NextResponse.json(FALLBACK, { headers })
  }

  try {
    // Use SQL function for reliable multi-table join (avoids PostgREST nested join issues)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_live_drops', {
      since_days: 14,
      result_limit: 10,
    })

    let drops: LiveDrop[] = []
    if (!error && data) {
      drops = toDrops(data as any[])
    } else if (error) {
      console.error('[live-drops] RPC error:', error)
    }

    // RPC missing/empty — query price_history directly for real drops
    if (drops.length < 3) {
      try {
        drops = await getRealLiveDrops(supabase, 8)
      } catch (fallbackErr) {
        console.error('[live-drops] Direct-table fallback error:', fallbackErr)
      }
    }

    const result = drops.length >= 3 ? drops : FALLBACK
    return NextResponse.json(result, { headers })
  } catch (err) {
    console.error('[live-drops] Unexpected error:', err)
    return NextResponse.json(FALLBACK, { headers })
  }
}
