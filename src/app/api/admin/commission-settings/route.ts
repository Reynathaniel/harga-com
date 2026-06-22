/**
 * GET  /api/admin/commission-settings — Baca setting komisi saat ini
 * POST /api/admin/commission-settings — Update split percentage (admin only)
 *
 * POST body:
 * {
 *   userSharePercent: number  // 0–100
 *   ownerSharePercent: number // 0–100, harus userSharePercent + ownerSharePercent === 100
 *   minPayout?: number        // minimum saldo untuk withdraw (default 50000)
 *   notes?: string
 *   adminSecret?: string      // env: ADMIN_SECRET (simple auth sementara)
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCommissionSettings, updateCommissionSettings } from '@/lib/db/referral'

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? ''

function isAdminAuthorized(request: NextRequest, body?: Record<string, unknown>): boolean {
  // Cek header
  const headerSecret = request.headers.get('x-admin-secret') ?? ''
  if (ADMIN_SECRET && headerSecret === ADMIN_SECRET) return true

  // Cek body field
  if (ADMIN_SECRET && body?.adminSecret === ADMIN_SECRET) return true

  // Jika ADMIN_SECRET tidak di-set (development), allow all
  if (!ADMIN_SECRET) return true

  return false
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await getCommissionSettings()

  if (!settings) {
    // Default jika DB belum ada
    return NextResponse.json({
      success: true,
      data: {
        userSharePercent: 50,
        ownerSharePercent: 50,
        minPayout: 50000,
        notes: 'Default (DB not configured)',
      },
    })
  }

  return NextResponse.json({ success: true, data: settings })
}

export async function POST(request: NextRequest) {
  let body: {
    userSharePercent?: number
    ownerSharePercent?: number
    minPayout?: number
    notes?: string
    adminSecret?: string
  } = {}

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  if (!isAdminAuthorized(request, body as Record<string, unknown>)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userShare  = Number(body.userSharePercent  ?? 50)
  const ownerShare = Number(body.ownerSharePercent ?? 50)
  const minPayout  = Number(body.minPayout         ?? 50000)

  // Validasi
  if (userShare < 0 || ownerShare < 0) {
    return NextResponse.json(
      { success: false, error: 'Persentase tidak boleh negatif' },
      { status: 400 }
    )
  }

  if (Math.round(userShare + ownerShare) !== 100) {
    return NextResponse.json(
      { success: false, error: `userSharePercent + ownerSharePercent harus = 100. Dapat: ${userShare + ownerShare}` },
      { status: 400 }
    )
  }

  if (minPayout < 0) {
    return NextResponse.json(
      { success: false, error: 'minPayout tidak boleh negatif' },
      { status: 400 }
    )
  }

  const updated = await updateCommissionSettings(userShare, ownerShare, minPayout, body.notes)

  if (!updated) {
    return NextResponse.json(
      { success: false, error: 'Gagal update settings. Pastikan Supabase terkonfigurasi.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: `Split diupdate: user ${userShare}% / owner ${ownerShare}%`,
    data: updated,
  })
}
