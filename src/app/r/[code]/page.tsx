export const dynamic = 'force-dynamic'

/**
 * /r/[code] — Referral redirect page
 *
 * Flow:
 * 1. User share link: https://harga-com.vercel.app/r/A3KX92BF
 * 2. Page ini log klik (via API) lalu redirect ke homepage dengan ?ref=A3KX92BF
 * 3. Jika ada productId di query: redirect ke /produk/{id}?ref={code}
 *
 * Params:
 *   - code: referral code dari URL path
 *   - productId (query, optional): ID produk spesifik
 *   - platform  (query, optional): platform tujuan
 */

import { redirect } from 'next/navigation'
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

/**
 * Server component: log klik via API route lalu redirect.
 * Menggunakan fetch ke API /api/referral/[code]/track agar logic terpusat.
 */
export default async function ReferralRedirectPage({ params, searchParams }: Props) {
  const { code } = params
  const { productId, platform } = searchParams

  // Sanitize code (alphanumeric only, uppercase, max 12 chars)
  const safeCode = code.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 12)

  if (!safeCode) {
    redirect('/')
  }

  // Build destination URL
  // Tracking sudah dilakukan di /api/referral/[code]/track
  // Di sini kita langsung redirect ke halaman yang tepat dengan ?ref=
  if (productId) {
    const dest = `/produk/${productId}?ref=${safeCode}${platform ? `&platform=${platform}` : ''}`
    redirect(dest)
  }

  // Default: homepage dengan ref cookie
  redirect(`/?ref=${safeCode}`)
}
