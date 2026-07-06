import { NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'

export const runtime = 'nodejs'

export interface LiveDrop {
  name: string
  drop: string
  platform: string
  price: string
  productId: string
}

const FALLBACK: LiveDrop[] = [
  { name: 'Sony WH-1000XM5', drop: '-12.5%', platform: 'Shopee', price: 'Rp 3.990.000', productId: '' },
  { name: 'iPhone 15 128GB', drop: '-8.2%', platform: 'Tokopedia', price: 'Rp 12.499.000', productId: '' },
  { name: 'Dyson V15 Detect', drop: '-15.3%', platform: 'Lazada', price: 'Rp 6.999.000', productId: '' },
  { name: 'Samsung Galaxy S24', drop: '-6.8%', platform: 'Blibli', price: 'Rp 11.999.000', productId: '' },
  { name: 'Nintendo Switch OLED', drop: '-9.1%', platform: 'TikTok Shop', price: 'Rp 3.899.000', productId: '' },
  { name: 'MacBook Air M2', drop: '-5.4%', platform: 'Tokopedia', price: 'Rp 14.999.000', productId: '' },
  { name: 'ASUS ROG Zephyrus G14', drop: '-11.2%', platform: 'Shopee', price: 'Rp 18.499.000', productId: '' },
  { name: 'Xiaomi 14 Ultra', drop: '-7.6%', platform: 'Lazada', price: 'Rp 9.799.000', productId: '' },
]

export async function GET() {
  const headers = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
  const supabase = tryGetServerClient()

  if (!supabase) {
    return NextResponse.json(FALLBACK, { headers })
  }

  try {
    // Fetch recent price_history rows with offer + product + merchant via joins
    const since = new Date(Date.now() - 14 * 86_400_000).toISOString()

    const { data: rows, error } = await supabase
      .from('price_history')
      .select(`
        price,
        offers (
          price,
          product_id,
          products ( id, name ),
          merchants ( name )
        )
      `)
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: false })
      .limit(100)

    if (error || !rows) {
      return NextResponse.json(FALLBACK, { headers })
    }

    // Keep only rows where historical price > current offer price (genuine drop)
    const seen = new Set<string>()
    const brandCount: Record<string, number> = {}
    const drops: LiveDrop[] = []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of rows as any[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const offer: any = Array.isArray(row.offers) ? row.offers[0] : row.offers
      if (!offer) continue

      const product = Array.isArray(offer.products) ? offer.products[0] : offer.products
      const merchant = Array.isArray(offer.merchants) ? offer.merchants[0] : offer.merchants
      if (!product || !merchant) continue

      const productId: string = product.id
      if (seen.has(productId)) continue
      if (offer.price >= row.price) continue  // not actually a drop

      // Brand diversity: cap at 2 drops per brand so ticker feels varied
      const rawName: string = product.name ?? ''
      const brand = rawName.split(' ')[0] ?? 'Unknown'
      if ((brandCount[brand] ?? 0) >= 2) continue

      const dropPct = Math.round((row.price - offer.price) / row.price * 1000) / 10
      seen.add(productId)
      brandCount[brand] = (brandCount[brand] ?? 0) + 1

      drops.push({
        name: rawName.length > 45 ? rawName.slice(0, 45) + '…' : rawName,
        drop: `-${dropPct}%`,
        platform: merchant.name,
        price: 'Rp ' + offer.price.toLocaleString('id-ID'),
        productId,
      })

      if (drops.length >= 10) break
    }

    const result = drops.length >= 3 ? drops : FALLBACK
    return NextResponse.json(result, { headers })
  } catch {
    return NextResponse.json(FALLBACK, { headers })
  }
}
