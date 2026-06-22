/**
 * GET /api/ping
 *
 * Dijalankan otomatis oleh Vercel Cron Job setiap 3 hari.
 * Tujuan: mencegah Supabase free tier auto-pause project karena inaktif.
 */

import { NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'

export async function GET() {
  const db = tryGetServerClient()

  if (!db) {
    return NextResponse.json({
      ok: false,
      message: 'Supabase not configured',
      ts: new Date().toISOString(),
    })
  }

  try {
    const { error } = await (db as any)
      .from('merchants')
      .select('id')
      .limit(1)

    if (error) throw error

    return NextResponse.json({
      ok: true,
      message: 'Supabase ping successful',
      ts: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      message: 'Supabase ping failed',
      error: String(err),
      ts: new Date().toISOString(),
    }, { status: 500 })
  }
}
