'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Link2, ScanLine, X, TrendingUp, Clock } from 'lucide-react'
import { cn, cleanProductName } from '@/lib/utils'

interface SearchResult {
  id: string
  name: string
  slug: string
  category: string
  best_price: number | null
  image_url?: string | null
}

const POPULAR = [
  'iPhone 15 Pro', 'Samsung Galaxy S24', 'Laptop ASUS ROG',
  'AirPods Pro', 'PS5', 'Nike Air Force 1', 'Dyson V15',
]

interface SearchAutocompleteProps {
  size?: 'hero' | 'normal'
  initialValue?: string
  onSearch?: (q: string) => void
  className?: string
  extraParams?: Record<string, string>
}

export function SearchAutocomplete({
  size = 'normal',
  initialValue = '',
  onSearch,
  className,
  extraParams = {},
}: SearchAutocompleteProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialValue)
  const [focused, setFocused] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('harga_recent') || '[]')
      setRecentSearches(stored.slice(0, 4))
    } catch { /* ignore */ }
  }, [])

  const saveRecent = (term: string) => {
    try {
      const prev = JSON.parse(sessionStorage.getItem('harga_recent') || '[]') as string[]
      const updated = [term, ...prev.filter(s => s !== term)].slice(0, 6)
      sessionStorage.setItem('harga_recent', JSON.stringify(updated))
      setRecentSearches(updated.slice(0, 4))
    } catch { /* ignore */ }
  }

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.data || data.results || data.products || [])
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, fetchSuggestions])

  const handleSearch = (q?: string) => {
    const term = (q ?? query).trim()
    if (!term) return
    saveRecent(term)
    setFocused(false)
    if (onSearch) {
      onSearch(term)
    } else {
      const params = new URLSearchParams({ q: term, ...extraParams })
      router.push(`/cari?${params.toString()}`)
    }
  }

  const isUrl = query.startsWith('http://') || query.startsWith('https://')
  const showDropdown = focused
  const formatPrice = (n: number | null | undefined) =>
    n ? `Rp ${n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'jt' : (n / 1000).toFixed(0) + 'rb'}` : ''

  return (
    <div className={cn('relative w-full', className)}>
      <div
        className={cn(
          'flex items-center gap-2 bg-[var(--bg-card)] border rounded-2xl transition-all duration-200',
          focused
            ? 'border-amber-500/50 shadow-[0_0_0_3px_rgba(245,158,11,0.10)]'
            : 'border-[var(--border-subtle)] hover:border-[var(--border)]',
          size === 'hero' ? 'px-5 py-4' : 'px-4 py-3'
        )}
      >
        {isUrl
          ? <Link2 size={18} className="text-amber-400 shrink-0" />
          : <Search size={18} className={cn('shrink-0 transition-colors', focused ? 'text-amber-400' : 'text-[var(--text-muted)]')} />
        }

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSearch()
            if (e.key === 'Escape') { setFocused(false); inputRef.current?.blur() }
          }}
          placeholder={
            size === 'hero'
              ? "Cari apa saja — baru atau bekas..."
              : "Cari produk atau tempel URL..."
          }
          className={cn(
            'flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            size === 'hero' ? 'text-base' : 'text-sm'
          )}
        />

        {query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus() }}
            className="text-[var(--text-muted)] hover:text-white transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        )}

        <button
          onClick={() => handleSearch()}
          className={cn(
            'shrink-0 font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap',
            'bg-amber-500 hover:bg-amber-400 active:scale-95 text-white shadow-sm shadow-amber-500/20',
            size === 'hero' ? 'px-5 py-2.5 text-sm' : 'px-4 py-2 text-xs'
          )}
        >
          {isUrl ? (
            <><ScanLine size={14} />Analisa</>
          ) : (
            <>Cari Harga</>
          )}
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl overflow-hidden z-50 slide-up">

          {results.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                Produk
              </div>
              {results.map((r, i) => (
                <button
                  key={r.id ?? i}
                  onMouseDown={() => {
                    saveRecent(r.name)
                    setFocused(false)
                    router.push(`/produk/${r.slug || r.id}`)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left"
                >
                  <Search size={14} className="text-[var(--text-muted)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--text-primary)] truncate">{cleanProductName(r.name)}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {r.category}{r.best_price ? ' · mulai ' + formatPrice(r.best_price) : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {loading && query.length > 1 && results.length === 0 && (
            <div className="py-4 text-center text-xs text-[var(--text-muted)]">
              <div className="skeleton h-4 w-48 mx-auto rounded mb-2" />
              <div className="skeleton h-4 w-32 mx-auto rounded" />
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="py-2">
              {recentSearches.length > 0 && (
                <>
                  <div className="px-4 py-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Pencarian Terakhir
                  </div>
                  {recentSearches.map(s => (
                    <button
                      key={s}
                      onMouseDown={() => handleSearch(s)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left"
                    >
                      <Clock size={13} className="text-[var(--text-muted)] shrink-0" />
                      <span className="text-sm text-[var(--text-secondary)]">{s}</span>
                    </button>
                  ))}
                  <div className="border-t border-[var(--border-subtle)] my-1" />
                </>
              )}
              <div className="px-4 py-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp size={10} /> Populer Sekarang
              </div>
              {POPULAR.map(s => (
                <button
                  key={s}
                  onMouseDown={() => handleSearch(s)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left"
                >
                  <span className="text-amber-400 text-xs">🔥</span>
                  <span className="text-sm text-[var(--text-secondary)]">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
