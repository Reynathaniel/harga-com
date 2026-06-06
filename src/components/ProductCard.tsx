import Link from 'next/link'
import Image from 'next/image'
import { Star, TrendingDown, ShoppingCart, Bell } from 'lucide-react'
import type { Product } from '@/lib/types'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah, priceDiffPercent, lowestListingFirst } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  compact?: boolean
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const sortedListings = lowestListingFirst(product.listings)
  const cheapest = sortedListings[0]
  const mostExpensive = sortedListings[sortedListings.length - 1]
  const diff = priceDiffPercent(cheapest.price, mostExpensive.price)
  const cheapestPlatform = PLATFORMS[cheapest.platformId]
  const cashbackPct = cheapestPlatform.cashbackPct
  const cashbackAmount = Math.round(cheapest.price * cashbackPct / 100)

  return (
    <Link href={`/produk/${product.id}`}
      className="group block bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-indigo-500/40 hover:shadow-[0_4px_24px_rgba(99,102,241,0.1)] transition-all duration-200">

      {/* Image */}
      <div className="relative aspect-square bg-[#0d0d1a] overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, 25vw"
        />

        {/* Cheapest platform badge */}
        <div className="absolute top-2 left-2">
          <span className="platform-badge text-white text-[10px] font-bold"
                style={{ background: cheapestPlatform.color }}>
            TERMURAH
          </span>
        </div>

        {/* Savings badge */}
        {diff > 5 && (
          <div className="absolute top-2 right-2 bg-green-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            Hemat {diff}%
          </div>
        )}

        {/* Cashback badge - bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-500/80 to-transparent px-2 pt-4 pb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-[10px] font-bold text-white">
            💰 Cashback {cashbackPct}% = {formatRupiah(cashbackAmount, true)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 mb-2 group-hover:text-white transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <Star size={11} fill="#f59e0b" className="text-amber-400" />
          <span className="text-xs text-[var(--text-secondary)]">
            {product.averageRating.toFixed(1)}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            ({(product.totalReviews / 1000).toFixed(1)}rb)
          </span>
          <span className="ml-auto text-[10px] text-[var(--text-muted)]">
            {sortedListings.length} platform
          </span>
        </div>

        {/* Price range */}
        <div className="mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white">
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
            <span className="text-xs text-[var(--text-muted)]">
              di {cheapestPlatform.name}
            </span>
            {diff > 0 && (
              <span className="text-xs text-green-400 ml-auto">
                s/d {formatRupiah(mostExpensive.price - cheapest.price, true)} lebih murah
              </span>
            )}
          </div>
        </div>

        {/* Cashback pill */}
        <div className="flex items-center gap-1 mb-3 cashback-pulse inline-flex">
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            💰 CB {cashbackPct}%
          </span>
        </div>

        {/* Platform dots */}
        <div className="flex items-center gap-1.5 mb-3">
          {sortedListings.slice(0, 5).map(l => {
            const p = PLATFORMS[l.platformId]
            return (
              <div key={l.platformId}
                className="w-5 h-5 rounded-full border-2 border-[var(--border)] flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: p.color }}
                title={`${p.name}: ${formatRupiah(l.price)}`}>
                {p.shortName[0]}
              </div>
            )
          })}
          {sortedListings.length > 5 && (
            <span className="text-[10px] text-[var(--text-muted)]">
              +{sortedListings.length - 5}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
            <ShoppingCart size={12} />
            Beli Termurah
          </button>
          <button className="p-2 text-[var(--text-muted)] hover:text-amber-400 bg-[var(--bg-hover)] hover:bg-amber-500/10 rounded-lg transition-colors">
            <Bell size={14} />
          </button>
        </div>
      </div>
    </Link>
  )
}
