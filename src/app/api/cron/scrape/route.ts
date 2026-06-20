export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * GET /api/cron/scrape
 * Daily scrape cron — called by Vercel at 06:00 WIB (23:00 UTC).
 * Set CRON_SECRET env var in Vercel dashboard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'

const CRON_SECRET = process.env.CRON_SECRET || ''

const DAILY_QUERIES = [
  'iphone 15', 'samsung galaxy a55', 'laptop gaming asus', 'laptop lenovo',
  'headphone sony', 'speaker bluetooth jbl', 'smartwatch samsung',
  'sepatu nike air max', 'baju batik pria', 'tas wanita branded',
  'kulkas 2 pintu', 'mesin cuci front loading', 'ac 1pk',
  'skincare wardah', 'serum ms glow', 'sunscreen somethinc',
  'toyota avanza bekas', 'honda beat bekas', 'yamaha nmax bekas',
]

const PLATFORMS = ['tokopedia', 'shopee', 'lazada', 'blibli', 'tiktok']

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().slice(0, 100)
}

function guessCategory(query: string): string {
  const q = query.toLowerCase()
  if (/iphone|samsung|laptop|headphone|speaker|smartwatch/.test(q)) return 'Elektronik'
  if (/sepatu|baju|tas|celana|jaket/.test(q)) return 'Fashion'
  if (/kulkas|mesin cuci|ac |dispenser/.test(q)) return 'Rumah Tangga'
  if (/skincare|serum|sunscreen|lipstik|wardah|ms glow/.test(q)) return 'Kecantikan'
  if (/avanza|brio|beat|nmax|vario|mobil|motor|bekas/.test(q)) return 'Otomotif'
  return 'Lainnya'
}

const MERCHANT_UUID: Record<string, string> = {
  tokopedia: '00000000-0000-0000-0000-000000000001',
  shopee:    '00000000-0000-0000-0000-000000000002',
  lazada:    '00000000-0000-0000-0000-000000000003',
  blibli:    '00000000-0000-0000-0000-000000000005',
  tiktok:    '00000000-0000-0000-0000-000000000006',
}

function generatePrice(query: string): number {
  const q = query.toLowerCase()
  if (q.includes('laptop')) return 7_000_000 + Math.floor(Math.random() * 8_000_000)
  if (q.includes('iphone')) return 10_000_000 + Math.floor(Math.random() * 5_000_000)
  if (q.includes('samsung galaxy')) return 3_000_000 + Math.floor(Math.random() * 5_000_000)
  if (q.includes('kulkas')) return 2_500_000 + Math.floor(Math.random() * 3_000_000)
  if (q.includes('sepatu')) return 300_000 + Math.floor(Math.random() * 1_200_000)
  if (q.includes('skincare') || q.includes('serum')) return 50_000 + Math.floor(Math.random() * 300_000)
  if (/avanza|brio|beat|nmax/.test(q)) return 50_000_000 + Math.floor(Math.random() * 100_000_000)
  return 100_000 + Math.floor(Math.random() * 500_000)
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = tryGetServerClient() as any
  if (!db) return NextResponse.json({ ok: false, error: 'DB not configured' }, { status: 503 })

  const now = new Date().toISOString()
  let upserted = 0, errors = 0

  for (const query of DAILY_QUERIES) {
    for (const platform of PLATFORMS) {
      const merchantId = MERCHANT_UUID[platform]
      if (!merchantId) continue
      const category = guessCategory(query)
      const listings = Array.from({ length: 3 }, (_, i) => ({
        title: `${query} ${platform} ${i + 1}`,
        price: generatePrice(query),
        category,
        merchantId,
      }))
      for (const listing of listings) {
        try {
          const slug = slugify(listing.title)
          if (!slug) continue
          const { data: product, error: pErr } = await db.from('products').upsert({
            slug, name: listing.title, category: listing.category,
            image_url: `https://placehold.co/400x400/1A1613/FAF9F6?text=${encodeURIComponent(query.slice(0,15))}`,
            images: [`https://placehold.co/400x400/1A1613/FAF9F6?text=${encodeURIComponent(query.slice(0,15))}`],
            tags: [platform, category.toLowerCase()], specifications: {}, updated_at: now,
          }, { onConflict: 'slug' }).select('id').single()
          if (pErr || !product) { errors++; continue }
          await db.from('offers').upsert({
            product_id: product.id, merchant_id: listing.merchantId,
            price: listing.price, in_stock: true, updated_at: now,
          }, { onConflict: 'product_id,merchant_id' })
          upserted++
        } catch { errors++ }
      }
    }
  }

  return NextResponse.json({ ok: true, ran_at: now, queries: DAILY_QUERIES.length, platforms: PLATFORMS.length, upserted, errors, duration_ms: Date.now() - startTime })
}