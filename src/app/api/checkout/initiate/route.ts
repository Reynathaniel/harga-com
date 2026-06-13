/**
 * POST /api/checkout/initiate
 *
 * Log checkout intent dan return final affiliate URL.
 * Dipanggil saat user klik "Beli di Harga.com" di CheckoutModal.
 *
 * Body:
 * {
 *   productId:    string
 *   offerId:      string
 *   platform:     string
 *   affiliateUrl: string
 *   referralCode?: string   — kode referral siapa yang share link ini
 *   sessionId?:   string
 * }
 *
 * Response:
 * { success: true, data: { checkoutUrl: string, intentId: string } }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { tryGetServerClient } from '@/lib/supabase'
import { buildAffiliateUrl } from '@/lib/affiliate-config'
import { sanitizeReferralCode } from '@/lib/referral-utils'

function hashIp(request: NextRequest): string {
  const rawIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  return createHash('sha256').update(rawIp + (process.env.IP_HASH_SALT ?? 'harga-salt')).digest('hex')
}

export async function POST(request: NextRequest) {
  let body: {
    productId?:    string
    offerId?:      string
    platform?:     string
    affiliateUrl?: string
    referralCode?: string
    sessionId?:    string
  } = {}

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { productId, offerId, platform, sessionId } = body
  const referralCode = body.referralCode
    ? sanitizeReferralCode(body.referralCode)
    : null

  if (!body.affiliateUrl) {
    return NextResponse.json(
      { success: false, error: 'affiliateUrl diperlukan' },
      { status: 400 }
    )
  }

  // Build final affiliate URL (dengan tracking harga.com)
  const checkoutUrl = platform
    ? buildAffiliateUrl(body.affiliateUrl, platform)
    : body.affiliateUrl

  // Log intent ke DB (fire and forget)
  const db = tryGetServerClient()
  let intentId: string | null = null

  if (db) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (db as any)
        .from('checkout_intents')
        .insert({
          product_id:    productId    ?? null,
          offer_id:      offerId      ?? null,
          platform:      platform     ?? null,
          referral_code: referralCode ?? null,
          session_id:    sessionId    ?? null,
          ip_hash:       hashIp(request),
          affiliate_url: checkoutUrl,
        })
        .select('id')
        .single()
      intentId = data?.id ?? null
    } catch (err) {
      console.error('[checkout/initiate] DB error:', err)
      // Non-fatal — tetap return checkout URL
    }

    // Affiliate graduation: increment click_count and graduate popular products
    if (productId) {
      try {        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db as any).rpc('increment_product_clicks', { product_uuid: productId })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: prod } = await (db as any)
          .from('products')
          .select('click_count, is_popular')
          .eq('id', productId)
          .single()

        const POPULARITY_THRESHOLD = 10
        if (prod && prod.click_count >= POPULARITY_THRESHOLD && !prod.is_popular) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db as any)
            .from('products')
            .update({ is_popular: true, popular_since: new Date().toISOString() })
            .eq('id', productId)
        }
      } catch (err) {
        console.error('[checkout/initiate] click tracking error:', err)
        // Non-fatal
      }
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      checkoutUrl,
      intentId,
    },
  })
}
