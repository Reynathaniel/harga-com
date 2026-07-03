import { NextRequest, NextResponse } from 'next/server'
import { scrapeAll, INDONESIAN_PLATFORMS } from '@/lib/scrapers'
import { saveScraperResults } from '@/lib/db/scraper-save'

export const maxDuration = 60

// Rotate queries across cron runs to maximize catalog coverage
// 3 runs/day × 7 day cycle = 21 unique query batches
const QUERY_ROTATION = [
  'iphone 15 pro',
  'samsung galaxy a55',
  'laptop gaming asus rog',
  'headphone sony wh-1000xm5',
  'speaker bluetooth jbl',
  'smartwatch samsung galaxy watch',
  'sepatu nike air max',
  'tas wanita branded',
  'kulkas samsung 2 pintu',
  'mesin cuci samsung',
  'ac panasonic 1pk',
  'skincare wardah',
  'serum ms glow',
  'sunscreen somethinc spf',
  'laptop lenovo thinkpad',
  'kamera mirrorless sony',
  'airpods pro 2',
  'playstation 5',
  'sepatu adidas',
  'parfum pria',
  'samsung galaxy s24',
]

export async function GET(request: NextRequest) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rotate by day + hour to cover different queries each run
  const now = new Date()
  const rotationIndex = (now.getUTCDate() * 3 + Math.floor(now.getUTCHours() / 8)) % QUERY_ROTATION.length
  const query = QUERY_ROTATION[rotationIndex]

  const start = Date.now()
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
      rotationIndex,
      totalFound: result.totalFound,
      durationMs: Date.now() - start,
      errors: result.errors,
      saved,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, query, error: String(err) }, { status: 500 })
  }
}
