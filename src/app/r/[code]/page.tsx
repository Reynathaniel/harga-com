export const dynamic = 'force-dynamic'

/**
 * /r/[code] — Referral redirect page
 *
 * Flow:
 * 1. User visits https://harga.com/r/A3KX92BF
 * 2. Page looks up owner user_id from referral code
 * 3. Logs the referral click to referral_clicks table (with user_id for dashboard attribution)
 * 4. Redirects to product or homepage with ?ref=CODE (stored client-side by ReferralHandler)
 */

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createHash } from 'crypto'
import { tryGetServerClient } from '@/lib/supabase'
import type { Metadata } from 'next'

interface Props {
  params: { code: string }
  searchParams: { productId?: string; platform?: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Redirecting — harga.com',
    description: 'Temukan harga terbaik di harga.com',
    robots: 'noindex',
  }
}

export default async function ReferralRedirectPage({ params, searchParams }: Props) {
  const { code } = params
  const { productId, platform } = searchParams

  // Sanitize code (alphanumeric only, uppercase, max 12 chars)
  const safeCode = code.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 12)

  if (!safeCode) {
    redirect('/')
  }

  // Log the referral click to DB (best-effort)
  try {
    const db = tryGetServerClient()
    if (db) {
      const headersList = headers()
      const rawIp = headersList.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
      const ipHash = createHash('sha256')
        .update(rawIp + (process.env.IP_HASH_SALT ?? 'harga-salt'))
        .digest('hex')

      // Look up referral code owner so we can attribute user_id
      // (dashboard queries referral_clicks by user_id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (db as any)
        .from('user_profiles')
        .select('id')
        .eq('referral_code', safeCode)
        .maybeSingle()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).from('referral_clicks').insert({
        referral_code: safeCode,
        user_id:       profile?.id ?? null,
        product_id:    productId ?? null,
        platform:      platform  ?? null,
        ip_hash:       ipHash,
        user_agent:    headersList.get('user-agent') ?? null,
        referer:       headersList.get('referer')    ?? null,
        converted:     false,
      })
    }
  } catch {
    // Non-fatal — always redirect regardless
  }

  // Redirect to destination; ?ref= param stored client-side by ReferralHandler
  if (productId) {
    const dest = `/produk/${productId}?ref=${safeCode}${platform ? `&platform=${platform}` : ''}`
    redirect(dest)
  }

  redirect(`/?ref=${safeCode}`)
}
