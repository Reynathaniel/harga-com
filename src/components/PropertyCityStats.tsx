'use client'

import { useEffect, useState } from 'react'

interface CityStatRow {
  city: string
  avg_price_per_m2_land: number
  avg_price_per_m2_building: number | null
  count: number
  min_price: number
  max_price: number
}

interface Props {
  category: string // 'rumah-bekas' | 'tanah-bekas' or DB label
}

function formatRp(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} jt/m²`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)} rb/m²`
  return `${n.toFixed(0)}/m²`
}

function Skeleton() {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: '20px 24px',
        marginTop: 24,
      }}
    >
      <div style={{ height: 16, width: 200, borderRadius: 8, background: 'var(--bg-hover)', marginBottom: 16 }} />
      {[1, 2, 3].map(i => (
        <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 2, height: 12, borderRadius: 6, background: 'var(--bg-hover)' }} />
          <div style={{ flex: 1, height: 12, borderRadius: 6, background: 'var(--bg-hover)' }} />
          <div style={{ flex: 1, height: 12, borderRadius: 6, background: 'var(--bg-hover)' }} />
        </div>
      ))}
    </div>
  )
}

export function PropertyCityStats({ category }: Props) {
  const [stats, setStats] = useState<CityStatRow[] | null>(null)
  const [loading, setLoading] = useState(true)

  const isRumah =
    category === 'rumah-bekas' ||
    category === 'Rumah Bekas'

  useEffect(() => {
    setLoading(true)
    setStats(null)
    fetch(`/api/property/city-stats?category=${encodeURIComponent(category)}`)
      .then(r => r.json())
      .then(d => {
        setStats(d.stats ?? [])
        setLoading(false)
      })
      .catch(() => {
        setStats([])
        setLoading(false)
      })
  }, [category])

  if (loading) return <Skeleton />

  // Hide if fewer than 2 cities or fewer than 3 total listings
  const totalListings = stats?.reduce((s, r) => s + r.count, 0) ?? 0
  if (!stats || stats.length < 2 || totalListings < 3) return null

  // Cheapest city = lowest avg_price_per_m2_land (last in DESC-sorted list)
  const cheapestCity = stats[stats.length - 1]?.city

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: '20px 24px',
        marginTop: 24,
        overflowX: 'auto',
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
          📊 Perbandingan Harga/m² per Kota
        </span>
        <span
          style={{
            marginLeft: 8,
            fontSize: 11,
            color: 'var(--text-muted)',
            fontWeight: 400,
          }}
        >
          {isRumah ? 'Rumah Bekas' : 'Tanah Bekas'} · {stats.length} kota · {totalListings} listing
        </span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                paddingBottom: 8,
                paddingRight: 16,
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              Kota
            </th>
            <th
              style={{
                textAlign: 'right',
                paddingBottom: 8,
                paddingRight: 16,
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              Rata-rata/m² tanah
            </th>
            {isRumah && (
              <th
                style={{
                  textAlign: 'right',
                  paddingBottom: 8,
                  paddingRight: 16,
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                Rata-rata/m² bangunan
              </th>
            )}
            <th
              style={{
                textAlign: 'right',
                paddingBottom: 8,
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              Jumlah listing
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.map((row, i) => {
            const isCheapest = row.city === cheapestCity
            return (
              <tr
                key={row.city}
                style={{
                  background: isCheapest ? 'rgba(34,197,94,0.06)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <td
                  style={{
                    padding: '9px 16px 9px 0',
                    color: isCheapest ? '#22c55e' : 'var(--text-primary)',
                    fontWeight: isCheapest ? 600 : 400,
                    borderBottom: i < stats.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {isCheapest && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        background: '#22c55e',
                        color: '#fff',
                        borderRadius: 4,
                        padding: '1px 5px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        flexShrink: 0,
                      }}
                    >
                      Termurah
                    </span>
                  )}
                  {row.city}
                </td>
                <td
                  style={{
                    padding: '9px 16px 9px 0',
                    textAlign: 'right',
                    color: isCheapest ? '#22c55e' : 'var(--text-primary)',
                    fontWeight: isCheapest ? 700 : 500,
                    borderBottom: i < stats.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatRp(row.avg_price_per_m2_land)}
                </td>
                {isRumah && (
                  <td
                    style={{
                      padding: '9px 16px 9px 0',
                      textAlign: 'right',
                      color: 'var(--text-secondary)',
                      borderBottom: i < stats.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {row.avg_price_per_m2_building != null
                      ? formatRp(row.avg_price_per_m2_building)
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                )}
                <td
                  style={{
                    padding: '9px 0',
                    textAlign: 'right',
                    color: 'var(--text-muted)',
                    borderBottom: i < stats.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {row.count}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
