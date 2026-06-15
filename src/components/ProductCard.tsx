'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { Star, TrendingDown, ShoppingCart, Bell, Globe, Flame } from 'lucide-react'
import type { Product } from '@/lib/types'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah, priceDiffPercent, lowestListingFirst } from '@/lib/utils'
import MediaEmbed from './MediaEmbed'

interface ProductCardProps {
  product: Product
  compact?: boolean
  tilt?: boolean
}

const INTL_PLATFORMS = new Set(['amazon', 'alibaba', 'aliexpress', 'jd'])

export function ProductCard({ product, compact = false, tilt = true }: ProductCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)

  const sortedListings = lowestListingFirst(product.listings)
  const cheapest = sortedListings[0]

  if (!cheapest) {
    return (
      <div className="block rounded-xl overflow-hidden opacity-40"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
        <div className="relative aspect-square" style={{ background: 'var(--bg-hover)' }} />
        <div className="p-3">
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{product.name}</p>
        </div>
      </div>
    )
  }

  const mostExpensive = sortedListings[sortedListings.length - 1]
  const diff = priceDiffPercent(cheapest.price, mostExpensive.price)
  const savings = mostExpensive.price - cheapest.price
  const cheapestPlatform = PLATFORMS[cheapest.platformId] ?? PLATFORMS['tokopedia']
  const cashbackPct = cheapestPlatform.cashbackPct
  const cashbackAmount = Math.round(cheapest.price * cashbackPct / 100)
  const isIntl = INTL_PLATFORMS.has(cheapest.platformId)
  const domesticListings = sortedListings.filter(l => !INTL_PLATFORMS.has(l.platformId))
  const intlListings = sortedListings.filter(l => INTL_PLATFORMS.has(l.platformId))
  const displayListings = compact ? sortedListings.slice(0, 4) : sortedListings.slice(0, 6)
  const priceRange = mostExpensive.price - cheapest.price
  const rangePercent = priceRange > 0 ? Math.min(100, Math.round((priceRange / cheapest.price) * 100)) : 0
  const isUsed = cheapest.condition === 'used'

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt || !cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    const rx = (py - 0.5) * -8
    const ry = (px - 0.5) * 10
    cardRef.current.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`
    if (glowRef.current) {
      glowRef.current.style.setProperty('--mx', px * 100 + '%')
      glowRef.current.style.setProperty('--my', py * 100 + '%')
    }
  }

  const onMouseLeave = () => {
    setHovered(false)
    if (cardRef.current) cardRef.current.style.transform = ''
  }

  return (
    <Link href={'/produk/' + product.id}
      className="block"
      style={{ transformStyle: 'preserve-3d' }}>
      <div
        ref={cardRef}
        onMouseEnter={() => setHovered(true)}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{
          background: '#FFFFFF',
          border: `1px solid ${hovered ? 'var(--cream-300)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: hovered
            ? '0 8px 28px rgba(26,22,19,0.10), 0 2px 8px rgba(212,146,10,0.08)'
            : 'var(--shadow-card)',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          transition: 'box-shadow var(--transition-base), border-color var(--transition-base), transform var(--transition-tilt)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
        }}>

        {/* ── Image / Video ── */}
        <div className="relative overflow-hidden"
          style={{ aspectRatio: '1 / 1', background: 'var(--cream-100)' }}>
          <MediaEmbed
            imageUrl={product.images[0]}
            videoUrl={cheapest.videoUrl}
            videoThumb={cheapest.videoThumb}
            title={product.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)', transition: 'transform var(--transition-slow)' }}
          />

          {/* Subtle warm glow on hover */}
          <div ref={glowRef}
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(212,146,10,0.12), transparent 45%)',
              opacity: hovered ? 1 : 0,
              transition: 'opacity var(--transition-base)',
            }} />

          {/* Top-left badges */}
          <div className="absolute flex flex-col gap-1.5 items-start"
            style={{ top: 10, left: 10, transform: 'translateZ(40px)' }}>
            {diff > 0 && (
              <span className="text-white" style={{
                padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-10)', fontWeight: 'var(--fw-bold)',
                background: 'var(--red-500)', lineHeight: 1,
              }}>−{diff}%</span>
            )}
            {isUsed ? (
              <span style={{
                padding: '3px 9px', borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-10)', fontWeight: 'var(--fw-bold)',
                background: 'rgba(36,113,163,0.12)', color: 'var(--info)',
                border: '1px solid rgba(36,113,163,0.25)', lineHeight: 1,
              }}>Bekas</span>
            ) : product.popular && (
              <span className="flex items-center gap-1" style={{
                padding: '3px 9px', borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-10)', fontWeight: 'var(--fw-bold)',
                background: 'var(--gradient-gold)', color: '#fff', lineHeight: 1,
              }}>
                <Flame size={8} fill="white" /> Populer
              </span>
            )}
            {isIntl && (
              <span className="flex items-center gap-0.5 text-white" style={{
                padding: '3px 8px', borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-9)', fontWeight: 'var(--fw-bold)',
                background: 'rgba(26,82,118,0.85)', lineHeight: 1,
              }}>
                <Globe size={8} /> INTL
              </span>
            )}
          </div>

          {/* Top-right: platform badge */}
          <div className="absolute" style={{ top: 10, right: 10, transform: 'translateZ(30px)' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
              borderRadius: 'var(--radius-full)', fontSize: 'var(--text-9)',
              fontWeight: 'var(--fw-bold)', lineHeight: 1, color: '#fff',
              background: cheapestPlatform.id === 'tiktok' ? '#1a1a1a' : cheapestPlatform.color,
              whiteSpace: 'nowrap',
            }}>
              {cheapestPlatform.shortName}
            </span>
          </div>

          {/* Hover overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-2 pt-8 pb-2"
            style={{
              background: 'linear-gradient(to top, rgba(26,22,19,0.75), rgba(26,22,19,0.3), transparent)',
              opacity: hovered ? 1 : 0, transition: 'opacity var(--transition-base)',
            }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 'var(--text-10)', fontWeight: 'var(--fw-bold)', color: '#E8A820' }}>
                CB {cashbackPct}% · {formatRupiah(cashbackAmount, true)}
              </span>
              <span style={{ fontSize: 'var(--text-10)', color: 'rgba(255,255,255,0.75)' }}>
                {sortedListings.length} platform
              </span>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{
          padding: compact ? '10px' : '12px',
          display: 'flex', flexDirection: 'column', gap: 8, flex: 1,
          transform: 'translateZ(24px)',
        }}>
          {/* Title */}
          <h3 style={{
            margin: 0,
            fontFamily: 'var(--font-sans)',
            fontSize: compact ? 'var(--text-xs)' : 'var(--text-sm)',
            fontWeight: 'var(--fw-medium)',
            lineHeight: 'var(--leading-snug)',
            color: 'var(--text-primary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
            minHeight: '2.6em',
          }}>{product.name}</h3>

          {/* Rating — hidden until real data is available */}
          {/* <div className="flex items-center gap-1">
            <Star size={11} fill="#D4920A" style={{ color: 'var(--brand)', flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              {product.averageRating.toFixed(1)}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              ({(product.totalReviews / 1000).toFixed(1)}rb)
            </span>
            {!compact && domesticListings.length > 0 && intlListings.length > 0 && (
              <span className="ml-auto flex items-center gap-0.5"
                style={{ fontSize: 'var(--text-9)', color: 'var(--info)', fontWeight: 'var(--fw-semibold)', opacity: 0.8 }}>
                <Globe size={8} />+{intlListings.length}
              </span>
            )}
          </div> */}
          {!compact && domesticListings.length > 0 && intlListings.length > 0 && (
            <div className="flex items-center gap-0.5"
              style={{ fontSize: 'var(--text-9)', color: 'var(--info)', fontWeight: 'var(--fw-semibold)', opacity: 0.8 }}>
              <Globe size={8} />+{intlListings.length} intl
            </div>
          )}

          {/* Price */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: compact ? 'var(--text-base)' : 'var(--text-xl)',
                  fontWeight: 'var(--fw-extrabold)',
                  letterSpacing: 'var(--tracking-tight)',
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}>{formatRupiah(cheapest.price, true)}</span>
                {cheapest.originalPrice && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    {formatRupiah(cheapest.originalPrice, true)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown size={11} style={{ color: 'var(--win)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  di {cheapestPlatform.shortName}
                </span>
              </div>
            </div>

            {/* Savings pill */}
            {savings > 0 && (
              <span className="inline-flex items-center gap-1" style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-11)',
                fontWeight: 'var(--fw-bold)',
                color: 'var(--win)',
                background: 'var(--win-soft-bg)',
                border: '1px solid var(--win-soft-border)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                alignSelf: 'flex-start',
              }}>↓ Hemat {formatRupiah(savings, true)}</span>
            )}
          </div>

          {/* Price range bar */}
          {!compact && rangePercent > 3 && (
            <div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--cream-200)' }}>
                <div className="h-full rounded-full" style={{
                  background: 'var(--gradient-win)',
                  width: `${Math.max(10, 100 - rangePercent)}%`,
                }} />
              </div>
              <div className="flex justify-between mt-0.5">
                <span style={{ fontSize: 'var(--text-9)', color: 'var(--win)' }}>{formatRupiah(cheapest.price, true)}</span>
                <span style={{ fontSize: 'var(--text-9)', color: 'var(--text-muted)' }}>{formatRupiah(mostExpensive.price, true)}</span>
              </div>
            </div>
          )}

          {/* Cashback badge */}
          {!compact && cashbackPct > 0 && (
            <span className="inline-flex items-center gap-1" style={{
              fontSize: 'var(--text-10)', fontWeight: 'var(--fw-semibold)',
              padding: '3px 9px', borderRadius: 'var(--radius-full)',
              color: 'var(--brand)', background: 'var(--brand-soft-bg)',
              border: '1px solid var(--brand-soft-border)',
              alignSelf: 'flex-start',
            }}>
              CB {cashbackPct}% · {formatRupiah(cashbackAmount, true)}
            </span>
          )}

          {/* Platform dots */}
          <div className="flex items-center gap-1">
            {displayListings.map(l => {
              const p = PLATFORMS[l.platformId] ?? PLATFORMS['tokopedia']
              const isIntlDot = INTL_PLATFORMS.has(l.platformId)
              return (
                <div key={l.platformId}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm transition-transform ${hovered ? 'scale-110' : ''} ${isIntlDot ? 'ring-1 ring-blue-400/50' : ''}`}
                  style={{
                    background: l.platformId === 'tiktok' ? '#1a1a1a' : p.color,
                    fontSize: 9, fontWeight: 800,
                  }}
                  title={`${p.name}: ${formatRupiah(l.price)}`}>
                  {p.shortName.slice(0, 2)}
                </div>
              )
            })}
            {sortedListings.length > (compact ? 4 : 6) && (
              <span style={{ fontSize: 'var(--text-10)', color: 'var(--text-muted)', fontWeight: 'var(--fw-medium)' }}>
                +{sortedListings.length - (compact ? 4 : 6)}
              </span>
            )}
          </div>

          {/* CTA */}
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.open(cheapest.affiliateUrl, '_blank', 'noopener,noreferrer')
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-opacity hover:opacity-90"
              style={{
                background: 'var(--gradient-gold)', color: '#FFFFFF',
                boxShadow: 'var(--shadow-button)', border: 'none', cursor: 'pointer',
                fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-extrabold)',
              }}>
              <ShoppingCart size={12} />
              Beli Sekarang
            </button>
            <button
              className="flex items-center justify-center rounded-lg transition-all"
              style={{
                width: 32, height: 32, border: '1px solid var(--border-subtle)',
                background: 'transparent', cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--brand-soft-border)'
                e.currentTarget.style.background = 'var(--brand-soft-bg)'
                e.currentTarget.style.color = 'var(--brand)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)'
                e.currentTarget.style.background = 'transparent