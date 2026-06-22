/**
 * GET /api/referral/[code]/track
 *
 * Log referral click dan redirect ke halaman produk atau homepage.
 * URL: /api/referral/A3KX92BF/track?productId=xxx&platform=tokopedia
 *
 * Query params:
 *   - productId (optional) — redirect ke /produk/{id}
 *   - platform  (optional) — nama platform
 *   - offerId   (optional) — specific offer
 *   - dest      (optional) — custom destination URL (harus di-domain harga.com)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getUserByReferralCode, logReferralClick } from '@/lib/db/referral'
import { sanitizeReferralCode } from '@/lib/referral-utils'

function hashIp(request: NextRequest): string {
  const rawIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  return createHash('sha256').update(rawIp + (process.env.IP_HASH_SALT ?? 'harga-salt')).digest('hex')
}

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const rawCode   = params.code
  const code      = sanitizeReferralCode(rawCode)
  const { searchParams } = request.nextUrl
  const productId = searchParams.get('productId') ?? undefined
  const platform  = searchParams.get('platform')  ?? undefined
  const offerId   = searchParams.get('offerId')   ?? undefined

  // Validate referral code + get owner user_id
  const owner = await getUserByReferralCode(code)

  if (!owner) {
    // Invalid code — redirect tanpa tracking
    const fallback = productId
      ? new URL(`/produk/${productId}`, request.url)
      : new URL('/', request.url)
    return NextResponse.redirect(fallback)
  }

  // Log click asynchronously (tidak block redirect)
  logReferralClick({
    referralCode: code,
    userId:    owner.id,
    productId: productId,
    platform:  platform,
    offerId:   offerId,
    ipHash:    hashIp(request),
    userAgent: request.headers.get('user-agent') ?? undefined,
    referer:   request.headers.get('referer')    ?? undefined,
  }).catch(err => console.error('[referral-track] log error:', err))

  // Build destination
  let destination: URL
  if (productId) {
    destination = new URL(`/produk/${productId}`, request.url)
    destination.searchParams.set('ref', code)
  } else {
    destination = new URL('/', request.url)
    destination.searchParams.set('ref', code)
  }

  return NextResponse.redirect(destination)
}
