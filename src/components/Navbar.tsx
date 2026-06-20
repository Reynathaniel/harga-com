'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Search, X, Menu } from 'lucide-react'
import { PLATFORMS } from '@/lib/platforms'

const NAV_LINKS = [
  { href: '/',         label: 'Beranda' },
  { href: '/cari',     label: 'Scan' },
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
    <nav
      style={{
        position: 'fixed', top: 36, left: 0, right: 0, zIndex: 50,
        background: scrolled ? 'rgba(250,248,242,0.95)' : 'rgba(250,248,242,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.2s ease, box-shadow 0.2s ease',
        boxShadow: scrolled ? '0 2px 16px rgba(26,24,20,0.08)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4" style={{ height: 56, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', flexShrink: 0, marginRight: 8 }}>
          <span style={{ color: 'var(--brand)', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>●</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1 }}>harga</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 17, fontWeight: 300, color: 'var(--text-secondary)', letterSpacing: '-0.5px', lineHeight: 1, marginLeft: -2 }}>.com</span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex" style={{
          flex: 1, maxWidth: 420, alignItems: 'center', gap: 8,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 100, padding: '6px 6px 6px 14px',
          opacity: showInlineSearch ? 1 : 0,
          pointerEvents: showInlineSearch ? 'auto' : 'none',
          transition: 'opacity 0.2s ease',
          boxShadow: '0 1px 4px rgba(26,24,20,0.06)',
        }}>
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input ref={searchInputRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari produk di 12 platform..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', minWidth: 0 }}
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')}
              style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: 0, display: 'flex' }}>
              <X size={12} />
            </button>
          )}
        </form>

        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 13,
              fontWeight: isActive(l.href) ? 600 : 400,
              color: isActive(l.href) ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive(l.href) ? 'var(--cream-200)' : 'transparent',
              textDecoration: 'none', fontFamily: 'var(--font-ui)',
              transition: 'background 0.15s ease, color 0.15s ease',
              position: 'relative' as const,
            }}>
              {l.label}
              {isActive(l.href) && (
                <span style={{
                  position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                  width: 4, height: 4, borderRadius: '50%', background: 'var(--brand)', display: 'block',
                }} />
              )}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <Link href="/cari" className="md:hidden" style={{
            width: 36, height: 36, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', textDecoration: 'none',
          }}><Search size={16} /></Link>

          <Link href="/alert" className="hidden md:flex" style={{
            width: 36, height: 36, borderRadius: 8,
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', textDecoration: 'none',
            position: 'relative' as const,
          }}><Bell size={16} /></Link>

          <button className="hidden md:flex" style={{
            alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 100,
            background: 'var(--bg-dark)', color: '#FFFFFF', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap' as const,
            transition: 'opacity 0.15s ease',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
            Pantau Harga
          </button>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden" style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
          }} aria-label="Toggle menu">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <div className="md:hidden" style={{
        overflow: 'hidden', maxHeight: mobileOpen ? 400 : 0,
        transition: 'max-height 0.3s ease',
        background: 'rgba(250,248,242,0.97)', borderTop: '1px solid var(--border)',
      }}>
        <div style={{ padding: '12px 16px 20px' }}>
          <form onSubmit={handleSearch} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '8px 12px', marginBottom: 12,
          }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari produk..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}
            />
          </form>
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} style={{
              display: 'flex', alignItems: 'center', padding: '12px 0',
              borderBottom: '1px solid var(--border)', fontSize: 14, fontFamily: 'var(--font-ui)',
              color: isActive(l.href) ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: isActive(l.href) ? 600 : 400, textDecoration: 'none',
            }}>
              {isActive(l.href) && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', marginRight: 8, flexShrink: 0 }} />}
              {l.label}
            </Link>
          ))}
          <button style={{
            width: '100%', marginTop: 16, padding: '12px', borderRadius: 12,
            background: 'var(--bg-dark)', color: '#FFF', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-ui)',
          }}>Pantau Harga</button>
        </div>
      </div>
    </nav>
  )
}
