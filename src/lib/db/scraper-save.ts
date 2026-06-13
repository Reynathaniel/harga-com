/**
 * scraper-save.ts — Persist RawListing[] from scraper into Supabase.
 * Strategy per listing:
 *   1. Upsert product  (conflict on slug)
 *   2. Upsert offer    (conflict on product_id + merchant_id)
 *   3. Insert price_history row if price changed
 */

import { tryGetServerClient } from '../supabase'
import type { RawListing } from '../scrapers/types'

// Merchant UUID map (matches seeded rows in DB)
const MERCHANT_ID: Record<string, string> = {
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
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .slice(0, 100)
}

function calcDiscount(price: number, originalPrice?: number): number | null {
  if (!originalPrice || originalPrice <= price) return null
  return Math.round((1 - price / originalPrice) * 100)
}

export interface SaveResult {
  upserted: number
  skipped: number
  errors: number
  durationMs: number
}

export async function saveScraperResults(listings: RawListing[]): Promise<SaveResult> {
  const start = Date.now()
  let upserted = 0, skipped = 0, errors = 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = tryGetServerClient() as any
  if (!db) {
    console.warn('[scraper-save] Supabase not configured — skipping persist')
    return { upserted: 0, skipped: listings.length, errors: 0, durationMs: Date.now() - start }
  }

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
          images:         [listing.imageUrl],
          tags:           [],
          specifications: listing.specs ?? {},
          updated_at:     now,
        }, { onConflict: 'slug' })
        .select('id')
        .single()

      if (pErr || !product) {
        console.error('[scraper-save] product upsert:', pErr?.message)
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
          updated_at:     now,
        }, { onConflict: 'product_id,merchant_id' })
        .select('id')
        .single()

      if (oErr || !offer) {
        console.error('[scraper-save] offer upsert:', oErr?.message)
        errors++; continue
      }

      // 3. Price history — only append if price changed
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
      console.error('[scraper-save] unexpected error:', err)
      errors++
    }
  }

  return { upserted, skipped, errors, durationMs: Date.now() - start }
}
