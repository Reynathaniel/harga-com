import { NextRequest, NextResponse } from 'next/server'
import { scrapeAll, scrapePlatform, getRegisteredPlatforms, INDONESIAN_PLATFORMS } from '@/lib/scrapers'

// Protect the scraper endpoint with a simple secret
// Set SCRAPER_SECRET env var in Vercel; omit it locally for easy testing
const SCRAPER_SECRET = process.env.SCRAPER_SECRET

function checkAuth(req: NextRequest): boolean {
  if (!SCRAPER_SECRET) return true  // no secret = open for local dev
  const provided = req.headers.get('x-scraper-secret')
    || req.nextUrl.searchParams.get('secret')
  return provided === SCRAPER_SECRET
}

// ── GET /api/scraper/run?q=...&platforms=tokopedia,shopee&limit=30 ──────────
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get('q')
  if (!q) {
    return NextResponse.json(
      { error: 'Missing query parameter: q', platforms: getRegisteredPlatforms() },
      { status: 400 }
    )
  }

  const platformParam = req.nextUrl.searchParams.get('platforms')
  const platforms = platformParam
    ? platformParam.split(',').map(p => p.trim()).filter(Boolean)
    : INDONESIAN_PLATFORMS

  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '30') || 30
  const page  = parseInt(req.nextUrl.searchParams.get('page') ?? '1')   || 1

  const startMs = Date.now()

  try {
    const result = await scrapeAll({ query: q, platforms, limit, page, concurrency: 3 })

    return NextResponse.json({
      ok: true,
      query: q,
      platforms,
      totalFound: result.totalFound,
      durationMs: result.durationMs,
      errors: result.errors,
      listings: result.merged,
      byPlatform: Object.fromEntries(
        result.results.map(r => [r.platformId, { count: r.totalFound, error: r.error }])
      ),
    })
  } catch (err) {
    console.error('[scraper/run] Error:', err)
    return NextResponse.json(
      { ok: false, error: String(err), durationMs: Date.now() - startMs },
      { status: 500 }
    )
  }
}

// ── POST /api/scraper/run — same as GET but query in body ───────────────────
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const q = String(body.query ?? body.q ?? '')
  if (!q) return NextResponse.json({ error: 'Missing field: query' }, { status: 400 })

  const platforms = (body.platforms as string[] | undefined) ?? INDONESIAN_PLATFORMS
  const limit = (body.limit as number | undefined) ?? 30
  const page  = (body.page  as number | undefined) ?? 1

  try {
    const result = await scrapeAll({ query: q, platforms, limit, page, concurrency: 3 })
    return NextResponse.json({
      ok: true,
      query: q,
      totalFound: result.totalFound,
      durationMs: result.durationMs,
      errors: result.errors,
      listings: result.merged,
    })
  } catch (err) {
    console.error('[scraper/run POST] Error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
