import { ProductCard } from '@/components/ProductCard'
import { LiveBar } from '@/components/LiveBar'
import { HeroRealSearch } from '@/components/HeroSection'
import { getProducts, getCategories } from '@/lib/db/products'
import { STATS, TRENDING_SEARCHES } from '@/lib/mock-data'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah, lowestListingFirst, priceDiffPercent } from '@/lib/utils'
import { TrendingDown, Bell, Wallet, Shield, Zap, RefreshCw, ArrowRight, CheckCircle2, Flame, Package } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getTrendingProducts() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/products/popular?limit=8`,
      { cache: 'no-store' }
    )
    if (!res.ok) return []
    const json = await res.json()
    return json.products ?? []
  } catch {
    return []
  }
}

/* Eyebrow + title section head — matches design system SectionHead */
function SectionHead({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-end flex-wrap gap-4 mb-6">
      <div>
        <div className="harga-text-gradient mb-1.5" style={{
          fontSize: 'var(--text-10)', fontWeight: 'var(--fw-black)',
          letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase',
        }}>{eyebrow}</div>
        <h2 style={{
          margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-extrabold)',
          letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)',
        }}>{title}</h2>
      </div>
      {action}
    </div>
  )
}

export default async function HomePage() {
  const { products: allProducts } = await getProducts({ sort: 'popular', limit: 16 })
  const { products: usedProducts } = await getProducts({ condition: 'used', sort: 'popular', limit: 8 })
  const featuredProducts = allProducts.slice(0, 8)
  const categories = await getCategories()
  const platformList = Object.values(PLATFORMS)
  const trendingProducts = await getTrendingProducts()

  const hematProducts = [...allProducts]
    .map(p => {
      const sorted = lowestListingFirst(p.listings)
      const diff = sorted.length > 1 ? priceDiffPercent(sorted[0].price, sorted[sorted.length - 1].price) : 0
      const savings = sorted.length > 1 ? sorted[sorted.length - 1].price - sorted[0].price : 0
      return { product: p, diff, savings }
    })
    .filter(x => x.diff > 5)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 4)

  return (
    <div className="pt-[88px]">

      {/* ── HERO ── */}
      <section className="hero-gradient relative overflow-hidden">
        {/* Kinetik animated mesh blobs */}
        <div className="harga-mesh">
          <span className="harga-blob b1" />
          <span className="harga-blob b2" />
          <span className="harga-blob b3" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-[70px] text-center" style={{ zIndex: 1 }}>
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full fade-in"
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)',
              color: 'var(--text-secondary)', boxShadow: 'var(--shadow-card)',
              letterSpacing: 'var(--tracking-wide)',
            }}>
            <span className="harga-live-dot" />
            LIVE · {STATS.platforms} MARKETPLACE · BARU &amp; BEKAS
          </div>

          {/* Display heading */}
          <h1 className="fade-in" style={{
            margin: 0, marginBottom: 16,
            fontSize: 'clamp(38px, 6vw, 68px)',
            fontWeight: 'var(--fw-extrabold)',
            letterSpacing: 'var(--tracking-tighter)',
            lineHeight: 'var(--leading-tight)',
            color: 'var(--text-primary)',
          }}>
            Harga terbaik.<br />
            <span className="harga-text-gradient">Baru atau bekas.</span>
          </h1>

          <p className="fade-in" style={{
            margin: '0 auto 30px', maxWidth: 560,
            fontSize: 'var(--text-lg)', color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
          }}>
            Bandingkan harga barang <b style={{ color: 'var(--text-primary)' }}>baru &amp; bekas</b> dari Shopee,
            Tokopedia, Lazada &amp; 7 marketplace lain — dalam satu pencarian.
          </p>

          <div className="max-w-2xl mx-auto">
            <HeroRealSearch />
          </div>

          {/* Trending chips */}
          <div className="flex flex-wrap gap-2 justify-center mt-4 mb-10">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', alignSelf: 'center' }}>Coba:</span>
            {TRENDING_SEARCHES.slice(0, 8).map(t => (
              <Link key={t} href={'/cari?q=' + encodeURIComponent(t)}
                className="px-3 py-1 rounded-full transition-all"
                style={{
                  fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)',
                  background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)', boxShadow: 'var(--shadow-card)',
                }}
                onMouseEnter={undefined}>
                {t}
              </Link>
            ))}
          </div>

          {/* Stats row */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-8"
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              fontSize: 'var(--text-sm)', boxShadow: 'var(--shadow-card)',
            }}>
            <span style={{ fontWeight: 'var(--fw-extrabold)', color: 'var(--text-primary)' }}>22.000+</span>
            <span style={{ color: 'var(--text-muted)' }}>produk</span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span style={{ fontWeight: 'var(--fw-extrabold)', color: 'var(--text-primary)' }}>10</span>
            <span style={{ color: 'var(--text-muted)' }}>platform</span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span style={{ color: 'var(--text-muted)' }}>Update tiap 4 jam</span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span className="harga-live-dot" />
            <span style={{ color: 'var(--win)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-xs)' }}>Live</span>
          </div>

          {/* Platform mini-icons */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Harga dari:</span>
            {platformList.map(p => (
              <div key={p.id}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform cursor-default"
                style={{
                  background: p.id === 'tiktok' ? '#1a1a1a' : p.color,
                  fontSize: 'var(--text-10)', fontWeight: 'var(--fw-extrabold)',
                  boxShadow: 'var(--shadow-card)', outline: '1px solid rgba(255,255,255,0.05)',
                }}
                title={p.name}>
                {p.shortName.slice(0, 2)}
              </div>
            ))}
          </div>
        </div>
      </section>

      <LiveBar />

      {/* ── FEATURED PRODUCTS ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <SectionHead
          eyebrow="Pilihan Hari Ini"
          title="Produk Terpopuler"
          action={
            <Link href="/cari?sort=popular"
              className="flex items-center gap-1 transition-colors"
              style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)' }}>
              Lihat semua <ArrowRight size={14} />
            </Link>
          }
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
          {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

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
            {trendingProducts.map((p: { id: string; name: string; image_url: string | null; best_price: number; click_count: number }) => (
              <Link key={p.id} href={'/produk/' + p.id}
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
                fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-extrabold)',
                letterSpacing: 'var(--tracking-tight)', color: 'var(--text-primary)',
              }}>
                Bukan cuma baru — yang bekas juga di sini.
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
              {usedProducts.slice(0, 2).map(p => {
                const cheapest = lowestListingFirst(p.listings)[0]
                return cheapest ? (
                  <Link key={p.id} href={'/produk/' + p.id}
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

      {/* ── BARANG BEKAS ── */}
      {usedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <SectionHead
            eyebrow="Second Hand"
            title={<span className="flex items-center gap-2"><Package size={20} style={{ color: 'var(--orange-400)' }} /> Barang Bekas Berkualitas</span> as any}
            action={
              <Link href="/cari?condition=used"
                className="flex items-center gap-1 transition-colors"
                style={{ fontSize: 'var(--text-sm)', color: 'var(--orange-400)' }}>
                Lihat semua <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
            {usedProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl"
            style={{
              fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
              background: 'rgba(197,98,26,0.04)', border: '1px solid rgba(197,98,26,0.12)',
            }}>
            <span style={{ color: 'var(--orange-400)', fontWeight: 'var(--fw-medium)' }}>♻️ Barang Bekas</span>
            <span>·</span>
            <span>Harga lebih hemat, kondisi terpilih. Verifikasi penjual sebelum bertransaksi.</span>
          </div>
        </section>
      )}

      {/* ── HEMAT TERBESAR ── */}
      {hematProducts.length > 0 && (
        <section style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}
          className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <SectionHead
              eyebrow="Selisih Terbesar"
              title={<span className="flex items-center gap-2"><TrendingDown size={20} style={{ color: 'var(--win)' }} /> Hemat Terbesar Hari Ini</span> as any}
              action={
                <Link href="/cari?sort=hemat"
                  className="flex items-center gap-1 transition-colors"
                  style={{ fontSize: 'var(--text-sm)', color: 'var(--win)' }}>
                  Lihat semua <ArrowRight size={14} />
                </Link>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hematProducts.map(({ product, diff, savings }) => {
                const sorted = lowestListingFirst(product.listings)
                const cheapest = sorted[0]
                const platform = PLATFORMS[cheapest.platformId]
                return (
                  <Link key={product.id} href={'/produk/' + product.id}
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
            <div className="harga-text-gradient mb-2" style={{
              fontSize: 'var(--text-10)', fontWeight: 'var(--fw-black)',
              letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase',
            }}>Platform</div>
            <h2 style={{
              margin: 0, marginBottom: 12,
              fontSize: 'var(--text-3xl)', fontWeight: 'var(--fw-bold)',
              color: 'var(--text-primary)',
            }}>Lebih dari sekadar perbandingan harga</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Semua yang Anda butuhkan dalam satu platform</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <TrendingDown size={22} style={{ color: 'var(--win)' }} />, title: 'Bandingkan Real-Time', desc: 'Harga diperbarui setiap 4 jam dari semua marketplace. Selalu dapatkan harga terkini.', badge: 'LIVE', badgeStyle: { background: 'var(--win-soft-bg)', color: 'var(--win)', border: '1px solid var(--win-soft-border)' } },
              { icon: <Wallet size={22} style={{ color: 'var(--brand)' }} />, title: 'Cashback Otomatis', desc: 'Beli melalui kami dan dapatkan cashback 5-8%. Saldo bisa ditarik ke GoPay/OVO/Bank.', badge: 'S/D 8%', badgeStyle: { background: 'var(--brand-soft-bg)', color: 'var(--brand)', border: '1px solid var(--brand-soft-border)' } },
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
            fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)',
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

      {/* ── CATEGORIES ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <SectionHead
          eyebrow="Kategori"
          title="Jelajahi Kategori"
          action={
            <Link href="/cari"
              className="flex items-center gap-1 transition-colors"
              style={{ fontSize: 'var(--text-sm)', color: 'var(--brand)' }}>
              Lihat semua <ArrowRight size={14} />
            </Link>
          }
        />
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map(cat => (
            <Link key={cat.id} href={'/cari?kategori=' + cat.id}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all hover:scale-105"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-2xl">{cat.icon}</span>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-medium)', color: 'var(--text-secondary)' }}>{cat.label}</span>
              <span style={{ fontSize: 'var(--text-10)', color: 'var(--text-muted)' }}>{(cat.count / 1000).toFixed(0)}rb+</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}
        className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="harga-text-gradient mb-2" style={{
            fontSize: 'var(--text-10)', fontWeight: 'var(--fw-black)',
            letterSpacing: 'var(--tracking-widest)', textTransform: 'uppercase',
          }}>Cara Kerja</div>
          <h2 style={{ margin: 0, marginBottom: 12, fontSize: 'var(--text-3xl)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
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
              fontSize: 'var(--text-3xl)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)',
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
              <button className="px-8 py-3 rounded-xl transition-opacity hover:opacity-90"
                style={{
                  background: 'var(--gradient-gold)', color: 'var(--text-on-brand)',
                  boxShadow: 'var(--shadow-button)', fontWeight: 'var(--fw-extrabold)',
                  fontSize: 'var(--text-sm)', border: 'none', cursor: 'pointer',
                }}>
                Daftar Gratis
              </button>
              <button className="px-8 py-3 rounded-xl transition-colors"
                style={{
                  background: 'var(--bg-hover)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontWeight: 'var(--fw-semibold)',
                  fontSize: 'var(--text-sm)', cursor: 'pointer',
                }}>
                Pelajari Lebih Lanjut
              </button>
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
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          <div>
            {/* Logo in footer */}
            <div className="flex items-center gap-2 mb-3">
              <svg width={28} height={28} viewBox="0 0 48 48" fill="none" style={{ flexShrink: 0, filter: 'drop-shadow(0 2px 6px rgba(212,146,10,0.25))' }}>
                <defs>
                  <linearGradient id="hg-footer" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#ffc24b" />
                    <stop offset="1" stopColor="#ff5a3c" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#hg-footer)" />
                <g transform="translate(7.5 7.5) scale(1.38)" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                  <circle cx="7.5" cy="7.5" r="1.4" fill="#fff" />
                </g>
              </svg>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 'var(--fw-extrabold)', letterSpacing: 'var(--tracking-tight)' }}>
                <span style={{ color: 'var(--text-primary)' }}>Harga</span>
                <span style={{ color: 'var(--brand)' }}>.com</span>
              </span>
            </div>
            <p style={{
              fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
              lineHeight: 'var(--leading-relaxed)', marginBottom: 16, maxWidth: 220,
            }}>
              Platform perbandingan harga terlengkap di Indonesia. Hemat lebih banyak, belanja lebih cerdas.
            </p>
            <div className="flex gap-2">
              {[
                { label: 'Instagram', icon: 'IG' },
                { label: 'Twitter',   icon: 'TW' },
                { label: 'TikTok',   icon: 'TK' },
                { label: 'YouTube',  icon: 'YT' },
              ].map(s => (
                <a key={s.label} href="#" title={s.label}
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
          {[
            { title: 'Fitur', links: ['Bandingkan Harga', 'Price Alert', 'Cashback', 'Browser Extension', 'Mobile App'] },
            { title: 'Platform', links: ['Tokopedia', 'Shopee', 'TikTok Shop', 'Amazon', 'AliExpress', 'Lazada'] },
            { title: 'Perusahaan', links: ['Tentang Kami', 'Blog', 'Karir', 'Hubungi Kami', 'Privasi'] },
          ].map(col => (
            <div key={col.title}>
              <div style={{
                fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)',
                fontSize: 'var(--text-xs)', marginBottom: 12,
                textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)',
              }}>{col.title}</div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {col.links.map(l => (
                  <li key={l}>
                    <a href="#" style={{
                      color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textDecoration: 'none',
                    }}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 24 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p style={{ margin: 0, fontSize: 'var(--text-11)', color: 'var(--text-muted)' }}>
            © 2026 harga.com — Harga real-time, cashback nyata.
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-11)', color: 'var(--text-muted)' }}>Dibuat di Indonesia 🇮🇩</p>
        </div>
      </footer>
    </div>
  )
}
