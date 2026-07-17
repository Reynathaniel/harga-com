export const dynamic = 'force-dynamic'
export const revalidate = 0

const CATEGORY_LABELS: Record<string, string> = {
  'elektronik': 'Elektronik',
  'fashion': 'Fashion',
  'rumah-tangga': 'Rumah Tangga',
  'gaming': 'Gaming',
  'kecantikan': 'Kecantikan & Perawatan',
  'olahraga': 'Olahraga & Outdoor',
  'motor-bekas': 'Motor Bekas',
  'mobil-bekas': 'Mobil Bekas',
  'rumah-bekas': 'Rumah Bekas',
  'tanah-bekas': 'Tanah Bekas',
  'lainnya':      'Lainnya',
}

export function generateMetadata({ searchParams }: { searchParams: Record<string, string> }) {
  const q = searchParams?.q ?? ''
  const kategori = searchParams?.kategori ?? ''
  const categoryLabel = kategori ? (CATEGORY_LABELS[kategori] ?? kategori) : ''

  if (q) {
    return {
      title: `Harga "${q}" — Bandingkan dari Semua Marketplace | Harga.com`,
      description: `Bandingkan harga ${q} dari Tokopedia, Shopee, Lazada, Blibli, dan marketplace lainnya. Temukan harga terbaik dan hemat lebih banyak di Harga.com.`,
    }
  }
  if (categoryLabel) {
    return {
      title: `${categoryLabel} — Harga Terbaik dari Semua Marketplace | Harga.com`,
      description: `Temukan produk ${categoryLabel} terbaik dari Tokopedia, Shopee, Lazada dan 14+ marketplace Indonesia. Bandingkan harga dan cashback di Harga.com.`,
    }
  }
  return {
    title: 'Cari Produk — Bandingkan Harga Terbaik | Harga.com',
    description: 'Cari dan bandingkan harga produk dari Tokopedia, Shopee, Lazada, Blibli, TikTok Shop, dan marketplace lainnya di Indonesia.',
  }
}

import { SearchAutocomplete } from '@/components/SearchAutocomplete'
import { ProductCard } from '@/components/ProductCard'
import { getProducts, getCategories } from '@/lib/db/products'
import { PLATFORMS, PLATFORM_VEHICLE } from '@/lib/platforms'
import { formatRupiah } from '@/lib/utils'
import { tryGetServerClient } from '@/lib/supabase'
import { SlidersHorizontal, TrendingDown, Package, Sparkles, Search, Car } from 'lucide-react'
import Link from 'next/link'
import { PropertyCityStats } from '@/components/PropertyCityStats'

interface SearchPageProps {
  searchParams: {
    q?: string
    kategori?: string
    sort?: string
    min?: string
    max?: string
    platform?: string
    condition?: string
    offset?: string
    kt?: string       // kamar tidur (bedrooms min) for property
    sert?: string     // sertifikat type for property
    lt_min?: string   // luas tanah min (m²) for property
    lt_max?: string
    merk?: string
    kota?: string   // luas tanah max (m²) for property
  }
}

async function getRealPriceDropCount(): Promise<number> {
  const db = tryGetServerClient()
  if (!db) return 0
  try {
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
    const { count } = await db
      .from('price_history')
      .select('offer_id', { count: 'exact', head: true })
      .gte('recorded_at', since)
    return count ?? 0
  } catch {
    return 0
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

const VEHICLE_PRICE_PRESETS = [
  { label: 'Di bawah 50Jt',   min: 0,          max: 50000000  },
  { label: '50Jt - 100Jt',    min: 50000000,   max: 100000000 },
  { label: '100Jt - 200Jt',   min: 100000000,  max: 200000000 },
  { label: '200Jt - 500Jt',   min: 200000000,  max: 500000000 },
  { label: 'Di atas 500Jt',   min: 500000000,  max: 999999999 },
]

const VEHICLE_CATEGORIES = ['mobil-bekas', 'motor-bekas']
const PROPERTY_CATEGORIES = ['rumah-bekas', 'tanah-bekas']

function EmptyState({ query, isVehicle }: { query: string; isVehicle: boolean }) {
  const suggestions = isVehicle
    ? ['Toyota Avanza', 'Honda Jazz', 'Suzuki Ertiga', 'Daihatsu Xenia', 'Toyota Kijang']
    : ['iPhone 15', 'Samsung S24', 'Laptop Gaming', 'Sepatu Nike', 'PS5']

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
        {isVehicle
          ? 'Coba kata kunci merk atau model kendaraan, misalnya "Toyota" atau "Honda Brio"'
          : 'Coba kata kunci lain, atau gunakan URL produk langsung dari marketplace'}
      </p>
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {suggestions.map(s => (
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
  const offset   = searchParams.offset ? Number(searchParams.offset) : 0
  const PAGE_SIZE = 40
  const MOTOR_BRANDS = ['Honda', 'Yamaha', 'Kawasaki', 'Suzuki', 'Vespa', 'Royal Enfield']
  const MOBIL_BRANDS = ['Toyota', 'Honda', 'Daihatsu', 'Suzuki', 'Mitsubishi', 'Wuling', 'Nissan', 'Hyundai']
  const KOTA_LIST = ['Jakarta', 'Bandung', 'Surabaya', 'Bekasi', 'Tangerang', 'Depok', 'Bogor', 'Semarang', 'Yogyakarta', 'Medan', 'Makassar', 'Bali']

  const kt      = searchParams.kt || ''
  const sert    = searchParams.sert || ''
  const ltMin   = searchParams.lt_min ? Number(searchParams.lt_min) : undefined
  const ltMax   = searchParams.lt_max ? Number(searchParams.lt_max) : undefined
  const merk     = searchParams.merk || ''
  const kota     = searchParams.kota || ''

  const isVehicleCategory = VEHICLE_CATEGORIES.includes(category)
  const isPropertyCategory = PROPERTY_CATEGORIES.includes(category)
  const vehiclePlatformIds = new Set(PLATFORM_VEHICLE)
  const propertyPlatformIds = new Set(['olx', 'carousell'])

  const [{ products, total, source }, categories, priceDropCount] = await Promise.all([
    getProducts({
      query,
      category: category || undefined,
      platform: platform || undefined,
      condition: (condition as 'new' | 'used') || undefined,
      minPrice,
      maxPrice,
      sort,
      limit: PAGE_SIZE,
      offset,
      merk: merk || undefined,
      kota: kota || undefined,
    }),
    getCategories(),
    getRealPriceDropCount(),
  ])
  const activeCategory = categories.find(c => c.id === category)
  const activePlatform = platform ? PLATFORMS[platform] : null
  const allPlatforms = Object.values(PLATFORMS)

  // Smart platform groups:
  // - Vehicle categories: show vehicle platforms
  // - Property categories: show OLX/Carousell only
  // - Regular categories/all: show regular marketplaces only
  const regularPlatforms = allPlatforms.filter(p => !vehiclePlatformIds.has(p.id) && !propertyPlatformIds.has(p.id))
  const vehiclePlatforms = allPlatforms.filter(p => vehiclePlatformIds.has(p.id))
  const propertyPlatforms = allPlatforms.filter(p => propertyPlatformIds.has(p.id))
  const activePlatformList = isVehicleCategory ? vehiclePlatforms
    : isPropertyCategory ? propertyPlatforms
    : regularPlatforms

  const PROPERTY_PRICE_PRESETS = [
    { label: '< 500jt',    min: 0, max: 500_000_000 },
    { label: '500jt–1M',   min: 500_000_000, max: 1_000_000_000 },
    { label: '1M–3M',      min: 1_000_000_000, max: 3_000_000_000 },
    { label: '3M–5M',      min: 3_000_000_000, max: 5_000_000_000 },
    { label: '> 5M',       min: 5_000_000_000, max: 999_999_999_999 },
  ]
  const pricePresets = isVehicleCategory ? VEHICLE_PRICE_PRESETS
    : isPropertyCategory ? PROPERTY_PRICE_PRESETS
    : PRICE_PRESETS

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
      offset: offset > 0 ? String(offset) : undefined,
      kt: kt || undefined,
      sert: sert || undefined,
      lt_min: searchParams.lt_min,
      lt_max: searchParams.lt_max,
      merk: merk || undefined,
      kota: kota || undefined,
      ...overrides,
    }
    Object.entries(base).forEach(([k, v]) => { if (v) params.set(k, v) })
    return '/cari?' + params.toString()
  }

  return (
    <div className="pt-[88px] min-h-screen">

      {/* Search bar */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-subtle)] px-4 py-4">
        <div className="max-w-[1440px] mx-auto">
          <SearchAutocomplete initialValue={query} />
        </div>
      </div>

      {/* Category tabs */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-x-auto">
        <div className="max-w-[1440px] mx-auto px-4 py-2.5 flex items-center gap-2 whitespace-nowrap">
          <Link href={buildHref({ kategori: undefined, platform: undefined })}
            className={'px-3 py-1.5 text-xs rounded-full border transition-colors shrink-0 font-medium ' +
              (!category ? 'bg-amber-500 text-white border-amber-500' : 'text-[var(--text-secondary)] border-[var(--border-subtle)] hover:border-amber-500/40 hover:text-[var(--brand)]')}>
            Semua
          </Link>
          {categories.map(cat => (
            <Link key={cat.id} href={buildHref({ kategori: cat.id, platform: undefined })}
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
        <div className="max-w-[1440px] mx-auto px-4 py-2 flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mr-1 shrink-0">
            Kondisi:
          </span>
          {[
            { value: '',     label: 'Semua' },
            { value: 'new',  label: 'Baru' },
            { value: 'used', label: 'Bekas' },
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

      {/* Platform filter tabs — smart: vehicle platforms only shown for vehicle categories */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-x-auto">
        <div className="max-w-[1440px] mx-auto px-4 py-2 flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mr-1 shrink-0 flex items-center gap-1">
            {isVehicleCategory && <Car size={10} />}
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
          {activePlatformList.map(p => {
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
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: bg }} />
                {p.name}
                {!isVehicleCategory && <span className="text-[9px] opacity-60">CB {p.cashbackPct}%</span>}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 py-6">
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
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-1">
                  {isVehicleCategory && <Car size={10} />}
                  Platform
                </div>
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
                  {activePlatformList.map(p => (
                    <Link key={p.id} href={buildHref({ platform: p.id })}
                      className={'flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-colors ' +
                        (platform === p.id ? 'bg-amber-500/10 text-amber-400 font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--brand)] hover:bg-[var(--bg-hover)]')}>
                      <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                        style={{ background: p.id === 'tiktok' ? '#1a1a1a' : p.color }}>
                        {p.shortName.slice(0, 2)}
                      </div>
                      <span className="flex-1">{p.name}</span>
                      {!isVehicleCategory && <span className="text-[10px] text-amber-400 font-medium">{p.cashbackPct}%</span>}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">Rentang Harga</div>
                <div className="space-y-1">
                  {pricePresets.map(preset => (
                    <Link key={preset.label}
                      href={buildHref({ min: String(preset.min), max: String(preset.max), offset: undefined })}
                      className={'block w-full text-left text-xs px-3 py-2 rounded-xl transition-colors ' +
                        (minPrice === preset.min && maxPrice === preset.max
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          : 'text-[var(--text-secondary)] hover:text-[var(--brand)] hover:bg-[var(--bg-hover)]')}>
                      {preset.label}
                    </Link>
                  ))}
                </div>
                {/* Custom price range */}
                <form action="/cari" method="get" className="flex gap-2 mt-2 items-center">
                  {query     && <input type="hidden" name="q"        value={query} />}
                  {category  && <input type="hidden" name="kategori" value={category} />}
                  {platform  && <input type="hidden" name="platform" value={platform} />}
                  {condition && <input type="hidden" name="condition" value={condition} />}
                  {sort !== 'lowest' && <input type="hidden" name="sort" value={sort} />}
                  <input type="number" name="min" defaultValue={searchParams.min} placeholder="Min"
                    className="flex-1 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-xl px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-amber-500/50 w-0 transition-colors" />
                  <input type="number" name="max" defaultValue={searchParams.max} placeholder="Max"
                    className="flex-1 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-xl px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-amber-500/50 w-0 transition-colors" />
                  <button type="submit"
                    className="shrink-0 px-2 py-1.5 text-[10px] font-bold rounded-xl bg-amber-500 text-white border-none cursor-pointer">
                    OK
                  </button>
                </form>
              </div>


              {isVehicleCategory && (<>{/* Merk filter */}<div><div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2.5">🏷️ Merk</div><div className="flex flex-wrap gap-1.5">{['', ...(category === 'motor-bekas' ? MOTOR_BRANDS : MOBIL_BRANDS)].map(b => (<Link key={b||"all"} href={buildHref({ merk: b||undefined, offset: undefined })}className={"px-2.5 py-1 text-xs rounded-lg border transition-colors " + (merk === b ? "bg-amber-500/15 text-amber-400 border-amber-500/25 font-semibold" : "text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--brand)] hover:bg-[var(--bg-hover)]")}>{b||"Semua"}</Link>))}</div></div>{/* Kota filter */}<div><div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2.5">📍 Kota</div><div className="flex flex-wrap gap-1.5"><Link href={buildHref({ kota: undefined, offset: undefined })} className={"px-2.5 py-1 text-xs rounded-lg border transition-colors " + (!kota ? "bg-amber-500/15 text-amber-400 border-amber-500/25 font-semibold" : "text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--brand)] hover:bg-[var(--bg-hover)]")}>Semua</Link>{KOTA_LIST.map(k => (<Link key={k} href={buildHref({ kota: k, offset: undefined })} className={"px-2.5 py-1 text-xs rounded-lg border transition-colors " + (kota === k ? "bg-amber-500/15 text-amber-400 border-amber-500/25 font-semibold" : "text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--brand)] hover:bg-[var(--bg-hover)]")}>{k}</Link>))}</div></div><div className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-3 py-3"><div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Car size={10}/> Kendaraan</div><p className="text-[10px] text-[var(--text-muted)]">Data dari OLX, Carousell, Carsome, Mobil123, OTO.</p></div></>)}

              {isPropertyCategory && (
                <>
                  {/* Kamar Tidur filter */}
                  <div>
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2.5">
                      🛏 Kamar Tidur
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['', '1', '2', '3', '4'].map(n => (
                        <Link
                          key={n}
                          href={buildHref({ kt: n || undefined, offset: undefined })}
                          className={'px-2.5 py-1 text-xs rounded-lg border transition-colors ' +
                            (kt === n
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/25 font-semibold'
                              : 'text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--brand)] hover:bg-[var(--bg-hover)]')}>
                          {n === '' ? 'Semua' : n === '4' ? '4+' : n}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Luas Tanah filter */}
                  <div>
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2.5">
                      📐 Luas Tanah (m²)
                    </div>
                    <form action="/cari" method="get" className="flex gap-2 items-center">
                      {query     && <input type="hidden" name="q"        value={query} />}
                      {category  && <input type="hidden" name="kategori" value={category} />}
                      {platform  && <input type="hidden" name="platform" value={platform} />}
                      {condition && <input type="hidden" name="condition" value={condition} />}
                      {kt        && <input type="hidden" name="kt"       value={kt} />}
                      {sert      && <input type="hidden" name="sert"     value={sert} />}
                      {sort !== 'lowest' && <input type="hidden" name="sort" value={sort} />}
                      <input type="number" name="lt_min" defaultValue={searchParams.lt_min} placeholder="Min"
                        className="flex-1 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-xl px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-amber-500/50 w-0 transition-colors" />
                      <input type="number" name="lt_max" defaultValue={searchParams.lt_max} placeholder="Max"
                        className="flex-1 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-xl px-2 py-1.5 text-xs text-[var(--text-primary)] outline-none focus:border-amber-500/50 w-0 transition-colors" />
                      <button type="submit"
                        className="shrink-0 px-2 py-1.5 text-[10px] font-bold rounded-xl bg-amber-500 text-white border-none cursor-pointer">
                        OK
                      </button>
                    </form>
                  </div>

                  {/* Kota filter */}<div><div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2.5">📍 Kota</div><div className="flex flex-wrap gap-1.5"><Link href={buildHref({ kota: undefined, offset: undefined })} className={"px-2.5 py-1 text-xs rounded-lg border transition-colors "+(!kota?"bg-amber-500/15 text-amber-400 border-amber-500/25 font-semibold":"text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--brand)] hover:bg-[var(--bg-hover)]")}>Semua</Link>{KOTA_LIST.map(k => (<Link key={k} href={buildHref({ kota: k, offset: undefined })} className={"px-2.5 py-1 text-xs rounded-lg border transition-colors "+(kota===k?"bg-amber-500/15 text-amber-400 border-amber-500/25 font-semibold":"text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--brand)] hover:bg-[var(--bg-hover)]")}>{k}</Link>))}</div></div>

                  {/* Sertifikat filter */}
                  <div>
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2.5">
                      📜 Sertifikat
                    </div>
                    <div className="space-y-1">
                      {[
                        { value: '', label: 'Semua' },
                        { value: 'SHM', label: 'SHM (Hak Milik)' },
                        { value: 'HGB', label: 'HGB' },
                        { value: 'SHGB', label: 'SHGB' },
                        { value: 'AJB', label: 'AJB / Girik' },
                      ].map(opt => (
                        <Link
                          key={opt.value}
                          href={buildHref({ sert: opt.value || undefined, offset: undefined })}
                          className={'block w-full text-left text-xs px-3 py-2 rounded-xl transition-colors ' +
                            (sert === opt.value
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                              : 'text-[var(--text-secondary)] hover:text-[var(--brand)] hover:bg-[var(--bg-hover)]')}>
                          {opt.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 pt-1 border-t border-[var(--border-subtle)]">
                <span className={'w-1.5 h-1.5 rounded-full shrink-0 ' + (source === 'supabase' ? 'bg-green-400' : 'bg-amber-400')} />
                {source === 'supabase' ? 'Harga diperbarui otomatis' : 'Mode demo'}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">

            {/* Active filter pills */}
            {(activePlatform || activeCategory || minPrice !== undefined || kt || sert || ltMin !== undefined || merk || kota) && (
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
                {kt && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    🛏 {kt === '4' ? '4+' : kt} KT
                    <Link href={buildHref({ kt: undefined })} className="ml-0.5 opacity-70 hover:opacity-100 leading-none">x</Link>
                  </span>
                )}
                {sert && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                    📜 {sert}
                    <Link href={buildHref({ sert: undefined })} className="ml-0.5 opacity-70 hover:opacity-100 leading-none">x</Link>
                  </span>
                )}
                {merk && (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">🏷️ {merk}<Link href={buildHref({ merk: undefined })} className="ml-0.5 opacity-70 hover:opacity-100 leading-none">x</Link></span>)}
                {kota && (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">📍 {kota}<Link href={buildHref({ kota: undefined })} className="ml-0.5 opacity-70 hover:opacity-100 leading-none">x</Link></span>)}
                {ltMin !== undefined && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    📐 {ltMin}–{ltMax ?? '∞'} m²
                    <Link href={buildHref({ lt_min: undefined, lt_max: undefined })} className="ml-0.5 opacity-70 hover:opacity-100 leading-none">x</Link>
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

            {priceDropCount > 0 && (
              <div className="flex items-center gap-3 bg-green-500/5 border border-green-500/15 rounded-xl px-4 py-3 mb-5 text-sm">
                <TrendingDown size={16} className="text-green-400 shrink-0" />
                <span className="text-green-400 font-medium">{priceDropCount} update harga</span>
                <span className="text-[var(--text-muted)]">dalam 7 hari terakhir</span>
                <span className="ml-auto text-[10px] text-amber-400 flex items-center gap-1 shrink-0">
                  <Sparkles size={10} />
                  {activePlatform ? 'CB ' + activePlatform.cashbackPct + '% aktif' : 'Cashback aktif'}
                </span>
              </div>
            )}

            {/* Mobile-only filter chips */}
            {(isVehicleCategory || isPropertyCategory) && (
              <div className="lg:hidden mb-3">
                {isVehicleCategory && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Merek</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
                      <Link href={buildHref({ merk: undefined, offset: undefined })} className={"whitespace-nowrap px-2.5 py-1 text-xs rounded-lg border transition-colors "+(!merk?"bg-amber-500/15 text-amber-400 border-amber-500/25 font-semibold":"text-[var(--text-secondary)] border-[var(--border-subtle)]")}>Semua</Link>
                      {(activeCategory?.id === 'motor-bekas' ? MOTOR_BRANDS : MOBIL_BRANDS).map(b => (
                        <Link key={b} href={buildHref({ merk: b, offset: undefined })} className={"whitespace-nowrap px-2.5 py-1 text-xs rounded-lg border transition-colors "+(merk===b?"bg-amber-500/15 text-amber-400 border-amber-500/25 font-semibold":"text-[var(--text-secondary)] border-[var(--border-subtle)]")}>{b}</Link>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">📍 Kota</p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
                    <Link href={buildHref({ kota: undefined, offset: undefined })} className={"whitespace-nowrap px-2.5 py-1 text-xs rounded-lg border transition-colors "+(!kota?"bg-amber-500/15 text-amber-400 border-amber-500/25 font-semibold":"text-[var(--text-secondary)] border-[var(--border-subtle)]")}>Semua</Link>
                    {KOTA_LIST.map(k => (
                      <Link key={k} href={buildHref({ kota: k, offset: undefined })} className={"whitespace-nowrap px-2.5 py-1 text-xs rounded-lg border transition-colors "+(kota===k?"bg-amber-500/15 text-amber-400 border-amber-500/25 font-semibold":"text-[var(--text-secondary)] border-[var(--border-subtle)]")}>{k}</Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <EmptyState query={query} isVehicle={isVehicleCategory} />
            )}


            {/* City price comparison for property categories */}
            {(category === 'rumah-bekas' || category === 'tanah-bekas') && (
              <PropertyCityStats category={category} />
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-10 gap-4 flex-wrap">
              {offset > 0 && (
                <Link href={buildHref({ offset: offset > PAGE_SIZE ? String(offset - PAGE_SIZE) : undefined })}
                  className="px-6 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-amber-500/35 hover:bg-[var(--bg-hover)] rounded-2xl text-sm font-medium transition-all flex items-center gap-2">
                  ← Sebelumnya
                </Link>
              )}
              {products.length >= PAGE_SIZE && offset + PAGE_SIZE < total && (
                <Link href={buildHref({ offset: String(offset + PAGE_SIZE) })}
                  className="group ml-auto px-8 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-amber-500/35 hover:bg-[var(--bg-hover)] rounded-2xl text-sm font-medium transition-all flex items-center gap-2">
                  <Package size={16} className="group-hover:animate-bounce" />
                  Muat Lebih Banyak
                </Link>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

