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
  carousell: '00000000-0000-0000-0000-000000000012',
}

// ── Supabase Storage: proxy image from blocked CDN ─────────────────────────
async function proxyImageToStorage(imageUrl, platformId, productId) {
  if (!imageUrl || !imageUrl.startsWith('http')) return imageUrl
  try {
    const referer = platformId === 'olx' ? 'https://www.olx.co.id/' : 'https://id.carousell.com/'
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Referer: referer,
        Accept: 'image/webp,image/avif,image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return imageUrl
    const buffer = await res.arrayBuffer()
    if (buffer.byteLength < 1000) return imageUrl // blocked / too small

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
    const path = `${platformId}/${String(productId).replace(/[^a-z0-9-]/gi, '_')}.${ext}`

    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, buffer, { contentType, upsert: true })
    if (error) return imageUrl

    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    return data?.publicUrl ?? imageUrl
  } catch {
    return imageUrl
  }
}

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

// ── OLX Playwright scraper ────────────────────────────────────────────────
function parseOlxPrice(str) {
  if (!str) return 0
  const n = str.replace(/[^\d]/g, '')
  return parseInt(n) || 0
}

async function scrapeOlxPlaywright(query, limit = 20) {
  let browser
  try {
    const { chromium } = await import('playwright')
    console.log(`  [OLX-PW] launching browser for: ${query}`)
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      locale: 'id-ID',
      extraHTTPHeaders: { 'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8' },
    })
    const page = await context.newPage()
    await page.goto(`https://www.olx.co.id/items/q-${encodeURIComponent(query)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    // Wait for listings to appear
    await page.waitForTimeout(2000)

    // Try to extract window.__PRELOADED_STATE__
    const state = await page.evaluate(() => {
      try { return window.__PRELOADED_STATE__ } catch { return null }
    }).catch(() => null)

    if (state) {
      const ads = state?.listing?.listingReducer?.ads
        || state?.ads?.ads
        || []
      const results = ads.slice(0, limit).map(ad => {
        const id = String(ad?.id || ad?.ad_id || '')
        const title = (ad?.title || ad?.subject || '').trim()
        const priceRaw = ad?.price?.value?.raw ?? ad?.price?.value ?? ad?.price ?? 0
        const price = typeof priceRaw === 'string' ? parseOlxPrice(priceRaw) : Math.round(Number(priceRaw))
        if (!id || !title || !price) return null
        const images = ad?.images || []
        const imageUrl = images[0]?.url || ad?.thumbnail || ad?.mainImage?.url || ''
        const url = ad?.url?.startsWith('http') ? ad.url : `https://www.olx.co.id/item/${id}.html`
        const location = ad?.location?.name || ad?.geo?.cityName || ad?.city || ''
        return { platformId: 'olx', productId: id, title, price, imageUrl, productUrl: url, shopName: ad?.user?.name || 'OLX Seller', condition: 'used', location, category: 'Motor Bekas' }
      }).filter(Boolean)
      if (results.length > 0) return results
    }

    // Fallback: scrape DOM
    const items = await page.$$eval('[data-aut-id="itemBox"], li[data-aut-id]', (els) =>
      els.map(el => ({
        title: el.querySelector('[data-aut-id="itemTitle"]')?.textContent?.trim() || '',
        price: el.querySelector('[data-aut-id="itemPrice"]')?.textContent?.trim() || '0',
        img: el.querySelector('img')?.src || '',
        url: el.querySelector('a')?.href || '',
      }))
    ).catch(() => [])

    return items.slice(0, limit)
      .filter(i => i.title && i.price !== '0')
      .map((i, idx) => ({
        platformId: 'olx',
        productId: i.url.split('/').filter(Boolean).pop()?.split('.')[0] || `olx-${Date.now()}-${idx}`,
        title: i.title,
        price: parseOlxPrice(i.price),
        imageUrl: i.img,
        productUrl: i.url,
        shopName: 'OLX Seller',
        condition: 'used',
        location: '',
        category: 'Motor Bekas',
      }))
  } catch (e) {
    console.log(`  [OLX-PW] error: ${e.message}`)
    return []
  } finally {
    await browser?.close()
  }
}

// ── Carousell Playwright scraper ──────────────────────────────────────────
async function scrapeCarousellPlaywright(query, limit = 20) {
  let browser
  try {
    const { chromium } = await import('playwright')
    console.log(`  [CAROUSELL-PW] launching browser for: ${query}`)
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      locale: 'id-ID',
    })
    const page = await context.newPage()
    await page.goto(`https://id.carousell.com/search/?keyword=${encodeURIComponent(query)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    await page.waitForTimeout(2500)

    // Try __NEXT_DATA__
    const nextData = await page.evaluate(() => {
      try {
        const el = document.getElementById('__NEXT_DATA__')
        return el ? JSON.parse(el.textContent) : null
      } catch { return null }
    }).catch(() => null)

    if (nextData) {
      const results =
        nextData?.props?.pageProps?.initialData?.results ||
        nextData?.props?.initialProps?.searchResults || []
      const parsed = results.slice(0, limit).map(r => {
        const id = String(r?.id || r?.listing?.id || r?.listingId || '')
        const title = (r?.title || r?.listing?.title || r?.name || '').trim()
        const priceVal = r?.price?.value || r?.listing?.price?.value || r?.priceCents || r?.price || 0
        const price = Math.round(Number(priceVal))
        if (!id || !title || !price) return null
        const imageUrl = r?.coverPhoto?.url || r?.listing?.coverPhoto?.url || r?.photo || r?.thumbnail || ''
        const slug = r?.slug || r?.listing?.slug || id
        const url = `https://id.carousell.com/p/${slug}/`
        return { platformId: 'carousell', productId: id, title, price, imageUrl, productUrl: url, shopName: r?.seller?.username || 'Carousell Seller', condition: 'used', location: r?.seller?.city || '', category: 'Motor Bekas' }
      }).filter(Boolean)
      if (parsed.length > 0) return parsed
    }

    // DOM fallback
    const items = await page.$$eval('[data-testid="listing-card"], [class*="D_J"]', (els) =>
      els.map(el => ({
        title: el.querySelector('[data-testid="listing-card-title"], [class*="D_ZA"]')?.textContent?.trim() || '',
        price: el.querySelector('[data-testid="listing-card-price"], [class*="D_aW"]')?.textContent?.trim() || '0',
        img: el.querySelector('img')?.src || '',
        url: el.querySelector('a')?.href || '',
      }))
    ).catch(() => [])

    return items.slice(0, limit)
      .filter(i => i.title)
      .map((i, idx) => ({
        platformId: 'carousell',
        productId: i.url.split('/').filter(Boolean).pop() || `cr-${Date.now()}-${idx}`,
        title: i.title,
        price: parseOlxPrice(i.price),
        imageUrl: i.img,
        productUrl: i.url,
        shopName: 'Carousell Seller',
        condition: 'used',
        location: '',
        category: 'Motor Bekas',
      }))
  } catch (e) {
    console.log(`  [CAROUSELL-PW] error: ${e.message}`)
    return []
  } finally {
    await browser?.close()
  }
}

// ── Save to Supabase ───────────────────────────────────────────────────────
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().slice(0, 100)
}

async function saveListings(listings, { proxyImages = false } = {}) {
  let saved = 0
  const now = new Date().toISOString()
  for (const l of listings) {
    try {
      const slug = slugify(l.title) + '-' + l.platformId + '-' + l.productId.slice(-6)
      const merchantId = MERCHANT_ID[l.platformId]
      if (!merchantId) continue

      // Optionally proxy blocked CDN images to Supabase Storage
      let imageUrl = l.imageUrl || null
      if (proxyImages && imageUrl) {
        imageUrl = await proxyImageToStorage(imageUrl, l.platformId, l.productId)
      }

      // Check for existing product
      const { data: existing } = await supabase
        .from('products')
        .select('id, image_url')
        .eq('slug', slug)
        .maybeSingle()

      let product = existing

      if (existing) {
        // Only update image if current one is missing or placeholder
        const hasImage = existing.image_url && existing.image_url.startsWith('http')
        const patch = {
          name: l.title,
          category: l.category ?? existing.category ?? null,
          updated_at: now,
          ...(imageUrl && !hasImage ? { image_url: imageUrl, images: [imageUrl] } : {}),
        }
        const { error: uErr } = await supabase.from('products').update(patch).eq('id', existing.id)
        if (uErr) continue
      } else {
        const { data: inserted, error: pErr } = await supabase
          .from('products')
          .insert({
            slug,
            name: l.title,
            brand: l.brand ?? null,
            category: l.category ?? null,
            image_url: imageUrl,
            images: imageUrl ? [imageUrl] : [],
            tags: [],
            specifications: l.specs ?? (l.location ? { city: l.location } : {}),
            updated_at: now,
          })
          .select('id')
          .single()
        if (pErr || !inserted) continue
        product = inserted
      }

      if (!product) continue

      // Upsert offer
      const { data: offer, error: oErr } = await supabase
        .from('offers')
        .upsert({
          product_id: product.id,
          merchant_id: merchantId,
          price: l.price,
          original_price: l.originalPrice ?? null,
          discount_pct: l.discountPct ?? null,
          shop_name: l.shopName ?? null,
          shop_verified: false,
          free_shipping: false,
          rating: 0,
          review_count: 0,
          sold_count: 0,
          stock_count: 1,
          url: l.productUrl ?? null,
          condition: l.condition ?? 'used',
          location: l.location ?? null,
          in_stock: true,
          updated_at: now,
        }, { onConflict: 'product_id,merchant_id' })
        .select('id')
        .single()

      if (oErr || !offer) continue

      // Price history — only if changed
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
    } catch (_) { /* skip */ }
  }
  return saved
}

// ── Bekas queries (OLX + Carousell with Playwright) ───────────────────────
const BEKAS_QUERIES = [
  // Motor bekas
  { query: 'Honda Beat bekas', category: 'Motor Bekas' },
  { query: 'Yamaha NMAX bekas', category: 'Motor Bekas' },
  { query: 'Yamaha Mio bekas', category: 'Motor Bekas' },
  { query: 'Honda Vario bekas', category: 'Motor Bekas' },
  { query: 'Honda PCX bekas', category: 'Motor Bekas' },
  { query: 'Kawasaki Ninja bekas', category: 'Motor Bekas' },
  { query: 'Suzuki GSX bekas', category: 'Motor Bekas' },
  // Mobil bekas
  { query: 'Toyota Avanza bekas', category: 'Mobil Bekas' },
  { query: 'Honda Brio bekas', category: 'Mobil Bekas' },
  { query: 'Daihatsu Ayla bekas', category: 'Mobil Bekas' },
  { query: 'Toyota Rush bekas', category: 'Mobil Bekas' },
  { query: 'Honda Jazz bekas', category: 'Mobil Bekas' },
  // Rumah/properti bekas
  { query: 'rumah bekas Jakarta', category: 'Rumah' },
  { query: 'rumah bekas Surabaya', category: 'Rumah' },
  { query: 'apartemen bekas', category: 'Apartemen' },
]

// Pick a rotating batch of 4 bekas queries per run (by hour, not overlapping with main batch)
const BEKAS_HOUR_OFFSET = (HOUR % 4) * 4
const BEKAS_BATCH = BEKAS_QUERIES.slice(BEKAS_HOUR_OFFSET, BEKAS_HOUR_OFFSET + 4)

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[${new Date().toISOString()}] Starting scraper`)
  console.log(`Queries this run: ${QUERIES.join(', ')}`)

  let totalSaved = 0

  // Regular marketplace scraping (Tokopedia, Shopee, Bukalapak)
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

    await new Promise(r => setTimeout(r, 2000))
  }

  // Bekas scraping — OLX + Carousell via Playwright (real photos for used goods)
  console.log(`\n── Bekas scraping (${BEKAS_BATCH.length} queries via Playwright) ──`)
  for (const { query, category } of BEKAS_BATCH) {
    console.log(`\nBekas: "${query}"`)

    const [olxResults, carousellResults] = await Promise.all([
      scrapeOlxPlaywright(query, 20),
      scrapeCarousellPlaywright(query, 20),
    ])

    // Override category per query
    const withCategory = [...olxResults, ...carousellResults].map(r => ({ ...r, category }))
    console.log(`  olx: ${olxResults.length} | carousell: ${carousellResults.length}`)

    if (withCategory.length > 0) {
      const saved = await saveListings(withCategory, { proxyImages: true })
      totalSaved += saved
      console.log(`  Saved: ${saved}/${withCategory.length} (images proxied to Storage)`)
    }

    await new Promise(r => setTimeout(r, 3000))
  }

  console.log(`\nDone. Total saved: ${totalSaved}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
