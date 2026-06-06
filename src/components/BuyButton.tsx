'use client'

/**
 * BuyButton — Tombol "Beli di Harga.com" yang membuka CheckoutModal.
 *
 * Menggantikan / melengkapi tombol redirect langsung ke platform.
 *
 * Usage:
 *   <BuyButton
 *     productId="xxx"
 *     productName="iPhone 15"
 *     productImage="/img.jpg"
 *     listings={product.listings}
 *     referralCode={userReferralCode}  // optional
 *   />
 */

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { CheckoutModal } from '@/components/CheckoutModal'
import type { PriceListing } from '@/lib/types'
import { PLATFORMS } from '@/lib/platforms'

interface BuyButtonProps {
  productId:     string
  productName:   string
  productImage:  string
  listings:      PriceListing[]
  referralCode?: string
  /** Style variant */
  variant?:      'primary' | 'outline' | 'compact'
  className?:    string
}

export function BuyButton({
  productId,
  productName,
  productImage,
  listings,
  referralCode,
  variant = 'primary',
  className = '',
}: BuyButtonProps) {
  const [open, setOpen] = useState(false)

  // Cheapest listing untuk label harga di button
  const cheapest   = [...listings].sort((a, b) => a.price - b.price)[0]
  const platform   = cheapest ? PLATFORMS[cheapest.platformId] : null
  const bgColor    = cheapest?.platformId === 'tiktok'
    ? '#1a1a1a'
    : (platform?.color ?? '#6366f1')

  const buttonContent = (
    <>
      <ShoppingCart size={variant === 'compact' ? 12 : 15} />
      {variant === 'compact' ? 'Beli' : 'Beli di Harga.com'}
    </>
  )

  const variantClass = {
    primary: 'py-3 text-sm font-bold text-white rounded-xl transition-opacity hover:opacity-90 active:scale-95',
    outline: 'py-2.5 text-sm font-semibold text-white border rounded-xl transition-colors hover:opacity-90',
    compact: 'py-2 text-xs font-semibold text-white rounded-lg transition-opacity hover:opacity-90',
  }[variant]

  const variantStyle = variant === 'outline'
    ? { borderColor: bgColor + '99', color: 'white', background: bgColor + '22' }
    : { background: bgColor }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center justify-center gap-2 ${variantClass} ${className}`}
        style={variantStyle}
      >
        {buttonContent}
      </button>

      <CheckoutModal
        isOpen={open}
        onClose={() => setOpen(false)}
        productId={productId}
        productName={productName}
        productImage={productImage}
        listings={listings}
        referralCode={referralCode}
      />
    </>
  )
}
