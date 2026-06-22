#!/usr/bin/env node
/**
 * scrape-all-local.mjs — Full multi-platform local scraper
 *
 * Runs on your Windows machine (residential IP) to bypass anti-bot blocks.
 * Covers: Shopee, TikTok, Tokopedia, Lazada, Bukalapak, Blibli, Amazon, AliExpress, Alibaba
 * Saves results directly to Supabase.
 *
 * Usage:
 *   node scripts/scrape-all-local.mjs --query "iphone 16"
 *   node scripts/scrape-all-local.mjs --queries "iphone,samsung,laptop" --limit 30
 *   node scripts/scrape-all-local.mjs --platform shopee,tokopedia --queries "iphone,samsung"
 *   node scripts/scrape-all-local.mjs --dry-run --query "test"
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
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const USD_TO_IDR = 16200
const CNY_TO_IDR = 2230

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

const ALL_PLATFORMS = ['shopee', 'tiktok', 'tokopedia', 'lazada', 'bukalapak', 'blibli', 'amazon', 'aliexpress', 'alibaba']

const UA_LIST = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
]

let _uaIdx = 0
function nextUA() { return UA_LIST[_uaIdx++ % UA_LIST.length] }

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function cleanTitle(raw) {
  return (raw ?? '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function get(obj, path, fallback = null) {
  try {
    const parts = path.split('.')
    let cur = obj
    for (const p of parts) {
      cur = cur?.[p]
      if (cur === undefined || cur === null) return fallback
    }
    return cur ?? fallback
  } catch { return fallback }
}

function parsePrice(raw) {
  if (typeof raw === 'number') return Math.round(raw)
  const cleaned = String(raw).replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.')
  return Math.round(parseFloat(cleaned)) || 0
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  const { asJson = true, ...fetchOptions } = options
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 18_000)
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': nextUA(),
          Accept: asJson ? 'application/json, text/plain, */*' : 'text/html,application/xhtml+xml,*/*',
          'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          ...fetchOptions.headers,
        },
        ...fetchOptions,
      })
      clearTimeout(timer)
      if (res.status === 429) {
        const wait = Math.pow(2, attempt) * 2000
        console.warn(`    [rate-limit] 429 → waiting ${wait}ms`)
        await sleep(wait)
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return asJson ? await res.json() : await res.text()
    } catch (err) {
      if (attempt === retries) return null
      await sleep(Math.pow(2, attempt) * 800)
    }
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM SCRAPERS
// ─────────────────────────────────────────────────────────────────────────────

// ── SHOPEE ────────────────────────────────────────────────────────────────────
function parseShopeeItem(raw) {
  try {
    const id = String(get(raw, 'itemid') || get(raw, 'item_id') || '')
    const shopId = String(get(raw, 'shopid') || get(raw, 'shop_id') || '')
    const title = cleanTitle(get(raw, 'name') || '')
    if (!title || !id) return null
    const priceRaw = get(raw, 'price') ?? 0
    const price = priceRaw > 100000 ? Math.round(priceRaw / 100000) : Math.round(priceRaw)
    if (!price) return null
    const origRaw = get(raw, 'price_before_discount') ?? 0
    const originalPrice = origRaw > 100000 ? Math.round(origRaw / 100000) : Math.round(origRaw)
    const images = get(raw, 'images') || []
    const cover = get(raw, 'image') || images[0] || ''
    const imageUrl = cover.startsWith('http') ? cover : `https://cf.shopee.co.id/file/${cover}_tn`
    const videoList = get(raw, 'video_info_list') || []
    const videoRaw = videoList.length > 0 ? videoList[0] : null
    const videoUrl = videoRaw ? (get(videoRaw, 'default_format.url') || get(videoRaw, 'url') || undefined) : undefined
    const videoThumb = videoRaw ? get(videoRaw, 'thumbnail') || undefined : undefined
    return {
      platformId: 'shopee', productId: id, title, price,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      currency: 'IDR', discount: get(raw, 'discount') || undefined,
      rating: get(raw, 'item_rating.rating_star') || get(raw, 'rating_star') || 0,
      reviewCount: get(raw, 'item_rating.rating_count.0') || 0,
      sold: get(raw, 'historical_sold') || get(raw, 'sold') || 0,
      stock: get(raw, 'stock') || 0,
      shopName: get(raw, 'shop_name') || 'Shopee Store',
      shopVerified: get(raw, 'is_official_shop') || false,
      freeShipping: get(raw, 'free_shipping') || false,
      url: `https://shopee.co.id/product/${shopId}/${id}`,
      imageUrl, videoUrl, videoThumb, scrapedAt: new Date(),
    }
  } catch { return null }
}

async function scrapeShopee(query, limit = 40) {
  const params = new URLSearchParams({
    keyword: query, limit: String(Math.min(limit, 60)), newest: '0',
    order: 'desc', page_type: 'search', scenario: 'PAGE_GLOBAL_SEARCH', version: '2',
  })
  const data = await fetchWithRetry(
    `https://shopee.co.id/api/v4/search/search_items?${params}`,
    { headers: { Referer: 'https://shopee.co.id/search', 'X-API-Source': 'pc', 'X-Shopee-Language': 'id' } }
  )
  if (!data) return []
  const items = Array.isArray(data.items) ? data.items : []
  return items.map(i => parseShopeeItem(i.item_basic ?? i)).filter(Boolean)
}

// ── TIKTOK ────────────────────────────────────────────────────────────────────
function parseTikTokItem(raw) {
  try {
    const id = String(get(raw, 'id') || get(raw, 'product_id') || '')
    const title = cleanTitle(get(raw, 'title') || get(raw, 'product_name') || get(raw, 'name') || '')
    if (!title || !id) return null
    const priceRaw = get(raw, 'price.original_price') ?? get(raw, 'price.sale_price') ?? get(raw, 'price') ?? get(raw, 'sale_price') ?? '0'
    const price = parsePrice(String(priceRaw))
    if (!price) return null
    const origRaw = get(raw, 'price.market_price') ?? get(raw, 'original_price')
    const originalPrice = origRaw ? parsePrice(String(origRaw)) : undefined
    const cover = get(raw, 'cover') || get(raw, 'main_image') || get(raw, 'images.0') || ''
    const videoUrl = get(raw, 'video.play_url') || get(raw, 'video_url') || undefined
    const videoThumb = get(raw, 'video.cover') || cover || undefined
    return {
      platformId: 'tiktok', productId: id, title, price,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      currency: 'IDR', discount: get(raw, 'price.discount') || undefined,
      rating: parseFloat(String(get(raw, 'rating') || 0)) || 0,
      reviewCount: parseInt(String(get(raw, 'comment_count') || 0)) || 0,
      sold: parseInt(String(get(raw, 'sales') || get(raw, 'sold_count') || 0)) || 0,
      stock: parseInt(String(get(raw, 'stock') || 0)) || 0,
      shopName: get(raw, 'shop.name') || get(raw, 'seller_name') || 'TikTok Shop',
      shopVerified: get(raw, 'shop.is_official') || false,
      freeShipping: get(raw, 'free_shipping') || false,
      url: `https://shop.tiktok.com/view/product/${id}`,
      imageUrl: cover, videoUrl, videoThumb, scrapedAt: new Date(),
    }
  } catch { return null }
}

async function scrapeTikTok(query, limit = 30) {
  const pageSize = Math.min(limit, 30)
  const params = new URLSearchParams({
    keyword: query, sort_type: '0', offset: '0',
    limit: String(pageSize), locale: 'id-ID', currency: 'IDR',
  })
  const data = await fetchWithRetry(
    `https://shop.tiktok.com/api/search?${params}`,
    { headers: { Referer: 'https://shop.tiktok.com/search' } }
  )
  if (data) {
    const items = get(data, 'data.items') || get(data, 'items') || []
    if (items.length > 0) return items.map(parseTikTokItem).filter(Boolean)
  }
  // Fallback
  const params2 = new URLSearchParams({
    keyword: query, page: '1', page_size: String(pageSize), sort_type: '0', locale: 'id-ID',
  })
  const data2 = await fetchWithRetry(
    `https://affiliate.tiktok.com/connection/product/search?${params2}`,
    { headers: { Referer: 'https://affiliate.tiktok.com' } }
  )
  if (data2) {
    const items = get(data2, 'data.products') || get(data2, 'products') || []
    return items.map(parseTikTokItem).filter(Boolean)
  }
  return []
}

// ── TOKOPEDIA ─────────────────────────────────────────────────────────────────
function parseTokopediaItem(raw) {
  try {
    const id = String(get(raw, 'id') || '')
    const title = cleanTitle(get(raw, 'name') || '')
    if (!title || !id) return null
    const priceRaw = get(raw, 'price.value') || get(raw, 'price') || 0
    const price = parsePrice(String(priceRaw))
    if (!price) return null
    const origRaw = get(raw, 'originalPrice')
    const originalPrice = origRaw ? parsePrice(String(origRaw)) : undefined
    return {
      platformId: 'tokopedia', productId: id, title, price,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      currency: 'IDR', discount: get(raw, 'discountPercentage') || undefined,
      rating: parseFloat(String(get(raw, 'rating') || 0)) || 0,
      reviewCount: parseInt(String(get(raw, 'countReview') || 0)) || 0,
      sold: parseInt(String(get(raw, 'totalSold') || 0)) || 0,
      stock: parseInt(String(get(raw, 'stock') || 0)) || 0,
      shopName: get(raw, 'shop.name') || 'Tokopedia Store',
      shopVerified: get(raw, 'shop.isOfficial') || false,
      freeShipping: get(raw, 'freeOngkir.isActive') || false,
      url: get(raw, 'url') || `https://www.tokopedia.com/product/${id}`,
      imageUrl: get(raw, 'imageUrl') || '',
      scrapedAt: new Date(),
    }
  } catch { return null }
}

async function scrapeTokopedia(query, limit = 40) {
  const rows = Math.min(limit, 60)
  const gqlUrl = 'https://gql.tokopedia.com/'
  const body = JSON.stringify([{
    operationName: 'SearchProductQueryV4',
    variables: {
      params: `q=${encodeURIComponent(query)}&rows=${rows}&start=0&ob=23&rt=4,7&srp_component_id=02.01.00.00&srp_page_id=1765&srp_page_title=&topadAds=true&official=false&page=1&user_id=0&device=desktop&source=search&scheme=https&navsource=`,
    },
    query: `query SearchProductQueryV4($params: String) {
      ace_search_product_v4(params: $params) {
        data { products {
          id name url imageUrl
          price { text value }
          originalPrice discountPercentage
          rating countReview totalSold stock
          shop { name appLink isOfficial }
          freeOngkir { isActive }
        }}
      }
    }`,
  }])

  const res = await fetchWithRetry(gqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://www.tokopedia.com', 'X-Source': 'tokopedia-lite' },
    body,
  })

  if (res) {
    const products = get(res, '0.data.ace_search_product_v4.data.products') || []
    if (products.length > 0) return products.map(parseTokopediaItem).filter(Boolean)
  }

  // HTML fallback
  const html = await fetchWithRetry(
    `https://www.tokopedia.com/search?q=${encodeURIComponent(query)}&page=1`,
    { asJson: false, headers: { Accept: 'text/html' } }
  )
  if (!html) return []

  // Try extracting from __NEXT_DATA__ or script tags
  const jsonMatch = html.match(/"products"\s*:\s*(\[[\s\S]{100,50000}\])/)
  if (jsonMatch) {
    try {
      const items = JSON.parse(jsonMatch[1])
      return items.slice(0, limit).map(parseTokopediaItem).filter(Boolean)
    } catch { /* ignore */ }
  }
  return []
}

// ── LAZADA ────────────────────────────────────────────────────────────────────
function parseLazadaItem(raw) {
  try {
    const id = String(get(raw, 'itemId') || get(raw, 'nid') || '')
    const title = cleanTitle(get(raw, 'name') || '')
    if (!title || !id) return null
    const priceRaw = get(raw, 'price') ?? get(raw, 'priceShow') ?? '0'
    const price = parsePrice(String(priceRaw))
    if (!price) return null
    const origRaw = get(raw, 'originalPrice') ?? get(raw, 'priceRemove')
    const originalPrice = origRaw ? parsePrice(String(origRaw)) : undefined
    return {
      platformId: 'lazada', productId: id, title, price,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      currency: 'IDR', discount: get(raw, 'discount') || undefined,
      rating: parseFloat(String(get(raw, 'ratingScore') || 0)) || 0,
      reviewCount: parseInt(String(get(raw, 'review') || 0)) || 0,
      sold: 0, stock: parseInt(String(get(raw, 'stock') || 0)) || 0,
      shopName: get(raw, 'sellerName') || get(raw, 'seller') || 'Lazada Store',
      shopVerified: get(raw, 'isLazMall') || get(raw, 'isOfficial') || false,
      freeShipping: get(raw, 'freeShipping') || false,
      url: `https://www.lazada.co.id/products/-i${id}.html`,
      imageUrl: get(raw, 'image') || '',
      scrapedAt: new Date(),
    }
  } catch { return null }
}

async function scrapeLazada(query, limit = 40) {
  // Try AJAX API first
  const params = new URLSearchParams({
    q: query, _keyori: 'ss', from: 'input',
    spm: 'a2o4l.home.search.go.18951c47', page: '1', ajax: 'true',
  })
  const data = await fetchWithRetry(
    `https://www.lazada.co.id/catalog/?${params}`,
    { headers: { 'X-Requested-With': 'XMLHttpRequest', Referer: 'https://www.lazada.co.id', 'X-Lazada-Language': 'id' } }
  )
  if (data) {
    const items = get(data, 'mods.listItems') || get(data, 'listItems') || []
    if (items.length > 0) return items.slice(0, limit).map(parseLazadaItem).filter(Boolean)
  }

  // HTML fallback
  const html = await fetchWithRetry(
    `https://www.lazada.co.id/catalog/?q=${encodeURIComponent(query)}`,
    { asJson: false, headers: { Referer: 'https://www.lazada.co.id', 'X-Lazada-Language': 'id' } }
  )
  if (!html) return []

  const match = html.match(/window\.__moduleData__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/)
  if (match) {
    try {
      const data2 = JSON.parse(match[1])
      const items = get(data2, 'data.root.fields.mods.listItems') || []
      return items.slice(0, limit).map(parseLazadaItem).filter(Boolean)
    } catch { /* ignore */ }
  }
  return []
}

// ── BUKALAPAK ─────────────────────────────────────────────────────────────────
function parseBukalapakItem(raw) {
  try {
    const id = String(get(raw, 'id') || '')
    const title = cleanTitle(get(raw, 'name') || '')
    if (!id || !title) return null
    const priceRaw = get(raw, 'price') ?? get(raw, 'price_new') ?? '0'
    const price = parsePrice(String(priceRaw))
    if (!price) return null
    const origRaw = get(raw, 'original_price')
    const originalPrice = origRaw ? parsePrice(String(origRaw)) : undefined
    const images = get(raw, 'images') || []
    const cover = images[0] || get(raw, 'small_image') || ''
    return {
      platformId: 'bukalapak', productId: id, title, price,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      currency: 'IDR', discount: get(raw, 'discount_percentage') || undefined,
      rating: parseFloat(String(get(raw, 'rating.average_rate') || 0)) || 0,
      reviewCount: parseInt(String(get(raw, 'rating.user_count') || 0)) || 0,
      sold: parseInt(String(get(raw, 'sold_count') || 0)) || 0,
      stock: parseInt(String(get(raw, 'stock') || 0)) || 0,
      shopName: get(raw, 'store.name') || get(raw, 'seller_username') || 'BL Store',
      shopVerified: get(raw, 'store.premium_top_seller') || false,
      freeShipping: false,
      url: `https://www.bukalapak.com/p/${id}`,
      imageUrl: cover, scrapedAt: new Date(),
    }
  } catch { return null }
}

async function scrapeBukalapak(query, limit = 40) {
  const params = new URLSearchParams({
    keywords: query, limit: String(Math.min(limit, 50)), offset: '0', source: 'navbar-search',
  })
  const data = await fetchWithRetry(
    `https://api.bukalapak.com/multisearch/products?${params}`,
    { headers: { Referer: 'https://www.bukalapak.com', 'Content-Type': 'application/json' } }
  )
  if (!data) return []
  const items = get(data, 'data.0.products') || get(data, 'products') || []
  return items.map(parseBukalapakItem).filter(Boolean)
}

// ── BLIBLI ────────────────────────────────────────────────────────────────────
function parseBlibliItem(raw) {
  try {
    const id = String(get(raw, 'itemSku') || get(raw, 'id') || '')
    const title = cleanTitle(get(raw, 'name') || '')
    if (!id || !title) return null
    const priceRaw = get(raw, 'price.offered') ?? get(raw, 'price.start') ?? get(raw, 'price') ?? '0'
    const price = typeof priceRaw === 'number' ? priceRaw : parsePrice(String(priceRaw))
    if (!price) return null
    const origRaw = get(raw, 'price.base')
    const originalPrice = origRaw ? (typeof origRaw === 'number' ? origRaw : parsePrice(String(origRaw))) : undefined
    const images = get(raw, 'images') || {}
    const imageUrl = Object.values(images)[0] || ''
    return {
      platformId: 'blibli', productId: id, title, price,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      currency: 'IDR',
      rating: parseFloat(String(get(raw, 'rating') || 0)) || 0,
      reviewCount: parseInt(String(get(raw, 'reviewCount') || 0)) || 0,
      sold: 0, stock: parseInt(String(get(raw, 'quantityAvailable') || 0)) || 0,
      shopName: get(raw, 'merchantName') || get(raw, 'seller.name') || 'Blibli Store',
      shopVerified: get(raw, 'freeShippingBadge') || false,
      freeShipping: get(raw, 'freeShipping') || false,
      url: `https://www.blibli.com/p/${id}`,
      imageUrl, scrapedAt: new Date(),
    }
  } catch { return null }
}

async function scrapeBlibli(query, limit = 40) {
  const params = new URLSearchParams({
    searchTerm: query, page: '0', itemPerPage: String(Math.min(limit, 40)),
    sort: 'RELEVANCE', https: 'true',
  })
  const data = await fetchWithRetry(
    `https://www.blibli.com/backend/search/products?${params}`,
    { headers: { Referer: 'https://www.blibli.com', Accept: 'application/json' } }
  )
  if (!data) return []
  const items = get(data, 'data.products') || []
  return items.map(parseBlibliItem).filter(Boolean)
}

// ── AMAZON ────────────────────────────────────────────────────────────────────
function parseAmazonBlock(block) {
  try {
    const asinMatch = block.match(/data-asin="([A-Z0-9]{10})"/)
    if (!asinMatch) return null
    const asin = asinMatch[1]
    const titleMatch = block.match(/<span[^>]*class="[^"]*a-text-normal[^"]*"[^>]*>([\s\S]*?)<\/span>/)
    const title = cleanTitle(titleMatch?.[1] || '')
    if (!title) return null
    const wholePriceMatch = block.match(/class="a-price-whole"[^>]*>([\d,]+)/)
    const fracPriceMatch = block.match(/class="a-price-fraction"[^>]*>(\d+)/)
    const priceUSD = wholePriceMatch
      ? parseFloat(`${wholePriceMatch[1].replace(/,/g, '')}.${fracPriceMatch?.[1] ?? '00'}`) : 0
    if (!priceUSD) return null
    const priceIDR = Math.round(priceUSD * USD_TO_IDR)
    const origMatch = block.match(/a-price a-text-price[^>]*>[\s\S]*?<span class="a-offscreen">\$?([\d,.]+)/)
    const origUSD = origMatch ? parseFloat(origMatch[1].replace(/,/g, '')) : 0
    const origIDR = origUSD ? Math.round(origUSD * USD_TO_IDR) : 0
    const ratingMatch = block.match(/(\d+(?:\.\d+)?)\s+out of 5/)
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0
    const reviewMatch = block.match(/([\d,]+)\s+rating/)
    const reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, ''), 10) : 0
    const imgMatch = block.match(/<img[^>]+class="[^"]*s-image[^"]*"[^>]+src="([^"]+)"/)
    return {
      platformId: 'amazon', productId: asin, title, price: priceIDR,
      originalPrice: origIDR && origIDR > priceIDR ? origIDR : undefined,
      currency: 'IDR',
      discount: origIDR && priceIDR && origIDR > priceIDR ? Math.round((1 - priceIDR / origIDR) * 100) : undefined,
      rating, reviewCount, sold: 0, stock: 1,
      shopName: 'Amazon',
      shopVerified: block.includes('amazon-choice') || block.includes("Amazon's Choice"),
      freeShipping: block.includes('FREE delivery') || block.includes('FREE Shipping'),
      url: `https://www.amazon.com/dp/${asin}`,
      imageUrl: imgMatch?.[1] || '', scrapedAt: new Date(),
    }
  } catch { return null }
}

async function scrapeAmazon(query, limit = 40) {
  const params = new URLSearchParams({ k: query, page: '1', ref: 'sr_pg_1' })
  const html = await fetchWithRetry(
    `https://www.amazon.com/s?${params}`,
    { asJson: false, headers: { 'Accept-Language': 'en-US,en;q=0.9', Referer: 'https://www.amazon.com' } }
  )
  if (!html) return []
  const blocks = html.match(/<div[^>]+data-asin="([A-Z0-9]{10})"[^>]*>([\s\S]*?)(?=<div[^>]+data-asin="|$)/g) || []
  return blocks.slice(0, limit).map(parseAmazonBlock).filter(Boolean)
}

// ── ALIEXPRESS ────────────────────────────────────────────────────────────────
function parseAliexpressItem(raw) {
  try {
    const id = String(get(raw, 'productId') || get(raw, 'itemId') || '')
    const title = cleanTitle(get(raw, 'title') || get(raw, 'name') || '')
    if (!id || !title) return null
    const priceRaw = get(raw, 'prices.salePrice.minPrice') ?? get(raw, 'salePrice') ?? get(raw, 'price') ?? '0'
    const priceUSD = parseFloat(String(priceRaw))
    const priceIDR = Math.round(priceUSD * USD_TO_IDR)
    if (!priceIDR) return null
    const origRaw = get(raw, 'prices.originalPrice.minPrice')
    const origIDR = origRaw ? Math.round(parseFloat(String(origRaw)) * USD_TO_IDR) : 0
    const imgRaw = get(raw, 'imageUrl') || get(raw, 'img') || ''
    const imageUrl = imgRaw.startsWith('//') ? 'https:' + imgRaw : imgRaw
    return {
      platformId: 'aliexpress', productId: id, title, price: priceIDR,
      originalPrice: origIDR && origIDR > priceIDR ? origIDR : undefined,
      currency: 'IDR',
      rating: parseFloat(String(get(raw, 'averageStar') || 0)) || 0,
      reviewCount: parseInt(String(get(raw, 'reviewCount') || 0)) || 0,
      sold: parseInt(String(get(raw, 'orders') || 0)) || 0,
      stock: 0, shopName: get(raw, 'store.storeName') || 'AliExpress Store',
      shopVerified: get(raw, 'store.topRatedSeller') || false,
      freeShipping: get(raw, 'logistics.hasFreeShipping') || false,
      url: `https://www.aliexpress.com/item/${id}.html`,
      imageUrl, scrapedAt: new Date(),
    }
  } catch { return null }
}

async function scrapeAliexpress(query, limit = 40) {
  const params = new URLSearchParams({
    SearchText: query, page: '1', pageSize: String(Math.min(limit, 60)),
    sortType: 'default', g: 'y', isrefine: 'y',
  })
  const html = await fetchWithRetry(
    `https://www.aliexpress.com/wholesale?${params}`,
    { asJson: false, headers: { Referer: 'https://www.aliexpress.com', 'Accept-Language': 'en-US,en;q=0.9,id;q=0.8' } }
  )
  if (!html) return []

  // Try runParams extraction
  const match = html.match(/window\.runParams\s*=\s*(\{[\s\S]*?\});\s*(?:window\.|var )/)
  if (match) {
    try {
      const dataStr = match[0].replace(/^window\.runParams\s*=\s*/, '').replace(/;\s*$/, '')
      const data = JSON.parse(dataStr)
      const items = get(data, 'mods.itemList.content') || get(data, 'data.mods.itemList.content') || []
      if (items.length > 0) return items.slice(0, limit).map(parseAliexpressItem).filter(Boolean)
    } catch { /* ignore */ }
  }

  // Regex fallback
  const results = []
  const productBlocks = html.match(/class="[^"]*manhattan--container[^"]*"[\s\S]*?(?=class="[^"]*manhattan--container|$)/g) || []
  for (const block of productBlocks.slice(0, limit)) {
    try {
      const idMatch = block.match(/(?:item|product)[_-]?id[=":\s]+(\d{10,})/)
      if (!idMatch) continue
      const id = idMatch[1]
      const titleMatch = block.match(/(?:title|h1|h2|alt)[="\s>]+"([^"]{10,})"/)
      const title = cleanTitle(titleMatch?.[1] || '')
      if (!title) continue
      const priceMatch = block.match(/US\$\s*([\d.]+)/)
      const priceUSD = priceMatch ? parseFloat(priceMatch[1]) : 0
      if (!priceUSD) continue
      const imgMatch = block.match(/src="(https:\/\/ae\d*\.alicdn\.com\/[^"]+)"/)
      results.push({
        platformId: 'aliexpress', productId: id, title,
        price: Math.round(priceUSD * USD_TO_IDR), currency: 'IDR',
        rating: 0, reviewCount: 0, sold: 0, stock: 0,
        shopName: 'AliExpress Store', shopVerified: false,
        freeShipping: block.toLowerCase().includes('free ship'),
        url: `https://www.aliexpress.com/item/${id}.html`,
        imageUrl: imgMatch?.[1] || '', scrapedAt: new Date(),
      })
    } catch { /* ignore */ }
  }
  return results
}

// ── ALIBABA ───────────────────────────────────────────────────────────────────
async function scrapeAlibaba(query, limit = 40) {
  const params = new URLSearchParams({
    SearchText: query, page: '1', pageSize: String(Math.min(limit, 48)),
  })
  const html = await fetchWithRetry(
    `https://www.alibaba.com/trade/search?${params}`,
    { asJson: false, headers: { Referer: 'https://www.alibaba.com', 'Accept-Language': 'en-US,en;q=0.9' } }
  )
  if (!html) return []

  const results = []
  // Alibaba stores data in __DATA__ or offer blocks
  const offerBlocks = html.match(/class="[^"]*offer-list-item[^"]*"[\s\S]*?(?=class="[^"]*offer-list-item|$)/g) || []
  for (const block of offerBlocks.slice(0, limit)) {
    try {
      const idMatch = block.match(/offerId[=":\s]+(\d{10,})/) || block.match(/\/offer\/(\d{10,})/)
      if (!idMatch) continue
      const id = idMatch[1]
      const titleMatch = block.match(/title[="\s>]+"([^"]{10,})"/) || block.match(/<h2[^>]*>([\s\S]{10,200}?)<\/h2>/)
      const title = cleanTitle(titleMatch?.[1] || '')
      if (!title) continue
      const priceMatch = block.match(/\$\s*([\d.]+)/) || block.match(/US\$\s*([\d.]+)/)
      const priceUSD = priceMatch ? parseFloat(priceMatch[1]) : 0
      if (!priceUSD) continue
      const imgMatch = block.match(/src="(https:\/\/[^"]*alibaba[^"]+\.jpg[^"]*)"/)
      results.push({
        platformId: 'alibaba', productId: id, title,
        price: Math.round(priceUSD * USD_TO_IDR), currency: 'IDR',
        rating: 0, reviewCount: 0, sold: 0, stock: 0,
        shopName: 'Alibaba Supplier', shopVerified: false, freeShipping: false,
        url: `https://www.alibaba.com/product-detail/${id}.html`,
        imageUrl: imgMatch?.[1] || '', scrapedAt: new Date(),
      })
    } catch { /* ignore */ }
  }
  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE SAVE
// ─────────────────────────────────────────────────────────────────────────────

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().slice(0, 100)
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

      const { data: product, error: pErr } = await db
        .from('products')
        .upsert({
          slug, name: listing.title, brand: listing.brand ?? null,
          category: listing.category ?? null, image_url: listing.imageUrl,
          images: [listing.imageUrl].filter(Boolean), tags: [],
          specifications: listing.specs ?? {}, updated_at: now,
        }, { onConflict: 'slug' })
        .select('id').single()

      if (pErr || !product) { errors++; continue }

      const { data: offer, error: oErr } = await db
        .from('offers')
        .upsert({
          product_id: product.id, merchant_id: merchantId,
          price: listing.price, original_price: listing.originalPrice ?? null,
          discount_pct: calcDiscount(listing.price, listing.originalPrice),
          shop_name: listing.shopName, shop_verified: listing.shopVerified,
          free_shipping: listing.freeShipping, rating: listing.rating,
          review_count: listing.reviewCount, sold_count: listing.sold,
          stock_count: listing.stock, url: listing.url,
          affiliate_url: listing.affiliateUrl ?? null,
          in_stock: listing.stock !== 0,
          video_url: listing.videoUrl ?? null, video_thumb: listing.videoThumb ?? null,
          updated_at: now,
        }, { onConflict: 'product_id,merchant_id' })
        .select('id').single()

      if (oErr || !offer) { errors++; continue }

      const { data: lastH } = await db
        .from('price_history').select('price')
        .eq('offer_id', offer.id).order('recorded_at', { ascending: false }).limit(1).single()

      if (!lastH || lastH.price !== listing.price) {
        await db.from('price_history').insert({ offer_id: offer.id, price: listing.price, recorded_at: now })
      }

      upserted++
    } catch (err) {
      console.error(`  [db] ${err.message}`)
      errors++
    }
  }
  return { upserted, skipped, errors }
}

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM DISPATCH
// ─────────────────────────────────────────────────────────────────────────────

async function scrapePlatform(platformId, query, limit) {
  switch (platformId) {
    case 'shopee':     return scrapeShopee(query, limit)
    case 'tiktok':     return scrapeTikTok(query, limit)
    case 'tokopedia':  return scrapeTokopedia(query, limit)
    case 'lazada':     return scrapeLazada(query, limit)
    case 'bukalapak':  return scrapeBukalapak(query, limit)
    case 'blibli':     return scrapeBlibli(query, limit)
    case 'amazon':     return scrapeAmazon(query, limit)
    case 'aliexpress': return scrapeAliexpress(query, limit)
    case 'alibaba':    return scrapeAlibaba(query, limit)
    default: return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
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
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv)
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

  const platformArg = args.platform ?? 'all'
  const platforms = platformArg === 'all' ? ALL_PLATFORMS : platformArg.split(',').map(p => p.trim())
  const limit = parseInt(args.limit ?? '40')

  const queries = args.queries
    ? args.queries.split(',').map(q => q.trim()).filter(Boolean)
    : args.query ? [args.query] : null

  if (!queries || queries.length === 0) {
    console.error('[error] Provide --query "keyword" or --queries "kw1,kw2,kw3"')
    process.exit(1)
  }

  console.log(`\n=== harga.com all-platform local scraper ===`)
  console.log(`   platforms : ${platforms.join(', ')}`)
  console.log(`   queries   : ${queries.length} keywords`)
  console.log(`   limit     : ${limit} per platform`)
  if (dryRun) console.log(`   mode      : DRY RUN (no Supabase writes)`)
  console.log('')

  let grandTotal = 0

  for (const query of queries) {
    console.log(`\n--- Query: "${query}" ---`)
    for (const platformId of platforms) {
      process.stdout.write(`  [${platformId}] scraping...`)
      try {
        const listings = await scrapePlatform(platformId, query, limit)
        process.stdout.write(` ${listings.length} found`)
        if (listings.length === 0) {
          console.log(' (blocked or empty)')
        } else if (dryRun) {
          console.log(` → dry-run | sample: ${listings[0]?.title?.slice(0, 50)}`)
        } else {
          const saved = await saveListings(db, listings)
          grandTotal += saved.upserted
          console.log(` → saved=${saved.upserted} skip=${saved.skipped} err=${saved.errors}`)
        }
      } catch (err) {
        console.log(` ERROR: ${err.message}`)
      }
      await sleep(1200)
    }
    if (queries.indexOf(query) < queries.length - 1) await sleep(2000)
  }

  console.log(`\n=== Done. Total upserted: ${grandTotal} ===\n`)
}

main().catch(err => {
  console.error('[fatal]', err)
  process.exit(1)
})
