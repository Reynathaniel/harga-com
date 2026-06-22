'use client'

/**
 * CheckoutModal — "Beli di Harga.com"
 *
 * Fitur checkout internal sedang dalam pengembangan.
 * Modal menampilkan notifikasi "Under Development" dan
 * tetap menawarkan redirect langsung ke platform tujuan.
 */

import { useCallback } from 'react'
import { X, ShoppingCart, ExternalLink, Construction } from 'lucide-react'
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
  productName,
  listings,
}: CheckoutModalProps) {
  const sorted  = [...listings].sort((a, b) => a.price - b.price)
  const cheapest = sorted[0]
  const platform = cheapest ? PLATFORMS[cheapest.platformId] : null
  const bgColor  = cheapest?.platformId === 'tiktok' ? '#1a1a1a' : (platform?.color ?? '#f59e0b')

  const handleGoToPlatform = useCallback(() => {
    if (cheapest?.affiliateUrl) {
      window.open(cheapest.affiliateUrl, '_blank', 'noopener,noreferrer')
    }
    onClose()
  }, [cheapest, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div className="w-full sm:max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <ShoppingCart size={15} className="text-amber-400" />
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Beli di Harga.com
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Under Development banner */}
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <Construction size={28} className="text-amber-400" />
              </div>
              <div>
                <div className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Sedang dalam pengembangan
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Fitur checkout langsung via Harga.com akan segera hadir.
                  Untuk sekarang, kami akan arahkan ke{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {platform?.name ?? 'platform'}
                  </strong>{' '}
                  untuk menyelesaikan pembelian.
                </div>
              </div>
            </div>

            {/* Price summary */}
            {cheapest && (
              <div className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)' }}>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {productName.length > 35 ? productName.slice(0, 35) + '…' : productName}
                </div>
                <div className="text-sm font-bold shrink-0 ml-3" style={{ color: 'var(--text-primary)' }}>
                  {formatRupiah(cheapest.price, true)}
                </div>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleGoToPlatform}
              disabled={!cheapest}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white rounded-xl transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-50"
              style={{ background: bgColor }}
            >
              <ExternalLink size={15} />
              Lanjutkan ke {platform?.name ?? 'Platform'}
            </button>

            <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
              Harga tidak ada markup — sama persis dengan platform aslinya.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
