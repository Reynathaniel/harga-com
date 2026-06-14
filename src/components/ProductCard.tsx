import Link from 'next/link'
import { Star, TrendingDown, ShoppingCart, Bell, Globe } from 'lucide-react'
import type { Product } from '@/lib/types'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah, priceDiffPercent, lowestListingFirst } from '@/lib/utils'
import MediaEmbed from './MediaEmbed'

interface ProductCardProps {
  product: Product
  compact?: boolean
}

const INTL_PLATFORMS = new Set(['amazon', 'alibaba', 'aliexpress', 'jd'])

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const sortedListings = lowestListingFirst(product.listings)
  const cheapest = sortedListings[0]

  if (!cheapest) {
    return (
      <div className="block bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden opacity-40">
        <div className="relative aspect-square bg-[var(--bg-hover)]" />
        <div className="p-3"><p className="text-xs text-[var(--text-muted)]">{product.name}</p></div>
      </div>
    )
  }

  const mostExpensive = sortedListings[sortedListings.length - 1]
  const diff = priceDiffPercent(cheapest.price, mostExpensive.price)
  const cheapestPlatform = PLATFORMS[cheapest.platformId] ?? PLATFORMS['tokopedia']
  const cashbackPct = cheapestPlatform.cashbackPct
  const cashbackAmount = Math.round(cheapest.price * cashbackPct / 100)
  const isIntl = INTL_PLATFORMS.has(cheapest.platformId)
  const domesticListings = sortedListings.filter(l => !INTL_PLATFORMS.has(l.platformId))
  const intlListings = sortedListings.filter(l => INTL_PLATFORMS.has(l.platformId))
  const displayListings = compact ? sortedListings.slice(0, 4) : sortedListings.slice(0, 6)

  // Price range bar: cheapest=0%, mostExpensive=100%
  const priceRange = mostExpensive.price - cheapest.price
  const rangePercent = priceRange > 0 ? Math.min(100, Math.round((priceRange / cheapest.price) * 100)) : 0

  return (
    <Link href={"/produk/" + product.id}
      className="group block bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden hover:border-amber-500/40 hover:shadow-[0_6px_28px_rgba(245,158,11,0.12)] transition-all duration-200">

      {/* Image / Video */}
      <div className="relative aspect-square bg-[var(--bg-hover)] overflow-hidden">
        <MediaEmbed
          imageUrl={product.images[0]}
          videoUrl={cheapest.videoUrl}
          videoThumb={cheapest.videoThumb}
          title={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="platform-badge text-white text-[10px] font-bold shadow-sm"
                style={{ background: cheapestPlatform.color }}>
            TERMURAH
          </span>
          {isIntl && (
            <span className="flex items-center gap-0.5 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
              <Globe size={8} />
              INTL
            </span>
          )}
          {cheapest.condition === 'used' && (
            <span className="bg-orange-100 text-orange-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-orange-200 shadow-sm">
              BEKAS
            </span>
          )}
        </div>

        {diff > 5 && (
          <div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
            Hemat {diff}%
          </div>
        )}

        {/* Hover overlay — cashback + platform count */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pt-8 pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-300">
              CB {cashbackPct}% · {formatRupiah(cashbackAmount, true)}
            </span>
            <span className="text-[10px] text-white/70">
              {sortedListings.length} platform
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={compact ? 'p-2.5' : 'p-3'}>
        <h3 className={`font-medium text-[var(--text-primary)] line-clamp-2 mb-2 group-hover:text-white transition-colors leading-snug ${compact ? 'text-xs' : 'text-sm'}`}>
          {product.name}
        </h3>

        {/* Rating row */}
        <div className="flex items-center gap-1 mb-2">
          <Star size={11} fill="#f59e0b" className="text-amber-400" />
          <span className="text-xs text-[var(--text-secondary)]">{product.averageRating.toFixed(1)}</span>
          <span className="text-xs text-[var(--text-muted)]">({(product.totalReviews / 1000).toFixed(1)}rb)</span>
          {!compact && domesticListings.length > 0 && intlListings.length > 0 && (
            <span className="ml-auto flex items-center gap-0.5 text-[9px] text-blue-400/80 font-medium">
              <Globe size={8} />
              +{intlListings.length} intl
            </span>
          )}
        </div>

        {/* Price */}
        <div className="mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className={`font-bold text-white ${compact ? 'text-base' : 'text-lg'}`}>
              {formatRupiah(cheapest.price, true)}
            </span>
            {cheapest.originalPrice && (
              <span className="text-xs text-[var(--text-muted)] line-through">
                {formatRupiah(cheapest.originalPrice, true)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <TrendingDown size={11} className="text-green-400" />
            <span className="text-xs text-[var(--text-muted)]">di {cheapestPlatform.shortName}</span>
            {diff > 0 && (
              <span className="text-xs text-green-400 ml-auto font-medium">
                s/d {diff}% lebih hemat
              </span>
            )}
          </div>
        </div>

        {/* Price range bar */}
        {!compact && rangePercent > 3 && (
          <div className="mb-2.5">
            <div className="h-1 bg-[var(--bg-hover)] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-amber-500 rounded-full"
                style={{ width: `${Math.max(10, 100 - rangePercent)}%` }} />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[9px] text-green-400">{formatRupiah(cheapest.price, true)}</span>
              <span className="text-[9px] text-[var(--text-muted)]">{formatRupiah(mostExpensive.price, true)}</span>
            </div>
          </div>
        )}

        {/* Cashback badge */}
        {!compact && (
          <div className="mb-2.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              CB {cashbackPct}% · {formatRupiah(cashbackAmount, true)}
            </span>
          </div>
        )}

        {/* Platform dots */}
        <div className="flex items-center gap-1 mb-3">
          {displayListings.map(l => {
            const p = PLATFORMS[l.platformId] ?? PLATFORMS['tokopedia']
            const isIntlDot = INTL_PLATFORMS.has(l.platformId)
            return (
              <div key={l.platformId}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm transition-transform group-hover:scale-110 ${isIntlDot ? 'ring-1 ring-blue-400/50' : ''}`}
                style={{ background: p.color }}
                title={`${p.name}: ${formatRupiah(l.price)}`}>
                {p.shortName[0]}
              </div>
            )
          })}
          {sortedListings.length > (compact ? 4 : 6) && (
            <span className="text-[10px] text-[var(--text-muted)] font-medium">
              +{sortedListings.length - (compact ? 4 : 6)}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors shadow-sm shadow-amber-500/20">
            <ShoppingCart size={12} />
            Beli Sekarang
          </button>
          <button className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--border-subtle)] hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-400 text-[var(--text-muted)] transition-all">
            <Bell size={13} />
          </button>
        </div>
      </div>
    </Link>
  )
}
