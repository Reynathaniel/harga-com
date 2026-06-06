'use client'

/**
 * ReferralDashboard — UI lengkap untuk sistem referral user.
 * Ditampilkan di /referral atau sebagai section di profil user.
 *
 * Mengambil data dari /api/referral/dashboard
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Link as LinkIcon, Copy, Check, TrendingUp, Clock,
  DollarSign, Users, ChevronRight, RefreshCw, ExternalLink
} from 'lucide-react'

interface CommissionItem {
  id: string
  platform: string | null
  amount_gross: number
  user_amount: number
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  created_at: string
}

interface ClickItem {
  id: string
  platform: string | null
  created_at: string
  converted: boolean
}

interface DashboardData {
  referralCode: string
  referralLink: string
  totalClicks: number
  clicksThisMonth: number
  pendingCommission: number
  approvedCommission: number
  paidCommission: number
  totalEarned: number
  referralBalance: number
  recentClicks: ClickItem[]
  recentCommissions: CommissionItem[]
}

function formatRp(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  paid:     'bg-green-500/10 text-green-400 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
}

interface ReferralDashboardProps {
  userId?: string  // jika ada, override auth token
}

export function ReferralDashboard({ userId }: ReferralDashboardProps) {
  const [data,    setData   ] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError  ] = useState<string | null>(null)
  const [copied,  setCopied ] = useState(false)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const url = userId
        ? `/api/referral/dashboard?userId=${userId}`
        : '/api/referral/dashboard'
      const res = await fetch(url)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError(json.error ?? 'Gagal memuat data')
      }
    } catch {
      setError('Koneksi gagal')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const handleCopy = useCallback(async () => {
    if (!data?.referralLink) return
    try {
      await navigator.clipboard.writeText(data.referralLink)
    } catch {
      const el = document.createElement('input')
      el.value = data.referralLink
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [data])

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-24 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-2">{error}</div>
        <button
          onClick={fetchDashboard}
          className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mx-auto"
        >
          <RefreshCw size={14} /> Coba lagi
        </button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">

      {/* ── Referral Link Box ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <LinkIcon size={16} className="text-indigo-400" />
          <span className="text-sm font-bold text-white">Link Referral Kamu</span>
        </div>

        <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-center gap-3 mb-3">
          <span className="flex-1 text-sm text-[var(--text-secondary)] font-mono truncate">
            {data.referralLink ?? 'Belum tersedia'}
          </span>
          <button
            onClick={handleCopy}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Tersalin!' : 'Salin'}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--text-muted)]">
            Kode: <span className="font-mono font-bold text-indigo-300">{data.referralCode}</span>
          </span>
          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            💰 Dapat komisi setiap ada yang beli lewat link ini
          </span>
        </div>
      </div>

      {/* ── Stats Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Users size={16} className="text-blue-400" />}
          label="Total Klik"
          value={data.totalClicks.toLocaleString('id')}
          sub={`${data.clicksThisMonth} bulan ini`}
        />
        <StatCard
          icon={<Clock size={16} className="text-amber-400" />}
          label="Pending"
          value={formatRp(data.pendingCommission)}
          sub="Menunggu approval"
          highlight="amber"
        />
        <StatCard
          icon={<TrendingUp size={16} className="text-green-400" />}
          label="Disetujui"
          value={formatRp(data.approvedCommission)}
          sub="Siap dicairkan"
          highlight="green"
        />
        <StatCard
          icon={<DollarSign size={16} className="text-indigo-400" />}
          label="Saldo"
          value={formatRp(data.referralBalance)}
          sub={`Total: ${formatRp(data.totalEarned)}`}
          highlight="indigo"
        />
      </div>

      {/* ── Recent Commissions ───────────────────────────────────── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <span className="text-sm font-bold text-white">Riwayat Komisi</span>
          <button
            onClick={fetchDashboard}
            className="text-xs text-[var(--text-muted)] hover:text-white flex items-center gap-1"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {data.recentCommissions.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-muted)] text-sm">
            Belum ada komisi. Share link produkmu untuk mulai!
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {data.recentCommissions.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">
                    {c.platform ?? 'Platform'}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {formatDate(c.created_at)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-white">
                    +{formatRp(c.user_amount)}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    dari {formatRp(c.amount_gross)}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[c.status] ?? ''}`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent Clicks ────────────────────────────────────────── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <span className="text-sm font-bold text-white">Klik Terbaru</span>
        </div>

        {data.recentClicks.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm">
            Belum ada klik.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {data.recentClicks.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: c.converted ? '#22c55e' : '#6b7280' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[var(--text-secondary)]">
                    {c.platform ?? 'Unknown'} •{' '}
                    <span className="text-xs text-[var(--text-muted)]">{formatDate(c.created_at)}</span>
                  </div>
                </div>
                {c.converted && (
                  <span className="text-[10px] text-green-400 font-semibold">Konversi</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── How it works ─────────────────────────────────────────── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
        <div className="text-sm font-bold text-white mb-4">Cara Kerja</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { n: '1', title: 'Share Link', desc: 'Copy link referralmu dan share ke teman atau media sosial' },
            { n: '2', title: 'Teman Klik & Beli', desc: 'Ketika teman klik linkmu dan beli produk di platform tujuan' },
            { n: '3', title: 'Dapat Komisi', desc: 'Komisi affiliate masuk otomatis. 50% untukmu, 50% harga.com' },
          ].map(s => (
            <div key={s.n} className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                {s.n}
              </div>
              <div>
                <div className="text-sm font-semibold text-white mb-0.5">{s.title}</div>
                <div className="text-xs text-[var(--text-muted)]">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ── StatCard ─────────────────────────────────────────────────────

interface StatCardProps {
  icon:       React.ReactNode
  label:      string
  value:      string
  sub:        string
  highlight?: 'amber' | 'green' | 'indigo'
}

function StatCard({ icon, label, value, sub, highlight }: StatCardProps) {
  const highlightClass = {
    amber:  'border-amber-500/20 bg-amber-500/5',
    green:  'border-green-500/20 bg-green-500/5',
    indigo: 'border-indigo-500/20 bg-indigo-500/5',
  }[highlight ?? ''] ?? 'border-[var(--border)] bg-[var(--bg-card)]'

  return (
    <div className={`border rounded-2xl p-4 ${highlightClass}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-[var(--text-muted)] font-medium">{label}</span>
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</div>
    </div>
  )
}
