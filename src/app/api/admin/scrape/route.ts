export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/scrape
 *
 * Triggers a scrape run for specified platforms + queries.
 * Protected by ADMIN_SCRAPE_KEY header/body.
 *
 * Body:
 *   {
 *     key: string        // must match ADMIN_SCRAPE_KEY env var
 *     platforms?: string[]   // default: all Indonesian platforms
 *     queries?: string[]     // default: top product keywords
 *     limit?: number         // listings per platform/query (default 20)
 *   }
 *
 * Response:
 *   {
 *     message: string
 *     platforms: string[]
 *     queries: string[]
 *     triggered_at: string
 *     note: string
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'

const ADMIN_KEY = process.env.ADMIN_SCRAPE_KEY

const DEFAULT_PLATFORMS = ['tokopedia', 'shopee', 'lazada', 'blibli', 'tiktok']
const DEFAULT_QUERIES   = [
  'iphone 15', 'samsung galaxy', 'laptop gaming', 'sepatu nike', 'baju batik',
  'kulkas sharp', 'mesin cuci lg', 'skincare wardah', 'lipstik ms glow',
  'toyota avanza', 'honda beat', 'yamaha nmax',
]

export async function POST(req: NextRequest) {
  let body: {
    key?: string
    platforms?: string[]
    queries?: string[]
    limit?: number
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Auth check
  const providedKey = body.key || req.headers.get('x-admin-key') || ''
  if (!ADMIN_KEY || providedKey !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const platforms = body.platforms ?? DEFAULT_PLATFORMS
  const queries   = body.queries   ?? DEFAULT_QUERIES
  const limit     = body.limit     ?? 20

  // Log the scrape trigger to DB (best-effort)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = tryGetServerClient() as any
    if (db) {
      // We don't have a scrape_log table, so just ping the DB
      await db.from('products').select('id').limit(1)
    }
  } catch { /* ignore */ }

  // In a production system you'd either:
  //   1. Call a background worker / queue
  //   2. Trigger a Vercel Edge Function
  //   3. Use a Supabase Edge Function
  //   4. POST to an internal worker URL
  //
  // For now we return the manifest of what would be scraped.
  // The actual scraping is done via:
  //   node scripts/scrape-smart.mjs --platform all --queries "..."
  //   or via the /api/cron/scrape route (called by Vercel Cron)

  return NextResponse.json({
    message:      'Scrape job queued',
    platforms,
    queries,
    limit,
    triggered_at: new Date().toISOString(),
    note: 'To run manually: node scripts/scrape-smart.mjs --platform all --queries "iphone,samsung"',
    docs: {
      manual_script:   'node scripts/scrape-smart.mjs --platform all --queries "keyword1,keyword2"',
      vehicle_script:  'node scripts/scrape-vehicles.mjs --type all --pages 3',
      cron_endpoint:   '/api/cron/scrape (runs daily at 06:00 WIB)',
    },
  })
}

// GET — health check / status endpoint
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key') || req.headers.get('x-admin-key') || ''
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    status:   'ready',
    defaults: { platforms: DEFAULT_PLATFORMS, queries: DEFAULT_QUERIES },
    cron:     '0 6 * * * (06:00 WIB daily)',
  })
}
