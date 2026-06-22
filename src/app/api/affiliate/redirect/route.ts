/**
 * POST /api/affiliate/redirect - log click + return destination URL
 * GET  /api/affiliate/redirect?offerId=xxx - log + redirect
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { logClick } from '@/lib/db/offers'
import { tryGetServerClient } from '@/lib/supabase'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { buildAffiliateUrl } from '@/lib/affiliate-config'

interface OfferRecord {
  affiliate_url: string | null
  merchant?: { platform_id?: string }
}

async function resolveAffiliateUrl(offerId: string): Promise<string | null> {
  const db = tryGetServerClient()

  if (db) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (db as any)
      .from('offers')
      .select('affiliate_url, merchant:merchants(platform_id)')
      .eq('id', offerId)
      .single()

    const record = data as OfferRecord | null
    if (!record?.affiliate_url) return null

    const platformId = record.merchant?.platform_id ?? ''
    return buildAffiliateUrl(record.affiliate_url, platformId)
  }

  for (const p of MOCK_PRODUCTS) {
    for (const l of p.listings) {
      if (l.affiliateUrl.includes(offerId)) {
        return buildAffiliateUrl(l.affiliateUrl, l.platformId)
      }
    }
  }
  return null
}

function hashIp(request: NextRequest): string {
  const rawIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  return createHash('sha256').update(rawIp).digest('hex')
}

export async function POST(request: NextRequest) {
  let body: { offerId?: string; sessionId?: string; referer?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { offerId, sessionId = '', referer } = body

  if (!offerId) {
    return NextResponse.json(
      { success: false, error: 'offerId diperlukan' },
      { status: 400 }
    )
  }

  logClick({
    offerId,
    sessionId,
    userAgent: request.headers.get('user-agent') ?? '',
    ipHash:    hashIp(request),
    referer,
  }).catch(() => {})

  const affiliateUrl = await resolveAffiliateUrl(offerId)

  if (!affiliateUrl) {
    return NextResponse.json(
      { success: false, error: 'Offer tidak ditemukan' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: { url: affiliateUrl } })
}

export async function GET(request: NextRequest) {
  const offerId   = request.nextUrl.searchParams.get('offerId')
  const sessionId = request.nextUrl.searchParams.get('sessionId') ?? ''
  const referer   = request.headers.get('referer') ?? undefined

  if (!offerId) {
    return NextResponse.json(
      { success: false, error: 'offerId diperlukan' },
      { status: 400 }
    )
  }

  logClick({
    offerId,
    sessionId,
    userAgent: request.headers.get('user-agent') ?? '',
    ipHash:    hashIp(request),
    referer,
  }).catch(() => {})

  const affiliateUrl = await resolveAffiliateUrl(offerId)

  if (!affiliateUrl) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.redirect(affiliateUrl)
}
