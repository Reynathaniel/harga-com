/**
 * POST /api/referral/register
 *
 * Generate atau return existing referral code untuk user yang sudah login.
 *
 * Body: { userId: string }
 * atau gunakan auth header (Supabase JWT) — userId dari token.
 *
 * Response: { success: true, data: { referralCode, referralLink } }
 */

import { NextRequest, NextResponse } from 'next/server'
import { ensureReferralCode } from '@/lib/db/referral'
import { buildReferralLink } from '@/lib/referral-utils'
import { tryGetServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  let body: { userId?: string } = {}

  try {
    body = await request.json()
  } catch {
    // body opsional
  }

  // Coba ambil user dari Supabase auth header
  let userId = body.userId

  if (!userId) {
    const db = tryGetServerClient()
    if (db) {
      const authHeader = request.headers.get('authorization') ?? ''
      const token = authHeader.replace('Bearer ', '').trim()
      if (token) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (db as any).auth.getUser(token)
        userId = data?.user?.id
      }
    }
  }

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'userId diperlukan atau kirim Authorization header' },
      { status: 401 }
    )
  }

  const referralCode = await ensureReferralCode(userId)

  if (!referralCode) {
    return NextResponse.json(
      { success: false, error: 'Gagal generate referral code. Pastikan Supabase terkonfigurasi.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      referralCode,
      referralLink: buildReferralLink(referralCode),
    },
  })
}
