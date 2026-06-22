import { NextResponse } from 'next/server'
import { getRegisteredPlatforms, INDONESIAN_PLATFORMS, ALL_PLATFORMS } from '@/lib/scrapers'

// GET /api/scraper/status — health check & platform listing
export async function GET() {
  return NextResponse.json({
    ok: true,
    registeredPlatforms: getRegisteredPlatforms(),
    indonesianPlatforms: INDONESIAN_PLATFORMS,
    allPlatforms: ALL_PLATFORMS,
    endpoints: {
      run: '/api/scraper/run?q=<query>&platforms=<comma-list>&limit=30',
      status: '/api/scraper/status',
    },
    note: 'Add x-scraper-secret header or ?secret= query param if SCRAPER_SECRET env var is set',
  })
}
