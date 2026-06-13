'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Wallet, Zap, Search, TrendingDown, TrendingUp, Minus, X, Globe } from 'lucide-react'
import { LIVE_TICKER_ITEMS } from '@/lib/mock-data'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/',         label: 'Beranda' },
  { href: '/cari',     label: 'Cari' },
  { href: '/alert',    label: 'Alert' },
  { href: '/cashback', label: 'Cashback' },
]

const PLATFORM_ROW = ['tokopedia','shopee','tiktok','lazada','blibli','bukalapak','amazon','aliexpress','alibaba','jd']
const INTL_PLATFORMS = new Set(['amazon','alibaba','aliexpress','jd'])

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [alertCount] = useState(3)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const tickerItems = [...LIVE_TICKER_ITEMS, ...LIVE_TICKER_ITEMS]

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
      if (pathname === '/') setShowSearch(window.scrollY > 320)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  const showInlineSearch = showSearch || pathname !== '/'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/cari?q=${encodeURIComponent(searchQuery.trim())}`)
    setSearchQuery('')
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border-subtle)] transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(9,9,11,0.98)' : 'rgba(9,9,11,0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: scrolled
          ? '0 1px 0 rgba(63,63,70,0.8), 0 4px 20px rgba(0,0,0,0.4)'
          : '0 1px 0 rgba(63,63,70,0.5)',
      }}>

      {/* ── Live Ticker ── */}
      <div className="border-b border-[var(--border-subtle)] h-8 overflow-hidden relative" style={{ background: 'rgba(9,9,11,0.9)' }}>
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#09090b] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#09090b] to-transparent z-10 pointer-events-none" />
        <div className="absolute left-3 top-0 bottom-0 flex items-center gap-1.5 z-20">
          <span className="live-dot" />
          <span className="text-[10px] font-bold text-green-400 tracking-wider">LIVE</span>
        </div>
        <div className="flex items-center h-full pl-16">
          <div className="ticker-track">
            {tickerItems.map((item, i) => {
              const plat = PLATFORMS[item.platform.toLowerCase().replace(' ', '') as keyof typeof PLATFORMS]
              const platColor = plat?.color ?? '#888'
              return (
                <span key={i} className="flex items-center gap-1.5 text-xs whitespace-nowrap text-[var(--text-muted)]">
                  <span>{item.icon}</span>
                  <span className="text-[var(--text-secondary)]">{item.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                    style={{ background: platColor + '22', color: platColor }}>
                    {item.platform}
                  </span>
                  <span className="font-semibold text-white">{formatRupiah(item.price, true)}</span>
                  {item.change < 0 ? (
                    <span className="flex items-center gap-0.5 text-[10px] text-green-400 font-medium">
                      <TrendingDown size={10} />{Math.abs(item.change)}%
                    </span>
                  ) : item.change > 0 ? (
                    <span className="flex items-center gap-0.5 text-[10px] text-red-400 font-medium">
                      <TrendingUp size={10} />{item.change}%
                    </span>
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)]"><Minus size={10} /></span>
                  )}
                  <span className="text-[var(--border)] mx-2">·</span>
                </span>
              )
            })}
          </div>
        </div>
        <div className="absolute right-3 top-0 bottom-0 flex items-center z-20 gap-2">
          <span className="flex items-center gap-0.5 text-[9px] text-blue-400/70 font-medium">
            <Globe size={8} />intl
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">4 jam</span>
        </div>
      </div>

      {/* ── Main Nav ── */}
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/40 transition-shadow">
            <Zap size={14} className="text-white" fill="white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-lg tracking-tight leading-none">
              <span className="text-white">harga</span>
              <span className="text-gradient-gold">.com</span>
            </span>
            <span className="text-[9px] text-[var(--text-muted)] leading-none tracking-wide">{PLATFORM_ROW.length} platform</span>
          </div>
        </Link>

        {/* Inline search (appears on scroll or non-home pages) */}
        <form onSubmit={handleSearch}
          className={`hidden md:flex flex-1 max-w-lg items-center gap-2 bg-[var(--bg-hover)] border rounded-xl px-3 py-1.5 transition-all duration-300 ${
            showInlineSearch
              ? 'opacity-100 border-[var(--border)] hover:border-amber-500/40 focus-within:border-amber-500/60'
              : 'opacity-0 pointer-events-none border-transparent'
          }`}>
          <Search size={14} className="text-[var(--text-muted)] shrink-0" />
          <input ref={searchInputRef} type="text" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari produk di 10 platform..."
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[var(--text-muted)] min-w-0" />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="text-[var(--text-muted)] hover:text-white transition-colors">
              <X size={13} />
            </button>
          )}
        </form>

        {/* Platform mini-dots (desktop, hidden when search is visible) */}
        {!showInlineSearch && (
          <div className="hidden lg:flex items-center gap-1 ml-2">
            {PLATFORM_ROW.map(id => {
              const p = PLATFORMS[id as keyof typeof PLATFORMS]
              if (!p) return null
              const isIntl = INTL_PLATFORMS.has(id)
              return (
                <div key={id}
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm opacity-60 hover:opacity-100 transition-opacity cursor-pointer ${isIntl ? 'ring-1 ring-blue-400/40' : ''}`}
                  style={{ background: p.color }}
                  title={p.name}>
                  {p.shortName[0]}
                </div>
              )
            })}
          </div>
        )}

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-0.5 ml-auto">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors relative ${
                isActive(l.href)
                  ? 'text-white bg-[var(--bg-hover)]'
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]'
              }`}>
              {l.label}
              {isActive(l.href) && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full" />
              )}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 ml-2">
          <Link href="/cari"
            className="md:hidden flex items-center justify-center w-9 h-9 text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
            <Search size={16} />
          </Link>
          {/* Alert bell with badge */}
          <Link href="/alert"
            className="hidden md:flex relative items-center justify-center w-9 h-9 text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
            <Bell size={16} />
            {alertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full ring-1 ring-[var(--bg-primary)]" />
            )}
          </Link>
          {/* Cashback wallet */}
          <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 rounded-lg transition-all">
            <Wallet size={15} />
            <span className="font-medium">Rp 0</span>
          </button>
          <button className="hidden md:flex items-center gap-1.5 px-4 py-1.5 text-sm bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors font-semibold shadow-sm shadow-amber-500/20">
            Masuk
          </button>
          {/* Hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 text-[var(--text-secondary)] hover:text-white rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            aria-label="Toggle menu">
            <span className="block w-5 h-0.5 bg-current rounded-full transition-transform duration-300 origin-center"
              style={mobileOpen ? { transform: 'translateY(4px) rotate(45deg)' } : {}} />
            <span className="block w-5 h-0.5 bg-current rounded-full transition-opacity duration-300"
              style={mobileOpen ? { opacity: 0 } : {}} />
            <span className="block w-5 h-0.5 bg-current rounded-full transition-transform duration-300 origin-center"
              style={mobileOpen ? { transform: 'translateY(-8px) rotate(-45deg)' } : {}} />
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <div className={`md:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-hidden transition-all duration-300 ease-in-out ${
        mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-4 py-3">
          {/* Mobile search */}
          <form onSubmit={handleSearch}
            className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 mb-3 focus-within:border-amber-500/50 transition-colors">
            <Search size={14} className="text-[var(--text-muted)]" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari produk di 10 platform..."
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[var(--text-muted)]" />
          </form>

          {/* Platform dots mobile */}
          <div className="flex flex-wrap gap-1.5 mb-3 px-0.5">
            {PLATFORM_ROW.map(id => {
              const p = PLATFORMS[id as keyof typeof PLATFORMS]
              if (!p) return null
              const isIntl = INTL_PLATFORMS.has(id)
              return (
                <div key={id}
                  className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold text-white ${isIntl ? 'ring-1 ring-blue-400/40' : ''}`}
                  style={{ background: p.color + 'CC' }}>
                  {isIntl && <Globe size={8} />}
                  {p.shortName}
                </div>
              )
            })}
          </div>

          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className={`flex items-center py-3 text-sm border-b border-[var(--border-subtle)] last:border-0 transition-colors ${
                isActive(l.href) ? 'text-white font-semibold' : 'text-[var(--text-secondary)]'
              }`}>
              {isActive(l.href) && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2" />}
              {l.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-3">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Bell size={14} />
              Alert {alertCount > 0 && <span className="bg-amber-400 text-white text-[9px] font-bold px-1 rounded-full">{alertCount}</span>}
            </button>
            <button className="flex-1 py-2.5 text-sm text-white bg-amber-500 hover:bg-amber-400 rounded-xl font-semibold transition-colors">
              Masuk
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
