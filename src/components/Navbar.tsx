'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Search, X, Menu, Zap } from 'lucide-react'
import { WaitlistModal } from '@/components/WaitlistModal'

const NAV_LINKS = [
  { href: '/',                   label: 'Beranda' },
  { href: '/cari',               label: 'Cari' },
  { href: '/cari?sort=popular',  label: 'Trending' },
]

function PriceTagLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="hg-nav-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F97316" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#hg-nav-logo)" />
      <g transform="translate(7.5 7.5) scale(1.38)" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
        <circle cx="7.5" cy="7.5" r="1.4" fill="#fff" stroke="none" />
      </g>
    </svg>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = searchQuery.trim()
    router.push(q ? `/cari?q=${encodeURIComponent(q)}` : '/cari')
    setSearchQuery('')
  }

  const isActive = (href: string) => {
    const base = href.split('?')[0]
    if (base === '/') return pathname === '/'
    return pathname.startsWith(base)
  }

  return (
    <>
      <nav
        style={{
          position: 'fixed', top: 36, left: 0, right: 0, zIndex: 50,
          background: scrolled ? 'rgba(250,248,242,0.97)' : 'rgba(250,248,242,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          transition: 'background 0.2s ease, box-shadow 0.2s ease',
          boxShadow: scrolled ? '0 2px 16px rgba(26,24,20,0.08)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4"
          style={{ height: 56, display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* Logo */}
          <Link href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <PriceTagLogo size={30} />
            <span style={{
              fontFamily: 'var(--font-ui)', fontSize: 18, fontWeight: 800,
              letterSpacing: '-0.5px', lineHeight: 1, color: 'var(--text-primary)',
            }}>
              Harga<span style={{ color: 'var(--brand)' }}>.com</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 0, marginLeft: 8 }}>
            {NAV_LINKS.map(l => (
              <Link key={l.label} href={l.href}
                style={{
                  padding: '6px 14px', borderRadius: 100,
                  fontSize: 14, fontFamily: 'var(--font-ui)',
                  fontWeight: isActive(l.href) ? 600 : 400,
                  color: isActive(l.href) ? 'var(--brand)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch}
            className="hidden md:flex"
            style={{
              flex: 1, maxWidth: 380, marginLeft: 'auto',
              alignItems: 'center',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 100,
              padding: '6px 6px 6px 16px',
              boxShadow: '0 1px 4px rgba(26,24,20,0.05)',
            }}>
            <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginRight: 8 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari produk..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontSize: 13, color: 'var(--text-primary)',
                fontFamily: 'var(--font-ui)', minWidth: 0,
              }}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')}
                style={{
                  color: 'var(--text-muted)', cursor: 'pointer',
                  background: 'none', border: 'none', padding: '2px 4px',
                  display: 'flex', alignItems: 'center',
                }}>
                <X size={12} />
              </button>
            )}
          </form>

          {/* Right action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Daftar (Waitlist) button */}
            <button
              onClick={() => setWaitlistOpen(true)}
              className="hidden md:flex items-center gap-1.5"
              style={{
                padding: '8px 16px', borderRadius: 100,
                background: 'transparent', color: 'var(--brand)',
                border: '1px solid var(--brand)', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-ui)',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
              <Zap size={13} />
              Daftar
            </button>

            {/* Pantau Harga button */}
            <Link href="/alert"
              className="hidden md:flex items-center gap-1.5"
              style={{
                padding: '8px 16px', borderRadius: 100,
                background: 'var(--brand)', color: '#FFF',
                fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-ui)',
                textDecoration: 'none', whiteSpace: 'nowrap',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
              <Bell size={13} />
              Pantau Harga
            </Link>

            {/* Mobile: search icon */}
            <Link href="/cari" className="md:hidden"
              style={{
                width: 36, height: 36, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', textDecoration: 'none',
              }}>
              <Search size={18} />
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden"
              aria-label="Toggle menu"
              style={{
                width: 36, height: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)',
              }}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div className="md:hidden" style={{
          overflow: 'hidden',
          maxHeight: mobileOpen ? 420 : 0,
          transition: 'max-height 0.3s ease',
          background: 'rgba(250,248,242,0.97)',
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{ padding: '12px 16px 24px' }}>
            <form onSubmit={handleSearch} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '8px 12px', marginBottom: 12,
            }}>
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input type="text" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari produk..."
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)',
                }}
              />
            </form>

            {NAV_LINKS.map(l => (
              <Link key={l.label} href={l.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', padding: '13px 0',
                  borderBottom: '1px solid var(--border)', fontSize: 14,
                  fontFamily: 'var(--font-ui)',
                  color: isActive(l.href) ? 'var(--brand)' : 'var(--text-secondary)',
                  fontWeight: isActive(l.href) ? 600 : 400,
                  textDecoration: 'none',
                }}>
                {l.label}
              </Link>
            ))}

            <Link href="/alert"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 16, padding: '13px',
                borderRadius: 12, background: 'var(--brand)',
                color: '#FFF', textDecoration: 'none',
                fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-ui)',
              }}>
              <Bell size={15} />
              Pantau Harga
            </Link>
          </div>
        </div>
      </nav>

      <WaitlistModal isOpen={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
    </>
  )
}
