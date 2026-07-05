/**
 * scrape-cron.mjs — Standalone scraper for GitHub Actions
 * Runs directly from GitHub's servers (Azure IPs — different from Vercel AWS)
 * Saves results to Supabase via REST API
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Merchant IDs (match DB seed)
const MERCHANT_ID = {
  tokopedia: '00000000-0000-0000-0000-000000000001',
  shopee:    '00000000-0000-0000-0000-000000000002',
  lazada:    '00000000-0000-0000-0000-000000000003',
  bukalapak: '00000000-0000-0000-0000-000000000004',
  blibli:    '00000000-0000-0000-0000-000000000005',
  tiktok:    '00000000-0000-0000-0000-000000000006',
  olx:       '00000000-0000-0000-0000-000000000011',
}

// OLX Property category IDs
const OLX_PROPERTY_CATEGORIES = {
  'Rumah Bekas': '5158',
  'Tanah Bekas': '5159',
}

// OLX Vehicle category IDs (olx.co.id/motor_c197, olx.co.id/mobil-bekas_c198)
const OLX_VEHICLE_CATEGORIES = {
  'Motor Bekas': '197',
  'Mobil Bekas': '198',
}


// Vehicle keyword queries — rotate each run
const MOTOR_QUERIES = [
  { q: 'honda beat bekas', brand: 'Honda',    category: 'Motor Bekas' },
  { q: 'yamaha nmax bekas', brand: 'Yamaha',  category: 'Motor Bekas' },
  { q: 'honda vario bekas', brand: 'Honda',   category: 'Motor Bekas' },
  { q: 'yamaha aerox bekas', brand: 'Yamaha', category: 'Motor Bekas' },
  { q: 'honda pcx bekas', brand: 'Honda',     category: 'Motor Bekas' },
  { q: 'kawasaki ninja bekas', brand: 'Kawasaki', category: 'Motor Bekas' },
]

const MOBIL_QUERIES = [
  { q: 'toyota avanza bekas', brand: 'Toyota',   category: 'Mobil Bekas' },
  { q: 'honda brio bekas', brand: 'Honda',        category: 'Mobil Bekas' },
  { q: 'daihatsu xenia bekas', brand: 'Daihatsu', category: 'Mobil Bekas' },
  { q: 'toyota kijang bekas', brand: 'Toyota',    category: 'Mobil Bekas' },
  { q: 'honda hrv bekas', brand: 'Honda',         category: 'Mobil Bekas' },
  { q: 'suzuki ertiga bekas', brand: 'Suzuki',    category: 'Mobil Bekas' },
]

// Each run picks 2 motor + 2 mobil queries by hour
const MOTOR_BATCH = MOTOR_QUERIES.slice((HOUR % 3) * 2, (HOUR % 3) * 2 + 2)
const MOBIL_BATCH = MOBIL_QUERIES.slice((HOUR % 3) * 2, (HOUR % 3) * 2 + 2)

// Rotate queries each run based on hour
const ALL_QUERIES = [
  'iPhone 15', 'Samsung Galaxy', 'laptop gaming', 'AirPods',
  'sepatu Nike', 'baju batik', 'kamera mirrorless', 'headphone',
  'Nintendo Switch', 'Dyson vacuum', 'smartwatch', 'skincare',
]

const HOUR = new Date().getUTCHours()
const QUERY_BATCH = ALL_QUERIES.slice((HOUR % 3) * 4, ((HOUR % 3) * 4) + 4)
const CUSTOM_QUERY = process.env.SCRAPE_QUERY
const QUERIES = CUSTOM_QUERY ? [CUSTOM_QUERY] : QUERY_BATCH

const UA = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
]
const randUA = () => UA[Math.floor(Math.random() * UA.length)]

// ── Tokopedia scraper (GraphQL) ────────────────────────────────────────────
async function scrapeTokopedia(query, limit = 30) {
  try {
    const res = await fetch('https://gql.tokopedia.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': randUA(),
        'Origin': 'https://www.tokopedia.com',
        'Referer': 'https://www.tokopedia.com/search?q=' + encodeURIComponent(query),
        'X-Source': 'tokopedia-lite',
        'Accept': 'application/json',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
      },
      body: JSON.stringify([{
        operationName: 'SearchProductQueryV4',
        variables: {
          params: `q=${encodeURIComponent(query)}&rows=${Math.min(limit, 60)}&start=0&ob=23&rt=4,7&page=1&user_id=0&device=desktop&source=search`,
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

    if (!res.ok) { console.log(`Tokopedia HTTP ${res.status}`); return [] }

    const json = await res.json()
    const products = json?.[0]?.data?.ace_search_product_v4?.data?.products ?? []

    return products.map(p => ({
      platformId: 'tokopedia',
      productId: String(p.id),
      title: p.name,
      price: p.price?.value ?? 0,
      originalPrice: p.originalPrice || null,
      discountPct: p.discountPercentage || null,
      imageUrl: p.imageUrl,
      productUrl: p.url,
      shopName: p.shop?.name ?? null,
      condition: 'new',
    })).filter(p => p.price > 0)
  } catch (e) {
    console.log('Tokopedia error:', e.message)
    return []
  }
}

// ── Shopee scraper (REST API) ──────────────────────────────────────────────
async function scrapeShopee(query, limit = 30) {
  try {
    const url = `https://shopee.co.id/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(query)}&limit=${Math.min(limit, 50)}&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2`
    const res = await fetch(url, {
      headers: {
        'User-Agent': randUA(),
        'Referer': 'https://shopee.co.id/search?keyword=' + encodeURIComponent(query),
        'Accept': 'application/json',
        'Accept-Language': 'id-ID,id;q=0.9',
        'x-api-source': 'pc',
        'x-requested-with': 'XMLHttpRequest',
      },
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) { console.log(`Shopee HTTP ${res.status}`); return [] }

    const json = await res.json()
    const items = json?.items ?? []

    return items.map(item => {
      const d = item.item_basic
      if (!d) return null
      const price = Math.round((d.price ?? 0) / 100000)
      const origPrice = d.price_before_discount ? Math.round(d.price_before_discount / 100000) : null
      return {
        platformId: 'shopee',
        productId: String(d.itemid),
        title: d.name,
        price,
        originalPrice: origPrice,
        discountPct: d.discount ? parseInt(d.discount) : null,
        imageUrl: d.image ? `https://cf.shopee.co.id/file/${d.image}_tn` : null,
        productUrl: `https://shopee.co.id/-i.${d.shopid}.${d.itemid}`,
        shopName: d.shop_name ?? null,
        condition: 'new',
      }
    }).filter(Boolean).filter(p => p.price > 0)
  } catch (e) {
    console.log('Shopee error:', e.message)
    return []
  }
}

// ── Bukalapak scraper (REST API) ──────────────────────────────────────────
async function scrapeBukalapak(query, limit = 20) {
  try {
    const url = `https://api.bukalapak.com/products/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=0&sort_by=relevance`
    const res = await fetch(url, {
      headers: {
        'User-Agent': randUA(),
        'Accept': 'application/json',
        'Referer': 'https://www.bukalapak.com/products?search[keywords]=' + encodeURIComponent(query),
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) { console.log(`Bukalapak HTTP ${res.status}`); return [] }

    const json = await res.json()
    const products = json?.data ?? []

    return products.map(p => ({
      platformId: 'bukalapak',
      productId: String(p.id),
      title: p.name,
      price: p.price ?? 0,
      originalPrice: p.original_price ?? null,
      discountPct: p.discount_percentage ?? null,
      imageUrl: p.images?.small_urls?.[0] ?? null,
      productUrl: p.url ?? null,
      shopName: p.store?.name ?? null,
      condition: p.condition === 'used' ? 'used' : 'new',
    })).filter(p => p.price > 0)
  } catch (e) {
    console.log('Bukalapak error:', e.message)
    return []
  }
}

// ── OLX category scraper ────────────────────────────────────────────────────
// Fetches real listings (property or vehicle) from OLX's internal category
// search API by category_id. Images are hotlinkable OLX CDN URLs.
function getOlxImageUrl(images) {
  if (!Array.isArray(images) || images.length === 0) return null
  const fileId = images[0]?.id
  if (!fileId) return null
  return `https://apollo.olx.co.id/v1/files/${fileId}-ID/image;s=644x461`
}

function getOlxParam(parameters, key) {
  if (!Array.isArray(parameters)) return null
  const param = parameters.find(p => p.key === key)
  return param?.value ?? null
}

async function scrapeOlxCategory(category, categoryId, pages = 3) {
  const listings = []
  for (let page = 1; page <= pages; page++) {
    try {
      const url = `https://www.olx.co.id/api/relevance/v4/search?category_id=${categoryId}&location_id=1000&page=${page}`
      const res = await fetch(url, {
        headers: {
          'User-Agent': randUA(),
          'Accept': 'application/json',
          'Accept-Language': 'id-ID,id;q=0.9',
          'Referer': 'https://www.olx.co.id',
        },
        signal: AbortSignal.timeout(20000),
      })

      if (!res.ok) { console.log(`OLX property HTTP ${res.status}`); break }

      const json = await res.json()
      const items = json?.data ?? []
      if (items.length === 0) break

      for (const item of items) {
        const price = item.price?.value
        if (!price) continue

        const imageUrl = getOlxImageUrl(item.images)
        const city = item.location?.city_name ?? item.location?.region_name ?? null

        listings.push({
          platformId: 'olx',
          productId: String(item.id),
          title: item.title,
          price: parseInt(price) || 0,
          originalPrice: null,
          discountPct: null,
          imageUrl,
          productUrl: item.url ?? `https://www.olx.co.id/item/${item.id}`,
          shopName: item.user?.name ?? null,
          condition: 'used',
          category,
        })
      }

      await new Promise(r => setTimeout(r, 1500))
    } catch (e) {
      console.log(`OLX property page ${page} error:`, e.message)
      break
    }
  }
  return listings
}

// ── Save to Supabase ───────────────────────────────────────────────────────
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().slice(0, 100)
}

async function saveListings(listings, category = null, brandOverride = null) {
  let saved = 0
  for (const l of listings) {
    try {
      const slug = slugify(l.title) + '-' + l.platformId + '-' + l.productId.slice(-6)
      const merchantId = MERCHANT_ID[l.platformId]
      if (!merchantId) continue

      const productData = {
        slug,
        name: l.title,
        image_url: l.imageUrl,
        condition: l.condition ?? 'new',
        brand: brandOverride || l.brand || null,
      }
      if (category || l.category) productData.category = category || l.category

      // Upsert product
      const { data: product, error: pErr } = await supabase
        .from('products')
        .upsert(productData, { onConflict: 'slug', ignoreDuplicates: false })
        .select('id').single()

      if (pErr || !product) continue

      // Upsert listing (offer)
      await supabase
        .from('offers')
        .upsert({
          product_id: product.id,
          merchant_id: merchantId,
          price: l.price,
          original_price: l.originalPrice,
          discount_pct: l.discountPct,
          url: l.productUrl,
          shop_name: l.shopName,
          in_stock: true,
          condition: l.condition || 'used',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'product_id,merchant_id' })

      saved++
    } catch (_) { /* skip */ }
  }
  return saved
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[${new Date().toISOString()}] Starting scraper`)
  console.log(`Queries this run: ${QUERIES.join(', ')}`)

  let totalSaved = 0

  // Marketplace products (keyword-based)
  for (const query of QUERIES) {
    console.log(`\nScraping: "${query}"`)

    const [toko, shopee, buka] = await Promise.all([
      scrapeTokopedia(query, 30),
      scrapeShopee(query, 30),
      scrapeBukalapak(query, 20),
    ])

    const all = [...toko, ...shopee, ...buka]
    console.log(`  tokopedia: ${toko.length} | shopee: ${shopee.length} | bukalapak: ${buka.length}`)

    if (all.length > 0) {
      const saved = await saveListings(all)
      totalSaved += saved
      console.log(`  Saved: ${saved}/${all.length}`)
    }

    // Rate limit between queries
    await new Promise(r => setTimeout(r, 2000))
  }

  // OLX Property (category-based, not keyword-based)
  console.log('\n── OLX Property ──────────────────────────────────────────')
  for (const [category, categoryId] of Object.entries(OLX_PROPERTY_CATEGORIES)) {
    console.log(`\nScraping OLX property: "${category}" (category_id=${categoryId})`)
    const listings = await scrapeOlxCategory(category, categoryId, 3)
    console.log(`  olx-property: ${listings.length}`)

    if (listings.length > 0) {
      const saved = await saveListings(listings, category)
      totalSaved += saved
      console.log(`  Saved: ${saved}/${listings.length}`)
    }

    await new Promise(r => setTimeout(r, 2000))
  }

  // OLX Vehicles (category-based, not keyword-based)
  console.log('\n── OLX Vehicles ─────────────────────────────────────────')
  for (const [category, categoryId] of Object.entries(OLX_VEHICLE_CATEGORIES)) {
    console.log(`\nScraping OLX vehicle: "${category}" (category_id=${categoryId})`)
    const listings = await scrapeOlxCategory(category, categoryId, 3)
    console.log(`  olx-vehicle: ${listings.length}`)

    if (listings.length > 0) {
      const saved = await saveListings(listings, category)
      totalSaved += saved
      console.log(`  Saved: ${saved}/${listings.length}`)
    }

    await new Promise(r => setTimeout(r, 2000))
  }

  // Motor Bekas + Mobil Bekas keyword scraping
  console.log('\n── Vehicle Categories ─────────────────────────────────────')
  for (const vq of [...MOTOR_BATCH, ...MOBIL_BATCH]) {
    console.log(`\nScraping vehicle: "${vq.q}"`)
    const [toko, shopee] = await Promise.all([
      scrapeTokopedia(vq.q, 20),
      scrapeShopee(vq.q, 20),
    ])
    // Only keep listings with 'bekas' in title (filter out accessories)
    const vehicleListings = [...toko, ...shopee].filter(l =>
      l.title && l.title.toLowerCase().includes('bekas') && l.price > 1_000_000
    ).map(l => ({ ...l, condition: 'used' }))
    console.log(`  vehicle listings: ${vehicleListings.length}/${toko.length+shopee.length}`)
    if (vehicleListings.length > 0) {
      const saved = await saveListings(vehicleListings, vq.category, vq.brand)
      totalSaved += saved
      console.log(`  Saved: ${saved}`)
    }
    await new Promise(r => setTimeout(r, 1500))
  }

  console.log(`\nDone. Total saved: ${totalSaved}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
