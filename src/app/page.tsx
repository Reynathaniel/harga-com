import { ProductCard } from '@/components/ProductCard'
import { HeroRealSearch } from '@/components/HeroSection'
import { DealTerbaikSection } from '@/components/DealTerbaikSection'
import { getProducts, getPromoProducts } from '@/lib/db/products'
import { tryGetServerClient } from '@/lib/supabase'
import { STATS } from '@/lib/mock-data'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah, lowestListingFirst, priceDiffPercent } from '@/lib/utils'
import type { Product } from '@/lib/types'
import { TrendingDown, Bell, Wallet, Shield, Zap, RefreshCw, ArrowRight, CheckCircle2, Flame } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'
import type { ReactNode } from 'react'
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getTrendingProducts() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = tryGetServerClient() as any
    if (!db) return []
    const { data, error } = await db
      .from('products_with_best_offer')
      .select('id, name, slug, image_url, best_price, total_reviews')
      .order('offer_count', { ascending: false })
      .order('total_reviews', { ascending: false, nullsFirst: false })
      .limit(8)
    if (error || !data || data.length === 0) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((p: any) => ({ ...p, click_count: p.total_reviews ?? 0 }))
  } catch {
    return []
  }
}

/* Eyebrow + title section head — matches design system SectionHead */
function SectionHead({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="reveal flex justify-between items-end flex-wrap gap-4 mb-6">
      <div>
        <div style={{
          fontSize: 10, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase' as const,
          color: 'var(--text-muted)', fontFamily: 'var(--font-ui)',
          marginBottom: 6,
        }}>{eyebrow}</div>
        <h2 style={{
          margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 400,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-editorial)',
          letterSpacing: '-0.01em',
        }}>{title}</h2>
      </div>
      {action}
    </div>
  )
}

export default async function HomePage() {
  const [
    { products: allProducts },
    { products: usedProducts },
    trendingProducts,
    promoProducts,
  ] = await Promise.all([
    getProducts({ sort: 'popular', limit: 16 }).catch(() => ({ products: [] as Product[], total: 0, source: 'mock' as const })),
    getProducts({ condition: 'used', sort: 'popular', limit: 8 }).catch(() => ({ products: [] as Product[], total: 0, source: 'mock' as const })),
    getTrendingProducts(),
    getPromoProducts(8).catch(() => [] as Product[]),
  ])

  const platformList = Object.values(PLATFORMS)

  const hematProducts = (allProducts ?? [])
    .map(p => {
      const sorted = lowestListingFirst(p.listings ?? [])
      const diff = sorted.length > 1 ? priceDiffPercent(sorted[0].price, sorted[sorted.length - 1].price) : 0
      const savings = sorted.length > 1 ? sorted[sorted.length - 1].price - sorted[0].price : 0
      return { product: p, diff, savings }
    })
    .filter(x => x.diff > 5 && isFinite(x.diff))
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 4)

  // JSON-LD: WebSite schema with Sitelinks Search Box
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Harga.com',
    url: 'https://harga.com',
    description: 'Bandingkan harga dari 17+ marketplace Indonesia. Barang baru & bekas.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://harga.com/cari?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <div className="pt-[92px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />

      {/* ── HERO ── */}
      <section className="hero-gradient relative overflow-hidden">
        {/* Animated mesh blobs */}
        <div className="harga-mesh">
          <span className="harga-blob b1" />
          <span className="harga-blob b2" />
          <span className="harga-blob b3" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-[72px] text-center" style={{ zIndex: 1 }}>
          {/* Green pill badge */}
          <div className="hero-enter-1 inline-flex items-center gap-2 mb-8" style={{
            padding: '6px 16px', borderRadius: 100,
            background: 'rgba(74,222,128,0.12)',
            border: '1px solid rgba(74,222,128,0.3)',
            fontSize: 12, fontWeight: 600,
            color: '#16a34a', fontFamily: 'var(--font-ui)',
            letterSpacing: '0.01em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', display: 'inline-block', flexShrink: 0 }} />
            {STATS.platforms}+ Marketplace · Barang Baru &amp; Bekas
          </div>

          {/* Instrument Serif headline */}
          <h1 className="hero-enter-2" style={{
            margin: '0 0 20px',
            fontFamily: 'var(--font-editorial)',
            fontSize: 'clamp(44px, 7.5vw, 76px)',
            fontWeight: 400,
            lineHeight: 1.05,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}>
            Harga terbaik.<br />
            <span style={{ color: 'var(--brand)' }}>Baru atau bekas.</span>
          </h1>

          <p className="hero-enter-3" style={{
            margin: '0 auto 40px', maxWidth: 560,
            fontSize: 'var(--text-lg)', color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
            fontFamily: 'var(--font-ui)',
          }}>
            Bandingkan harga barang <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>baru &amp; bekas</strong> dari Shopee, Tokopedia,
            Lazada &amp; {STATS.platforms - 3} marketplace lain — dalam satu pencarian.
          </p>

          {/* Search bar */}
          <div className="hero-enter-4 max-w-2xl mx-auto">
            <HeroRealSearch />
          </div>

          {/* Quick chips */}
          <div className="hero-enter-5 flex flex-wrap gap-2 justify-center mt-5 mb-12">
            <span style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center', fontFamily: 'var(--font-ui)' }}>Coba:</span>
            {['iPhone 15 Pro', 'Sepatu Preloved', 'Kamera Bekas', 'Skincare', 'PS5'].map(t => (
              <Link key={t} href={'/cari?q=' + encodeURIComponent(t)}
                style={{
                  padding: '4px 14px', borderRadius: 100,
                  fontSize: 13, fontFamily: 'var(--font-ui)',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', textDecoration: 'none',
                  boxShadow: 'var(--shadow-card)',
                  transition: 'border-color 0.15s',
                }}>
                {t}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-4 divide-x divide-[var(--border-subtle)]">
          {[
            { label: 'Produk Aktif', value: STATS.totalProducts + '+', color: 'var(--brand)' },
            { label: 'Marketplace',  value: STATS.platforms + '+',                      color: 'var(--win)' },
            { label: 'Update Harga', value: 'Tiap 4 jam',                               color: '#a78bfa' },
            { label: 'Cashback',     value: 'S/d 8%',                                   color: '#facc15' },
          ].map(s => (
            <div key={s.label} className="px-4 sm:px-6 first:pl-0 text-center sm:text-left">
              <div className="text-lg font-extrabold" style={{ color: s.color, fontFamily: 'var(--font-ui)' }}>{s.value}</div>
              <div className="text-[11px] text-[var(--text-muted)]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CATEGORY ROW ── */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Elektronik',   icon: '🖥️',  color: '#F59E0B', bg: 'rgba(245,158,11,0.10)',  href: '/cari?kategori=elektronik' },
            { label: 'Fashion',      icon: '👗',  color: '#F97316', bg: 'rgba(249,115,22,0.10)',  href: '/cari?kategori=fashion' },
            { label: 'Rumah',        icon: '🏠',  color: '#0EA5E9', bg: 'rgba(14,165,233,0.10)',  href: '/cari?kategori=rumah-tangga' },
            { label: 'Hobi & Game', icon: '🎮',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)',  href: '/cari?kategori=gaming' },
            { label: 'Olahraga',     icon: '⚽',  color: '#EF4444', bg: 'rgba(239,68,68,0.10)',   href: '/cari?kategori=olahraga' },
            { label: 'Kecantikan',   icon: '💄',  color: '#EC4899', bg: 'rgba(236,72,153,0.10)',  href: '/cari?kategori=kecantikan' },
            { label: 'Motor Bekas',  icon: '🏍️',  color: '#F59E0B', bg: 'rgba(245,158,11,0.10)',  href: '/cari?kategori=motor-bekas' },
            { label: 'Mobil Bekas',  icon: '🚙',  color: '#64748B', bg: 'rgba(100,116,139,0.10)', href: '/cari?kategori=mobil-bekas' },
          ].map(cat => (
            <Link key={cat.label} href={cat.href}
              className="group flex items-center gap-4 rounded-2xl transition-all hover:-translate-y-0.5"
              style={{
                padding: '18px 20px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
                textDecoration: 'none',
              }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                style={{ background: cat.bg, boxShadow: `0 0 0 1px ${cat.color}22` }}>
                {cat.icon}
              </div>
              <span style={{
                fontWeight: 600, color: 'var(--text-primary)',
                fontSize: 14, fontFamily: 'var(--font-ui)',
                lineHeight: 1.2,
              }}>{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── DEAL TERPANAS ── */}
      {promoProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <SectionHead
            eyebrow="Flash Sale · Diskon Gila"
            title={<span className="flex items-center gap-2"><Flame size={22} style={{ color: 'var(--brand)' }} /> Deal Terpanas Hari Ini</span> as any}
            action={
              <Link href="/cari?sort=lowest"
                className="flex items-center gap-1 transition-colors"
                style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)' }}>
                Lihat semua <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 reveal-grid">
            {(promoProducts ?? []).map(p => {
              const cheapest = lowestListingFirst(p.listings ?? [])[0]
              const discountPct = cheapest?.originalPrice && cheapest.originalPrice > cheapest.price
                ? Math.round(100 * (cheapest.originalPrice - cheapest.price) / cheapest.originalPrice)
                : 0
              return (
                <Link key={p.id} href={`/produk/${p.slug || p.id}`}
                  className="group rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-card)' }}>
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}><Flame size={32} /></div>
                    }
                    {discountPct > 0 && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-white"
                        style={{ background: 'var(--brand)', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-extrabold)' }}>
                        -{discountPct}%
                      </div>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-white"
                      style={{ background: 'rgba(0,0,0,0.55)', fontSize: 'var(--text-9)', fontWeight: 'var(--fw-bold)', letterSpacing: '0.03em' }}>
                      PROMO
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="line-clamp-2 leading-snug mb-2"
                      style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-medium)', color: 'var(--text-primary)' }}>
                      {p.name}
                    </p>
                    <div className="flex items-end gap-2 flex-wrap">
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-extrabold)', color: 'var(--brand)' }}>
                        {formatRupiah(cheapest?.price ?? p.lowestPrice, true)}
                      </span>
                      {cheapest?.originalPrice && cheapest.originalPrice > cheapest.price && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {formatRupiah(cheapest.originalPrice, true)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1" style={{ fontSize: 'var(--text-10)', color: 'var(--text-muted)' }}>
                      <Flame size={10} style={{ color: 'var(--brand)' }} />
                      <span>Flash Sale · Stok Terbatas</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ── DEAL TERBAIK (with Semua / Baru / Bekas tabs) ── */}
      <DealTerbaikSection allProducts={(allProducts ?? []).slice(0, 10)} usedProducts={usedProducts ?? []} />

      {/* ── TRENDING ── */}
      {trendingProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <SectionHead
            eyebrow="Real-Time"
            title={<span className="flex items-center gap-2"><Flame size={22} style={{ color: 'var(--orange-500)' }} /> Produk Trending</span> as any}
            action={
              <Link href="/cari?sort=popular"
                className="flex items-center gap-1 transition-colors"
                style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)' }}>
                Lihat semua <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {trendingProducts.map((p: { id: string; slug: string; name: string; image_url: string | null; best_price: number; click_count: number }) => (
              <Link key={p.id} href={'/produk/' + (p.slug || p.id)}
                className="group rounded-xl overflow-hidden transition-all"
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                }}>
                <div className="relative aspect-square overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}><Flame size={24} /></div>
                  }
                  {p.click_count > 0 && (
                    <div className="absolute top-1.5 right-1.5 text-white flex items-center gap-0.5"
                      style={{
                        background: 'var(--orange-500)', fontSize: 'var(--text-9)',
                        fontWeight: 'var(--fw-extrabold)', padding: '2px 6px',
                        borderRadius: 'var(--radius-full)',
                      }}>
                      <Flame size={7} />
                      {p.click_count}
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="line-clamp-2 leading-snug mb-1"
                    style={{ fontSize: 'var(--text-11)', fontWeight: 'var(--fw-medium)', color: 'var(--text-primary)' }}>
                    {p.name}
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-extrabold)', color: 'var(--brand)' }}>
                    {formatRupiah(p.best_price, true)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── PRELOVED HIGHLIGHT BANNER ── */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="relative overflow-hidden rounded-2xl"
          style={{
            border: '1px solid var(--border)',
            background: 'linear-gradient(120deg, rgba(26,107,60,0.06), rgba(212,146,10,0.05))',
          }}>
          <div className="flex items-center justify-between gap-6 p-8 flex-wrap">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
                style={{
                  background: 'var(--win-soft-bg)', border: '1px solid var(--win-soft-border)',
                  color: 'var(--win)', fontSize: 'var(--text-10)', fontWeight: 'var(--fw-black)',
                  letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase',
                }}>
                Preloved · Barang Bekas
              </div>
              <h2 style={{
                margin: 0, marginBottom: 8,
                fontSize: 'var(--text-2xl)', fontWeight: 400,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-editorial)',
              }}>
                Bukan cuma baru — <em>yang bekas juga di sini.</em>
              </h2>
              <p style={{
                margin: 0, marginBottom: 18,
                fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)',
              }}>
                Hemat lebih jauh dengan barang preloved dari penjual terpercaya OLX &amp; Carousell.
                Kami bandingkan harga second terbaik untuk Anda.
              </p>
              <Link href="/cari?condition=used"
                className="inline-flex items-center gap-2 transition-opacity hover:opacity-90"
                style={{
                  padding: '11px 20px', borderRadius: 'var(--radius-md)',
                  background: 'var(--gradient-win)', color: '#053d24',
                  fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-extrabold)',
                  boxShadow: 'var(--shadow-green)',
                }}>
                Jelajahi Preloved →
              </Link>
            </div>
            <div className="flex gap-3">
              {(usedProducts ?? []).slice(0, 2).map(p => {
                const cheapest = lowestListingFirst(p.listings ?? [])[0]
                return cheapest ? (
                  <Link key={p.id} href={'/produk/' + (p.slug || p.id)}
                    className="w-36 rounded-xl overflow-hidden group transition-all"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="aspect-square overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                      {p.images[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                    </div>
                    <div className="p-2">
                      <p className="line-clamp-2 leading-snug mb-1"
                        style={{ fontSize: 'var(--text-11)', fontWeight: 'var(--fw-medium)', color: 'var(--text-primary)' }}>
                        {p.name}
                      </p>
                      <p style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-extrabold)', color: 'var(--brand)' }}>
                        {formatRupiah(cheapest.price, true)}
                      </p>
                    </div>
                  </Link>
                ) : null
              })}
            </div>
          </div>
        </div>
      </section>


      {/* ── HEMAT TERBESAR ── */}
      {hematProducts.length > 0 && (
        <section style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}
          className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <SectionHead
              eyebrow="Selisih Terbesar"
              title={<span className="flex items-center gap-2"><TrendingDown size={20} style={{ color: 'var(--win)' }} /> Hemat Terbesar Hari Ini</span> as any}
              action={
                <Link href="/cari?sort=lowest"
                  className="flex items-center gap-1 transition-colors"
                  style={{ fontSize: 'var(--text-sm)', color: 'var(--win)' }}>
                  Lihat semua <ArrowRight size={14} />
                </Link>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hematProducts.map(({ product, diff, savings }) => {
                const sorted = lowestListingFirst(product.listings ?? [])
                const cheapest = sorted[0]
                if (!cheapest) return null
                const platform = PLATFORMS[cheapest.platformId]
                if (!platform) return null
                return (
                  <Link key={product.id} href={'/produk/' + (product.slug || product.id)}
                    className="group rounded-2xl p-4 transition-all"
                    style={{
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--win-soft-border)',
                    }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{
                          background: platform.id === 'tiktok' ? '#1a1a1a' : platform.color,
                          fontSize: 'var(--text-10)', fontWeight: 'var(--fw-extrabold)',
                        }}>
                        {platform.shortName.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-medium)', color: 'var(--text-primary)' }}>{product.name}</p>
                        <p style={{ fontSize: 'var(--text-10)', color: 'var(--text-muted)' }}>{platform.name}</p>
                      </div>
                    </div>
                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--fw-extrabold)', color: 'var(--text-primary)', marginBottom: 6 }}>
                      {formatRupiah(cheapest.price, true)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span style={{
                        fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)',
                        padding: '2px 8px', borderRadius: 'var(--radius-full)',
                        color: 'var(--win)', background: 'var(--win-soft-bg)', border: '1px solid var(--win-soft-border)',
                      }}>
                        Hemat {diff}%
                      </span>
                      <span className="truncate" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        vs {formatRupiah(savings, true)} lebih mahal
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURES ── */}
      <section style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-subtle)' }}
        className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase' as const, color: 'var(--text-muted)',
              fontFamily: 'var(--font-ui)', marginBottom: 8,
            }}>Platform</div>
            <h2 style={{
              margin: 0, marginBottom: 12,
              fontSize: 'var(--text-3xl)', fontWeight: 400,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-editorial)',
            }}>Lebih dari sekadar perbandingan harga</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-ui)' }}>Semua yang Anda butuhkan dalam satu platform</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <TrendingDown size={22} style={{ color: 'var(--win)' }} />, title: 'Bandingkan Real-Time', desc: 'Harga diperbarui setiap 4 jam dari semua marketplace. Selalu dapatkan harga terkini.', badge: 'LIVE', badgeStyle: { background: 'var(--win-soft-bg)', color: 'var(--win)', border: '1px solid var(--win-soft-border)' } },
              { icon: <Wallet size={22} style={{ color: 'var(--brand)' }} />, title: 'Cashback Otomatis', desc: 'Cashback otomatis segera hadir. Daftar sekarang untuk akses pertama.', badge: 'SEGERA', badgeStyle: { background: 'var(--brand-soft-bg)', color: 'var(--brand)', border: '1px solid var(--brand-soft-border)' } },
              { icon: <Bell size={22} style={{ color: 'var(--amber-300)' }} />, title: 'Price Alert Pintar', desc: 'Set target harga dan dapatkan notifikasi WA/Email saat harga turun ke target.', badge: 'WA + EMAIL', badgeStyle: { background: 'var(--brand-soft-bg)', color: 'var(--amber-300)', border: '1px solid var(--brand-soft-border)' } },
              { icon: <Zap size={22} style={{ color: '#facc15' }} />, title: 'Beli Sekarang', desc: 'Tidak perlu pindah tab. Beli langsung melalui kami, cashback masuk otomatis.', badge: '1 KLIK', badgeStyle: { background: 'rgba(250,204,21,0.10)', color: '#facc15', border: '1px solid rgba(250,204,21,0.20)' } },
              { icon: <RefreshCw size={22} style={{ color: 'var(--cyan-400)' }} />, title: 'Riwayat Harga', desc: 'Grafik harga 90 hari terakhir. Tahu kapan harga sedang turun atau naik.', badge: '90 HARI', badgeStyle: { background: 'rgba(34,211,238,0.10)', color: 'var(--cyan-400)', border: '1px solid rgba(34,211,238,0.20)' } },
              { icon: <Shield size={22} style={{ color: 'var(--blue-400)' }} />, title: 'Toko Terverifikasi', desc: 'Hanya tampilkan listing dari toko resmi dan terverifikasi. Aman dari penipuan.', badge: 'VERIFIED', badgeStyle: { background: 'rgba(96,165,250,0.10)', color: 'var(--blue-400)', border: '1px solid rgba(96,165,250,0.20)' } },
            ].map(f => (
              <div key={f.title} className="rounded-xl p-5 transition-all group"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-hover)' }}>
                    {f.icon}
                  </div>
                  <span style={{
                    fontSize: 'var(--text-10)', fontWeight: 'var(--fw-extrabold)',
                    padding: '4px 8px', borderRadius: 'var(--radius-md)',
                    ...f.badgeStyle,
                  }}>{f.badge}</span>
                </div>
                <h3 style={{ margin: 0, marginBottom: 8, fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM KAMI ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <div className="harga-text-gradient mb-2" style={{
            fontSize: 'var(--text-10)', fontWeight: 'var(--fw-black)',
            letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase',
          }}>Cakupan</div>
          <h2 style={{
            margin: 0, marginBottom: 8,
            fontSize: 'var(--text-2xl)', fontWeight: 400, color: 'var(--text-primary)',
          fontFamily: 'var(--font-editorial)',
          }}>Semua toko favorit, satu tempat</h2>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Harga real-time dari <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--fw-semibold)' }}>{platformList.length} marketplace</span> terpopuler di Indonesia &amp; dunia
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {platformList.map(p => (
            <Link key={p.id} href={'/cari?platform=' + p.id}
              className="group rounded-2xl p-5 flex flex-col transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold mb-3 shadow-md shrink-0"
                style={{
                  background: p.id === 'tiktok' ? '#1a1a1a' : p.color,
                  fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-extrabold)',
                  boxShadow: 'var(--shadow-card)',
                }}>
                {p.shortName.slice(0, 2)}
              </div>
              <div style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)', marginBottom: 2 }}>
                {p.name}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--brand)', fontWeight: 'var(--fw-medium)', marginBottom: 8 }}>
                Cashback {p.cashbackPct}%
              </div>
              <div className="mt-auto h-0.5 rounded-full w-0 group-hover:w-full transition-all duration-300"
                style={{ background: p.id === 'tiktok' ? '#fe2c55' : p.color }} />
            </Link>
          ))}
        </div>
        <p className="text-center mt-6" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          Klik platform untuk melihat produk termurah di sana
        </p>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}
        className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="harga-text-gradient mb-2" style={{
            fontSize: 'var(--text-10)', fontWeight: 'var(--fw-black)',
            letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase',
          }}>Cara Kerja</div>
          <h2 style={{ margin: 0, marginBottom: 12, fontSize: 'var(--text-3xl)', fontWeight: 400, color: 'var(--text-primary)', fontFamily: 'var(--font-editorial)' }}>
            Cara kerja harga.com
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 48 }}>Hemat uang dalam 3 langkah mudah</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '🔍', title: 'Cari Produk', desc: 'Ketik nama produk atau paste link dari marketplace manapun' },
              { step: '02', icon: '💡', title: 'Bandingkan Harga', desc: 'Lihat harga dari semua marketplace sekaligus + grafik historis' },
              { step: '03', icon: '💰', title: 'Beli & Dapat Cashback', desc: 'Beli melalui kami, cashback masuk otomatis ke wallet Anda' },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
                  style={{ background: 'var(--brand-soft-bg)', border: '1px solid var(--brand-soft-border)', boxShadow: 'var(--shadow-card)' }}>
                  {s.icon}
                </div>
                <div style={{
                  fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-extrabold)',
                  color: 'var(--brand)', marginBottom: 8, letterSpacing: 'var(--tracking-wide)',
                }}>LANGKAH {s.step}</div>
                <h3 style={{ margin: 0, marginBottom: 8, fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>{s.title}</h3>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CASHBACK CTA ── */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="relative overflow-hidden rounded-2xl p-8 sm:p-12 text-center"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--brand-soft-border)',
            boxShadow: 'var(--glow-amber)',
          }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(212,146,10,0.06), transparent)' }} />
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, var(--brand-soft-border), transparent)' }} />
          <div className="relative">
            <div className="text-5xl mb-4">💰</div>
            <h2 style={{
              margin: 0, marginBottom: 12,
              fontSize: 'var(--text-3xl)', fontWeight: 400, color: 'var(--text-primary)',
              fontFamily: 'var(--font-editorial)',
            }}>
              Dapatkan cashback hingga <span className="harga-text-gradient">8%</span>
            </h2>
            <p style={{
              color: 'var(--text-secondary)', marginBottom: 32,
              maxWidth: 400, marginLeft: 'auto', marginRight: 'auto',
            }}>
              Daftar gratis, mulai belanja melalui harga.com, dan saldo cashback langsung masuk ke wallet Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link href="/cari"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl transition-opacity hover:opacity-90"
                style={{
                  background: 'var(--gradient-gold)', color: 'var(--text-on-brand)',
                  boxShadow: 'var(--shadow-button)', fontWeight: 'var(--fw-extrabold)',
                  fontSize: 'var(--text-sm)', textDecoration: 'none',
                }}>
                Mulai Belanja
              </Link>
              <Link href="/cashback"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl transition-colors"
                style={{
                  background: 'var(--bg-hover)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontWeight: 'var(--fw-semibold)',
                  fontSize: 'var(--text-sm)', textDecoration: 'none',
                }}>
                Pelajari Cashback
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              {['Cashback otomatis', 'Tarik ke GoPay/OVO', 'Tanpa minimum pembelian'].map(b => (
                <div key={b} className="flex items-center gap-1.5" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--win)' }} />{b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}
        className="px-4 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-8 mb-8">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <svg width={28} height={28} viewBox="0 0 48 48" fill="none" style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 6px rgba(249,115,22,0.25))' }}>
                <defs>
                  <linearGradient id="hg-footer" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#F97316" />
                    <stop offset="1" stopColor="#EA580C" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#hg-footer)" />
                <g transform="translate(7.5 7.5) scale(1.38)" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                  <circle cx="7.5" cy="7.5" r="1.4" fill="#fff" stroke="none" />
                </g>
              </svg>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>
                <span style={{ color: 'var(--text-primary)' }}>Harga</span>
                <span style={{ color: 'var(--brand)' }}>.com</span>
              </span>
            </div>
            <p style={{
              fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
              lineHeight: 'var(--leading-relaxed)', marginBottom: 16, maxWidth: 200,
            }}>
              Temukan harga terbaik barang baru &amp; bekas dari semua marketplace Indonesia.
            </p>
            <div className="flex gap-2">
              {[
                { label: 'Instagram', icon: 'IG', href: 'https://instagram.com/hargacom' },
                { label: 'Twitter',   icon: 'X',  href: 'https://twitter.com/hargacom' },
                { label: 'TikTok',   icon: 'TK', href: 'https://tiktok.com/@hargacom' },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" title={s.label}
                  className="flex items-center justify-center rounded-lg transition-colors"
                  style={{
                    width: 28, height: 28, background: 'var(--bg-hover)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 'var(--text-9)', fontWeight: 'var(--fw-extrabold)',
                    color: 'var(--text-muted)', textDecoration: 'none',
                  }}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {[
            {
              title: 'Produk',
              links: [
                { label: 'Cari Harga',    href: '/cari' },
                { label: 'Trending',      href: '/cari?sort=popular' },
                { label: 'Kategori',      href: '/cari' },
                { label: 'Pantau Harga',  href: '/alert' },
              ],
            },
            {
              title: 'Marketplace',
              links: [
                { label: 'Shopee',       href: '/cari?platform=shopee' },
                { label: 'Tokopedia',    href: '/cari?platform=tokopedia' },
                { label: 'Lazada',       href: '/cari?platform=lazada' },
                { label: 'Blibli',       href: '/cari?platform=blibli' },
                { label: 'Bukalapak',    href: '/cari?platform=bukalapak' },
                { label: '+6 lainnya',   href: '/cari' },
              ],
            },
            {
              title: 'Perusahaan',
              links: [
                { label: 'Tentang Kami', href: '/tentang' },
                { label: 'Karir',        href: '/tentang' },
                { label: 'Kontak',       href: '/tentang' },
                { label: 'Blog',         href: '/blog' },
              ],
            },
            {
              title: 'Bantuan',
              links: [
                { label: 'FAQ',                 href: '/faq' },
                { label: 'Cara Kerja',          href: '/cara-kerja' },
                { label: 'Kebijakan Privasi',   href: '/kebijakan-privasi' },
                { label: 'Syarat & Ketentuan',  href: '/syarat-ketentuan' },
              ],
            },
          ].map(col => (
            <div key={col.title}>
              <div style={{
                fontWeight: 700, color: 'var(--text-primary)',
                fontSize: 11, marginBottom: 12,
                textTransform: 'uppercase' as const, letterSpacing: '0.08em',
                fontFamily: 'var(--font-ui)',
              }}>{col.title}</div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {col.links.map(l => (
                  <li key={l.label}>
                    <Link href={l.href} className="footer-link" style={{
                      color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none',
                      fontFamily: 'var(--font-ui)',
                    }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 24 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p style={{ margin: 0, fontSize: 'var(--text-11)', color: 'var(--text-muted)' }}>
            © 2026 Harga.com — Temukan Harga Terbaik.
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-11)', color: 'var(--text-muted)' }}>Dibuat di Indonesia 🇮🇩</p>
        </div>
      </footer>

      {/* ── SCROLL REVEAL OBSERVER ── */}
      <Script id="harga-scroll-reveal" strategy="afterInteractive">{`
(function(){
  if(typeof IntersectionObserver==='undefined')return;
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add('in-view');}
    });
  },{threshold:0.07,rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.reveal,.reveal-grid,.stat-pop').forEach(function(el){
    // Add js-ready so CSS hides them for the reveal animation
    el.classList.add('js-ready');
    io.observe(el);
  });
})();
      `}</Script>
    </div>
  )
}
