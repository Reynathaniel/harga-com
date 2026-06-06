'use client'
import Link from 'next/link'
import { TrendingDown, Flame } from 'lucide-react'
import { MOCK_PRODUCTS } from '@/lib/mock-data'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah, lowestListingFirst, priceDiffPercent } from '@/lib/utils'
import Image from 'next/image'

export function LiveBar() {
  // Build hot-deal items from mock products: cheapest listing per product
  const dealItems = MOCK_PRODUCTS.map(product => {
    const sorted = lowestListingFirst(product.listings)
    const cheapest = sorted[0]
    const mostExpensive = sorted[sorted.length - 1]
    const savings = priceDiffPercent(cheapest.price, mostExpensive.price)
    const platform = PLATFORMS[cheapest.platformId]
    return { product, cheapest, savings, platform }
  })

  // Duplicate for seamless loop
  const items = [...dealItems, ...dealItems]

  return (
    <section className="py-8 overflow-hidden relative border-y border-[var(--border)]"
             style={{ background: 'linear-gradient(to right, rgba(99,102,241,0.03), rgba(245,158,11,0.03))' }}>
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[var(--bg-primary)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[var(--bg-primary)] to-transparent z-10 pointer-events-none" />

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 mb-4">
        <Flame size={16} className="text-amber-400" />
        <span className="text-sm font-bold text-white">Deal Terpanas Hari Ini</span>
        <span className="text-xs text-[var(--text-muted)]">— harga termurah dari semua platform</span>
      </div>

      {/* Scrolling track */}
      <div className="flex" style={{ animation: 'ticker-scroll 60s linear infinite' }}>
        <div className="flex gap-4 px-4" style={{ width: 'max-content' }}>
          {items.map((item, i) => (
            <Link key={i} href={`/produk/${item.product.id}`}
              className="flex-shrink-0 w-52 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-indigo-500/40 transition-all group">

              {/* Product image */}
              <div className="relative h-32 bg-[#0d0d1a] overflow-hidden">
                <Image
                  src={item.product.images[0]}
                  alt={item.product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="208px"
                />
                {item.savings > 5 && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    -{item.savings}%
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2.5">
                <p className="text-xs text-[var(--text-secondary)] line-clamp-1 mb-1 group-hover:text-white transition-colors">
                  {item.product.name}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {formatRupiah(item.cheapest.price, true)}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <TrendingDown size={10} className="text-green-400" />
                      <span className="text-[10px] font-semibold text-white px-1.5 py-0.5 rounded"
                            style={{ background: item.platform.color + '30', color: item.platform.color }}>
                        {item.platform.shortName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
