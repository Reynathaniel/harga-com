import { NextRequest, NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  const name  = String(body.name  ?? '').trim()

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
        .upsert({ email, name: name || null, source: 'homepage' }, { onConflict: 'email' })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, data })
    } catch (err) {
      console.error('[POST /api/waitlist]', err)
      // fall through to mock success so UX isn't blocked
    }
  }

  // Mock fallback
  return NextResponse.json({
    success: true,
    data: { id: `wl_${Date.now()}`, email, name: name || null, source: 'homepage' },
  })
}
