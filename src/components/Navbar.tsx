'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Wallet, Search, TrendingDown, TrendingUp, Minus, X, Globe } from 'lucide-react'
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

/* Price-tag logo mark — matches Logo.jsx from design system */
function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none"
      style={{ flexShrink: 0, filter: 'drop-shadow(0 4px 12px rgba(255,90,60,0.35))' }}>
      <defs>
        <linearGradient id="hg-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffc24b" />
          <stop offset="1" stopColor="#ff5a3c" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#hg-logo)" />
      <g transform="translate(7.5 7.5) scale(1.38)" fill="none"
        stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
        <circle cx="7.5" cy="7.5" r="1.4" fill="#fff" />
      </g>
    </svg>
  )
}

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
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        borderBottom: '1px solid var(--glass-border)',
        boxShadow: scrolled ? 'var(--shadow-elevated)' : 'none',
      }}>

      {/* ── Live Ticker ── */}
      <div className="h-8 overflow-hidden relative"
        style={{
          background: 'linear-gradient(90deg, var(--brand-soft-bg), var(--win-soft-bg))',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, var(--ink-950), transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, var(--ink-950), transparent)' }} />
        <div className="absolute left-3 top-0 bottom-0 flex items-center gap-1.5 z-20">
          <span className="harga-live-dot" />
          <span style={{ fontSize: 'var(--text-10)', fontWeight: 'var(--fw-black)', color: 'var(--win)', letterSpacing: 'var(--tracking-wide)' }}>LIVE</span>
        </div>
        <div className="flex items-center h-full pl-16">
          <div className="ticker-track">
            {tickerItems.map((item, i) => {
              const plat = PLATFORMS[item.platform.toLowerCase().replace(' ', '') as keyof typeof PLATFORMS]
              const platColor = plat?.color ?? '#888'
              return (
                <span key={i} className="flex items-center gap-1.5 whitespace-nowrap"
                  style={{ fontSize: 'var(--text-11)', color: 'var(--text-muted)' }}>
                  <span>{item.icon}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                  <span style={{
                    fontSize: 'var(--text-10)', padding: '1px 6px', borderRadius: 'var(--radius-full)',
                    fontWeight: 'var(--fw-semibold)', background: platColor + '22', color: platColor,
                  }}>{item.platform}</span>
                  <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>{formatRupiah(item.price, true)}</span>
                  {item.change < 0 ? (
                    <span className="flex items-center gap-0.5" style={{ fontSize: 'var(--text-10)', color: 'var(--win)', fontWeight: 'var(--fw-semibold)' }}>
                      <TrendingDown size={10} />{Math.abs(item.change)}%
                    </span>
                  ) : item.change > 0 ? (
                    <span className="flex items-center gap-0.5" style={{ fontSize: 'var(--text-10)', color: 'var(--danger)', fontWeight: 'var(--fw-semibold)' }}>
                      <TrendingUp size={10} />{item.change}%
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}><Minus size={10} /></span>
                  )}
                  <span style={{ color: 'var(--border)', margin: '0 8px' }}>·</span>
                </span>
              )
            })}
          </div>
        </div>
        <div className="absolute right-3 top-0 bottom-0 flex items-center z-20 gap-2">
          <span className="flex items-center gap-0.5" style={{ fontSize: 'var(--text-9)', color: 'var(--info)', fontWeight: 'var(--fw-semibold)', opacity: 0.7 }}>
            <Globe size={8} />intl
          </span>
          <span style={{ fontSize: 'var(--text-10)', color: 'var(--text-muted)' }}>4 jam</span>
        </div>
      </div>

      {/* ── Main Nav ── */}
      <div className="harga-glass" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">

          {/* Logo — price-tag SVG mark + wordmark */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <LogoMark size={32} />
            <div className="flex flex-col leading-none">
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 'var(--fw-extrabold)', fontSize: 18, letterSpacing: 'var(--tracking-tight)', lineHeight: 1 }}>
                <span style={{ color: 'var(--text-primary)' }}>Harga</span>
                <span style={{ color: 'var(--brand)' }}>.com</span>
              </span>
              <span style={{ fontSize: 'var(--text-9)', color: 'var(--text-muted)', lineHeight: 1, letterSpacing: 'var(--tracking-wide)', marginTop: 2 }}>
                {PLATFORM_ROW.length} platform
              </span>
            </div>
          </Link>

          {/* Inline search */}
          <form onSubmit={handleSearch}
            className={`hidden md:flex flex-1 max-w-lg items-center gap-2 rounded-xl px-3 py-1.5 transition-all duration-300 ${
              showInlineSearch
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none'
            }`}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}>
            <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input ref={searchInputRef} type="text" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari produk di 10 platform..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
                minWidth: 0,
              }} />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')}
                style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
                <X size={13} />
              </button>
            )}
          </form>

          {/* Platform mini-dots */}
          {!showInlineSearch && (
            <div className="hidden lg:flex items-center gap-1 ml-2">
              {PLATFORM_ROW.map(id => {
                const p = PLATFORMS[id as keyof typeof PLATFORMS]
                if (!p) return null
                const isIntl = INTL_PLATFORMS.has(id)
                return (
                  <div key={id}
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-white shadow-sm opacity-60 hover:opacity-100 transition-opacity cursor-pointer ${isIntl ? 'ring-1 ring-blue-400/40' : ''}`}
                    style={{ background: id === 'tiktok' ? '#1a1a1a' : p.color, fontSize: 8, fontWeight: 800 }}
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
                className="relative px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)',
                  color: isActive(l.href) ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isActive(l.href) ? 'var(--bg-hover)' : 'transparent',
                }}>
                {l.label}
                {isActive(l.href) && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: 'var(--brand)' }} />
                )}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 ml-2">
            <Link href="/cari"
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}>
              <Search size={16} />
            </Link>
            <Link href="/alert"
              className="hidden md:flex relative items-center justify-center w-9 h-9 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}>
              <Bell size={16} />
              {alertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-1"
                  style={{ background: 'var(--brand)', ringColor: 'var(--bg-primary)' }} />
              )}
            </Link>
            <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
              style={{
                fontSize: 'var(--text-sm)', color: 'var(--brand)',
                background: 'var(--brand-soft-bg)', border: '1px solid var(--brand-soft-border)',
              }}>
              <Wallet size={15} />
              <span style={{ fontWeight: 'var(--fw-medium)' }}>Rp 0</span>
            </button>
            {/* Pantau Harga CTA — magnetic on hover */}
            <button
              className="harga-magnet hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg"
              style={{
                background: 'var(--gradient-gold)', color: 'var(--text-on-brand)',
                boxShadow: 'var(--shadow-button)', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-extrabold)',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - r.left - r.width / 2
                const y = e.clientY - r.top - r.height / 2
                e.currentTarget.style.transform = `translate(${x * 0.3}px, ${y * 0.4}px)`
              }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = '' }}>
              🔔 Pantau Harga
            </button>
            {/* Hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
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
      </div>

      {/* ── Mobile Menu ── */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
        style={{ background: 'var(--bg-primary)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="px-4 py-3">
          <form onSubmit={handleSearch}
            className="flex items-center gap-2 rounded-xl px-3 py-2 mb-3 transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari produk di 10 platform..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
              }} />
          </form>
          <div className="flex flex-wrap gap-1.5 mb-3 px-0.5">
            {PLATFORM_ROW.map(id => {
              const p = PLATFORMS[id as keyof typeof PLATFORMS]
              if (!p) return null
              const isIntl = INTL_PLATFORMS.has(id)
              return (
                <div key={id}
                  className={`flex items-center gap-1 text-white ${isIntl ? 'ring-1 ring-blue-400/40' : ''}`}
                  style={{
                    fontSize: 'var(--text-10)', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                    fontWeight: 'var(--fw-semibold)', background: (id === 'tiktok' ? '#1a1a1a' : p.color) + 'CC',
                  }}>
                  {isIntl && <Globe size={8} />}
                  {p.shortName}
                </div>
              )
            })}
          </div>
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
              className="flex items-center py-3 border-b last:border-0 transition-colors"
              style={{
                fontSize: 'var(--text-sm)', borderColor: 'var(--border-subtle)',
                color: isActive(l.href) ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive(l.href) ? 'var(--fw-semibold)' : 'var(--fw-regular)',
              }}>
              {isActive(l.href) && (
                <span className="w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0" style={{ background: 'var(--brand)' }} />
              )}
              {l.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-3">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
              style={{
                fontSize: 'var(--text-sm)', color: 'var(--brand)',
                background: 'var(--brand-soft-bg)', border: '1px solid var(--brand-soft-border)',
              }}>
              <Bell size={14} />
              Alert {alertCount > 0 && (
                <span className="text-white font-bold px-1 rounded-full" style={{ fontSize: 'var(--text-9)', background: 'var(--brand)' }}>{alertCount}</span>
              )}
            </button>
            <button className="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
              style={{ background: 'var(--gradient-gold)', color: 'var(--text-on-brand)', border: 'none' }}>
              Masuk
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
