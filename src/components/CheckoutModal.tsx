'use client'

/**
 * CheckoutModal — "Beli di Harga.com" experience.
 *
 * Menampilkan summary produk + pilihan platform, lalu redirect ke platform
 * tujuan dengan affiliate link (via /api/checkout/initiate).
 *
 * Props:
 *   isOpen, onClose, product info, listings, referralCode
 */

import { useState, useCallback } from 'react'
import Image from 'next/image'
import {
  X, ShoppingCart, Shield, Truck, Star,
  ExternalLink, ChevronRight, Loader2
} from 'lucide-react'
import type { PriceListing } from '@/lib/types'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah } from '@/lib/utils'

export interface CheckoutModalProps {
  isOpen:        boolean
  onClose:       () => void
  productId:     string
  productName:   string
  productImage:  string
  listings:      PriceListing[]
  referralCode?: string
}

export function CheckoutModal({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  listings,
  referralCode,
}: CheckoutModalProps) {
  const sorted = [...listings].sort((a, b) => a.price - b.price)
  const [selected,  setSelected ] = useState<PriceListing>(sorted[0])
  const [loading,   setLoading  ] = useState(false)
  const [error,     setError    ] = useState<string | null>(null)

  const handleBuy = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          platform:     selected.platformId,
          affiliateUrl: selected.affiliateUrl,
          referralCode: referralCode ?? null,
          sessionId:    typeof window !== 'undefined'
            ? (sessionStorage.getItem('session_id') ?? crypto.randomUUID())
            : undefined,
        }),
      })

      const json = await res.json()

      if (!json.success || !json.data?.checkoutUrl) {
        setError('Gagal memproses. Coba lagi.')
        return
      }

      // Store session id
      if (typeof window !== 'undefined') {
        const sid = sessionStorage.getItem('session_id') ?? crypto.randomUUID()
        sessionStorage.setItem('session_id', sid)
      }

      window.open(json.data.checkoutUrl, '_blank', 'noopener,noreferrer')
      onClose()
    } catch {
      setError('Koneksi gagal. Periksa internet kamu.')
    } finally {
      setLoading(false)
    }
  }, [selected, productId, referralCode, onClose])

  if (!isOpen) return null

  const platform = PLATFORMS[selected.platformId]
  const bgColor = selected.platformId === 'tiktok' ? '#1a1a1a' : (platform?.color ?? '#6366f1')
  const cashback = Math.round(selected.price * (platform?.cashbackPct ?? 0) / 100)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div className="w-full sm:max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-indigo-400" />
              <span className="text-sm font-bold text-white">Beli di Harga.com</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">

            {/* Product summary */}
            <div className="flex gap-3">
              <div className="w-16 h-16 relative bg-[var(--bg-primary)] rounded-xl overflow-hidden shrink-0">
                <Image src={productImage} alt={productName} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white line-clamp-2 mb-1">{productName}</div>
                <div className="text-xl font-bold text-white">{formatRupiah(selected.price)}</div>
                {selected.originalPrice && selected.discount && selected.discount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[var(--text-muted)] line-through">
                      {formatRupiah(selected.originalPrice)}
                    </span>
                    <span className="text-xs text-green-400 font-semibold">-{selected.discount}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Platform picker */}
            <div>
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                Pilih Platform ({sorted.length})
              </div>
              <div className="space-y-2">
                {sorted.map(listing => {
                  const p = PLATFORMS[listing.platformId]
                  if (!p) return null
                  const isSelected = listing.platformId === selected.platformId
                  const bg = listing.platformId === 'tiktok' ? '#1a1a1a' : p.color

                  return (
                    <button
                      key={listing.platformId}
                      onClick={() => setSelected(listing)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                        isSelected
                          ? 'border-indigo-500/50 bg-indigo-500/8'
                          : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-indigo-500/20'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ background: bg }}>
                        {p.shortName.slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{p.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {listing.freeShipping && (
                            <span className="text-[9px] text-blue-400 flex items-center gap-0.5">
                              <Truck size={9} /> Gratis ongkir
                            </span>
                          )}
                          {listing.shopVerified && (
                            <span className="text-[9px] text-green-400 flex items-center gap-0.5">
                              <Shield size={9} /> Official
                            </span>
                          )}
                          {listing.rating > 0 && (
                            <span className="text-[9px] text-amber-400 flex items-center gap-0.5">
                              <Star size={9} fill="currentColor" /> {listing.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-white">{formatRupiah(listing.price, true)}</div>
                        <div className="text-[10px] text-amber-400">CB {p.cashbackPct}%</div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                          <ChevronRight size={10} className="text-white" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Cashback info */}
            {cashback > 0 && (
              <div className="flex items-center gap-3 bg-amber-500/6 border border-amber-500/20 rounded-xl px-4 py-3">
                <span className="text-xl">💰</span>
                <div>
                  <div className="text-sm font-bold text-amber-400">
                    Cashback {formatRupiah(cashback, true)}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {platform?.cashbackPct}% via harga.com — otomatis ke wallet
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-[10px] text-[var(--text-muted)] text-center">
              Kamu akan diarahkan ke {platform?.name ?? 'platform'} untuk menyelesaikan pembelian.
              Harga tidak ada markup — sama persis dengan platform aslinya.
            </p>
          </div>

          {/* CTA */}
          <div className="px-5 pb-6 pt-0">
            <button
              onClick={handleBuy}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white rounded-xl transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ background: bgColor }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <ExternalLink size={15} />
                  Lanjutkan ke {platform?.name ?? 'Platform'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
