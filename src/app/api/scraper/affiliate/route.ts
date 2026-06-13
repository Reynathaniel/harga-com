/**
 * GET /api/scraper/affiliate
 *
 * Fetches curated affiliate product offers from Shopee Affiliate Program.
 * Requires SHOPEE_AFFILIATE_COOKIE + SHOPEE_AFFILIATE_CSRF env vars.
 *
 * Query params:
 *   page     — page number (default: 1)
 *   size     — results per page (default: 20, max: 100)
 *   sort     — 0=default | 1=commission_rate | 2=sales (default: 1)
 *   offer    — 0=all | 1=standard | 2=xtra | 3=sample (default: 0)
 *   keyword  — search within affiliate offers
 *   all      — if "true", fetches all pages (up to 5) for indexing
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  fetchShopeeAffiliateOffers,
  fetchAllShopeeAffiliateOffers,
} from '@/lib/scrapers/shopee-affiliate'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const page    = Number(searchParams.get('page')    ?? 1)
  const size    = Number(searchParams.get('size')    ?? 20)
  const sortBy  = (Number(searchParams.get('sort')   ?? 1)) as 0 | 1 | 2
  const offerType = (Number(searchParams.get('offer') ?? 0)) as 0 | 1 | 2 | 3
  const keyword = searchParams.get('keyword') ?? undefined
  const fetchAll = searchParams.get('all') === 'true'

  try {
    if (fetchAll) {
      const result = await fetchAllShopeeAffiliateOffers({
        maxPages: 5,
        size: 50,
        sortBy,
        offerType,
        keyword,
      })

      return NextResponse.json({
        ok: !result.error,
        source: 'shopee_affiliate',
        totalFound: result.totalFound,
        returned: result.listings.length,
        pagesScraped: result.pagesScraped,
        error: result.error,
        listings: result.listings.slice(0, 200), // cap response size
      })
    }

    const result = await fetchShopeeAffiliateOffers({ page, size, sortBy, offerType, keyword })

    return NextResponse.json({
      ok: !result.error,
      source: 'shopee_affiliate',
      totalFound: result.totalFound,
      page: result.page,
      hasMore: result.hasMore,
      returned: result.listings.length,
      error: result.error,
      listings: result.listings,
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, source: 'shopee_affiliate', error: String(err) },
      { status: 500 },
    )
  }
}
