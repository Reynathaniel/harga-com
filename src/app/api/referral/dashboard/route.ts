/**
 * GET /api/referral/dashboard
 *
 * Return statistik referral untuk user yang sedang login.
 * Kirim Authorization: Bearer {supabase_access_token}
 * atau query param ?userId={id} (development only)
 *
 * Response: { success: true, data: ReferralStats }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getReferralDashboard } from '@/lib/db/referral'
import { tryGetServerClient } from '@/lib/supabase'
import { buildReferralLink } from '@/lib/referral-utils'

export async function GET(request: NextRequest) {
  const db = tryGetServerClient()
  let userId: string | undefined

  // Try auth token
  if (db) {
    const authHeader = request.headers.get('authorization') ?? ''
    const token = authHeader.replace('Bearer ', '').trim()
    if (token) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (db as any).auth.getUser(token)
      userId = data?.user?.id
    }
  }

  // Dev fallback
  if (!userId) {
    userId = request.nextUrl.searchParams.get('userId') ?? undefined
  }

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — kirim Authorization header' },
      { status: 401 }
    )
  }

  if (!db) {
    // Mock response untuk development
    return NextResponse.json({
      success: true,
      data: {
        totalClicks: 0,
        clicksThisMonth: 0,
        pendingCommission: 0,
        approvedCommission: 0,
        paidCommission: 0,
        totalEarned: 0,
        referralBalance: 0,
        referralCode: 'DEMO1234',
        referralLink: buildReferralLink('DEMO1234'),
        recentClicks: [],
        recentCommissions: [],
      },
    })
  }

  const stats = await getReferralDashboard(userId)

  if (!stats) {
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data dashboard' },
      { status: 500 }
    )
  }

  // Ambil referral code user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (db as any)
    .from('user_profiles')
    .select('referral_code')
    .eq('id', userId)
    .single()

  const referralCode = profile?.referral_code ?? ''

  return NextResponse.json({
    success: true,
    data: {
      ...stats,
      referralCode,
      referralLink: referralCode ? buildReferralLink(referralCode) : null,
    },
  })
}
