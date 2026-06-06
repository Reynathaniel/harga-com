'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Wallet, Zap, Search, TrendingDown, TrendingUp, Minus, X } from 'lucide-react'
import { LIVE_TICKER_ITEMS } from '@/lib/mock-data'
import { formatRupiah } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/',         label: 'Beranda' },
  { href: '/cari',     label: 'Cari' },
  { href: '/alert',    label: 'Alert' },
  { href: '/cashback', label: 'Cashback' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const tickerItems = [...LIVE_TICKER_ITEMS, ...LIVE_TICKER_ITEMS]

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
      if (pathname === '/') {
        setShowSearch(window.scrollY > 320)
      }
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
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(10,10,15,0.97)' : 'rgba(10,10,15,0.94)',
        backdropFilter: 'blur(20px)',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.3)' : 'none',
      }}>

      {/* Live ticker */}
      <div className="border-b border-[var(--border)] bg-[#080810] h-8 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#080810] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#080810] to-transparent z-10 pointer-events-none" />
        <div className="absolute left-3 top-0 bottom-0 flex items-center gap-1.5 z-20">
          <span className="live-dot" />
          <span className="text-[10px] font-bold text-green-400 tracking-wider">LIVE</span>
        </div>
        <div className="flex items-center h-full pl-16">
          <div className="ticker-track">
            {tickerItems.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs whitespace-nowrap text-[var(--text-muted)]">
                <span>{item.icon}</span>
                <span className="text-[var(--text-secondary)]">{item.name}</span>
                <span className="text-[10px] px-1 rounded"
                  style={{
                    background: item.platform === 'Shopee' ? '#ee4d2d18' : item.platform === 'TikTok' ? '#ffffff08' : '#42b54918',
                    color: item.platform === 'Shopee' ? '#ee4d2d' : item.platform === 'TikTok' ? '#888' : '#42b549',
                  }}>
                  {item.platform}
                </span>
                <span className="font-semibold text-white">{formatRupiah(item.price, true)}</span>
                {item.change < 0 ? (
                  <span className="flex items-center gap-0.5 text-[10px] text-green-400">
                    <TrendingDown size={10} />{Math.abs(item.change)}%
                  </span>
                ) : item.change > 0 ? (
                  <span className="flex items-center gap-0.5 text-[10px] text-red-400">
                    <TrendingUp size={10} />{item.change}%
                  </span>
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)]"><Minus size={10} /></span>
                )}
                <span className="text-[var(--border)] mx-2">·</span>
              </span>
            ))}
          </div>
        </div>
        <div className="absolute right-3 top-0 bottom-0 flex items-center z-20">
          <span className="text-[10px] text-[var(--text-muted)]">Update 4 jam</span>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Zap size={14} className="text-white" fill="white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">
            <span className="text-white">harga</span>
            <span className="text-gradient-gold">.com</span>
          </span>
        </Link>

        {/* Inline search (appears on scroll or non-home pages) */}
        <form onSubmit={handleSearch}
          className={`hidden md:flex flex-1 max-w-md items-center gap-2 bg-[var(--bg-hover)] border rounded-xl px-3 py-1.5 transition-all duration-300 ${
            showInlineSearch
              ? 'opacity-100 border-[var(--border)] hover:border-indigo-500/40'
              : 'opacity-0 pointer-events-none border-transparent'
          }`}>
          <Search size={14} className="text-[var(--text-muted)] shrink-0" />
          <input ref={searchInputRef} type="text" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari produk..."
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[var(--text-muted)] min-w-0" />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="text-[var(--text-muted)] hover:text-white">
              <X size={13} />
            </button>
          )}
        </form>

        {/* Desktop nav links */}
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
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full" />
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

          <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg transition-colors">
            <Wallet size={15} />
            <span className="font-medium">Rp 0</span>
          </button>

          <button className="hidden md:flex items-center gap-1.5 px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-semibold">
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

      {/* Mobile menu */}
      <div className={`md:hidden border-t border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden transition-all duration-300 ease-in-out ${
        mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-4 py-3">
          <form onSubmit={handleSearch}
            className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 mb-3">
            <Search size={14} className="text-[var(--text-muted)]" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari produk..."
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[var(--text-muted)]" />
          </form>
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className={`flex items-center py-3 text-sm border-b border-[var(--border)] last:border-0 transition-colors ${
                isActive(l.href) ? 'text-white font-semibold' : 'text-[var(--text-secondary)]'
              }`}>
              {isActive(l.href) && <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-2" />}
              {l.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-3">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Bell size={14} />
              Alert
            </button>
            <button className="flex-1 py-2.5 text-sm text-white bg-indigo-600 rounded-xl font-semibold">
              Masuk
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
