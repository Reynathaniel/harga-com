/**
 * products.ts - Data access layer for products
 *
 * Every function tries Supabase first.
 * Falls back to in-memory mock-data if Supabase is not configured.
 */

import { tryGetServerClient } from '../supabase'
import {
  MOCK_PRODUCTS,
  searchProducts as mockSearch,
  getProductById as mockGetById,
  CATEGORIES,
} from '../mock-data'
import type { Product } from '../types'
import type { ProductRow, OfferWithMerchant } from '../database.types'
import { adaptDbProductToAppProduct } from './adapters'
import { getPriceHistory } from './price-history'
import type { PriceHistory } from '../types'
import { CATEGORY_CONFIGS } from '../config/category-config'

function sanitizeSearchQuery(q: string): string {
  return q.trim().slice(0, 200).replace(/[<>{}]/g, '')
}

// Map category URL id â DB label
const CATEGORY_ID_TO_LABEL: Record<string, string> = {
  'elektronik':   'Elektronik',
  'fashion':      'Fashion',
  'rumah-tangga': 'Rumah Tangga',
  'gaming':       'Gaming',
  'kecantikan':   'Kecantikan',
  'olahraga':     'Olahraga',
  'motor-bekas':  'Motor Bekas',
  'mobil-bekas':  'Mobil Bekas',
  'rumah-bekas':  'Rumah Bekas',
  'tanah-bekas':  'Tanah Bekas',
  'properti':     'Properti',
  'lainnya':      'Lainnya',
}

// Types

export interface GetProductsOptions {
  query?:    string
  category?: string
  platform?:  string
  condition?: 'new' | 'used'
  minPrice?:  number
  maxPrice?: number
  sort?:     'lowest' | 'highest' | 'rating' | 'popular' | 'newest'
  limit?:    number
  offset?:   number
  merk?:      string
  kota?:      string
  brand?:    string
  tahun_min?: number
  tahun_max?: number
}

export interface ProductsResult {
  products: Product[]
  total: number
  source: 'supabase' | 'mock'
}

// enrichProductWithOffers â fetch offers for a product and build the full Product object

async function enrichProductWithOffers(
  db: ReturnType<typeof tryGetServerClient>,
  product: ProductRow,
  fetchHistory?: boolean
): Promise<Product> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: offerData } = await (db as any)
    .from('offers')
    .select('*, merchant:merchants(*)')
    .eq('product_id', product.id)
    .eq('in_stock', true)
    .order('price', { ascending: true })

  const offers: OfferWithMerchant[] = (offerData as OfferWithMerchant[]) ?? []

  let realHistory: PriceHistory[] = []
  if (fetchHistory) {
    realHistory = await getPriceHistory(product.id)
  }

  return adaptDbProductToAppProduct(product, offers, realHistory)
}

// batchEnrichProducts â fetch all offers for multiple products in one query
async function batchEnrichProducts(
  db: ReturnType<typeof tryGetServerClient>,
  rows: ProductRow[]
): Promise<Product[]> {
  if (rows.length === 0) return []
  const ids = rows.map(r => r.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allOffers } = await (db as any)
    .from('offers')
    .select('*, merchant:merchants(*)')
    .in('product_id', ids)
    .eq('in_stock', true)
    .order('price', { ascending: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const offersByProduct: Record<string, any[]> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;((allOffers as any[]) ?? []).forEach((o: any) => {
    if (!offersByProduct[o.product_id]) offersByProduct[o.product_id] = []
    offersByProduct[o.product_id].push(o)
  })
  return rows.map(row => adaptDbProductToAppProduct(row, offersByProduct[row.id] ?? []))
}

// getProducts

export async function getProducts(opts: GetProductsOptions = {}): Promise<ProductsResult> {
  const {
    query: rawQuery = '',
    category,
    platform,
    condition,
    minPrice,
    maxPrice,
    sort = 'lowest',
    limit = 40,
    offset = 0,
    merk,
    kota,
    brand,
    tahun_min,
    tahun_max,
  } = opts

  const query = sanitizeSearchQuery(rawQuery)

  const db = tryGetServerClient()

  if (db) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (db as any)
        .from('products_with_best_offer')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)

      if (query) {
        q = q.or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
      }
      if (category) {
        // Map URL id (e.g. 'rumah-tangga') to DB label ('Rumah Tangga')
        const dbCategory = CATEGORY_ID_TO_LABEL[category] ?? category
        q = q.ilike('category', dbCategory)
        // Forbidden keyword filter: prevents marketplace-injected sponsored products
        // from polluting category results. Rules are defined in category-config.ts.
        const catCfg = Object.values(CATEGORY_CONFIGS).find(c => c.dbLabel === dbCategory)
        if (catCfg?.forbiddenKeywords?.length) {
          for (const kw of catCfg.forbiddenKeywords) {
            q = q.not('name', 'ilike', `%${kw}%`)
          }
        }
      }
            // Platform filter: direct best_platform_id filter avoids the 1000-row offers subquery limit.
      // For vehicle categories, auto-restrict to vehicle platforms.
      // For property categories, auto-restrict to olx/carousell.
      const VEHICLE_PLATFORM_IDS = ['olx', 'carousell', 'carsome', 'mobil123', 'momobil', 'oto', 'belanjamobil']
      const dbCatLabel = category ? (CATEGORY_ID_TO_LABEL[category] ?? category) : ''
      const isVehicleCat = ['Motor Bekas', 'Mobil Bekas'].includes(dbCatLabel)
      const isPropertyCat = dbCatLabel === 'Rumah Bekas'
      const isTanahBekas = dbCatLabel === 'Tanah Bekas'

      if (platform) {
        // Explicit platform: resolve merchant UUIDs then product IDs (supports multi-offer products)
        const { data: mRows } = await (db as any).from('merchants').select('id').eq('platform_id', platform)
        const mIds = ((mRows as any[]) ?? []).map((m: any) => m.id as string)
        if (mIds.length > 0) {
          const { data: oRows } = await (db as any).from('offers').select('product_id').in('merchant_id', mIds).limit(50000)
          const pIds = Array.from(new Set(((oRows as any[]) ?? []).map((o: any) => o.product_id as string)))
          if (pIds.length === 0) return { products: [], total: 0, source: 'supabase' }
          q = q.in('id', pIds)
        } else {
          return { products: [], total: 0, source: 'supabase' }
        }
      } else if (isVehicleCat) {
        q = q.in('best_platform_id', VEHICLE_PLATFORM_IDS)
      } else if (isPropertyCat) {
        q = q.in('best_platform_id', ['olx', 'carousell'])
      }

      // Price floor to filter out non-house/non-land junk listings misclassified into these categories
      if (isPropertyCat) q = q.gte('best_price', 1000000)
      if (isTanahBekas) q = q.gte('best_price', 10000000)

// Filter by best_condition (added to products_with_best_offer view)
      if (condition === 'used') {
        q = q.eq('best_condition', 'used')
      } else if (condition === 'new') {
        q = q.eq('best_condition', 'new')
      }
      if (merk) q = q.ilike('brand', `%${merk}%`)
      if (kota) q = q.or(`name.ilike.%${kota}%,city.ilike.%${kota}%`)
      if (minPrice != null) q = q.gte('best_price', minPrice)
      if (maxPrice != null) q = q.lte('best_price', maxPrice)
      if (kota) q = q.ilike('specifications->>kota', `%${kota}%`)
      if (brand) q = q.ilike('brand', `%${brand}%`)
      if (tahun_min != null) q = q.gte('specifications->>tahun', String(tahun_min))
      if (tahun_max != null) q = q.lte('specifications->>tahun', String(tahun_max))

      switch (sort) {
        case 'lowest':  q = q.order('best_price', { ascending: true }); break
        case 'highest': q = q.order('best_price', { ascending: false }); break
        case 'rating':  q = q.order('average_rating', { ascending: false, nullsFirst: false }); break
        case 'popular': q = q.order('offer_count', { ascending: false }).order('total_reviews', { ascending: false, nullsFirst: false }); break
        case 'newest':  q = q.order('created_at', { ascending: false }); break
      }

      const { data, error, count } = await q

      if (error) throw error

      // Batch-fetch all offers for the page in one query (avoids N+1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const products = await batchEnrichProducts(db, (data ?? []) as ProductRow[])

      return { products, total: count ?? products.length, source: 'supabase' }
    } catch (err) {
      console.error('[db/products] Supabase error, falling back to mock:', err)
    }
  }

  // Mock fallback
  let results = mockSearch(query, { category, minPrice, maxPrice })
  if (platform) {
    results = results.filter(p => p.listings.some(l => l.platformId === platform))
  }
  if (condition === 'used') {
    results = results.filter(p => p.listings.some(l => l.condition === 'used'))
  } else if (condition === 'new') {
    results = results.filter(p => p.listings.some(l => !l.condition || l.condition === 'new'))
  }
  let sorted = [...results]
  if (sort === 'lowest')  sorted.sort((a, b) => a.lowestPrice - b.lowestPrice)
  if (sort === 'highest') sorted.sort((a, b) => b.lowestPrice - a.lowestPrice)
  if (sort === 'rating')  sorted.sort((a, b) => b.averageRating - a.averageRating)
  if (sort === 'popular') sorted.sort((a, b) => b.totalReviews - a.totalReviews)
  const paginated = sorted.slice(offset, offset + limit)
  return { products: paginated, total: sorted.length, source: 'mock' }
}

// getProductBySlug

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = tryGetServerClient()

  if (db) {
    try {
      const { data: product, error: pErr } = await db
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single()

      if (pErr || !product) throw pErr ?? new Error('Not found')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await enrichProductWithOffers(db as any, product, true)
    } catch (err) {
      console.error('[db/products] getProductBySlug error, falling back to mock:', err)
    }
  }

  return mockGetById(slug) ?? null
}

// getProductById

export async function getProductById(id: string): Promise<Product | null> {
  const db = tryGetServerClient()

  if (db) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Only use id.eq if the param looks like a UUID (avoids PostgreSQL type error)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      const { data: product } = await (db as any)
        .from('products')
        .select('*')
        .or(isUUID ? `id.eq.${id},slug.eq.${id}` : `slug.eq.${id}`)
        .single()

      if (product) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await enrichProductWithOffers(db as any, product as ProductRow, true)
      }
    } catch (err) {
      console.error('[db/products] getProductById error, falling back to mock:', err)
    }
  }

  return mockGetById(id) ?? null
}

// getAllProductIds

export async function getAllProductIds(): Promise<string[]> {
  const db = tryGetServerClient()

  if (db) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (db as any).from('products').select('id, slug')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (data) return (data as any[]).map((p: any) => p.id as string)
    } catch { /* fall through */ }
  }

  return MOCK_PRODUCTS.map(p => p.id)
}

// getCategories

export async function getCategories() {
  const db = tryGetServerClient()

  if (db) {
    try {
      // Use a grouped count query instead of fetching all rows
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (db as any)
        .from('products')
        .select('category', { count: 'exact' })
        .not('category', 'is', null)
        .limit(10000)

      if (data) {
        const counts: Record<string, number> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(data as any[]).forEach((r: any) => {
          if (r.category) counts[r.category] = (counts[r.category] ?? 0) + 1
        })
        return CATEGORIES.map(c => ({
          ...c,
          count: Object.prototype.hasOwnProperty.call(counts, c.label) ? counts[c.label] : c.count,
        }))
      }
    } catch { /* fall through */ }
  }

  return CATEGORIES
}

// getPromoProducts â returns products with the highest discount_pct offers

export async function getPromoProducts(limit = 8): Promise<Product[]> {
  const db = tryGetServerClient()

  if (db) {
    try {
      // Fetch top discounted in-stock offers, sorted by discount_pct DESC
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: discountOffers, error: doErr } = await (db as any)
        .from('offers')
        .select('product_id, discount_pct, price, original_price')
        .gt('discount_pct', 10)
        .eq('in_stock', true)
        .order('discount_pct', { ascending: false })
        .limit(limit * 5) // fetch extra to allow for deduplication

      if (doErr) throw doErr

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const offerRows: any[] = discountOffers ?? []

      // Deduplicate by product_id, keep highest discount per product
      const seenIds = new Set<string>()
      const productIds: string[] = []
      for (const row of offerRows) {
        if (!seenIds.has(row.product_id)) {
          seenIds.add(row.product_id)
          productIds.push(row.product_id as string)
        }
        if (productIds.length >= limit) break
      }

      if (productIds.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: productRows, error: prErr } = await (db as any)
          .from('products_with_best_offer')
          .select('*')
          .in('id', productIds)

        if (!prErr && productRows && (productRows as unknown[]).length > 0) {
          // Preserve the discount-sorted order
          const rowMap = new Map<string, unknown>()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(productRows as any[]).forEach((r: any) => rowMap.set(r.id, r))
          const orderedRows = productIds
            .map(id => rowMap.get(id))
            .filter(Boolean)

          const products = await batchEnrichProducts(db, orderedRows as ProductRow[])
          return products
        }
      }

      // Secondary fallback: products with best_original_price > best_price
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (db as any)
        .from('products_with_best_offer')
        .select('*')
        .not('best_original_price', 'is', null)
        .order('total_reviews', { ascending: false })
        .limit(limit)

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const products = await batchEnrichProducts(db, (data ?? []) as ProductRow[])
      return products
    } catch (err) {
      console.error('[db/products] getPromoProducts error:', err)
    }
  }

  // Fallback: return top products sorted by reviews as placeholder
  return MOCK_PRODUCTS.slice(0, limit).map(p => p as unknown as Product)
}

