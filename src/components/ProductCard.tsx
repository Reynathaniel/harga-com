'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { TrendingDown } from 'lucide-react'
import { PlatformBadge } from '@/components/PlatformBadge'
import type { Product } from '@/lib/types'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah, lowestListingFirst, priceDiffPercent, cleanProductName } from '@/lib/utils'
import { getCategoryConfig } from '@/lib/config/category-config'

const PROPERTY_CATEGORIES = ['Properti', 'Rumah Bekas', 'Tanah Bekas']
const VEHICLE_CATEGORIES = ['Motor Bekas', 'Mobil Bekas']
const INT32_MAX = 2147483647

interface Props {
  product: Product
  compact?: boolean
  tilt?: boolean // kept for API compat, unused
}

export function ProductCard({ product, compact = false }: Props) {
  const [imgFailed, setImgFailed] = useState(false)

  const sorted = lowestListingFirst(product.listings)
  const catConfig = getCategoryConfig(product.category)
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

  const isNego = cheapest.price === INT32_MAX
  const mostExpensive = sorted[sorted.length - 1]
  const savings = isNego ? 0 : mostExpensive.price - cheapest.price
  const savingsPct = isNego ? 0 : priceDiffPercent(cheapest.price, mostExpensive.price)
  const platform = PLATFORMS[cheapest.platformId]
  const cashbackPct = platform?.cashbackPct ?? 0
  const isUsed = cheapest.condition === 'used'

  // Property / vehicle logic
  const isProperty = PROPERTY_CATEGORIES.includes(product.category)
  const isVehicle = VEHICLE_CATEGORIES.includes(product.category)
  const specs = product.specifications as Record<string, string> | undefined
  const vehicleCity = isVehicle ? (specs?.['city'] || '') : ''
  // Read specs — support both new (snake_case) and old (Indonesian label) formats
  const landAreaStr = specs?.['land_area_m2'] || specs?.['Luas Tanah']?.replace(/[^0-9.]/g, '') || ''
  const buildingAreaStr = specs?.['building_area_m2'] || specs?.['Luas Bangunan']?.replace(/[^0-9.]/g, '') || ''
  const bedrooms = specs?.['bedrooms'] || specs?.['Kamar Tidur'] || ''
  const bathrooms = specs?.['bathrooms'] || specs?.['Kamar Mandi'] || ''
  const city = specs?.['city_detail'] || specs?.['city'] || specs?.['Lokasi'] || ''
  const certificate = specs?.['certificate'] || specs?.['Sertifikat'] || ''
  const floors = specs?.['floors'] || specs?.['Jumlah Lantai'] || ''
  const isRumah = product.category === 'Rumah Bekas'
  const isTanah = product.category === 'Tanah Bekas'

  // Calculate price per m² from actual price (not stored spec)
  const landArea = landAreaStr ? parseFloat(landAreaStr) : null
  const buildingArea = buildingAreaStr ? parseFloat(buildingAreaStr) : null
  let pricePerM2: number | null = null
  if (!isNego && isProperty) {
    if (isTanah && landArea) {
      pricePerM2 = cheapest.price / landArea
    } else if (isRumah) {
      if (buildingArea) pricePerM2 = cheapest.price / buildingArea
      else if (landArea) pricePerM2 = cheapest.price / landArea
    }
  }

  const rawImg = product.images?.[0]
  const isValidImg = (
    !imgFailed &&
    !!rawImg &&
    rawImg.startsWith('http') &&
    !rawImg.includes('placehold.co') &&
    !rawImg.includes('placeholder') &&
    !rawImg.includes('picsum.photos')
  )
  const imgSrc = isValidImg ? rawImg : catConfig.placeholderUrl

  return (
    <Link href={`/produk/${product.slug || product.id}`} className="block group">
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
            className={`transition-transform duration-300 group-hover:scale-[1.04] ${isProperty ? 'object-cover' : 'object-contain p-3'}`}
            onError={() => setImgFailed(true)}
            sizes="(max-width:640px)50vw,(max-width:1024px)33vw,20vw"
            unoptimized
          />

          {/* Discount badge */}
          {savingsPct >= 5 && !isProperty && (
            <span
              className="absolute top-2 left-2 text-[9px] font-extrabold text-white px-1.5 py-[3px] rounded-lg leading-none"
              style={{ background: 'var(--win)' }}
            >
              -{savingsPct}%
            </span>
          )}

          {/* Property category badge */}
          {isProperty && (
            <span
              className="absolute top-2 left-2 text-[9px] font-bold text-white px-1.5 py-[3px] rounded-lg leading-none"
              style={{ background: isRumah ? '#7c3aed' : '#059669' }}
            >
              {product.category}
            </span>
          )}

          {/* Bekas badge — hidden for property */}
          {isUsed && !isProperty && (
            <span className="absolute top-2 right-2 text-[9px] font-bold bg-orange-400 text-white px-1.5 py-[3px] rounded-lg leading-none">
              BEKAS
            </span>
          )}

          {/* Location overlay for property */}
          {isProperty && city && (
            <span className="absolute bottom-2 left-2 text-[9px] font-medium bg-black/60 text-white px-1.5 py-[3px] rounded-md leading-none backdrop-blur-sm">
              📍 {city}
            </span>
          )}

          {/* Multi-store pill */}
          {sorted.length > 1 && !isProperty && (
            <span className="absolute bottom-2 right-2 text-[9px] font-medium bg-[var(--bg-card)]/90 text-[var(--text-muted)] border border-[var(--border-subtle)] px-1.5 py-[3px] rounded-md backdrop-blur-sm">
              {sorted.length} toko
            </span>
          )}
        </div>

        {/* ── Body ── */}
        <div className="p-3">
          {/* Property: specs row before title */}
          {isProperty && (landAreaStr || buildingAreaStr || bedrooms || floors) && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1.5">
              {isRumah && buildingAreaStr && (
                <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
                  LB {buildingAreaStr}
                </span>
              )}
              {landAreaStr && (
                <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
                  LT {landAreaStr}
                </span>
              )}
              {bedrooms && (
                <span className="text-[10px] text-[var(--text-muted)]">🛏 {bedrooms} KT</span>
              )}
              {bathrooms && (
                <span className="text-[10px] text-[var(--text-muted)]">🚿 {bathrooms} KM</span>
              )}
              {floors && isRumah && (
                <span className="text-[10px] text-[var(--text-muted)]">{floors} Lantai</span>
              )}
            </div>
          )}

          {product.brand && !isProperty && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] truncate mb-0.5">
              {product.brand}
            </p>
          )}
          <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug line-clamp-2 min-h-[2.5em] mb-2">
            {cleanProductName(product.name)}
          </p>

          {/* Vehicle city display */}
          {isVehicle && vehicleCity && (
            <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-0.5 -mt-1.5 mb-1.5 truncate">
              <span>📍</span> {vehicleCity}
            </p>
          )}

          {/* Price — shows "Harga Nego" for INT32_MAX */}
          <div className="flex items-baseline gap-1.5 mb-1.5">
            {isNego ? (
              <span className="text-base font-bold text-orange-500">
                Harga Nego
              </span>
            ) : (
              <>
                <span className="text-base font-bold" style={{ color: 'var(--brand)' }}>
                  {formatRupiah(cheapest.price, true)}
                </span>
                {!!cheapest.originalPrice && !!cheapest.discount && cheapest.discount > 0 && !isProperty && (
                  <span className="text-[11px] text-[var(--text-muted)] line-through">
                    {formatRupiah(cheapest.originalPrice, true)}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Price per m² — calculated from price ÷ area */}
          {isProperty && pricePerM2 && pricePerM2 > 0 && (
            <div
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-[3px] rounded mb-2"
              style={{
                color: '#7c3aed',
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.15)',
              }}
            >
              {formatRupiah(pricePerM2, true)}<span className="font-normal opacity-70">/m²</span>
            </div>
          )}

          {/* Certificate badge */}
          {isProperty && certificate && (
            <div className="flex flex-wrap gap-1 mb-2">
              <span
                className="inline-flex items-center text-[9px] font-bold px-1.5 py-[3px] rounded"
                style={{
                  color: '#059669',
                  background: 'rgba(5,150,105,0.08)',
                  border: '1px solid rgba(5,150,105,0.2)',
                }}
              >
                📜 {certificate}
              </span>
            </div>
          )}

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

          {/* Savings footer — non-property only */}
          {savings > 0 && !compact && !isProperty && (
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
