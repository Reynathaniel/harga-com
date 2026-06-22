export const dynamic = 'force-dynamic'

/**
 * /referral — Halaman dashboard referral user
 */

import type { Metadata } from 'next'
import { ReferralDashboard } from '@/components/ReferralDashboard'
import { Share2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Referral Dashboard — harga.com',
  description: 'Lacak klik, komisi, dan saldo referral kamu di harga.com',
}

export default function ReferralPage({
  searchParams,
}: {
  searchParams: { userId?: string }
}) {
  return (
    <div className="pt-[88px] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <Share2 size={18} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Referral Dashboard</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Share produk, dapat komisi otomatis
            </p>
          </div>
        </div>

        <ReferralDashboard userId={searchParams.userId} />
      </div>
    </div>
  )
}
