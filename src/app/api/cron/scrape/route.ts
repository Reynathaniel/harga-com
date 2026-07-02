export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes — Vercel Pro plan required

/**
 * GET /api/cron/scrape
 *
 * Daily scrape cron job — called by Vercel Cron at 06:00 WIB (23:00 UTC).
 * Rotates through a set of popular queries across Indonesian platforms.
 *
 * Security: Vercel Cron sends Authorization: Bearer <CRON_SECRET>.
 * Set CRON_SECRET env var in Vercel dashboard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { scrapeAll, INDONESIAN_PLATFORMS } from '@/lib/scrapers'
import { saveScraperResults } from '@/lib/db/scraper-save'

const CRON_SECRET = process.env.CRON_SECRET ?? ''

// Rotate through these queries daily — ordered by search popularity
const DAILY_QUERIES = [
  'iphone 15 pro',
  'samsung galaxy a55',
  'laptop gaming asus',
  'headphone sony',
  'speaker bluetooth jbl',
  'smartwatch samsung galaxy watch',
  'sepatu nike',
  'tas wanita',
  'kulkas 2 pintu',
  'mesin cuci front loading',
  'ac 1pk inverter',
  'skincare wardah',
  'serum ms glow',
  'sunscreen somethinc',
  'laptop lenovo thinkpad',
  'kamera mirrorless sony',
  'airpods pro',
  'playstation 5',
  'sepatu adidas',
  'parfum pria',
]

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends Authorization header)
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()

  // Rotate query based on day of month to spread coverage
  const dayOfMonth = new Date().getDate()
  const query = DAILY_QUERIES[dayOfMonth % DAILY_QUERIES.length]

  try {
    const result = await scrapeAll({
      query,
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
      query,
      totalFound: result.totalFound,
      durationMs: Date.now() - startTime,
      errors: result.errors,
      saved,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, query, error: String(err) }, { status: 500 })
  }
}
