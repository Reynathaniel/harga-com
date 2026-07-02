'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { TrendingDown } from 'lucide-react'
import { PlatformBadge } from '@/components/PlatformBadge'
import type { Product } from '@/lib/types'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah, lowestListingFirst, priceDiffPercent, cleanProductName } from '@/lib/utils'

interface Props {
  product: Product
  compact?: boolean
  tilt?: boolean // kept for API compat, unused
}

export function ProductCard({ product, compact = false }: Props) {
  const [imgFailed, setImgFailed] = useState(false)

  const sorted = lowestListingFirst(product.listings)
  const cheapest = sorted[0]

  if (!cheapest) {
    return (
      <div className="rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-card)] opacity-30">
        <div className="aspect-[4/3] bg-[var(--bg-hover)]" />
        <div className="p-3 space-y-2">
          <div className="h-2.5 bg-[var(--bg-hover)] rounded w-3/4" />
          <div className="h-2 bg-[var(--bg-hover)] rounded w-1/2" />
        </div>
      </div>
    )
  }

  const mostExpensive = sorted[sorted.length - 1]
  const savings = mostExpensive.price - cheapest.price
  const savingsPct = priceDiffPercent(cheapest.price, mostExpensive.price)
  const platform = PLATFORMS[cheapest.platformId]
  const cashbackPct = platform?.cashbackPct ?? 0
  const isUsed = cheapest.condition === 'used'

  const rawImg = product.images?.[0]
  const isValidImg = (
    !imgFailed &&
    !!rawImg &&
    rawImg.startsWith('http') &&
    !rawImg.includes('placehold.co') &&
    !rawImg.includes('placeholder') &&
    !rawImg.includes('picsum.photos')
  )
  const imgSrc = isValidImg ? rawImg : '/placeholder-product.png'

  const platformBg = platform?.id === 'tiktok' ? '#1a1a1a' : (platform?.color ?? '#9c9589')

  return (
    <Link href={`/produk/${product.id}`} className="block group">
      <article
        className="rounded-2xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-subtle)] transition-all duration-200 group-hover:border-[var(--brand)]/30 group-hover:shadow-[0_6px_24px_rgba(249,115,22,0.09)] group-hover:-translate-y-0.5"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        {/* ── Image ── */}
        <div className="relative aspect-[4/3] bg-[var(--bg-hover)] overflow-hidden">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]"
            onError={() => setImgFailed(true)}
            sizes="(max-width:640px)50vw,(max-width:1024px)33vw,20vw"
            unoptimized
          />

          {/* Discount badge */}
          {savingsPct >= 5 && (
            <span
              className="absolute top-2 left-2 text-[9px] font-extrabold text-white px-1.5 py-[3px] rounded-lg leading-none"
              style={{ background: 'var(--win)' }}
            >
              -{savingsPct}%
            </span>
          )}

          {/* Bekas badge */}
          {isUsed && (
            <span className="absolute top-2 right-2 text-[9px] font-bold bg-orange-400 text-white px-1.5 py-[3px] rounded-lg leading-none">
              BEKAS
            </span>
          )}

          {/* Multi-store pill */}
          {sorted.length > 1 && (
            <span className="absolute bottom-2 right-2 text-[9px] font-medium bg-[var(--bg-card)]/90 text-[var(--text-muted)] border border-[var(--border-subtle)] px-1.5 py-[3px] rounded-md backdrop-blur-sm">
              {sorted.length} toko
            </span>
          )}
        </div>

        {/* ── Body ── */}
        <div className="p-3">
          {product.brand && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate mb-0.5">
              {product.brand}
            </p>
          )}
          <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug line-clamp-2 min-h-[2.5em] mb-2">
            {cleanProductName(product.name)}
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 mb-2.5">
            <span className="text-base font-bold" style={{ color: 'var(--brand)' }}>
              {formatRupiah(cheapest.price, true)}
            </span>
            {cheapest.originalPrice && cheapest.discount && cheapest.discount > 0 && (
              <span className="text-[11px] text-[var(--text-muted)] line-through">
                {formatRupiah(cheapest.originalPrice, true)}
              </span>
            )}
          </div>

          {/* Platform row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <PlatformBadge platformId={cheapest.platformId} size="sm" variant="dot" showName={false} />
              <span className="text-[11px] text-[var(--text-secondary)] truncate">
                {platform?.name ?? cheapest.platformId}
              </span>
            </div>
            {cashbackPct > 0 && (
              <span
                className="text-[9px] font-bold px-1.5 py-[3px] rounded border shrink-0"
                style={{
                  color: '#D97706',
                  background: 'rgba(217,119,6,0.08)',
                  borderColor: 'rgba(217,119,6,0.18)',
                }}
              >
                CB {cashbackPct}%
              </span>
            )}
          </div>

          {/* Savings footer */}
          {savings > 0 && !compact && (
            <div
              className="mt-2 pt-2 flex items-center gap-1"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              <TrendingDown size={10} className="shrink-0" style={{ color: 'var(--win)' }} />
              <span className="text-[10px] font-medium" style={{ color: 'var(--win)' }}>
                Hemat {formatRupiah(savings, true)} vs termahal
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
