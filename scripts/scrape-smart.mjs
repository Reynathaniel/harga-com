#!/usr/bin/env node
/**
 * scrape-smart.mjs — Enhanced scraper with slug-based deduplication
 *
 * Usage:
 *   node scripts/scrape-smart.mjs --platform tokopedia --queries "iphone,samsung,laptop"
 *   node scripts/scrape-smart.mjs --platform all --queries "iphone" --limit 20
 *
 * Env vars required:
 *   SUPABASE_URL           (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_KEY   (service role key — bypasses RLS)
 */

import { parseArgs } from 'node:util'

// ─── Config ─────────────────────────────────────────────────────────────────

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://rtdbfbmbvuqentvxcstf.supabase.co'

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  ''

const MERCHANT_UUID = {
  tokopedia:  '00000000-0000-0000-0000-000000000001',
  shopee:     '00000000-0000-0000-0000-000000000002',
  lazada:     '00000000-0000-0000-0000-000000000003',
  bukalapak:  '00000000-0000-0000-0000-000000000004',
  blibli:     '00000000-0000-0000-0000-000000000005',
  tiktok:     '00000000-0000-0000-0000-000000000006',
  amazon:     '00000000-0000-0000-0000-000000000007',
  aliexpress: '00000000-0000-0000-0000-000000000008',
  alibaba:    '00000000-0000-0000-0000-000000000009',
  jd:         '00000000-0000-0000-0000-000000000010',
  olx:        '00000000-0000-0000-0000-000000000011',
  carousell:  '00000000-0000-0000-0000-000000000012',
}

const ALL_PLATFORMS = Object.keys(MERCHANT_UUID)
const INDO_PLATFORMS = ['tokopedia', 'shopee', 'lazada', 'blibli', 'tiktok', 'bukalapak']

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
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

async function sbFetch(path, options = {}) {
  if (!SUPABASE_KEY) {
    throw new Error('SUPABASE_SERVICE_KEY not set — cannot write to DB')
  }
  const url = `${SUPABASE_URL}/rest/v1${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase ${options.method || 'GET'} ${path} → ${res.status}: ${text}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('json')) return res.json()
  return null
}

/** Check if slug exists, return existing product id or null */
async function findProductBySlug(slug) {
  try {
    const rows = await sbFetch(`/products?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`)
    return rows?.[0]?.id ?? null
  } catch {
    return null
  }
}

/** Upsert product by slug — returns product id */
async function upsertProduct(listing) {
  const slug = slugify(listing.title)
  if (!slug) return null

  const now = new Date().toISOString()
  const body = {
    slug,
    name:           listing.title,
    brand:          listing.brand    ?? null,
    category:       listing.category ?? null,
    image_url:      listing.imageUrl ?? null,
    images:         listing.imageUrl ? [listing.imageUrl] : [],
    tags:           [],
    specifications: listing.specs   ?? {},
    updated_at:     now,
  }

  // Use ON CONFLICT on slug — upsert pattern
  const rows = await sbFetch('/products?on_conflict=slug&select=id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: JSON.stringify(body),
  })
  return rows?.[0]?.id ?? null
}

/** Upsert offer for product+merchant */
async function upsertOffer(productId, merchantId, listing) {
  const now = new Date().toISOString()
  const body = {
    product_id:     productId,
    merchant_id:    merchantId,
    price:          listing.price,
    original_price: listing.originalPrice ?? null,
    discount_pct:   calcDiscount(listing.price, listing.originalPrice),
    shop_name:      listing.shopName   ?? null,
    shop_verified:  listing.shopVerified ?? false,
    free_shipping:  listing.freeShipping ?? false,
    rating:         listing.rating     ?? null,
    review_count:   listing.reviewCount ?? 0,
    sold_count:     listing.sold        ?? 0,
    stock_count:    listing.stock       ?? 0,
    url:            listing.url        ?? null,
    affiliate_url:  listing.affiliateUrl ?? null,
    in_stock:       listing.stock !== 0,
    condition:      listing.condition ?? 'new',
    location:       listing.location  ?? null,
    updated_at:     now,
  }

  const rows = await sbFetch('/offers?on_conflict=product_id,merchant_id&select=id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: JSON.stringify(body),
  })
  return rows?.[0]?.id ?? null
}

/** Append price history if changed */
async function appendPriceHistory(offerId, price) {
  try {
    const rows = await sbFetch(
      `/price_history?offer_id=eq.${offerId}&select=price&order=recorded_at.desc&limit=1`
    )
    const lastPrice = rows?.[0]?.price
    if (lastPrice === price) return  // unchanged — skip

    await sbFetch('/price_history', {
      method: 'POST',
      prefer: 'return=minimal',
      body: JSON.stringify({ offer_id: offerId, price, recorded_at: new Date().toISOString() }),
    })
  } catch {
    // price history is nice-to-have, don't fail the whole listing
  }
}

/** Validate that a URL is reachable (HEAD check) */
async function validateUrl(url) {
  if (!url) return false
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HargaBot/1.0)' },
    })
    return res.ok || res.status === 405  // 405 = HEAD not allowed but URL exists
  } catch {
    return false   // treat as invalid (network error / timeout)
  }
}

// ─── Mock search (replace with real scraper calls in production) ─────────────

const CATEGORY_MAP = {
  iphone:    'Elektronik',
  samsung:   'Elektronik',
  laptop:    'Elektronik',
  macbook:   'Elektronik',
  headphone: 'Elektronik',
  speaker:   'Elektronik',
  baju:      'Fashion',
  celana:    'Fashion',
  sepatu:    'Fashion',
  tas:       'Fashion',
  kulkas:    'Rumah Tangga',
  mesin_cuci:'Rumah Tangga',
  dispenser: 'Rumah Tangga',
  skincare:  'Kecantikan',
  lipstik:   'Kecantikan',
  serum:     'Kecantikan',
}

function guessCategory(query) {
  const q = query.toLowerCase().replace(' ', '_')
  for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
    if (q.includes(key)) return cat
  }
  return 'Lainnya'
}

/**
 * Simulates scraping a platform for a query.
 * In production, swap this with actual scraper calls via dynamic import
 * of the platform scrapers from src/lib/scrapers/.
 *
 * Returns array of RawListing-compatible objects.
 */
async function scrapeQuery(platform, query, limit = 30) {
  const category = guessCategory(query)
  const merchantId = MERCHANT_UUID[platform]
  if (!merchantId) return []

  // Generate synthetic listings (replace with real HTTP scraping logic)
  const listings = []
  const priceBase = Math.floor(Math.random() * 500_000) + 100_000
  for (let i = 0; i < Math.min(limit, 10); i++) {
    const priceVariance = Math.floor(Math.random() * 100_000)
    const price = priceBase + priceVariance * (i % 3 === 0 ? -1 : 1)
    listings.push({
      title:         `${query} ${platform} variant ${i + 1}`,
      platformId:    platform,
      productId:     `${platform}-${query}-${i}`,
      price:         Math.max(10_000, price),
      originalPrice: Math.random() > 0.5 ? price + 50_000 : undefined,
      imageUrl:      `https://placehold.co/400x400/1A1613/FAF9F6?text=${encodeURIComponent(query)}`,
      url:           `https://www.${platform}.com/product/${query}-${i}`,
      shopName:      `Toko ${platform} ${i + 1}`,
      rating:        3.5 + Math.random() * 1.5,
      reviewCount:   Math.floor(Math.random() * 500),
      sold:          Math.floor(Math.random() * 200),
      freeShipping:  Math.random() > 0.5,
      category,
    })
  }
  return listings
}

// ─── Core save logic with dedup ──────────────────────────────────────────────

async function saveListing(listing) {
  const merchantId = MERCHANT_UUID[listing.platformId]
  if (!merchantId) return 'skipped'

  const slug = slugify(listing.title)
  if (!slug) return 'skipped'

  // Check existing
  const existingId = await findProductBySlug(slug)

  if (existingId) {
    // UPDATE offer only — product already exists
    const offerId = await upsertOffer(existingId, merchantId, listing)
    if (offerId) {
      await appendPriceHistory(offerId, listing.price)
      return 'updated'
    }
    return 'error'
  } else {
    // INSERT new product + offer
    const productId = await upsertProduct(listing)
    if (!productId) return 'error'

    const offerId = await upsertOffer(productId, merchantId, listing)
    if (offerId) {
      await appendPriceHistory(offerId, listing.price)
      return 'inserted'
    }
    return 'error'
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { values } = parseArgs({
    options: {
      platform: { type: 'string', default: 'tokopedia' },
      queries:  { type: 'string', default: 'iphone' },
      limit:    { type: 'string', default: '20' },
      validate: { type: 'boolean', default: false },
      dryrun:   { type: 'boolean', default: false },
    },
    strict: false,
  })

  const platforms = values.platform === 'all'
    ? ALL_PLATFORMS
    : values.platform === 'indo'
    ? INDO_PLATFORMS
    : values.platform.split(',').map(p => p.trim()).filter(Boolean)

  const queries = values.queries.split(',').map(q => q.trim()).filter(Boolean)
  const limit   = parseInt(values.limit, 10) || 20
  const dryrun  = values.dryrun === true
  const validateUrls = values.validate === true

  console.log(`\n🔍 scrape-smart.mjs`)
  console.log(`   Platforms : ${platforms.join(', ')}`)
  console.log(`   Queries   : ${queries.join(', ')}`)
  console.log(`   Limit     : ${limit} per platform/query`)
  console.log(`   Dry run   : ${dryrun}`)
  console.log(`   URL check : ${validateUrls}`)
  console.log(`   DB        : ${SUPABASE_URL}`)
  console.log(`   Key set   : ${SUPABASE_KEY ? 'YES' : 'NO (dry-run only)'}`)
  console.log()

  let totalInserted = 0
  let totalUpdated  = 0
  let totalSkipped  = 0
  let totalErrors   = 0

  for (const query of queries) {
    for (const platform of platforms) {
      console.log(`  ▶ [${platform}] "${query}" ...`)

      let listings
      try {
        listings = await scrapeQuery(platform, query, limit)
      } catch (err) {
        console.error(`    ✗ Scrape failed: ${err.message}`)
        totalErrors++
        continue
      }

      console.log(`    Found ${listings.length} listings`)

      for (const listing of listings) {
        // Optional URL validation
        if (validateUrls && listing.url) {
          const ok = await validateUrl(listing.url)
          if (!ok) {
            console.log(`    ⚠ Skipping invalid URL: ${listing.url}`)
            totalSkipped++
            continue
          }
        }

        if (dryrun) {
          console.log(`    [DRY] Would save: "${listing.title}" @ Rp ${listing.price.toLocaleString('id-ID')}`)
          totalInserted++
          continue
        }

        try {
          const result = await saveListing(listing)
          if      (result === 'inserted') totalInserted++
          else if (result === 'updated')  totalUpdated++
          else if (result === 'skipped')  totalSkipped++
          else                             totalErrors++
        } catch (err) {
          console.error(`    ✗ Save error: ${err.message}`)
          totalErrors++
        }
      }
    }
  }

  console.log('\n─────────────────────────────────')
  console.log(`  ✅ Inserted : ${totalInserted}`)
  console.log(`  🔄 Updated  : ${totalUpdated}`)
  console.log(`  ⏭  Skipped  : ${totalSkipped}`)
  console.log(`  ❌ Errors   : ${totalErrors}`)
  console.log('─────────────────────────────────\n')

  if (totalErrors > 0) process.exit(1)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
