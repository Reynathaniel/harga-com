import { NextRequest, NextResponse } from 'next/server'
import { tryGetServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const name = String(body?.name ?? '').trim().slice(0, 100)

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Email tidak valid' }, { status: 400 })
    }

    const db = tryGetServerClient()
    if (db) {
      // Use a try/catch — table may not exist yet
      try {
        await db
          .from('waitlist' as never)
          .upsert({ email, name: name || null, created_at: new Date().toISOString() }, { onConflict: 'email' })
      } catch {
        // Table doesn't exist yet — still return success to avoid exposing DB structure
      }
    }

    return NextResponse.json({ success: true, message: 'Berhasil bergabung waitlist!' })
  } catch {
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
