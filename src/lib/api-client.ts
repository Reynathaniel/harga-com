/**
 * api-client.ts — Client-side helpers for all API routes
 *
 * All functions return { success, data } or { success, error }.
 * Never throws — callers check success flag.
 */

import type { Product, PriceAlert, SearchFilters } from './types'

// ── Types ──────────────────────────────────────────────────────────

export interface ApiOk<T> {
  success: true
  data: T
}

export interface ApiErr {
  success: false
  error: string
}

export type ApiResult<T> = ApiOk<T> | ApiErr

export interface ProductsPage {
  products: Product[]
  total: number
  hasMore: boolean
  offset: number
  limit: number
}

export interface PriceHistoryData {
  productId: string
  days: number
  chartData: Array<Record<string, number | string | null>>
  stats: {
    lowestInPeriod: number | null
    highestInPeriod: number | null
    priceDeltaPct: number
  }
}

export interface StatsData {
  totalProducts: number
  totalMerchants: number
  avgSavingsPct: number
  totalPriceComparisons: number
}

export interface MerchantItem {
  id: string
  name: string
  slug: string
  platform_id: string
  logo_url: string | null
  cashback_default_pct: number
  color: string | null
}

export interface TrendingProduct {
  product_id: string
  name: string
  slug: string
  image_url: string | null
  best_price: number | null
  click_count: number
}

// ── Internal fetch ─────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
    })

    const json = await res.json()

    if (!res.ok) {
      return { success: false, error: json.error ?? `HTTP ${res.status}` }
    }

    // Normalise: some routes return { data: ... }, others { success, data }
    if ('success' in json) return json as ApiResult<T>
    if ('data' in json)    return { success: true, data: json.data as T }
    return { success: true, data: json as T }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// ── Products ───────────────────────────────────────────────────────

export interface FetchProductsOpts {
  q?: string
  category?: string
  platform?: string
  min_price?: number
  max_price?: number
  sort?: 'lowest' | 'highest' | 'rating' | 'popular' | 'newest'
  limit?: number
  offset?: number
}

export async function fetchProducts(
  opts: FetchProductsOpts = {}
): Promise<ApiResult<ProductsPage>> {
  const params = new URLSearchParams()
  if (opts.q)          params.set('q', opts.q)
  if (opts.category)   params.set('category', opts.category)
  if (opts.platform)   params.set('platform', opts.platform)
  if (opts.min_price != null) params.set('min', String(opts.min_price))
  if (opts.max_price != null) params.set('max', String(opts.max_price))
  if (opts.sort)       params.set('sort', opts.sort)
  if (opts.limit  != null) params.set('limit',  String(opts.limit))
  if (opts.offset != null) params.set('offset', String(opts.offset))

  return apiFetch<ProductsPage>(`/api/products?${params}`)
}

export async function fetchProduct(slug: string): Promise<ApiResult<Product>> {
  return apiFetch<Product>(`/api/products/${encodeURIComponent(slug)}`)
}

export async function fetchPriceHistory(
  slug: string,
  days = 30
): Promise<ApiResult<PriceHistoryData>> {
  return apiFetch<PriceHistoryData>(
    `/api/products/${encodeURIComponent(slug)}/history?days=${days}`
  )
}

// ── Search ─────────────────────────────────────────────────────────

export interface SearchResultItem {
  id: string
  name: string
  slug: string
  brand: string | null
  category: string | null
  image_url: string | null
  best_price: number | null
}

export async function searchProducts(
  query: string
): Promise<ApiResult<SearchResultItem[]>> {
  if (!query.trim()) return { success: true, data: [] }
  const params = new URLSearchParams({ q: query })
  return apiFetch<SearchResultItem[]>(`/api/search?${params}`)
}

// ── Affiliate redirect ─────────────────────────────────────────────

export interface RedirectResult {
  url: string
}

/**
 * Logs a click server-side, then navigates the browser to the affiliate URL.
 * Pass sessionId from your analytics/session store.
 */
export async function redirectToAffiliate(
  offerId: string,
  sessionId = ''
): Promise<void> {
  const result = await apiFetch<RedirectResult>('/api/affiliate/redirect', {
    method: 'POST',
    body: JSON.stringify({ offerId, sessionId }),
  })

  if (result.success) {
    window.open(result.data.url, '_blank', 'noopener,noreferrer')
  }
}

// ── Alerts ─────────────────────────────────────────────────────────

export interface CreateAlertPayload {
  productId: string
  targetPrice: number
  email?: string
  platforms?: string[]
}

export async function createAlert(
  payload: CreateAlertPayload
): Promise<ApiResult<PriceAlert>> {
  return apiFetch<PriceAlert>('/api/alerts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ── Stats ──────────────────────────────────────────────────────────

export async function fetchStats(): Promise<ApiResult<StatsData>> {
  return apiFetch<StatsData>('/api/stats')
}

// ── Merchants ──────────────────────────────────────────────────────

export async function fetchMerchants(): Promise<ApiResult<MerchantItem[]>> {
  return apiFetch<MerchantItem[]>('/api/merchants')
}

// ── Trending ───────────────────────────────────────────────────────

export async function fetchTrending(): Promise<ApiResult<TrendingProduct[]>> {
  return apiFetch<TrendingProduct[]>('/api/trending')
}
