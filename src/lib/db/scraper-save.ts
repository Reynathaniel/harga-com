/**
 * scraper-save.ts -- Persist RawListing[] from scraper into Supabase.
 * Strategy per listing:
 *   1. Upsert product  (conflict on slug)
 *   2. Upsert offer    (conflict on product_id + merchant_id)
 *   3. Insert price_history row if price changed
 */

import { tryGetServerClient } from '../supabase'
import type { RawListing } from '../scrapers/types'

// CDN domains that block hotlinking — images from these must be proxied to Supabase Storage
// Note: ik.imagekit.io (PasHouses), img.lamudi.com (Lamudi) are NOT blocked and can be used directly
const BLOCKED_CDN_DOMAINS = ['apollo.olx.co.id', 'olx.co.id', 'carousell.com', 'karousell.com']

function needsProxy(url: string): boolean {
  if (!url || !url.startsWith('http')) return false
  return BLOCKED_CDN_DOMAINS.some(d => url.includes(d))
}

/**
 * Download image from a CDN URL and upload to Supabase Storage.
 * Returns the stable Supabase Storage public URL, or the original URL if upload fails.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function proxyImageToStorage(supabase: any, imageUrl: string, platformId: string, productId: string): Promise<string> {
  try {
    const referer = platformId === 'olx'
      ? 'https://www.olx.co.id/'
      : 'https://id.carousell.com/'

    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Referer: referer,
        Accept: 'image/webp,image/avif,image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return imageUrl

    const buffer = await res.arrayBuffer()
    if (buffer.byteLength < 1000) return imageUrl // too small, likely blocked

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
    const path = `${platformId}/${productId.replace(/[^a-z0-9-]/gi, '_')}.${ext}`

    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, buffer, { contentType, upsert: true })

    if (error) return imageUrl

    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    return data?.publicUrl ?? imageUrl
  } catch {
    return imageUrl
  }
}

// Merchant UUID map (matches seeded rows in DB)
const MERCHANT_ID: Record<string, string> = {
  tokopedia:    '00000000-0000-0000-0000-000000000001',
  shopee:       '00000000-0000-0000-0000-000000000002',
  lazada:       '00000000-0000-0000-0000-000000000003',
  bukalapak:    '00000000-0000-0000-0000-000000000004',
  blibli:       '00000000-0000-0000-0000-000000000005',
  tiktok:       '00000000-0000-0000-0000-000000000006',
  amazon:       '00000000-0000-0000-0000-000000000007',
  aliexpress:   '00000000-0000-0000-0000-000000000008',
  alibaba:      '00000000-0000-0000-0000-000000000009',
  jd:           '00000000-0000-0000-0000-000000000010',
  olx:          '00000000-0000-0000-0000-000000000011',
  carousell:    '00000000-0000-0000-0000-000000000012',
  carsome:      '00000000-0000-0000-0000-000000000013',
  mobil123:     '00000000-0000-0000-0000-000000000014',
  momobil:      '00000000-0000-0000-0000-000000000015',
  oto:          '00000000-0000-0000-0000-000000000016',
  belanjamobil: '00000000-0000-0000-0000-000000000017',
  pashouses:    '00000000-0000-0000-0000-000000000018',
  lamudi:       '00000000-0000-0000-0000-000000000019',
  rumah123:     '00000000-0000-0000-0000-000000000020',
}

function isRealImageUrl(url: string | null | undefined): boolean {
  if (!url || !url.startsWith('http')) return false
  const lower = url.toLowerCase()
  if (lower.includes('placehold.co')) return false
  if (lower.includes('placeholder')) return false
  if (lower.includes('picsum.photos')) return false
  if (lower.includes('harga-com.vercel.app')) return false
  return true
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
    console.warn('[scraper-save] Supabase not configured -- skipping persist')
    return { upserted: 0, skipped: listings.length, errors: 0, durationMs: Date.now() - start }
  }

  const now = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDb = db as any

  for (const listing of listings) {
    const merchantId = MERCHANT_ID[listing.platformId]
    if (!merchantId) { skipped++; continue }

    try {
      const slug = slugify(listing.title)
      if (!slug) { skipped++; continue }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await anyDb
        .from('products')
        .select('id, images, image_url')
        .eq('slug', slug)
        .maybeSingle()

      let product: { id: string } | null = null

      // Proxy blocked CDN images to Supabase Storage for permanent hosting
      let finalImageUrl = listing.imageUrl
      if (isRealImageUrl(listing.imageUrl) && needsProxy(listing.imageUrl ?? '')) {
        const pid = existing?.id ?? `tmp-${Date.now()}`
        finalImageUrl = await proxyImageToStorage(anyDb, listing.imageUrl!, listing.platformId, pid)
      }

      if (existing) {
        const hasRealImage = isRealImageUrl(existing.image_url) ||
          ((existing.images?.length ?? 0) > 0 && isRealImageUrl(existing.images?.[0]))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const patch: Record<string, any> = {
          name:           listing.title,
          brand:          listing.brand    ?? null,
          category:       listing.category ?? null,
          tags:           [],
          specifications: listing.specs ?? {},
          updated_at:     now,
        }
        if (!hasRealImage && isRealImageUrl(finalImageUrl)) {
          patch.image_url = finalImageUrl
          patch.images    = [finalImageUrl]
        }
        const { error: uErr } = await anyDb.from('products').update(patch).eq('id', existing.id)
        if (uErr) { console.error('[scraper-save] product update:', uErr.message); errors++; continue }
        product = existing
      } else {
        const { data: inserted, error: pErr } = await anyDb
          .from('products')
          .insert({
            slug,
            name:           listing.title,
            brand:          listing.brand    ?? null,
            category:       listing.category ?? null,
            image_url:      isRealImageUrl(finalImageUrl) ? finalImageUrl : null,
            images:         isRealImageUrl(finalImageUrl) ? [finalImageUrl] : [],
            tags:           [],
            specifications: listing.specs ?? {},
            updated_at:     now,
          })
          .select('id')
          .single()
        if (pErr || !inserted) {
          console.error('[scraper-save] product insert:', pErr?.message)
          errors++; continue
        }
        product = inserted
      }

      if (!product) {
        console.error('[scraper-save] product upsert:', 'no product returned')
        errors++; continue
      }

      // 2. Upsert offer
      const { data: offer, error: oErr } = await anyDb
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
          video_url:      listing.videoUrl   ?? null,
          video_thumb:    listing.videoThumb ?? null,
          condition:      listing.condition  ?? 'used',
          location:       listing.location   ?? null,
          updated_at:     now,
        }, { onConflict: 'product_id,merchant_id' })
        .select('id')
        .single()

      if (oErr || !offer) {
        console.error('[scraper-save] offer upsert:', oErr?.message)
        errors++; continue
      }

      // 3. Price history -- only append if price changed
      const { data: lastH } = await anyDb
        .from('price_history')
        .select('price')
        .eq('offer_id', offer.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()

      if (!lastH || lastH.price !== listing.price) {
        await anyDb.from('price_history').insert({
          offer_id:    offer.id,
          pri