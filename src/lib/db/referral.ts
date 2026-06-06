/**
 * db/referral.ts — Database helpers untuk sistem referral
 */

import { tryGetServerClient } from '@/lib/supabase'
import type {
  ReferralClickRow,
  ReferralCommissionRow,
  CommissionSettingsRow,
} from '@/lib/database.types'

// ─────────────────────────────────────────────────────────────────
// Commission Settings
// ─────────────────────────────────────────────────────────────────

export async function getCommissionSettings(): Promise<CommissionSettingsRow | null> {
  const db = tryGetServerClient()
  if (!db) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (db as any)
    .from('commission_settings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data ?? null
}

export async function updateCommissionSettings(
  userSharePercent: number,
  ownerSharePercent: number,
  minPayout: number,
  notes?: string
): Promise<CommissionSettingsRow | null> {
  const db = tryGetServerClient()
  if (!db) return null

  // Upsert: update row pertama atau insert baru
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (db as any)
    .from('commission_settings')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = existing
    ? await (db as any)
        .from('commission_settings')
        .update({
          user_share_percent: userSharePercent,
          owner_share_percent: ownerSharePercent,
          min_payout: minPayout,
          notes: notes ?? null,
        })
        .eq('id', existing.id)
        .select()
        .single()
    : await (db as any)
        .from('commission_settings')
        .insert({
          user_share_percent: userSharePercent,
          owner_share_percent: ownerSharePercent,
          min_payout: minPayout,
          notes: notes ?? null,
        })
        .select()
        .single()

  return data ?? null
}

// ─────────────────────────────────────────────────────────────────
// User Referral Code
// ─────────────────────────────────────────────────────────────────

export async function getUserByReferralCode(
  referralCode: string
): Promise<{ id: string; referral_code: string; email: string } | null> {
  const db = tryGetServerClient()
  if (!db) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (db as any)
    .from('user_profiles')
    .select('id, referral_code, email')
    .eq('referral_code', referralCode)
    .single()

  return data ?? null
}

export async function ensureReferralCode(userId: string): Promise<string | null> {
  const db = tryGetServerClient()
  if (!db) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (db as any)
    .from('user_profiles')
    .select('referral_code')
    .eq('id', userId)
    .single()

  if (existing?.referral_code) return existing.referral_code

  // Generate via DB function (trigger akan generate jika NULL)
  const { generateReferralCode } = await import('@/lib/referral-utils')
  const code = generateReferralCode()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (db as any)
    .from('user_profiles')
    .update({ referral_code: code })
    .eq('id', userId)
    .select('referral_code')
    .single()

  return data?.referral_code ?? null
}

// ─────────────────────────────────────────────────────────────────
// Click Tracking
// ─────────────────────────────────────────────────────────────────

export interface LogReferralClickParams {
  referralCode: string
  userId?: string
  productId?: string
  platform?: string
  offerId?: string
  ipHash?: string
  userAgent?: string
  referer?: string
}

export async function logReferralClick(
  params: LogReferralClickParams
): Promise<string | null> {
  const db = tryGetServerClient()
  if (!db) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (db as any)
    .from('referral_clicks')
    .insert({
      referral_code: params.referralCode,
      user_id:       params.userId      ?? null,
      product_id:    params.productId   ?? null,
      platform:      params.platform    ?? null,
      offer_id:      params.offerId     ?? null,
      ip_hash:       params.ipHash      ?? null,
      user_agent:    params.userAgent   ?? null,
      referer:       params.referer     ?? null,
    })
    .select('id')
    .single()

  return data?.id ?? null
}

// ─────────────────────────────────────────────────────────────────
// Dashboard Statistics
// ─────────────────────────────────────────────────────────────────

export interface ReferralStats {
  totalClicks: number
  clicksThisMonth: number
  pendingCommission: number
  approvedCommission: number
  paidCommission: number
  totalEarned: number
  referralBalance: number
  recentClicks: ReferralClickRow[]
  recentCommissions: ReferralCommissionRow[]
}

export async function getReferralDashboard(userId: string): Promise<ReferralStats | null> {
  const db = tryGetServerClient()
  if (!db) return null

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dba = db as any

  // Fetch in parallel
  const [
    profileRes,
    totalClicksRes,
    monthClicksRes,
    commissionsRes,
    recentClicksRes,
  ] = await Promise.all([
    dba.from('user_profiles')
      .select('referral_code, referral_balance, total_earned')
      .eq('id', userId)
      .single(),

    dba.from('referral_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),

    dba.from('referral_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', monthStart.toISOString()),

    dba.from('referral_commissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),

    dba.from('referral_clicks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const profile     = profileRes.data
  const commissions = (commissionsRes.data ?? []) as ReferralCommissionRow[]

  const pendingAmount  = commissions.filter(c => c.status === 'pending' ).reduce((s, c) => s + Number(c.user_amount), 0)
  const approvedAmount = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + Number(c.user_amount), 0)
  const paidAmount     = commissions.filter(c => c.status === 'paid'    ).reduce((s, c) => s + Number(c.user_amount), 0)

  return {
    totalClicks:        totalClicksRes.count  ?? 0,
    clicksThisMonth:    monthClicksRes.count  ?? 0,
    pendingCommission:  pendingAmount,
    approvedCommission: approvedAmount,
    paidCommission:     paidAmount,
    totalEarned:        Number(profile?.total_earned     ?? 0),
    referralBalance:    Number(profile?.referral_balance ?? 0),
    recentClicks:       (recentClicksRes.data  ?? []) as ReferralClickRow[],
    recentCommissions:  commissions.slice(0, 10),
  }
}
