'use client'

/**
 * ShareButton — Tombol share produk dengan referral code embedded.
 * Jika user punya referral_code (dari localStorage / props), link yang di-share
 * mengandung ?ref={code} sehingga klik dari link tersebut ter-tracking.
 *
 * Usage:
 *   <ShareButton productId="abc" productName="iPhone 15" referralCode="A3KX92BF" />
 */

import { useState, useCallback } from 'react'
import { Share2, Copy, Check, Link as LinkIcon } from 'lucide-react'

interface ShareButtonProps {
  productId:     string
  productName:   string
  referralCode?: string   // jika undefined, share tanpa ref
  className?:    string
  variant?:      'icon' | 'full'
}

export function ShareButton({
  productId,
  productName,
  referralCode,
  className = '',
  variant = 'icon',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [open,   setOpen  ] = useState(false)

  const baseUrl  = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = referralCode
    ? `${baseUrl}/produk/${productId}?ref=${referralCode}`
    : `${baseUrl}/produk/${productId}`

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const el = document.createElement('input')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
    setOpen(false)
  }, [shareUrl])

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text:  `Cek harga terbaik ${productName} di harga.com!`,
          url:   shareUrl,
        })
      } catch {
        // user cancelled
      }
    } else {
      handleCopy()
    }
    setOpen(false)
  }, [productName, shareUrl, handleCopy])

  // WhatsApp share
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`Cek harga terbaik *${productName}* di harga.com!\n${shareUrl}`)}`
  // Twitter / X
  const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Cek harga terbaik ${productName} di harga.com!`)}&url=${encodeURIComponent(shareUrl)}`

  if (variant === 'full') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setOpen(p => !p)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border)] hover:border-indigo-500/40 hover:text-white rounded-xl transition-all"
        >
          <Share2 size={14} />
          Share{referralCode ? ' & Earn' : ''}
        </button>

        {open && <ShareDropdown
          onCopy={handleCopy}
          onNative={handleNativeShare}
          waUrl={waUrl}
          twUrl={twUrl}
          copied={copied}
          referralCode={referralCode}
          onClose={() => setOpen(false)}
        />}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(p => !p)}
        className="w-9 h-9 bg-[var(--bg-card)]/90 border border-[var(--border)] rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors backdrop-blur-sm"
        title="Share produk"
      >
        <Share2 size={15} />
      </button>

      {open && <ShareDropdown
        onCopy={handleCopy}
        onNative={handleNativeShare}
        waUrl={waUrl}
        twUrl={twUrl}
        copied={copied}
        referralCode={referralCode}
        onClose={() => setOpen(false)}
      />}
    </div>
  )
}

// ── Dropdown ──────────────────────────────────────────────────────

interface DropdownProps {
  onCopy:       () => void
  onNative:     () => void
  waUrl:        string
  twUrl:        string
  copied:       boolean
  referralCode?: string
  onClose:      () => void
}

function ShareDropdown({ onCopy, onNative, waUrl, twUrl, copied, referralCode, onClose }: DropdownProps) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <div className="text-sm font-bold text-white">Share Produk</div>
          {referralCode && (
            <div className="text-xs text-amber-400 mt-0.5">
              💰 Link referral kamu — dapat komisi jika ada yang beli!
            </div>
          )}
        </div>

        <div className="p-2 space-y-1">
          {/* Copy link */}
          <button
            onClick={onCopy}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors text-left"
          >
            {copied ? (
              <Check size={16} className="text-green-400 shrink-0" />
            ) : (
              <Copy size={16} className="text-[var(--text-muted)] shrink-0" />
            )}
            <div>
              <div className="text-sm font-medium text-white">
                {copied ? 'Link tersalin!' : 'Salin Link'}
              </div>
              <div className="text-xs text-[var(--text-muted)] truncate">
                {typeof window !== 'undefined' ? window.location.origin + '/produk/...' : ''}
              </div>
            </div>
          </button>

          {/* WhatsApp */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span className="text-sm">💬</span>
            </div>
            <span className="text-sm font-medium text-white">WhatsApp</span>
          </a>

          {/* Twitter / X */}
          <a
            href={twUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
              <span className="text-sm font-bold text-sky-400">𝕏</span>
            </div>
            <span className="text-sm font-medium text-white">Twitter / X</span>
          </a>

          {/* Native share (mobile) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              onClick={onNative}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <LinkIcon size={14} className="text-indigo-400" />
              </div>
              <span className="text-sm font-medium text-white">Bagikan via...</span>
            </button>
          )}
        </div>

        {referralCode && (
          <div className="px-4 py-3 border-t border-[var(--border)] bg-amber-500/5">
            <div className="text-[10px] text-amber-400/80">
              Kode referralmu: <span className="font-bold font-mono">{referralCode}</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
