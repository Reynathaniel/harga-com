'use client'
import { useState, useEffect } from 'react'
import { Bell, ShoppingCart } from 'lucide-react'
import { PriceAlertModal } from '@/components/PriceAlertModal'
import { BuyButton } from '@/components/BuyButton'
import { ShareButton } from '@/components/ShareButton'
import ProductLink from '@/components/ProductLink'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah } from '@/lib/utils'
import type { PriceListing } from '@/lib/types'

interface ProductActionsProps {
  productId: string
  productName: string
  productImage?: string
  currentPrice: number
  cheapestPlatformId: string
  affiliateUrl: string
  listings?: PriceListing[]
}

export function ProductActions({
  productId, productName, productImage = '',
  currentPrice, cheapestPlatformId, affiliateUrl, listings = [],
}: ProductActionsProps) {
  const [alertOpen, setAlertOpen] = useState(false)
  const [referralCode, setReferralCode] = useState<string | undefined>(undefined)
  const platform = PLATFORMS[cheapestPlatformId]

  useEffect(() => {
    const stored = localStorage.getItem('harga_referral_code')
    if (stored) setReferralCode(stored)
  }, [])

  const effectiveListings: PriceListing[] = listings.length > 0 ? listings : [{
    platformId:   cheapestPlatformId as PriceListing['platformId'],
    price:        currentPrice,
    affiliateUrl: affiliateUrl,
    url:          affiliateUrl,
    rating:       0,
    reviewCount:  0,
    sold:         0,
    stock:        0,
    shopName:     platform?.name ?? cheapestPlatformId,
    shopVerified: false,
    freeShipping: false,
    imageUrl:     productImage,
    updatedAt:    new Date(),
  }]

  return (
    <>
      <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white">Beli Sekarang</div>
          <span className="text-xs text-[var(--text-muted)]">Harga terbaik</span>
        </div>

        <div className="text-2xl font-black text-white">{formatRupiah(currentPrice)}</div>

        <BuyButton
          productId={productId}
          productName={productName}
          productImage={productImage}
          listings={effectiveListings}
          referralCode={referralCode}
          variant="primary"
          className="w-full"
        />

        <ProductLink
          productId={productId}
          url={affiliateUrl}
          platform={cheapestPlatformId}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white/70 border border-[var(--border-subtle)] hover:border-amber-500/30 hover:text-white rounded-xl transition-all"
        >
          <ShoppingCart size={14} />
          Langsung ke {platform?.name ?? 'Platform'}
        </ProductLink>

        <div className="flex gap-2">
          <button onClick={() => setAlertOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 rounded-xl transition-colors">
            <Bell size={15} />
            Pantau
          </button>
          <ShareButton
            productId={productId}
            productName={productName}
            referralCode={referralCode}
            variant="full"
            className="flex-1"
          />
        </div>

        <p className="text-[10px] text-center text-[var(--text-muted)]">
          Share link produk &#8594; dapat komisi jika ada yang beli
        </p>
      </div>

      <PriceAlertModal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
            productId={productId}
        productName={productName}
        currentPrice={currentPrice}
      />
    </>
  )
}
