export const dynamic = 'force-dynamic'

import { SearchAutocomplete } from '@/components/SearchAutocomplete'
import { ProductCard } from '@/components/ProductCard'
import { getProducts, getCategories } from '@/lib/db/products'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah } from '@/lib/utils'
import { SlidersHorizontal, TrendingDown, Star, Package, Sparkles, Search } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 300

interface SearchPageProps {
  searchParams: { q?: string; kategori?: string; sort?: string; min?: string; max?: string }
}

const SORT_OPTIONS = [
  { value: 'lowest',  label: 'Termurah',      icon: '\U0001f4b8' },
  { value: 'popular', label: 'Populer',        icon: '\U0001f525' },
  { value: 'newest',  label: 'Terbaru',        icon: '\U00002728' },
  { value: 'rating',  label: 'Rating Terbaik', icon: '\U00002b50' },
  { value: 'highest', label: 'Termahal',       icon: '\U0001f4c8' },
]

const PRICE_PRESETS = [
  { label: 'Di bawah 500rb', min: 0,        max: 500000 },
  { label: '500rb - 2Jt',    min: 500000,   max: 2000000 },
  { label: '2Jt - 5Jt',      min: 2000000,  max: 5000000 },
  { label: '5Jt - 15Jt',     min: 5000000,  max: 15000000 },
  { label: 'Di atas 15Jt',   min: 15000000, max: 999999999 },
]

function EmptyState({ query }: { query: string }) {
  return (
    <div className="text-center py-20 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl fade-in">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-6 opacity-50">
        <circle cx="60" cy="60" r="58" stroke="#3f3f46" strokeWidth="2" />
        <circle cx="52" cy="50" r="22" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 3" />
        <line x1="69" y1="67" x2="88" y2="86" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
        <circle cx="52" cy="50" r="13" fill="#f59e0b20" />
        <path d="M46 50h12M52 44v12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h3 className="text-lg font-semibold text-white mb-2">
        {query ? "Produk \"" + query + "\" tidak ditemukan" : 'Tidak ada produk'}
      </h3>
      <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-sm mx-auto">
        Coba kata kunci lain, atau gunakan URL produk langsung dari marketplace
      </p>
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {['iPhone 15', 'Samsung S24', 'Laptop Gaming', 'Sepatu Nike', 'PS5'].map(s => (
          <Link key={s} href={"/cari?q=" + encodeURIComponent(s)}
            className="px-3 py-1.5 text-xs bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-amber-500/40 rounded-full transition-colors">
            {s}
          </Link>
        ))}
      </div>
      <Link href="/cari"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold rounded-xl transition-colors">
        <Search size={14} />
        Lihat Semua Produk
      </Link>
    </div>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query    = searchParams.q || ''
  const category = searchParams.kategori || ''
  const sort     = (searchParams.sort || 'lowest') as 'lowest' | 'highest' | 'rating' | 'popular' | 'newest'
  const minPrice = searchParams.min ? Number(searchParams.min) : undefined
  const maxPrice = searchParams.max ? Number(searchParams.max) : undefined

  const { products, total, source } = await getProducts({
    query,
    category: category || undefined,
    minPrice,
    maxPrice,
    sort,
    limit: 40,
  })

  const categories = await getCategories()
  const priceDropCount = Math.max(1, Math.ceil(products.length * 0.3))
  const activeCategory = categories.find(c => c.id === category)

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const base: Record<string, string | undefined> = {
      q: query || undefined,
      kategori: category || undefined,
      sort,
      min: searchParams.min,
      max: searchParams.max,
      ...overrides,
    }
    Object.entries(base).forEach(([k, v]) => { if (v) params.set(k, v) })
    return "/cari?" + params.toString()
  }

  return (
    <div className="pt-[88px] min-h-screen">
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-subtle)] px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <SearchAutocomplete initialValue={query} />
        </div>
      </div>

      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-x-auto scroll-x-hidden">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-2 whitespace-nowrap">
          <Link href="/cari"
            className={"px-3 py-1.5 text-xs rounded-full border transition-colors shrink-0 font-medium " +
              (!category ? 'bg-amber-500 text-white border-amber-500' : 'text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-amber-500/40 hover:text-white')}>
            Semua
          </Link>
          {categories.map(cat => (
            <Link key={cat.id} href={buildHref({ kategori: cat.id })}
              className={"flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors shrink-0 font-medium " +
                (category === cat.id ? 'bg-amber-500 text-white border-amber-500' : 'text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-amber-500/40 hover:text-white')}>
              <span>{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <aside className="hidden lg:block lg:w-60 shrink-0">
            <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 sticky top-24 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-white text-sm">
                  <SlidersHorizontal size={14} className="text-amber-400" />
                  Filter
                </div>
                <Link href="/cari" className="text-[10px] text-[var(--text-muted)] hover:text-white transition-colors">Reset</Link>
              </div>

              <div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Platform</div>
                <div className="space-y-2.5">
                  {Object.values(PLATFORMS).map(p => (
                    <label key={p.id} className="flex items-center gap-2.5 cursor-pointer group">
                      <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded accent-amber-500 shrink-0" />
                      <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                        style={{ background: p.id === 'tiktok' ? '#1a1a1a' : p.color }}>
                        {p.shortName.slice(0, 2)}
                      </div>
                      <span className="text-xs text-[var(--text-secondary)] group-hover:text-white transition-colors flex-1">{p.name}</span>
                      <span className="text-[10px] text-amber-400 font-medium">{p.cashbackPct}%</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Rentang Harga</div>
                <div className="space-y-1">
                  {PRICE_PRESETS.map(preset => (
                    <Link key={preset.label}
                      href={buildHref({ min: String(preset.min), max: String(preset.max) })}
                      className={"block w-full text-left text-xs px-3 py-2 rounded-xl transition-colors " +
                        (minPrice === preset.min && maxPrice === preset.max
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]')}>
                      {preset.label}
                    </Link>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input type="number" placeholder="Min"
                    className="flex-1 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-xl px-2 py-1.5 text-xs text-white outline-none focus:border-amber-500/50 w-0 transition-colors" />
                  <input type="number" placeholder="Max"
                    className="flex-1 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-xl px-2 py-1.5 text-xs text-white outline-none focus:border-amber-500/50 w-0 transition-colors" />
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Rating Minimal</div>
                {[4.5, 4, 3].map(r => (
                  <label key={r} className="flex items-center gap-2 mb-2 cursor-pointer group">
                    <input type="radio" name="rating" className="accent-amber-500 shrink-0" />
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={10}
                          fill={i < Math.floor(r) ? '#f59e0b' : 'transparent'}
                          className={i < Math.floor(r) ? 'text-amber-400' : 'text-[var(--text-muted)]'} />
                      ))}
                      <span className="text-xs text-[var(--text-secondary)] ml-1 group-hover:text-white transition-colors">{r}+</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="space-y-2.5">
                {[
                  { label: 'Gratis Ongkir', checked: false },
                  { label: 'Toko Resmi',    checked: false },
                  { label: 'Ada Cashback',  checked: true },
                ].map(({ label, checked }) => (
                  <label key={label} className="flex items-center gap-2.5 cursor-pointer group">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded accent-amber-500 shrink-0" defaultChecked={checked} />
                    <span className="text-xs text-[var(--text-secondary)] group-hover:text-white transition-colors">{label}</span>
                  </label>
                ))}
              </div>

              <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 pt-1 border-t border-[var(--border-subtle)]">
                <span className={"w-1.5 h-1.5 rounded-full shrink-0 " + (source === 'supabase' ? 'bg-green-400' : 'bg-amber-400')} />
                {source === 'supabase' ? 'Data live dari Supabase' : 'Mode demo (mock data)'}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {query ? "Hasil untuk \"" + query + "\"" : activeCategory ? activeCategory.icon + ' ' + activeCategory.label : 'Semua Produk'}
                </h1>
                <p className="text-sm text-[var(--text-muted)]">
                  <span className="text-white font-medium">{total}</span> produk ditemukan
                  {minPrice !== undefined && maxPrice !== undefined && maxPrice < 999999999 && (
                    <span> &#183; {formatRupiah(minPrice, true)} &#8211; {formatRupiah(maxPrice, true)}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {SORT_OPTIONS.slice(0, 4).map(opt => (
                  <Link key={opt.value} href={buildHref({ sort: opt.value })}
                    className={"flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border font-medium transition-colors " +
                      (sort === opt.value
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-amber-500/40')}>
                    <span>{opt.icon}</span>
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>

            {products.length > 0 && (
              <div className="flex items-center gap-3 bg-green-500/5 border border-green-500/15 rounded-xl px-4 py-3 mb-5 text-sm">
                <TrendingDown size={16} className="text-green-400 shrink-0" />
                <span className="text-green-400 font-medium">{priceDropCount} produk turun harga</span>
                <span className="text-[var(--text-muted)]">dalam 24 jam terakhir</span>
                <span className="ml-auto text-[10px] text-amber-400 flex items-center gap-1 shrink-0">
                  <Sparkles size={10} /> Cashback aktif
                </span>
              </div>
            )}

            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <EmptyState query={query} />
            )}

            {products.length >= 40 && (
              <div className="text-center mt-10">
                <button className="group px-8 py-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-amber-500/35 hover:bg-[var(--bg-hover)] rounded-2xl text-sm font-medium transition-all flex items-center gap-2 mx-auto">
                  <Package size={16} className="group-hover:animate-bounce" />
                  Muat lebih banyak produk
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
