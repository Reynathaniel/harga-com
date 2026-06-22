/**
 * adapters.ts — Convert Supabase DB rows into the app's domain types (types.ts)
 *
 * Keeps the data layer decoupled from the DB schema.
 * When the schema changes, only update here.
 */

import type { Product, PriceListing, PlatformId, PriceHistory } from '../types'
import type { ProductRow, OfferWithMerchant } from '../database.types'
import { subDays } from 'date-fns'

// ── adaptOfferToListing ─────────────────────────────────────────────

export function adaptOfferToListing(offer: OfferWithMerchant, fallbackImageUrl?: string): PriceListing {
  const merchant = offer.merchant
  return {
    platformId:    merchant.platform_id as PlatformId,
    price:         offer.price,
    originalPrice: offer.original_price ?? undefined,
    discount:      offer.discount_pct ?? undefined,
    rating:        parseFloat(String(offer.rating ?? '4.5')) || 4.5,
    reviewCount:   offer.review_count,
    sold:          offer.sold_count,
    stock:         offer.stock_count,
    shopName:      offer.shop_name ?? merchant.name,
    shopVerified:  offer.shop_verified,
    freeShipping:  offer.free_shipping,
    url:           offer.url ?? '#',
    affiliateUrl:  offer.affiliate_url ?? '#',
    imageUrl:      fallbackImageUrl ?? `https://picsum.photos/seed/${offer.id.replace(/-/g, '').slice(0, 12)}/400/400`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    videoUrl:      (offer as any).video_url  ?? undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    videoThumb:    (offer as any).video_thumb ?? undefined,
    updatedAt:     new Date(offer.updated_at),
  }
}

// ── adaptDbProductToAppProduct ──────────────────────────────────────

export function adaptDbProductToAppProduct(
  product: ProductRow,
  offers: OfferWithMerchant[],
  realPriceHistory?: PriceHistory[]
): Product {
  const productImage = product.images?.[0] ?? product.image_url ?? undefined
  const listings = offers.map(offer => adaptOfferToListing(offer, productImage))
  const prices = listings.map(l => l.price)
  const lowestPrice  = prices.length ? Math.min(...prices) : 0
  const highestPrice = prices.length ? Math.max(...prices) : 0

  const priceHistory = (realPriceHistory && realPriceHistory.length > 0)
    ? realPriceHistory
    : []

  // Parse specifications safely
  let specifications: Record<string, string> = {}
  if (product.specifications && typeof product.specifications === 'object' && !Array.isArray(product.specifications)) {
    specifications = Object.fromEntries(
      Object.entries(product.specifications).map(([k, v]) => [k, String(v)])
    )
  }

  return {
    id:            product.id,
    name:          product.name,
    slug:          product.slug,
    brand:         product.brand ?? '',
    category:      product.category ?? 'Lainnya',
    subcategory:   product.subcategory ?? '',
    description:   product.description ?? '',
    specifications,
    images:        product.images?.length
                     ? product.images
                     : [product.image_url ?? `https://picsum.photos/seed/${product.slug}/600/600`],
    tags:          product.tags ?? [],
    listings,
    priceHistory,
    lowestPrice,
    highestPrice,
    averageRating: parseFloat(String(product.average_rating ?? '4.5')) || 4.5,
    totalReviews:  product.total_reviews,
    createdAt:     new Date(product.created_at),
    updatedAt:     new Date(product.updated_at),
  }
}

// ── generateSyntheticHistory ────────────────────────────────────────
// Used when real price history is not yet populated in DB

export function generateSyntheticHistory(base: number, days = 30) {
  const history = []

  for (let i = days; i >= 0; i--) {
    const v = () => base * (0.87 + Math.random() * 0.22)
    const prices: Partial<Record<PlatformId, number | null>> = {
      tokopedia:  i % 7 === 0 ? null : Math.round(v() / 1000) * 1000,
      shopee:     Math.round(v() * 0.94 / 1000) * 1000,
      lazada:     Math.round(v() * 1.02 / 1000) * 1000,
      bukalapak:  i > 20 ? null : Math.round(v() * 0.97 / 1000) * 1000,
      blibli:     Math.round(v() * 1.05 / 1000) * 1000,
      tiktok:     i > 15 ? null : Math.round(v() * 0.91 / 1000) * 1000,
      amazon:     null,
      alibaba:    null,
      aliexpress: null,
      jd:         null,
      olx:        null,
      carousell:  null,
    }
    history.push({ date: subDays(new Date(), i), prices })
  }
  return history
}
