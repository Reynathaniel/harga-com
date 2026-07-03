'use client'

import type { CSSProperties } from 'react'

/**
 * ProductLink — wraps an outbound product URL and fires click tracking
 * before the user navigates to the merchant.
 *
 * Uses `keepalive: true` so the fetch survives page unload.
 * Fire-and-forget: never blocks navigation.
 *
 * Usage:
 *   <ProductLink productId={id} offerId={offerId} url={affiliateUrl ?? url} platform="shopee">
 *     <button>Beli di Shopee</button>
 *   </ProductLink>
 */

interface ProductLinkProps {
  productId: string
  offerId?:  string
  url:       string
  platform:  string
  children:  React.ReactNode
  className?: string
  style?:    CSSProperties
}

export default function ProductLink({
  productId,
  offerId,
  url,
  platform,
  children,
  className,
  style,
}: ProductLinkProps) {
  const handleClick = () => {
    // Fire-and-forget — never await, never block navigation
    fetch('/api/track/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, offerId, platform }),
      keepalive: true, // survives page navigation
    }).catch(() => {})
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={handleClick}
    >
      {children}
    </a>
  )
}
