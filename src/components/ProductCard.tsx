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

  // Guard: product with no listings
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
  const cheapestPlatform = PLATFORMS[cheapest.platformId]
  const cashbackPct = cheapestPlatform.cashbackPct
  const cashbackAmount = Math.round(cheapest.price * cashbackPct / 100)

  return (
    <Link href={"/produk/" + product.id}
      className="group block bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden hover:border-amber-500/35 hover:shadow-[0_4px_20px_rgba(245,158,11,0.10)] transition-all duration-200">

      <div className="relative aspect-square bg-[var(--bg-hover)] overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div className="absolute top-2 left-2">
          <span className="platform-badge text-white text-[10px] font-bold shadow-sm"
                style={{ background: cheapestPlatform.color }}>
            TERMURAH
          </span>
        </div>
        {diff > 5 && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
            Hemat {diff}%
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-amber-900/30 to-transparent px-2 pt-6 pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-[10px] font-bold text-amber-200">
            Cashback {cashbackPct}% = {formatRupiah(cashbackAmount, true)}
          </span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 mb-2 group-hover:text-white transition-colors leading-snug">
          {product.name}
        </h3>

        <div className="flex items-center gap-1 mb-2.5">
          <Star size={11} fill="#f59e0b" className="text-amber-400" />
          <span className="text-xs text-[var(--text-secondary)]">{product.averageRating.toFixed(1)}</span>
          <span className="text-xs text-[var(--text-muted)]">({(product.totalReviews / 1000).toFixed(1)}rb)</span>
          <span className="ml-auto text-[10px] text-[var(--text-muted)]">{sortedListings.length} platform</span>
        </div>

        <div className="mb-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white">{formatRupiah(cheapest.price, true)}</span>
            {cheapest.originalPrice && (
              <span className="text-xs text-[var(--text-muted)] line-through">{formatRupiah(cheapest.originalPrice, true)}</span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <TrendingDown size={11} className="text-green-400" />
            <span className="text-xs text-[var(--text-muted)]">di {cheapestPlatform.name}</span>
            {diff > 0 && (
              <span className="text-xs text-green-400 ml-auto font-medium">
                s/d {formatRupiah(mostExpensive.price - cheapest.price, true)} lebih murah
              </span>
            )}
          </div>
        </div>

        <div className="mb-2.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            CB {cashbackPct}%
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          {sortedListings.slice(0, 5).map(l => {
            const p = PLATFORMS[l.platformId]
            return (
              <div key={l.platformId}
                className="w-5 h-5 rounded-full border-2 border-[var(--border-subtle)] flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                style={{ background: p.color }}
                title={p.name + ": " + formatRupiah(l.price)}>
                {p.shortName[0]}
              </div>
            )
          })}
          {sortedListings.length > 5 && (
            <span className="text-[10px] text-[var(--text-muted)]">+{sortedListings.length - 5}</span>
          )}
        </div>

        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors shadow