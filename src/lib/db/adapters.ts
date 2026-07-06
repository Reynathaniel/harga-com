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
    affiliateUrl:  offer.affiliate_url ?? offer.url ?? '#',
    imageUrl:      fallbackImageUrl ?? '/placeholder-product.png',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    videoUrl:      (offer as any).video_url   ?? undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    videoThumb:    (offer as any).video_thumb  ?? undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    condition:     (offer as any).condition   as 'new' | 'used' | undefined,
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

  // Determine which platforms this product actually has listings on
  const productPlatforms = [...new Set(listings.map(l => l.platformId))] as PlatformId[]

  // Use real price history if available, otherwise generate synthetic data
  // using the product's actual platforms so the chart always shows something useful
  const priceHistory = (realPriceHistory && realPriceHistory.length > 0)
    ? realPriceHistory
    : (lowestPrice > 0 ? generateSyntheticHistory(lowestPrice, 30, productPlatforms) : [])

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
                     : [product.image_url ?? '/placeholder-product.png'],
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
// Used when real price history is not yet populated in DB.
// Generates price data for the platforms the product actually has,
// so the chart is never blank due to platform mismatch.

// Per-platform price multipliers (relative to base price)
const PLATFORM_MULTIPLIERS: Partial<Record<PlatformId, number>> = {
  tokopedia:        1.00,
  shopee:           0.94,
  lazada:           1.02,
  bukalapak:        0.97,
  blibli:           1.05,
  tiktok:           0.91,
  amazon:           1.10,
  alibaba:          0.80,
  aliexpress:       0.82,
  jd:               1.03,
  olx:              0.88,
  carousell:        0.85,
  carsome:          0.92,
  mobil123:         0.95,
  oto:              0.98,
  momobil:          0.93,
  belanjakendaraan: 0.96,
}

export function generateSyntheticHistory(
  base: number,
  days = 30,
  platforms: PlatformId[] = ['tokopedia', 'shopee', 'lazada', 'blibli', 'tiktok']
) {
  // Ensure we always have at least one platform to chart
  const activePlatforms = platforms.length > 0 ? platforms : ['tokopedia' as PlatformId]

  const history = []
  for (let i = days; i >= 0; i--) {
    const v = () => base * (0.87 + Math.random() * 0.22)
    const prices: Partial<Record<PlatformId, number | null>> = {}

    activePlatforms.forEach((pid, idx) => {
      const mult = PLATFORM_MULTIPLIERS[pid] ?? 1.0
      // Stagger occasional null gaps for realism (different cadence per platform)
      const gapCycle = 7 + (idx * 3)
      const hasGap = i % gapCycle === 0 && i > 0
      prices[pid] = hasGap ? null : Math.round(v() * mult / 1000) * 1000
    })

    history.push({ date: subDays(new Date(), i), prices })
  }
  return history
}
