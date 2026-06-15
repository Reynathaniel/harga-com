export const dynamic = 'force-dynamic'
export const revalidate = 0

import { SearchAutocomplete } from '@/components/SearchAutocomplete'
import { ProductCard } from '@/components/ProductCard'
import { getProducts, getCategories } from '@/lib/db/products'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah } from '@/lib/utils'
import { SlidersHorizontal, TrendingDown, Star, Package, Sparkles, Search } from 'lucide-react'
import Link from 'next/link'

interface SearchPageProps {
  searchParams: {
    q?: string
    kategori?: string
    sort?: string
    min?: string
    max?: string
    platform?: string
    condition?: string
  }
}

const SORT_OPTIONS = [
  { value: 'lowest',  label: 'Termurah',      icon: '\u{1F4B8}' },
  { value: 'popular', label: 'Populer',        icon: '\u{1F525}' },
  { value: 'newest',  label: 'Terbaru',        icon: '\u{2728}'  },
  { value: 'rating',  label: 'Rating Terbaik', icon: '\u{2B50}'  },
  { value: 'highest', label: 'Termahal',       icon: '\u{1F4C8}' },
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
      <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        {query ? 'Produk "' + query + '" tidak ditemukan' : 'Tidak ada produk'}
      </h3>
      <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-sm mx-auto">
        Coba kata kunci lain, atau gunakan URL produk langsung dari marketplace
      </p>
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {['iPhone 15', 'Samsung S24', 'Laptop Gaming', 'Sepatu Nike', 'PS5'].map(s => (
          <Link key={s} href={'/cari?q=' + encodeURIComponent(s)}
            className="px-3 py-1.5 text-xs bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--brand)] hover:border-amber-500/40 rounded-full transition-colors">
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
  const platform  = searchParams.platform || ''
  const condition = searchParams.condition || ''
  const minPrice = searchParams.min ? Number(searchParams.min) : undefined
  const maxPrice = searchParams.max ? Number(searchParams.max) : undefined

  const { products, total, source } = await getProducts({
    query,
    category: category || undefined,
    platform: platform || undefined,
    condition: (condition as 'new' | 'used') || undefined,
    minPrice,
    maxPrice,
    sort,
    limit: 40,
  })

  const categories = await getCategories()
  const priceDropCount = Math.max(1, Math.ceil(products.length * 0.3))
  const activeCategory = categories.find(c => c.id === category)
  const activePlatform = platform ? PLATFORMS[platform] : null
  const platformList = Object.values(PLATFORMS)

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const base: Record<string, string | undefined> = {
      q:        query    || undefined,
      kategori: category || undefined,
      platform:  platform  || undefined,
      condition: condition || undefined,
      sort,
      min: searchParams.min,
      max: searchParams.max,
      ...overrides,
    }
    Object.entries(base).forEach(([k, v]) => { if (v) params.set(k, v) })
    return '/cari?' + params.toString()
  }

  return (
    <div className="pt-[88px] min-h-screen">

      {/* Search bar */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-subtle)] px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <SearchAutocomplete initialValue={query} />
        </div>
      </div>

      {/* Category tabs */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-2 whitespace-nowrap">
          <Link href={buildHref({ kategori: undefined })}
            className={'px-3 py-1.5 text-xs rounded-full border transition-colors shrink-0 font-medium ' +
              (!category ? 'bg-amber-500 text-white border-amber-500' : 'text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-amber-500/40 hover:text-[var(--brand)]')}>
            Semua
          </Link>
          {categories.map(cat => (
            <Link key={cat.id} href={buildHref({ kategori: cat.id })}
              className={'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors shrink-0 font-medium ' +
                (category === cat.id ? 'bg-amber-500 text-white border-amber-500' : 'text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-amber-500/40 hover:text-[var(--brand)]')}>
              <span>{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Condition filter tabs */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mr-1 shrink-0">
            Kondisi:
          </span>
          {[
            { value: '',     label: 'Semua' },
            { value: 'new',  label: '✨ Baru' },
            { value: 'used', label: '♻️ Bekas' },
          ].map(opt => (
            <Link
              key={opt.value}
              href={buildHref({ condition: opt.value || undefined })}
              className={'px-3 py-1 text-xs rounded-full border transition-colors shrink-0 font-medium ' +
                (condition === opt.value
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-orange-400/40 hover:text-[var(--brand)]')}>
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Platform filter tabs */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mr-1 shrink-0">
            Platform:
          </span>
          <Link
            href={buildHref({ platform: undefined })}
            className={'px-3 py-1 text-xs rounded-full border transition-colors shrink-0 font-medium ' +
              (!platform
                ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] border-amber-500/50'
                : 'text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-amber-500/30 hover:text-[var(--brand)]')}>
            Semua
          </Link>
          {platformList.map(p => {
            const isActive = platform === p.id
            const bg = p.id === 'tiktok' ? '#1a1a1a' : p.color
            return (
              <Link
                key={p.id}
                href={buildHref({ platform: p.id })}
                className={'flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-all shrink-0 font-medium ' +
                  (isActive
                    ? 'text-white border-transparent shadow-sm'
                    : 'text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--brand)]')}
                style={isActive ? { background: bg, borderColor: bg } : {}}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: bg }}
                />
                {p.name}
                <span className="text-[9px] opacity-60">CB {p.cashbackPct}%</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <aside className="hidden lg:block lg:w-60 shrink-0">
            <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 sticky top-24 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  <SlidersHorizontal size={14} className="text-amber-400" />
                  Filter
                </div>
                <Link href="/cari" className="text-[10px] text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">Reset</Link>
              </div>

              <div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Platform</div>
                <div className="space-y-1.5">
                  <Link
                    href={buildHref({ platform: undefined })}
                    className={'flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-colors ' +
                      (!platform ? 'bg-amber-500/10 text-amber-400 font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--brand)] hover:bg-[var(--bg-hover)]')}>
                    <span className="w-5 h-5 rounded-md bg-[var(--bg-hover)] border border-[var(--border-subtle)] flex items-center justify-center text-[9px] font-bold text-[var(--text-primary)] shrink-0">
                      All
                    </span>
                    Semua Platform
                  </Link>
                  {platformList.map(p => (
                    <Link key={p.id} href={buildHref({ platform: p.id })}
                      className={'flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-colors ' +
                        (platform === p.id ? 'bg-amber-500/10 text-amber-400 font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--brand)] hover:bg-[var(--bg-hover)]')}>
                      <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                        style={{ background: p.id === 'tiktok' ? '#1a1a1a' : p.color }}>
                        {p.shortName.slice(0, 2)}
                      </div>
                      <span className="flex-1">{p.name}</span>
                      <span className="text-[10px] text-amber-400 font-medium">{p.cashbackPct}%</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Rentang Harga</div>
                <div className="space-y-1">
                  {PRICE_PRESETS.map(preset => (
                    <Link key={preset.label}
                      href={buildHref({ min: String(preset.min), max: String(preset.max) })}
                      className={'block w-full text-left text-xs px-3 py-2 rounded-xl transition-colors ' +
                        (minPrice === preset.min && maxPrice === preset.max
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          : 'text-[var(--text-secondary)] hover:text-[var(--brand)] hover:bg-[var(--bg-hover)]')}>
                      {preset.label}
                    </Link>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <input type="number" placeholder="Min"
                    className="flex-1 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-xl px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-amber-500/50 w-0 transition-colors" />
                  <input type="number" placeholder="Max"
                    className="flex-1 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-xl px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-amber-500/50 w-0 transition-colors" />
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
                      <span className="text-xs text-[var(--text-secondary)] ml-1 group-hover:text-[var(--brand)] transition-colors">{r}+</span>
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
                    <span className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--brand)] transition-colors">{label}</span>
                  </label>
                ))}
              </div>

              <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 pt-1 border-t border-[var(--border-subtle)]">
                <span className={'w-1.5 h-1.5 rounded-full shrink-0 ' + (source === 'supabase' ? 'bg-green-400' : 'bg-amber-400')} />
                {source === 'supabase' ? 'Data live dari Supabase' : 'Mode demo (mock data)'}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">

            {/* Active filter pills */}
            {(activePlatform || activeCategory || minPrice !== undefined) && (
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="text-xs text-[var(--text-muted)]">Filter aktif:</span>
                {activePlatform && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full text-white"
                    style={{ background: activePlatform.id === 'tiktok' ? '#1a1a1a' : activePlatform.color }}>
                    {activePlatform.name}
                    <Link href={buildHref({ platform: undefined })} className="ml-0.5 opacity-70 hover:opacity-100 leading-none">x</Link>
                  </span>
                )}
                {activeCategory && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    {activeCategory.icon} {activeCategory.label}
                    <Link href={buildHref({ kategori: undefined })} className="ml-0.5 opacity-70 hover:opacity-100 leading-none">x</Link>
                  </span>
                )}
                {minPrice !== undefined && maxPrice !== undefined && maxPrice < 999999999 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    {formatRupiah(minPrice, true)} - {formatRupiah(maxPrice, true)}
                    <Link href={buildHref({ min: undefined, max: undefined })} className="ml-0.5 opacity-70 hover:opacity-100 leading-none">x</Link>
                  </span>
                )}
              </div>
            )}

            <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
              <div>
                <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {query
                    ? 'Hasil untuk "' + query + '"'
                    : activePlatform
                      ? 'Produk di ' + activePlatform.name
                      : activeCategory
                        ? activeCategory.icon + ' ' + activeCategory.label
                        : 'Semua Produk'}
                </h1>
                <p className="text-sm text-[var(--text-muted)]">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{total}</span> produk ditemukan
                  {activePlatform && (
                    <span> - termurah di <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{activePlatform.name}</span></span>
                  )}
                  {minPrice !== undefined && maxPrice !== undefined && maxPrice < 999999999 && (
                    <span> - {formatRupiah(minPrice, true)} s/d {formatRupiah(maxPrice, true)}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {SORT_OPTIONS.slice(0, 4).map(opt => (
                  <Link key={opt.value} href={buildHref({ sort: opt.value })}
                    className={'flex items-center gap-1 px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ' +
                      (sort === opt.value
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--brand)] hover:border-amber-500/40')}>
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
                  <Sparkles size={10} />
                  {activePlatform ? 'CB ' + activePlatform.cashbackPct + '% aktif' : 'Cashback aktif'}
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
                <button className="group px-8 py-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-amber-500/35 hover:bg-[var(--bg-hover)] rounded-2xl text-sm font-medium transition-all flex items-center gap-2 mx-auto">
                  <Package size={16} className="group-hover:animate-bounce" />
                  Muat Lebih Banyak
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
