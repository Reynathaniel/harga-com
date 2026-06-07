'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Link2, ScanLine, X, TrendingUp } from 'lucide-react'
import { TRENDING_SEARCHES } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  size?: 'hero' | 'normal'
  initialValue?: string
}

export function SearchBar({ size = 'normal', initialValue = '' }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialValue)
  const [focused, setFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (query.length > 1) {
      const filtered = TRENDING_SEARCHES.filter(s =>
        s.toLowerCase().includes(query.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 6))
    } else {
      setSuggestions([])
    }
  }, [query])

  const handleSearch = (q?: string) => {
    const term = q || query
    if (!term.trim()) return
    setFocused(false)
    router.push(`/cari?q=${encodeURIComponent(term.trim())}`)
  }

  const isUrl = query.startsWith('http://') || query.startsWith('https://')

  return (
    <div className="relative w-full">
      <div className={cn(
        'flex items-center gap-2 bg-[var(--bg-card)] border rounded-xl transition-all',
        focused
          ? 'border-amber-500/50 shadow-[0_0_0_3px_rgba(245,158,11,0.10)]'
          : 'border-[var(--border-subtle)] hover:border-[var(--border)]',
        size === 'hero' ? 'px-4 py-3.5' : 'px-3 py-2.5'
      )}>

        {isUrl
          ? <Link2 size={18} className="text-amber-400 shrink-0" />
          : <Search size={18} className="text-[var(--text-muted)] shrink-0" />
        }

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder={size === 'hero'
            ? "Coba 'iPhone 15 Pro Max' atau tempel link produk"
            : "Cari produk atau tempel URL..."}
          className={cn(
            'flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            size === 'hero' ? 'text-base' : 'text-sm'
          )}
        />

        {query && (
          <button onClick={() => setQuery('')} className="text-[var(--text-muted)] hover:text-white transition-colors">
            <X size={16} />
          </button>
        )}

        <button
          onClick={() => handleSearch()}
          className={cn(
            'shrink-0 font-semibold rounded-lg transition-all flex items-center gap-1.5',
            'bg-amber-500 hover:bg-amber-400 text-white shadow-sm shadow-amber-500/20',
            size === 'hero' ? 'px-5 py-2 text-sm' : 'px-3 py-1.5 text-xs'
          )}>
          {isUrl ? (
            <><ScanLine size={14} /> Analisa</>
          ) : (
            <>Bandingkan</>
          )}
        </button>
      </div>

      {/* Dropdown */}
      {focused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-2xl overflow-hidden z-50">
          {suggestions.length > 0 ? (
            <div className="py-2">
              <div className="px-3 py-1.5 text-xs text-[var(--text-muted)] font-medium">Saran pencarian</div>
              {suggestions.map(s => (
                <button key={s} onMouseDown={() => handleSearch(s)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-[var(--bg-hover)] transition-colors">
                  <Search size={14} className="text-[var(--text-muted)]" />
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-2">
              <div className="px-3 py-1.5 text-xs text-[var(--text-muted)] font-medium flex items-center gap-1.5">
                <TrendingUp size={12} /> Trending sekarang
              </div>
              {TRENDING_SEARCHES.slice(0, 6).map(s => (
                <button key={s} onMouseDown={() => handleSearch(s)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-[var(--bg-hover)] transition-colors">
                  <span className="text-amber-400 text-xs">🔥</span>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
