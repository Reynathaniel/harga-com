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

// getProducts

export async function getProducts(opts: GetProductsOptions = {}): Promise<ProductsResult> {
  const {
    query = '',
    category,
    platform,
    condition,
    minPrice,
    maxPrice,
    sort = 'lowest',
    limit = 40,
    offset = 0,
  } = opts

  const db = tryGetServerClient()

  if (db) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = (db as any)
        .from('products_with_best_offer')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)

      if (query.trim()) {
        q = q.or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
      }
      if (category) {
        q = q.ilike('category', `%${category}%`)
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
          const productIds = [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...new Set(((offerRows as any[]) ?? []).map((o: any) => o.product_id as string)),
          ]
          if (productIds.length === 0) return { products: [], total: 0, source: 'supabase' }
          q = q.in('id', productIds)
        } else {
          return { products: [], total: 0, source: 'supabase' }
        }
      }
      if (condition === 'used') {
        q = q.or('condition.eq.used,best_platform_id.in.(olx,carousell)')
      } else if (condition === 'new') {
        q = q.not('best_platform_id', 'in', '("olx","carousell")')
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
      return await enrichProductWithOffers(db as any, product)
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
        return await enrichProductWithOffers(db as any, product as ProductRow)
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
  const db = 