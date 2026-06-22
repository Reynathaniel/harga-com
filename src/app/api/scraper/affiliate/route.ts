import { NextRequest, NextResponse } from 'next/server'
import {
  fetchShopeeAffiliateOffers,
  fetchAllShopeeAffiliateOffers,
} from '@/lib/scrapers/shopee-affiliate'
import { saveScraperResults } from '@/lib/db/scraper-save'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const page      = Number(searchParams.get('page')    ?? 1)
  const size      = Number(searchParams.get('size')    ?? 20)
  const sortBy    = (Number(searchParams.get('sort')   ?? 1)) as 0 | 1 | 2
  const offerType = (Number(searchParams.get('offer')  ?? 0)) as 0 | 1 | 2 | 3
  const keyword   = searchParams.get('keyword') ?? undefined
  const fetchAll  = searchParams.get('all') === 'true'
  const shouldSave = searchParams.get('save') !== 'false'

  try {
    if (fetchAll) {
      const result = await fetchAllShopeeAffiliateOffers({
        maxPages: 5, size: 50, sortBy, offerType, keyword,
      })
      let saved = null
      if (shouldSave && result.listings.length > 0) {
        saved = await saveScraperResults(result.listings)
      }
      return NextResponse.json({
        ok: !result.error, source: 'shopee_affiliate',
        totalFound: result.totalFound, returned: result.listings.length,
        pagesScraped: result.pagesScraped, error: result.error, saved,
        listings: result.listings.slice(0, 200),
      })
    }

    const result = await fetchShopeeAffiliateOffers({ page, size, sortBy, offerType, keyword })
    let saved = null
    if (shouldSave && result.listings.length > 0) {
      saved = await saveScraperResults(result.listings)
    }
    return NextResponse.json({
      ok: !result.error, source: 'shopee_affiliate',
      totalFound: result.totalFound, page: result.page, hasMore: result.hasMore,
      returned: result.listings.length, error: result.error, saved,
      listings: result.listings,
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, source: 'shopee_affiliate', error: String(err) },
      { status: 500 },
    )
  }
}
