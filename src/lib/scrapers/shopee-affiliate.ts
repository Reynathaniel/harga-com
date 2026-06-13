/**
 * shopee-affiliate.ts
 *
 * Fetches curated affiliate product offers from the Shopee Affiliate Program.
 * URL: https://affiliate.shopee.co.id/offer/product_offer
 * API: https://affiliate.shopee.co.id/api/v1/offer/product_offers
 *
 * Requires authenticated session cookies from the affiliate account.
 * Set the following env vars (copy from browser DevTools → Application → Cookies):
 *   SHOPEE_AFFILIATE_COOKIE  — full Cookie header string from affiliate.shopee.co.id
 *   SHOPEE_AFFILIATE_CSRF    — X-CSRFToken value
 *
 * When env vars are absent the scraper returns an empty list gracefully.
 */

import type { RawListing } from './types'

// ─── Offer types from the affiliate portal ───────────────────────────────────
const OFFER_TYPE_MAP: Record<number, 'standard' | 'xtra' | 'sample'> = {
  0: 'standard',
  1: 'xtra',   // Komisi XTRA
  2: 'sample', // Sampel Gratis
}

const AFFILIATE_ID = process.env.AFFILIATE_SHOPEE_ID ?? ''
const AFF_COOKIE   = process.env.SHOPEE_AFFILIATE_COOKIE ?? ''
const AFF_CSRF     = process.env.SHOPEE_AFFILIATE_CSRF ?? ''

// ─── Request parameters ───────────────────────────────────────────────────────
export interface AffiliateOffersRequest {
  /** Page number, 1-indexed */
  page?: number
  /** Results per page (max 100 from Shopee) */
  size?: number
  /** 0=default, 1=commission_rate desc, 2=sales desc */
  sortBy?: 0 | 1 | 2
  /** 0=all, or a specific Shopee category_id */
  categoryId?: number
  /** 0=all, 1=standard, 2=xtra, 3=sample */
  offerType?: 0 | 1 | 2 | 3
  /** Free-text search within the affiliate portal */
  keyword?: string
}

export interface AffiliateOffersResult {
  listings: RawListing[]
  totalFound: number
  page: number
  hasMore: boolean
  scrapedAt: Date
  error?: string
}

// ─── Main function ─────────────────────────────────────────────────────────
export async function fetchShopeeAffiliateOffers(
  opts: AffiliateOffersRequest = {},
): Promise<AffiliateOffersResult> {
  const scrapedAt = new Date()
  const page = opts.page ?? 1
  const size = Math.min(opts.size ?? 20, 100)

  // No credentials → bail early
  if (!AFF_COOKIE || !AFF_CSRF) {
    return { listings: [], totalFound: 0, page, hasMore: false, scrapedAt,
      error: 'SHOPEE_AFFILIATE_COOKIE / SHOPEE_AFFILIATE_CSRF env vars not set' }
  }

  const params = new URLSearchParams({
    page:        String(page),
    size:        String(size),
    sort_by:     String(opts.sortBy ?? 0),
    category_id: String(opts.categoryId ?? 0),
    offer_type:  String(opts.offerType ?? 0),
    ...(opts.keyword ? { keyword: opts.keyword } : {}),
  })

  const url = `https://affiliate.shopee.co.id/api/v1/offer/product_offers?${params}`

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)

    let resp: Response
    try {
      resp = await fetch(url, {
        signal: controller.signal,
        headers: {
          Cookie: AFF_COOKIE,
          'X-CSRFToken': AFF_CSRF,
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
          Referer: 'https://affiliate.shopee.co.id/offer/product_offer',
          Origin: 'https://affiliate.shopee.co.id',
          'X-API-Source': 'pc',
        },
      })
    } finally {
      clearTimeout(timer)
    }

    if (!resp.ok) {
      return { listings: [], totalFound: 0, page, hasMore: false, scrapedAt,
        error: `Affiliate API HTTP ${resp.status}` }
    }

    const json = await resp.json() as unknown
    const data        = safeGet(json, 'data') ?? safeGet(json, 'result') ?? json
    const itemList    = safeGetArray(data, 'item_list') ?? safeGetArray(data, 'items') ?? []
    const total       = safeGetNum(data, 'total') ?? safeGetNum(data, 'total_count') ?? itemList.length

    const listings: RawListing[] = itemList
      .map((raw: unknown) => parseAffiliateItem(raw))
      .filter((x): x is RawListing => x !== null)

    return {
      listings,
      totalFound: total,
      page,
      hasMore: page * size < total,
      scrapedAt,
    }
  } catch (err) {
    return {
      listings: [],
      totalFound: 0,
      page,
      hasMore: false,
      scrapedAt,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ─── Parse a single affiliate item from the API response ──────────────────
function parseAffiliateItem(raw: unknown): RawListing | null {
  try {
    const id     = String(safeGet(raw, 'itemid') ?? safeGet(raw, 'item_id') ?? '')
    const shopId = String(safeGet(raw, 'shopid') ?? safeGet(raw, 'shop_id') ?? '')
    const name   = String(safeGet(raw, 'name') ?? safeGet(raw, 'title') ?? '').trim()
    if (!id || !name) return null

    // Price: Shopee affiliate API may return actual IDR or integer*100000
    const rawPrice = safeGetNum(raw, 'price') ?? safeGetNum(raw, 'price_min') ?? 0
    const price = rawPrice > 100_000 ? Math.round(rawPrice / 100_000) : Math.round(rawPrice)
    if (!price) return null

    const rawOrig = safeGetNum(raw, 'price_before_discount') ?? 0
    const originalPrice = rawOrig > 100_000 ? Math.round(rawOrig / 100_000) : Math.round(rawOrig)

    const commissionRate = safeGetNum(raw, 'commission_rate')
      ?? safeGetNum(raw, 'offer_commission_rate')
      ?? safeGetNum(raw, 'commission_percent')
      ?? undefined

    const offerTypeRaw = safeGetNum(raw, 'offer_type') ?? 0
    const offerType = OFFER_TYPE_MAP[offerTypeRaw] ?? 'standard'

    // Image
    const imgRaw = String(safeGet(raw, 'image') ?? safeGet(raw, 'cover') ?? '')
    const imageUrl = imgRaw.startsWith('http')
      ? imgRaw
      : `https://cf.shopee.co.id/file/${imgRaw}_tn`

    const sold = safeGetNum(raw, 'sold') ?? safeGetNum(raw, 'historical_sold') ?? 0
    const rating = safeGetNum(raw, 'rating_star') ?? safeGetNum(raw, 'item_rating.rating_star') ?? 0

    const productUrl = `https://shopee.co.id/product/${shopId}/${id}`
    const affiliateUrl = buildShopeeAffiliateUrl(shopId, id)

    return {
      platformId: 'shopee',
      productId: id,
      title: cleanTitle(name),
      price,
      originalPrice: originalPrice > price ? originalPrice : undefined,
      currency: 'IDR',
      discount: safeGetNum(raw, 'discount') ?? undefined,
      rating,
      reviewCount: safeGetNum(raw, 'rating_count') ?? sold,
      sold,
      stock: safeGetNum(raw, 'stock') ?? 0,
      shopName: String(safeGet(raw, 'shop_name') ?? 'Shopee Store'),
      shopVerified: !!(safeGet(raw, 'is_official_shop') ?? safeGet(raw, 'shopee_verified') ?? false),
      freeShipping: !!(safeGet(raw, 'free_shipping') ?? false),
      url: productUrl,
      affiliateUrl: AFFILIATE_ID && AFFILIATE_ID !== 'PENDING' ? affiliateUrl : undefined,
      imageUrl,
      affiliateCommissionPct: commissionRate,
      affiliateOfferType: offerType,
      isAffiliateOffer: true,
      scrapedAt: new Date(),
    }
  } catch {
    return null
  }
}

// ─── All offers across pages ───────────────────────────────────────────────
/**
 * Fetch ALL pages of affiliate offers up to `maxPages` (default 5).
 * Useful for cron jobs that want to index the full catalogue.
 */
export async function fetchAllShopeeAffiliateOffers(opts: {
  maxPages?: number
  size?: number
  sortBy?: 0 | 1 | 2
  offerType?: 0 | 1 | 2 | 3
  keyword?: string
} = {}): Promise<{ listings: RawListing[]; totalFound: number; pagesScraped: number; error?: string }> {
  const maxPages = opts.maxPages ?? 5
  const size     = opts.size ?? 50
  const allListings: RawListing[] = []
  let totalFound = 0
  let error: string | undefined

  for (let page = 1; page <= maxPages; page++) {
    const result = await fetchShopeeAffiliateOffers({ ...opts, page, size })
    if (result.error) {
      error = result.error
      break
    }
    allListings.push(...result.listings)
    totalFound = result.totalFound
    if (!result.hasMore) break
    // Polite delay between pages
    await sleep(1200)
  }

  return { listings: allListings, totalFound, pagesScraped: allListings.length, error }
}

// ─── Utilities ────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeGet(obj: unknown, key: string): unknown { try { return (obj as any)?.[key] } catch { return undefined } }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeGetNum(obj: unknown, key: string): number | undefined { const v = safeGet(obj, key); return typeof v === 'number' ? v : undefined }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeGetArray(obj: unknown, key: string): unknown[] | undefined { const v = safeGet(obj, key); return Array.isArray(v) ? v : undefined }

function buildShopeeAffiliateUrl(shopId: string, itemId: string): string {
  const base = `https://shopee.co.id/product/${shopId}/${itemId}`
  if (!AFFILIATE_ID || AFFILIATE_ID === 'PENDING') return base
  const url = new URL(base)
  url.searchParams.set('af_id', AFFILIATE_ID)
  url.searchParams.set('utm_source', 'harga.com')
  url.searchParams.set('utm_medium', 'affiliate')
  url.searchParams.set('utm_campaign', 'hargacom')
  return url.toString()
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ').trim()
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}
