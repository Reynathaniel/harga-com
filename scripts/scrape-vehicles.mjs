#!/usr/bin/env node
/**
 * scrape-vehicles.mjs — Layer 2: Scrape Tokopedia + Shopee for vehicle photos.
 *
 * Why Tokopedia first:
 *   OLX/Carousell block HTTP scrapers (403/empty). Tokopedia's GraphQL API
 *   returns real listings WITH images, including used vehicles listed as "bekas".
 *   The images load reliably from *.tokopedia.net CDN (no hotlink protection).
 *
 * What it does:
 *   1. Queries Tokopedia GraphQL for each vehicle search term
 *   2. Queries Shopee search API as supplementary source
 *   3. Upserts products into Supabase with category=Motor Bekas / Mobil Bekas
 *   4. Real Tokopedia CDN image_url stored — loads in browser without issues
 *   5. After saving, the existing Layer 1 SQL enrichment can propagate images
 *      to same-brand products that still have no photo
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/scrape-vehicles.mjs
 *   # Or load from .env.local automatically:
 *   node -e "require('fs').readFileSync('.env.local','utf8').split('\n').forEach(l=>{const[k,...v]=l.split('=');if(k&&v.length)process.env[k.trim()]=v.join('=').trim()})" scripts/scrape-vehicles.mjs
 */

import { readFileSync } from 'node:fs'

// Auto-load .env.local if present
try {
  const env = readFileSync('.env.local', 'utf8')
  for (const line of env.split('\n')) {
    const eq = line.indexOf('=')
    if (eq > 0) {
      const k = line.slice(0, eq).trim()
      const v = line.slice(eq + 1).trim()
      if (k && !process.env[k]) process.env[k] = v
    }
  }
} catch { /* .env.local not found — use existing env vars */ }

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Set them in .env.local or as environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const MERCHANT_ID = {
  tokopedia: '00000000-0000-0000-0000-000000000001',
  shopee:    '00000000-0000-0000-0000-000000000002',
}

const UA = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
]
const randUA = () => UA[Math.floor(Math.random() * UA.length)]

// ── Vehicle search queries ─────────────────────────────────────────────────
const VEHICLE_QUERIES = [
  // Motor bekas
  { query: 'Honda Beat bekas',      category: 'Motor Bekas', brand: 'Honda'    },
  { query: 'Yamaha NMAX bekas',     category: 'Motor Bekas', brand: 'Yamaha'   },
  { query: 'Yamaha Mio bekas',      category: 'Motor Bekas', brand: 'Yamaha'   },
  { query: 'Honda Vario bekas',     category: 'Motor Bekas', brand: 'Honda'    },
  { query: 'Honda PCX bekas',       category: 'Motor Bekas', brand: 'Honda'    },
  { query: 'Kawasaki Ninja bekas',  category: 'Motor Bekas', brand: 'Kawasaki' },
  { query: 'Yamaha Aerox bekas',    category: 'Motor Bekas', brand: 'Yamaha'   },
  { query: 'Honda Scoopy bekas',    category: 'Motor Bekas', brand: 'Honda'    },
  // Mobil bekas
  { query: 'Toyota Avanza bekas',   category: 'Mobil Bekas', brand: 'Toyota'   },
  { query: 'Honda Brio bekas',      category: 'Mobil Bekas', brand: 'Honda'    },
  { query: 'Daihatsu Ayla bekas',   category: 'Mobil Bekas', brand: 'Daihatsu' },
  { query: 'Toyota Rush bekas',     category: 'Mobil Bekas', brand: 'Toyota'   },
  { query: 'Honda Jazz bekas',      category: 'Mobil Bekas', brand: 'Honda'    },
  { query: 'Daihatsu Xenia bekas',  category: 'Mobil Bekas', brand: 'Daihatsu' },
  { query: 'Suzuki Ertiga bekas',   category: 'Mobil Bekas', brand: 'Suzuki'   },
  { query: 'Toyota Innova bekas',   category: 'Mobil Bekas', brand: 'Toyota'   },
]

// ── Tokopedia GraphQL ──────────────────────────────────────────────────────
async function scrapeTokopedia(query, limit = 20) {
  try {
    const res = await fetch('https://gql.tokopedia.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': randUA(),
        'Origin': 'https://www.tokopedia.com',
        'Referer': `https://www.tokopedia.com/search?q=${encodeURIComponent(query)}`,
        'X-Source': 'tokopedia-lite',
        'Accept': 'application/json',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
      },
      body: JSON.stringify([{
        operationName: 'SearchProductQueryV4',
        variables: {
          params: `q=${encodeURIComponent(query)}&rows=${Math.min(limit, 40)}&start=0&ob=23&rt=4,7&page=1&user_id=0&device=desktop&source=search`,
        },
        query: `query SearchProductQueryV4($params: String) {
          ace_search_product_v4(params: $params) {
            data { products {
              id name url imageUrl
              price { text value }
              originalPrice discountPercentage
              shop { name isOfficial }
            }}
          }
        }`,
      }]),
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) { console.log(`  Tokopedia HTTP ${res.status}`); return [] }
    const json = await res.json()
    const products = json?.[0]?.data?.ace_search_product_v4?.data?.products ?? []

    return products
      .filter(p => (p.price?.value ?? 0) > 0 && p.imageUrl)
      .map(p => ({
        platformId: 'tokopedia',
        productId:  String(p.id),
        title:      p.name,
        price:      p.price?.value ?? 0,
        originalPrice: p.originalPrice || null,
        discountPct:   p.discountPercentage || null,
        imageUrl:   p.imageUrl,
        productUrl: p.url,
        shopName:   p.shop?.name ?? null,
      }))
  } catch (e) {
    console.log(`  Tokopedia error: ${e.message}`)
    return []
  }
}

// ── Shopee search ──────────────────────────────────────────────────────────
async function scrapeShopee(query, limit = 20) {
  try {
    const url = `https://shopee.co.id/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(query)}&limit=${Math.min(limit, 40)}&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2`
    const res = await fetch(url, {
      headers: {
        'User-Agent': randUA(),
        'Referer': `https://shopee.co.id/search?keyword=${encodeURIComponent(query)}`,
        'Accept': 'application/json',
        'Accept-Language': 'id-ID,id;q=0.9',
        'x-api-source': 'pc',
        'x-requested-with': 'XMLHttpRequest',
      },
      signal: AbortSignal.timeout(18000),
    })
    if (!res.ok) return []
    const json = await res.json()
    const items = json?.items ?? []

    return items
      .map(item => {
        const d = item.item_basic
        if (!d) return null
        const price = Math.round((d.price ?? 0) / 100000)
        if (!price || !d.image) return null
        return {
          platformId: 'shopee',
          productId:  String(d.itemid),
          title:      d.name,
          price,
          originalPrice: d.price_before_discount ? Math.round(d.price_before_discount / 100000) : null,
          discountPct:   d.discount ? parseInt(d.discount) : null,
          imageUrl:   `https://cf.shopee.co.id/file/${d.image}_tn`,
          productUrl: `https://shopee.co.id/-i.${d.shopid}.${d.itemid}`,
          shopName:   d.shop_name ?? null,
        }
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

// ── Supabase save ──────────────────────────────────────────────────────────
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().slice(0, 100)
}

async function saveListings(listings, { category, brand }) {
  let saved = 0
  const now = new Date().toISOString()

  for (const l of listings) {
    try {
      const merchantId = MERCHANT_ID[l.platformId]
      if (!merchantId) continue
      if (!l.imageUrl?.startsWith('http')) continue  // skip if no real image

      const slug = slugify(l.title) + '-' + l.platformId + '-' + l.productId.slice(-6)

      const { data: existing } = await supabase
        .from('products')
        .select('id, image_url, images')
        .eq('slug', slug)
        .maybeSingle()

      let productId

      if (existing) {
        const hasRealImage = existing.image_url?.startsWith('http') ||
          existing.images?.some(u => u?.startsWith('http'))
        const patch = {
          name: l.title,
          category,
          brand: brand ?? null,
          updated_at: now,
          ...(!hasRealImage ? { image_url: l.imageUrl, images: [l.imageUrl] } : {}),
        }
        await supabase.from('products').update(patch).eq('id', existing.id)
        productId = existing.id
      } else {
        const { data: ins, error } = await supabase
          .from('products')
          .insert({
            slug,
            name:      l.title,
            brand:     brand ?? null,
            category,
            image_url: l.imageUrl,
            images:    [l.imageUrl],
            tags:      [],
            specifications: {},
            updated_at: now,
          })
          .select('id')
          .single()
        if (error || !ins) { console.log(`  insert err: ${error?.message}`); continue }
        productId = ins.id
      }

      // Upsert offer
      const { data: offer, error: oErr } = await supabase
        .from('offers')
        .upsert({
          product_id:    productId,
          merchant_id:   merchantId,
          price:         l.price,
          original_price: l.originalPrice ?? null,
          discount_pct:  l.discountPct ?? null,
          shop_name:     l.shopName ?? null,
          shop_verified: false,
          free_shipping: false,
          rating:        0,
          review_count:  0,
          sold_count:    0,
          stock_count:   1,
          url:           l.productUrl ?? null,
          condition:     'used',
          in_stock:      true,
          updated_at:    now,
        }, { onConflict: 'product_id,merchant_id' })
        .select('id')
        .single()

      if (oErr || !offer) continue

      // Price history
      const { data: lastH } = await supabase
        .from('price_history')
        .select('price')
        .eq('offer_id', offer.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()
      if (!lastH || lastH.price !== l.price) {
        await supabase.from('price_history').insert({ offer_id: offer.id, price: l.price, recorded_at: now })
      }

      saved++
    } catch (e) {
      console.log(`  skip: ${e.message}`)
    }
  }
  return saved
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[${new Date().toISOString()}] scrape-vehicles.mjs`)
  console.log(`DB: ${SUPABASE_URL}`)
  console.log(`Queries: ${VEHICLE_QUERIES.length}\n`)

  let totalSaved = 0
  let totalFetched = 0

  for (const { query, category, brand } of VEHICLE_QUERIES) {
    console.log(`"${query}" [${category}]`)

    const [toko, shopee] = await Promise.all([
      scrapeTokopedia(query, 20),
      scrapeShopee(query, 20),
    ])

    const all = [...toko, ...shopee]
    totalFetched += all.length
    console.log(`  tokopedia: ${toko.length} | shopee: ${shopee.length} (with images)`)

    if (all.length > 0) {
      const saved = await saveListings(all, { category, brand })
      totalSaved += saved
      console.log(`  saved: ${saved}`)
    }

    await new Promise(r => setTimeout(r, 2500))
  }

  console.log(`\n✅ Done. Fetched: ${totalFetched} | Saved: ${totalSaved}`)

  // Layer 1: propagate images to same-brand products that still have none
  console.log('\nRunning Layer 1 image enrichment via Supabase...')
  const { data } = await supabase.rpc('enrich_product_images').catch(() => ({ data: null }))
  if (data === null) {
    // RPC not defined — run equivalent SQL
    const { error } = await supabase
      .from('products')
      .select('id')
      .limit(1)  // test connection

    if (!error) {
      console.log('  (Run the Layer 1 SQL manually in Supabase dashboard to propagate images)')
      console.log(`
  UPDATE products p1
  SET image_url = (
    SELECT p2.image_url FROM products p2
    WHERE p2.brand = p1.brand AND p2.category = p1.category
      AND p2.image_url IS NOT NULL AND p2.image_url != ''
      AND p2.image_url NOT LIKE '%placehold%'
    ORDER BY p2.updated_at DESC LIMIT 1
  ),
  images = CASE WHEN (
    SELECT p2.image_url FROM products p2
    WHERE p2.brand = p1.brand AND p2.category = p1.category
      AND p2.image_url IS NOT NULL AND p2.image_url != ''
      AND p2.image_url NOT LIKE '%placehold%'
    ORDER BY p2.updated_at DESC LIMIT 1
  ) IS NOT NULL THEN ARRAY[(
    SELECT p2.image_url FROM products p2
    WHERE p2.brand = p1.brand AND p2.category = p1.category
      AND p2.image_url IS NOT NULL AND p2.image_url != ''
      AND p2.image_url NOT LIKE '%placehold%'
    ORDER BY p2.updated_at DESC LIMIT 1
  )]::text[] ELSE images END
  WHERE (p1.image_url IS NULL OR p1.image_url = '')
    AND p1.brand IS NOT NULL AND p1.brand != '';
      `)
    }
  }
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  