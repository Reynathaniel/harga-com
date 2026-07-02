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
    // Use SQL function for reliable multi-table join (avoids PostgREST nested join issues)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_live_drops', {
      since_days: 14,
      result_limit: 10,
    })

    if (error || !data) {
      console.error('[live-drops] RPC error:', error)
      return NextResponse.json(FALLBACK, { headers })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drops: LiveDrop[] = (data as any[]).map((row: any) => {
      const rawName: string = row.product_name ?? ''
      return {
        name: rawName.length > 45 ? rawName.slice(0, 45) + '\u2026' : rawName,
        drop: `-${row.drop_pct}%`,
        platform: row.platform_name,
        price: 'Rp ' + Number(row.current_price).toLocaleString('id-ID'),
        productId: row.product_id,
      }
    })

    const result = drops.length >= 3 ? drops : FALLBACK
    return NextResponse.json(result, { headers })
  } catch (err) {
    console.error('[live-drops] Unexpected error:', err)
    return NextResponse.json(FALLBACK, { headers })
  }
}
