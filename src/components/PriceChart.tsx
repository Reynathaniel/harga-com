'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { id: idLocale } = require('date-fns/locale')
import type { PriceHistory, PlatformId } from '@/lib/types'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah } from '@/lib/utils'
import { useState } from 'react'

interface PriceChartProps {
  history: PriceHistory[]
  activePlatforms?: PlatformId[]
}

const RANGES = [
  { label: '7H', days: 7 },
  { label: '30H', days: 30 },
  { label: '90H', days: 90 },
]

export function PriceChart({ history, activePlatforms }: PriceChartProps) {
  const [range, setRange] = useState(30)

  if (history.length === 0) {
    return (
      <div>
        <span className="text-sm font-medium text-[var(--text-secondary)]">Riwayat Harga</span>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
          Riwayat harga belum tersedia
        </p>
      </div>
    )
  }

  const allPlatforms = activePlatforms || ['tokopedia', 'shopee', 'lazada', 'tiktok'] as PlatformId[]
  const sliced = history.slice(-range)

  const data = sliced.map(h => ({
    date: format(h.date, 'd MMM', { locale: idLocale }),
    ...Object.fromEntries(
      allPlatforms.map(pid => [pid, h.prices[pid] != null ? h.prices[pid]! / 1000 : null])
    ),
  }))

  // Only render lines for platforms that have at least one non-null data point
  const platforms = allPlatforms.filter(pid =>
    data.some(d => (d as Record<string, unknown>)[pid] != null)
  )

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#1a1a2a] border border-[var(--border)] rounded-lg p-3 text-xs shadow-xl">
        <div className="text-[var(--text-muted)] mb-2 font-medium">{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-[var(--text-secondary)]">{PLATFORMS[p.dataKey]?.name ?? p.dataKey}</span>
            </div>
            <span className="font-semibold text-[var(--text-primary)]">{formatRupiah(p.value * 1000, true)}</span>
          </div>
        ))}
      </div>
    )
  }

  if (platforms.length === 0) {
    return (
      <div>
        <span className="text-sm font-medium text-[var(--text-secondary)]">Riwayat Harga</span>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
          Riwayat harga belum tersedia
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Range selector */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-[var(--text-secondary)]">Riwayat Harga</span>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button key={r.days} onClick={() => setRange(r.days)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                range === r.days
                  ? 'bg-amber-500 text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%' }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#5a5a72' }}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(sliced.length / 6)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#5a5a72' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v}rb`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            {platforms.map(pid => (
              <Line
                key={pid}
                type="monotone"
                dataKey={pid}
                stroke={PLATFORMS[pid]?.color ?? '#888'}
                strokeWidth={2}
                dot={false}
                connectNulls={true}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {platforms.map(pid => {
          const p = PLATFORMS[pid]
          if (!p) return null
          return (
            <div key={pid} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded" style={{ background: p.color }} />
              <span className="text-xs text-[var(--text-muted)]">{p.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}