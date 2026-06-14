'use client'
import { useState, useEffect } from 'react'
import { SearchAutocomplete } from '@/components/SearchAutocomplete'

const TYPEWRITER_WORDS = [
  'iPhone 15 Pro Max',
  'Samsung Galaxy S24 Ultra',
  'Laptop ASUS ROG Strix',
  'AirPods Pro 2',
  'PlayStation 5 Slim',
  'Dyson V15 Detect',
  'Nike Air Jordan 1',
  'Apple Watch Ultra 2',
  'Xiaomi 14 Pro',
  'GoPro Hero 12',
  'Canon EOS R50',
  'Kindle Paperwhite',
]

function TypewriterSearch() {
  const [wordIdx, setWordIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [typing, setTyping] = useState(true)

  useEffect(() => {
    const word = TYPEWRITER_WORDS[wordIdx]
    let timeout: NodeJS.Timeout
    if (typing) {
      if (displayed.length < word.length) {
        timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 60)
      } else {
        timeout = setTimeout(() => setTyping(false), 1800)
      }
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30)
      } else {
        setWordIdx((wordIdx + 1) % TYPEWRITER_WORDS.length)
        setTyping(true)
      }
    }
    return () => clearTimeout(timeout)
  }, [displayed, typing, wordIdx])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-amber-500/25 shadow-[0_0_40px_rgba(245,158,11,0.08)] rounded-2xl px-5 py-4 mb-3 focus-within:border-amber-500/50 transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 shrink-0">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <div className="flex-1 text-base text-white min-w-0">
          <span>{displayed}</span>
          <span className="typewriter-cursor text-amber-400" />
        </div>
        <button className="shrink-0 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 shadow-sm shadow-amber-500/20">
          Bandingkan
        </button>
      </div>
      <p className="text-xs text-center text-[var(--text-muted)]">
        Tempel link dari Tokopedia, Shopee, Lazada, TikTok, Amazon, AliExpress, dll
      </p>
    </div>
  )
}

export function HeroSearchSection() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <TypewriterSearch />
    </div>
  )
}

export function HeroRealSearch() {
  const [searchMode, setSearchMode] = useState<'new' | 'used'>('new')

  return (
    <div className="w-full max-w-2xl mx-auto mb-2">
      {/* Mode tabs */}
      <div className="flex items-center gap-1 mb-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-1 w-fit mx-auto">
        <button
          onClick={() => setSearchMode('new')}
          className={'px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ' +
            (searchMode === 'new'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-white')}>
          ✨ Produk Baru
        </button>
        <button
          onClick={() => setSearchMode('used')}
          className={'px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ' +
            (searchMode === 'used'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-white')}>
          ♻️ Barang Bekas
        </button>
      </div>
      <SearchAutocomplete size="hero" extraParams={searchMode === 'used' ? { condition: 'used' } : {}} />
    </div>
  )
}
