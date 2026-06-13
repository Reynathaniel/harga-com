import { NextResponse } from 'next/server'
import { scrapeAll, PLATFORM_INTL } from '@/lib/scrapers'
import { saveScraperResults } from '@/lib/db/scraper-save'

// Called by Vercel Cron daily at 03:00 UTC — scrapes international platforms
export async function GET() {
  const start = Date.now()
  try {
    const result = await scrapeAll({
      query: 'electronics',
      platforms: PLATFORM_INTL,
      limit: 30,
      concurrency: 2,
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
