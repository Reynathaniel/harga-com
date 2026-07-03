import { NextRequest, NextResponse } from 'next/server'
import { scrapeAll, PLATFORM_INTL } from '@/lib/scrapers'
import { saveScraperResults } from '@/lib/db/scraper-save'

export const maxDuration = 60

// Called by Vercel cron at 03:00 UTC daily (intl platforms)
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends Authorization header)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET ?? ''
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const INTL_QUERIES = [
    'electronics', 'smartphone', 'laptop', 'headphones',
    'camera', 'gaming console', 'smartwatch', 'tablet',
  ]
  const dayOfMonth = new Date().getDate()
  const query = INTL_QUERIES[dayOfMonth % INTL_QUERIES.length]

  const start = Date.now()
  try {
    const result = await scrapeAll({
      query,
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
      query,
      totalFound: result.totalFound,
      durationMs: Date.now() - start,
      errors: result.errors,
      saved,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
