import { NextResponse } from 'next/server'
import { scrapeAll, INDONESIAN_PLATFORMS } from '@/lib/scrapers'

// Called by Vercel Cron every 4 hours — scrapes Indonesian platforms
export async function GET() {
  const start = Date.now()
  try {
    const result = await scrapeAll({
      query: 'trending',
      platforms: INDONESIAN_PLATFORMS,
      limit: 40,
      concurrency: 3,
    })
    return NextResponse.json({
      ok: true,
      totalFound: result.totalFound,
      durationMs: Date.now() - start,
      errors: result.errors,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
