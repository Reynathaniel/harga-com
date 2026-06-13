#!/usr/bin/env node
/**
 * scrape-local.mjs — Local scraper for Shopee + TikTok Shop
 *
 * Runs on your Windows machine (residential IP) to bypass anti-bot blocks.
 * Saves results directly to Supabase.
 *
 * Usage:
 *   node scripts/scrape-local.mjs --platform shopee --query "iphone 16" --limit 40
 *   node scripts/scrape-local.mjs --platform tiktok --query "samsung" --limit 20
 *   node scripts/scrape-local.mjs --platform all --query "laptop" --limit 40
 *   node scripts/scrape-local.mjs --platform shopee --queries "iphone,samsung,laptop" --limit 20
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// ENV LOADER
// ─────────────────────────────────────────────────────────────────────────────

function loadEnv(path = '.env.local') {
  try {
    const lines = readFileSync(path, 'utf8').split('\n')
    const env = {}
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq < 0) continue
      const k = trimmed.slice(0, eq).trim()
      let v = trimmed.slice(eq + 1).trim()
      // Strip surrounding quotes
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      env[k] = v
    }
    return env
  } catch (e) {
    console.error(`[env] Cannot read ${path}: ${e.message}`)
    process.exit(1)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI ARGS
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2)
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true
      args[key] = val
    }
  }
  return args
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function cleanTitle(raw) {
  return (raw ?? '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function get(obj, path, fallback) {
  try {
    const parts = path.split('.')
    let cur = obj
    for (const p of parts) {
      cur = cur?.[p]
      if (cur === undefined || cur === null) return fallback
    }
    return cur ?? fallback
  } catch {
    return fallback
  }
}

function parsePrice(raw) {
  if (typeof raw === 'number') return Math.round(raw)
  const cleaned = String(raw)
    .replace(/[^\d.,]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  return Math.round(parseFloat(cleaned)) || 0
}

const UA_LIST = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
]

let _uaIndex = 0
function nextUA() { return UA_LIST[_uaIndex++ % UA_LIST.length] }

async function fetchJsonWithRetry(url, headers = {}, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 15_000)
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': nextUA(),
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          ...headers,
        },
      })
      clearTimeout(timer)
      if (res.status === 429) {
        const wait = Math.pow(2, attempt) * 1500
        console.warn(`  [rate-limit] 429 → waiting ${wait}ms`)
        await sleep(wait)
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (attempt === retries) return null
      await sleep(Math.pow(2, attempt) * 500)
    }
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// SHOPEE SCRAPER
// ─────────────────────────────────────────────────────────────────────────────

function parseShopeeItem(raw) {
  try {
    const id = String(get(raw, 'itemid', '') || get(raw, 'item_id', ''))
    const shopId = String(get(raw, 'shopid', '') || get(raw, 'shop_id', ''))
    const title = cleanTitle(get(raw, 'name', ''))
    if (!title || !id) return null

    const priceRaw = get(raw, 'price', 0)
    const price = priceRaw > 100000 ? Math.round(priceRaw / 100000) : Math.round(priceRaw)
    if (!price) return null

    const origRaw = get(raw, 'price_before_discount', 0)
    const originalPrice = origRaw > 100000 ? Math.round(origRaw / 100000) : Math.round(origRaw)

    const images = get(raw, 'images', [])
    const cover = get(raw, 'image', '') || images[0] || ''
    const imageUrl = cover.startsWith('http') ? cover : `https://cf.shopee.co.id/file/${cover}_tn`

    const videoList = get(raw, 'video_info_list', [])
    const videoRaw = videoList.length > 0 ? videoList[0] : null
    const videoUrl = videoRaw
      ? (get(videoRaw, 'default_format.url', '') || get(videoRaw, 'url', '')) || undefined
      : undefined
    const videoThumb = videoRaw ? get(videoRaw, 'thumbnail', '') || undefined : undefined

    const affiliateId = process.env.AFFILIATE_SHOPEE_ID
    let affiliateUrl = undefined
    if (affiliateId && affiliateId !== 'PENDING') {
      const base = `https://shopee.co.id/product/${shopId}/${id}`
      const u = new URL(base)
      u.searchParams.set('af_id', affiliateId)
      u.searchParams.set('utm_source', 'harga.com')
      u.searchParams.set('utm_medium', 'affiliate')
      affiliateUrl = u.toString()
    }

    return {
      platformId: 'shopee', productId: id, title, price,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      currency: 'IDR',
      discount: get(raw, 'discount', 0) || undefined,
      rating: get(raw, 'item_rating.rating_star', 0) || get(raw, 'rating_star', 0),
      reviewCount: get(raw, 'item_rating.rating_count.0', 0) || 0,
      sold: get(raw, 'historical_sold', 0) || get(raw, 'sold', 0),
      stock: get(raw, 'stock', 0),
      shopName: get(raw, 'shop_name', 'Shopee Store'),
      shopVerified: get(raw, 'is_official_shop', false) || get(raw, 'shopee_verified', false),
      freeShipping: get(raw, 'free_shipping', false),
      url: `https://shopee.co.id/product/${shopId}/${id}`,
      affiliateUrl,
      imageUrl, videoUrl, videoThumb,
      scrapedAt: new Date(),
    }
  } catch {
    return null
  }
}

async function scrapeShopee(query, limit = 40, page = 1) {
  const params = new URLSearchParams({
    keyword: query, limit: String(Math.min(limit, 60)),
    newest: String((page - 1) * Math.min(limit, 60)),
    order: 'desc', page_type: 'search',
    scenario: 'PAGE_GLOBAL_SEARCH', version: '2',
  })

  const data = await fetchJsonWithRetry(
    `https://shopee.co.id/api/v4/search/search_items?${params}`,
    {
      Referer: 'https://shopee.co.id/search',
      'X-API-Source': 'pc',
      'X-Shopee-Language': 'id',
    }
  )

  if (!data) return []
  const items = Array.isArray(data.items) ? data.items : []
  return items.map(i => parseShopeeItem(i.item_basic ?? i)).filter(Boolean)
}

// ─────────────────────────────────────────────────────────────────────────────
// TIKTOK SHOP SCRAPER
// ─────────────────────────────────────────────────────────────────────────────

function parseTikTokItem(raw) {
  try {
    const id = String(get(raw, 'id', '') || get(raw, 'product_id', ''))
    const title = cleanTitle(get(raw, 'title', '') || get(raw, 'product_name', '') || get(raw, 'name', ''))
    if (!title || !id) return null

    const priceRaw = get(raw, 'price.original_price', null)
      ?? get(raw, 'price.sale_price', null)
      ?? get(raw, 'price', null)
      ?? get(raw, 'sale_price', null)
      ?? get(raw, 'min_price', null)
    const price = parsePrice(String(priceRaw ?? '0'))
    if (!price) return null

    const origRaw = get(raw, 'price.market_price', null) ?? get(raw, 'original_price', null)
    const originalPrice = origRaw ? parsePrice(String(origRaw)) : undefined

    const cover = get(raw, 'cover', '') || get(raw, 'main_image', '') || get(raw, 'images.0', '') || ''

    const videoUrl = get(raw, 'video.play_url', '') || get(raw, 'video_url', '') || get(raw, 'video.url', '') || undefined
    const videoThumb = get(raw, 'video.cover', '') || cover || undefined

    return {
      platformId: 'tiktok', productId: id, title, price,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      currency: 'IDR',
      discount: get(raw, 'price.discount', 0) || undefined,
      rating: parseFloat(String(get(raw, 'rating', 0))) || 0,
      reviewCount: parseInt(String(get(raw, 'comment_count', 0))) || 0,
      sold: parseInt(String(get(raw, 'sales', 0))) || parseInt(String(get(raw, 'sold_count', 0))) || 0,
      stock: parseInt(String(get(raw, 'stock', 0))) || 0,
      shopName: get(raw, 'shop.name', '') || get(raw, 'seller_name', '') || 'TikTok Shop',
      shopVerified: get(raw, 'shop.is_official', false),
      freeShipping: get(raw, 'free_shipping', false),
      url: `https://shop.tiktok.com/view/product/${id}`,
      imageUrl: cover,
      videoUrl,
      videoThumb,
      scrapedAt: new Date(),
    }
  } catch {
    return null
  }
}

async function scrapeTikTok(query, limit = 20) {
  const pageSize = Math.min(limit, 30)

  // Primary: shop.tiktok.com search API
  const params1 = new URLSearchParams({
    keyword: query, sort_type: '0',
    offset: '0', limit: String(pageSize),
    is_in_sale: '0', locale: 'id-ID', currency: 'IDR',
  })

  const data1 = await fetchJsonWithRetry(
    `https://shop.tiktok.com/api/search?${params1}`,
    { Referer: 'https://shop.tiktok.com/search' }
  )

  if (data1) {
    const items = get(data1, 'data.items', []) || get(data1, 'items', []) || []
    if (items.length > 0) return items.map(parseTikTokItem).filter(Boolean)
  }

  // Fallback: affiliate partner search
  const params2 = new URLSearchParams({
    keyword: query, page: '1', page_size: String(pageSize),
    sort_type: '0', currency: 'IDR', locale: 'id-ID',
  })

  const data2 = await fetchJsonWithRetry(
    `https://affiliate.tiktok.com/connection/product/search?${params2}`,
    { Referer: 'https://affiliate.tiktok.com' }
  )

  if (data2) {
    const items = get(data2, 'data.products', []) || get(data2, 'products', []) || []
    return items.map(parseTikTokItem).filter(Boolean)
  }

  return []
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE SAVE
// ─────────────────────────────────────────────────────────────────────────────

const MERCHANT_ID = {
  tokopedia:  '00000000-0000-0000-0000-000000000001',
  shopee:     '00000000-0000-0000-0000-000000000002',
  lazada:     '00000000-0000-0000-0000-000000000003',
  bukalapak:  '00000000-0000-0000-0000-000000000004',
  blibli:     '00000000-0000-0000-0000-000000000005',
  tiktok:     '00000000-0000-0000-0000-000000000006',
  amazon:     '00000000-0000-0000-0000-000000000007',
  aliexpress: '00000000-0000-0000-0000-000000000008',
  alibaba:    '00000000-0000-0000-0000-000000000009',
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 100)
}

function calcDiscount(price, originalPrice) {
  if (!originalPrice || originalPrice <= price) return null
  return Math.round((1 - price / originalPrice) * 100)
}

async function saveListings(db, listings) {
  let upserted = 0, skipped = 0, errors = 0
  const now = new Date().toISOString()

  for (const listing of listings) {
    const merchantId = MERCHANT_ID[listing.platformId]
    if (!merchantId) { skipped++; continue }

    try {
      const slug = slugify(listing.title)
      if (!slug) { skipped++; continue }

      // 1. Upsert product
      const { data: product, error: pErr } = await db
        .from('products')
        .upsert({
          slug,
          name:           listing.title,
          brand:          listing.brand    ?? null,
          category:       listing.category ?? null,
          image_url:      listing.imageUrl,
          images:         [listing.imageUrl].filter(Boolean),
          tags:           [],
          specifications: listing.specs ?? {},
          updated_at:     now,
        }, { onConflict: 'slug' })
        .select('id')
        .single()

      if (pErr || !product) {
        if (pErr) console.error(`  [db] product upsert: ${pErr.message}`)
        errors++; continue
      }

      // 2. Upsert offer
      const { data: offer, error: oErr } = await db
        .from('offers')
        .upsert({
          product_id:     product.id,
          merchant_id:    merchantId,
          price:          listing.price,
          original_price: listing.originalPrice ?? null,
          discount_pct:   calcDiscount(listing.price, listing.originalPrice),
          shop_name:      listing.shopName,
          shop_verified:  listing.shopVerified,
          free_shipping:  listing.freeShipping,
          rating:         listing.rating,
          review_count:   listing.reviewCount,
          sold_count:     listing.sold,
          stock_count:    listing.stock,
          url:            listing.url,
          affiliate_url:  listing.affiliateUrl ?? null,
          in_stock:       listing.stock !== 0,
          video_url:      listing.videoUrl   ?? null,
          video_thumb:    listing.videoThumb ?? null,
          updated_at:     now,
        }, { onConflict: 'product_id,merchant_id' })
        .select('id')
        .single()

      if (oErr || !offer) {
        if (oErr) console.error(`  [db] offer upsert: ${oErr.message}`)
        errors++; continue
      }

      // 3. Price history — only if price changed
      const { data: lastH } = await db
        .from('price_history')
        .select('price')
        .eq('offer_id', offer.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()

      if (!lastH || lastH.price !== listing.price) {
        await db.from('price_history').insert({
          offer_id:    offer.id,
          price:       listing.price,
          recorded_at: now,
        })
      }

      upserted++
    } catch (err) {
      console.error(`  [db] unexpected: ${err.message}`)
      errors++
    }
  }

  return { upserted, skipped, errors }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function runScrape({ platform, query, limit, db, dryRun }) {
  const platforms = platform === 'all' ? ['shopee', 'tiktok'] : [platform]

  for (const p of platforms) {
    process.stdout.write(`[${p.charAt(0).toUpperCase() + p.slice(1)}] ${query} → scraping...`)
    let listings = []

    try {
      if (p === 'shopee') {
        listings = await scrapeShopee(query, limit)
      } else if (p === 'tiktok') {
        listings = await scrapeTikTok(query, limit)
      } else {
        console.log(` unknown platform: ${p}`)
        continue
      }
    } catch (err) {
      console.log(` ERROR: ${err.message}`)
      continue
    }

    process.stdout.write(` ${listings.length} results`)

    if (listings.length === 0) {
      console.log(' → 0 (blocked or no results)')
      continue
    }

    if (dryRun) {
      console.log(` → dry-run (not saved)`)
      console.log(`  Sample: ${listings[0]?.title?.slice(0, 60)} | Rp ${listings[0]?.price?.toLocaleString('id-ID')}`)
      continue
    }

    const saved = await saveListings(db, listings)
    console.log(` → saved: ${JSON.stringify(saved)}`)

    // Rate limit between platforms
    if (platforms.indexOf(p) < platforms.length - 1) await sleep(1000)
  }
}

async function main() {
  const args = parseArgs(process.argv)

  // Load env
  const envPath = args.env ?? '.env.local'
  const env = loadEnv(envPath)

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('[error] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  const db = createClient(supabaseUrl, serviceKey)
  const dryRun = args['dry-run'] === true || args['dry-run'] === 'true'

  const platform = (args.platform ?? 'all').toLowerCase()
  const limit    = parseInt(args.limit ?? '40')

  // Support --queries "iphone,samsung,laptop" or --query "iphone"
  const queries = args.queries
    ? args.queries.split(',').map(q => q.trim()).filter(Boolean)
    : args.query
      ? [args.query]
      : null

  if (!queries || queries.length === 0) {
    console.error('[error] Provide --query "keyword" or --queries "kw1,kw2,kw3"')
    process.exit(1)
  }

  console.log(`\n🛒 harga.com local scraper`)
  console.log(`   platform : ${platform}`)
  console.log(`   queries  : ${queries.join(', ')}`)
  console.log(`   limit    : ${limit} per platform`)
  if (dryRun) console.log(`   mode     : DRY RUN (no Supabase writes)`)
  console.log('')

  for (const query of queries) {
    await runScrape({ platform, query, limit, db, dryRun })
    if (queries.indexOf(query) < queries.length - 1) await sleep(1500)
  }

  console.log('\n✅ Done.')
}

main().catch(err => {
  console.error('[fatal]', err)
  process.exit(1)
})
