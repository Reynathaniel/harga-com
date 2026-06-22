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

function sanitizeSearchQuery(q: string): string {
  return q.trim().slice(0, 200).replace(/[<>{}]/g, '')
}

// Map category URL id → DB label
const CATEGORY_ID_TO_LABEL: Record<string, string> = {
  'elektronik':   'Elektronik',
  'fashion':      'Fashion',
  'rumah-tangga': 'Rumah Tangga',
  'gaming':       'Gaming',
  'kecantikan':   'Kecantikan',
  'otomotif':     'Otomotif',
  'olahraga':     'Olahraga',
  'lainnya':      'Lainnya',
  'buku':         'Buku',
  'motor-bekas':  'Motor Bekas',
  'mobil-bekas':  'Mobil Bekas',
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
}

export interface ProductsResult {
  products: Product[]
  total: number
  source: 'supabase' | 'mock'
}

// enrichProductWithOffers — fetch offers for a product and build the full Product object

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
      }
      if (platform) {
        // Fix: best_platform_id only shows the cheapest-platform product.
        // Instead look up all product IDs that have ANY offer from this platform.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: merchants } = await (db as any)
          .from('merchants')
          .select('id')
          .eq('platform_id', platform)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const merchantIds = ((merchants as any[]) ?? []).map((m: any) => m.id as string)
        if (merchantIds.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: offerRows } = await (db as any)
            .from('offers')
            .select('product_id')
            .in('merchant_id', merchantIds)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const productIds = Array.from(new Set(((offerRows as any[]) ?? []).map((o: any) => o.product_id as string)))
          if (productIds.length === 0) return { products: [], total: 0, source: 'supabase' }
          q = q.in('id', productIds)
        } else {
          return { products: [], total: 0, source: 'supabase' }
        }
      }
      // Note: products_with_best_offer view has no 'condition' column.
      // Used goods come from OLX/Carousell platforms only.
      if (condition === 'used') {
        q = q.in('best_platform_id', ['olx', 'carousell'])
      } else if (condition === 'new') {
        q = q.not('best_platform_id', 'in', '(olx,carousell)')
      }
      if (minPrice != null) q = q.gte('best_price', minPrice)
      if (maxPrice != null) q = q.lte('best_price', maxPrice)

      switch (sort) {
        case 'lowest':  q = q.order('best_price', { ascending: true }); break
        case 'highest': q = q.order('best_price', { ascending: false }); break
        case 'rating':  q = q.order('average_rating', { ascending: false, nullsFirst: false }); break
        case 'popular': q = q.order('total_reviews', { ascending: false }); break
        case 'newest':  q = q.order('created_at', { ascending: false }); break
      }

      const { data, error, count } = await q

      if (error) throw error

      const products = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data ?? []).map((row: any) => enrichProductWithOffers(db, row as ProductRow))
      )

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
      const { data: product } = await (db as any)
        .from('products')
        .select('*')
        .or(`id.eq.${id},slug.eq.${id}`)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (db as any)
        .from('products')
        .select('category')
        .not('category', 'is', null)

      if (data) {
        const counts: Record<string, number> = {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(data as any[]).forEach((r: any) => {
          if (r.category) counts[r.category] = (counts[r.category] ?? 0) + 1
        })
        return CATEGORIES.map(c => ({
          ...c,
          count: counts[c.label] ?? c.count,
        }))
      }
    } catch { /* fall through */ }
  }

  return CATEGORIES
}

// getPromoProducts — prioritises is_promo=true offers, then falls back to deals_by_discount view

export async function getPromoProducts(limit = 8): Promise<Product[]> {
  const db = tryGetServerClient()

  if (db) {
    try {
      // First: find product_ids that have at least one is_promo=true offer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: promoOffers, error: poErr } = await (db as any)
        .from('offers')
        .select('product_id, price, original_price')
        .eq('is_promo', true)
        .eq('in_stock', true)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const promoOfferRows: any[] = promoOffers ?? []

      // Sort by discount % descending and deduplicate product_ids
      const sorted = promoOfferRows
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((o: any) => ({
          product_id:    o.product_id as string,
          discountPct:   o.original_price && o.original_price > o.price
            ? ((o.original_price - o.price) / o.original_price)
            : 0,
        }))
        .sort((a: { discountPct: number }, b: { discountPct: number }) => b.discountPct - a.discountPct)

      const seenIds = new Set<string>()
      const productIds: string[] = []
      for (const row of sorted) {
        if (!seenIds.has(row.product_id)) {
          seenIds.add(row.product_id)
          productIds.push(row.product_id)
        }
        if (productIds.length >= limit) break
      }

      if (!poErr && productIds.length > 0) {
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

          const products = await Promise.all(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            orderedRows.map((row: any) => enrichProductWithOffers(db, row as ProductRow))
          )
          return products
        }
      }

      // Fallback: deals_by_discount view (products with any discount)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (db as any)
        .from('deals_by_discount')
        .select('*')
        .limit(limit)

      if (error) throw error

      const products = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data ?? []).map((row: any) => enrichProductWithOffers(db, row as ProductRow))
      )
      return products
    } catch (err) {
      console.error('[db/products] getPromoProducts error:', err)
    }
  }

  // Fallback: return top products sorted by reviews as placeholder
  return MOCK_PRODUCTS.slice(0, limit).map(p => p as unknown as Product)
}

