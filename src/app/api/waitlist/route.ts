/**
 * POST /api/waitlist — Join waitlist
 *
 * Body: { email, name?, source? }
 * Stores to Supabase `waitlist` table.
 */

import { NextRequest, NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const email  = String(body.email ?? '').trim().toLowerCase()
  const name   = body.name   ? String(body.name).trim()   : null
  const source = body.source ? String(body.source).trim() : 'modal'

  if (!email || !email.includes('@')) {
    return NextResponse.json(
      { success: false, error: 'Email tidak valid' },
      { status: 400 }
    )
  }

  const db = tryGetServerClient()

  if (db) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (db as any)
        .from('waitlist')
        .upsert({ email, name, source }, { onConflict: 'email', ignoreDuplicates: false })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, data })
    } catch (err: unknown) {
      // Unique violation = already registered
      const pgErr = err as { code?: string }
      if (pgErr?.code === '23505') {
        return NextResponse.json({ success: true, alreadyRegistered: true })
      }
      console.error('[POST /api/waitlist]', err)
      return NextResponse.json(
        { success: false, error: 'Gagal mendaftar' },
        { status: 500 }
      )
    }
  }

  // No DB — mock success
  return NextResponse.json({
    success: true,
    data: { id: `wl_${Date.now()}`, email, name, source, created_at: new Date().toISOString() },
  })
}
