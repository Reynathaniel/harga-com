export const dynamic = 'force-dynamic'

/**
 * /r/[code] — Referral redirect page
 *
 * Flow:
 * 1. User share link: https://harga.com/r/A3KX92BF
 * 2. Page logs the click to referral_clicks table
 * 3. Redirects to product or homepage with ?ref=CODE (picked up by ReferralHandler)
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

  // Log the referral click to DB (fire-and-forget with best-effort)
  try {
    const db = tryGetServerClient()
    if (db) {
      const headersList = headers()
      const rawIp = headersList.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
      const ipHash = createHash('sha256')
        .update(rawIp + (process.env.IP_HASH_SALT ?? 'harga-salt'))
        .digest('hex')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).from('referral_clicks').insert({
        referral_code: safeCode,
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

  // Redirect to destination with ?ref= so ReferralHandler can store it client-side
  if (productId) {
    const dest = &platform=
    redirect(dest)
  }

  redirect()
}
