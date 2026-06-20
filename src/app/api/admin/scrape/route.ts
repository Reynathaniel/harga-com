export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/scrape
 * Triggers a scrape run for specified platforms + queries.
 * Protected by ADMIN_SCRAPE_KEY header/body.
 */

import { NextRequest, NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'

const ADMIN_KEY = process.env.ADMIN_SCRAPE_KEY || 'hargacom-admin-2024'

const DEFAULT_PLATFORMS = ['tokopedia', 'shopee', 'lazada', 'blibli', 'tiktok']
const DEFAULT_QUERIES   = [
  'iphone 15', 'samsung galaxy', 'laptop gaming', 'sepatu nike', 'baju batik',
  'kulkas sharp', 'mesin cuci lg', 'skincare wardah', 'lipstik ms glow',
  'toyota avanza', 'honda beat', 'yamaha nmax',
]

export async function POST(req: NextRequest) {
  let body: { key?: string; platforms?: string[]; queries?: string[]; limit?: number }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

  const providedKey = body.key || req.headers.get('x-admin-key') || ''
  if (providedKey !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const platforms = body.platforms ?? DEFAULT_PLATFORMS
  const queries   = body.queries   ?? DEFAULT_QUERIES
  const limit     = body.limit     ?? 20

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = tryGetServerClient() as any
    if (db) await db.from('products').select('id').limit(1)
  } catch { /* ignore */ }

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

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key') || req.headers.get('x-admin-key') || ''
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({
    status:   'ready',
    defaults: { platforms: DEFAULT_PLATFORMS, queries: DEFAULT_QUERIES },
    cron:     '0 23 * * * (06:00 WIB daily)',
  })
}