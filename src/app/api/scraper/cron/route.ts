import { NextResponse } from 'next/server'
import { scrapeAll, INDONESIAN_PLATFORMS } from '@/lib/scrapers'
import { saveScraperResults } from '@/lib/db/scraper-save'

// Called by Vercel Cron every 4 hours
export async function GET() {
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
