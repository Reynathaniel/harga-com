import { NextRequest, NextResponse } from 'next/server'
import { scrapeAll, INDONESIAN_PLATFORMS } from '@/lib/scrapers'
import { saveScraperResults } from '@/lib/db/scraper-save'

export const maxDuration = 60

// Called by GitHub Actions every 4 hours (Vercel Hobby cron = once/day only)
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const start = Date.now()
  try {
    const result = await scrapeAll({
      query: 'trending',
      platforms: INDONESIAN_PLATFORMS,
      limit: 40,
      concurrency: 3,
    })
    let saved = null
    if (result.merged.length > 0) {
      saved = await saveScraperResults(result.merged)
    }
    return NextResponse.json({
      ok: true,
      totalFound: result.totalFound,
      durationMs: Date.now() - start,
      errors: result.errors,
      saved,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
