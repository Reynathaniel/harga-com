import { ProductCard } from '@/components/ProductCard'
import { LiveBar } from '@/components/LiveBar'
import { HeroRealSearch } from '@/components/HeroSection'
import { getProducts, getCategories } from '@/lib/db/products'
import { STATS, TRENDING_SEARCHES } from '@/lib/mock-data'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah, lowestListingFirst, priceDiffPercent } from '@/lib/utils'
import { TrendingDown, Bell, Wallet, Shield, Zap, RefreshCw, ArrowRight, CheckCircle2, Flame, Package } from 'lucide-react'
import Link from 'next/link'

// force-dynamic: prevents build-time Supabase calls that hang the Vercel build.
// Page is rendered on each request and cached by CDN edge.
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Fetch popular (graduation-tracked) products server-side
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

      {/* HERO */}
      <section className="hero-gradient min-h-[90vh] flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
        {/* Animated mesh blobs */}
        <div className="harga-mesh">
          <span className="harga-blob b1" />
          <span className="harga-blob b2" />
          <span className="harga-blob b3" />
        </div>

        <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full px-4 py-1.5 text-xs text-[var(--text-secondary)] mb-8 fade-in shadow-sm">
          <span className="harga-live-dot" />
          <span className="font-medium tracking-wide">LIVE · {STATS.platforms} MARKETPLACE · BARU &amp; BEKAS</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-4 max-w-4xl leading-[1.0] fade-in" style={{letterSpacing:'var(--tracking-tighter)'}}>
          Harga terbaik.<br />
          <span className="harga-text-gradient">Baru atau bekas.</span>
        </h1>

        <p className="text-[var(--text-secondary)] text-lg max-w-xl mb-10 leading-relaxed fade-in">
          Bandingkan harga barang <b className="text-white">baru &amp; bekas</b> dari Shopee, Tokopedia, Lazada &amp; 7 marketplace lain — dalam satu pencarian.
        </p>

        <HeroRealSearch />

        <div className="flex flex-wrap gap-2 justify-center mb-10 mt-4">
          {TRENDING_SEARCHES.slice(0, 8).map(t => (
            <Link key={t} href={"/cari?q=" + encodeURIComponent(t)}
              className="px-3 py-1 text-xs bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-amber-500/40 hover:text-amber-300 rounded-full transition-colors">
              {t}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl px-6 py-3 text-sm mb-8 shadow-sm">
          <span className="text-white font-bold">22.000+</span>
          <span className="text-[var(--text-muted)]">produk</span>
          <span className="text-[var(--border)]">|</span>
          <span className="text-white font-bold">10</span>
          <span className="text-[var(--text-muted)]">platform</span>
          <span className="text-[var(--border)]">|</span>
          <span className="text-[var(--text-muted)]">Update tiap 4 jam</span>
          <span className="text-[var(--border)]">|</span>
          <span className="live-dot ml-0.5" />
          <span className="text-green-400 font-medium text-xs">Live</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <span className="text-xs text-[var(--text-muted)]">Harga dari:</span>
          {platformList.map(p => (
            <div key={p.id}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[10px] font-bold shadow-md hover:scale-110 transition-transform cursor-default ring-1 ring-white/5"
              style={{ background: p.color }}
              title={p.name}>
              {p.shortName.slice(0, 2)}
            </div>
          ))}
        </div>
      </section>

      <LiveBar />

      {/* FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Produk Terpopuler</h2>
            <p className="text-sm text-[var(--text-muted)]">Harga terupdate dari semua platform</p>
          </div>
          <Link href="/cari?sort=popular" className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
            Lihat semua <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
          {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* PRODUK TRENDING — graduated by real click count */}
      {trendingProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Flame size={20} className="text-orange-400" />
                Produk Trending
              </h2>
              <p className="text-sm text-[var(--text-muted)]">Paling banyak diklik pengguna Harga.com</p>
            </div>
            <Link href="/cari?sort=popular" className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
              Lihat semua <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {trendingProducts.map((p: { id: string; name: string; image_url: string | null; best_price: number; click_count: number }) => (
              <Link key={p.id} href={"/produk/" + p.id}
                className="group bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden hover:border-orange-500/40 hover:shadow-[0_4px_20px_rgba(249,115,22,0.1)] transition-all">
                <div className="relative aspect-square bg-[var(--bg-hover)] overflow-hidden">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]"><Flame size={24} /></div>
                  }
                  {p.click_count > 0 && (
                    <div className="absolute top-1.5 right-1.5 bg-orange-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Flame size={7} />
                      {p.click_count}
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-medium text-white line-clamp-2 leading-snug mb-1">{p.name}</p>
                  <p className="text-xs font-bold text-amber-400">{formatRupiah(p.best_price, true)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}


      {/* PRELOVED HIGHLIGHT BANNER */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border)]" style={{background:'linear-gradient(120deg, rgba(31,224,137,0.08), rgba(255,176,32,0.06))'}}>
          <div className="flex items-center justify-between gap-6 p-8 flex-wrap">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3"
                style={{background:'var(--win-soft-bg)', border:'1px solid var(--win-soft-border)', color:'var(--win)'}}>
                Preloved · Barang Bekas
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-2" style={{letterSpacing:'var(--tracking-tight)'}}>
                Bukan cuma baru — yang bekas juga di sini.
              </h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                Hemat lebih jauh dengan barang preloved dari penjual terpercaya OLX &amp; Carousell. Kami bandingkan harga second terbaik untuk Anda.
              </p>
              <Link href="/cari?condition=used"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{background:'var(--gradient-win)', color:'#053d24', boxShadow:'var(--shadow-green)'}}>
                Jelajahi Preloved →
              </Link>
            </div>
            <div className="flex gap-3">
              {usedProducts.slice(0, 2).map(p => {
                const cheapest = lowestListingFirst(p.listings)[0]
                return cheapest ? (
                  <Link key={p.id} href={"/produk/" + p.id}
                    className="w-36 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--brand-soft-border)] transition-all group">
                    <div className="aspect-square bg-[var(--bg-hover)] overflow-hidden">
                      {p.images[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-medium text-white line-clamp-2 leading-snug mb-1">{p.name}</p>
                      <p className="text-xs font-bold" style={{color:'var(--brand)'}}>{formatRupiah(cheapest.price, true)}</p>
                    </div>
                  </Link>
                ) : null
              })}
            </div>
          </div>
        </div>
      </section>

      {/* BARANG BEKAS */}
      {usedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Package size={20} className="text-orange-400" />
                Barang Bekas Berkualitas
              </h2>
              <p className="text-sm text-[var(--text-muted)]">Produk second hand terpercaya dari OLX & Carousell</p>
            </div>
            <Link href="/cari?condition=used" className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors">
              Lihat semua <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
            {usedProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)] bg-orange-500/5 border border-orange-500/15 rounded-xl px-4 py-3">
            <span className="text-orange-400 font-medium">♻️ Barang Bekas</span>
            <span>·</span>
            <span>Harga lebih hemat, kondisi terpilih. Verifikasi penjual sebelum bertransaksi.</span>
          </div>
        </section>
      )}

      {/* HEMAT TERBESAR */}
      {hematProducts.length > 0 && (
        <section className="bg-[var(--bg-card)] border-y border-[var(--border-subtle)] py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingDown size={20} className="text-green-400" />
                  Hemat Terbesar Hari Ini
                </h2>
                <p className="text-sm text-[var(--text-muted)]">Selisih harga terbesar antar platform</p>
              </div>
              <Link href="/cari?sort=hemat" className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors">
                Lihat semua <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hematProducts.map(({ product, diff, savings }) => {
                const sorted = lowestListingFirst(product.listings)
                const cheapest = sorted[0]
                const platform = PLATFORMS[cheapest.platformId]
                return (
                  <Link key={product.id} href={"/produk/" + product.id}
                    className="group bg-[var(--bg-hover)] border border-green-500/15 rounded-2xl p-4 hover:border-green-500/40 hover:shadow-[0_4px_24px_rgba(34,197,94,0.08)] transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ background: platform.color }}>
                        {platform.shortName.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{product.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{platform.name}</p>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-white mb-1">{formatRupiah(cheapest.price, true)}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-green-400 font-semibold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                        Hemat {diff}%
                      </span>
                      <span className="text-xs text-[var(--text-muted)] truncate">
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

      {/* FEATURES */}
      <section className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Lebih dari sekadar perbandingan harga</h2>
            <p className="text-[var(--text-secondary)]">Semua yang Anda butuhkan dalam satu platform</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <TrendingDown className="text-green-400" size={22} />, title: 'Bandingkan Real-Time', desc: 'Harga diperbarui setiap 4 jam dari semua marketplace. Selalu dapatkan harga terkini.', badge: 'LIVE', badgeColor: 'bg-green-500/12 text-green-400 border border-green-500/20' },
              { icon: <Wallet className="text-amber-400" size={22} />, title: 'Cashback Otomatis', desc: 'Beli melalui kami dan dapatkan cashback 5-8%. Saldo bisa ditarik ke GoPay/OVO/Bank.', badge: 'S/D 8%', badgeColor: 'bg-amber-500/12 text-amber-400 border border-amber-500/20' },
              { icon: <Bell className="text-amber-300" size={22} />, title: 'Price Alert Pintar', desc: 'Set target harga dan dapatkan notifikasi WA/Email saat harga turun ke target.', badge: 'WA + EMAIL', badgeColor: 'bg-amber-500/12 text-amber-300 border border-amber-500/20' },
              { icon: <Zap className="text-yellow-400" size={22} />, title: 'Beli Sekarang', desc: 'Tidak perlu pindah tab. Beli langsung melalui kami, cashback masuk otomatis.', badge: '1 KLIK', badgeColor: 'bg-yellow-500/12 text-yellow-400 border border-yellow-500/20' },
              { icon: <RefreshCw className="text-cyan-400" size={22} />, title: 'Riwayat Harga', desc: 'Grafik harga 90 hari terakhir. Tahu kapan harga sedang turun atau naik.', badge: '90 HARI', badgeColor: 'bg-cyan-500/12 text-cyan-400 border border-cyan-500/20' },
              { icon: <Shield className="text-blue-400" size={22} />, title: 'Toko Terverifikasi', desc: 'Hanya tampilkan listing dari toko resmi dan terverifikasi. Aman dari penipuan.', badge: 'VERIFIED', badgeColor: 'bg-blue-500/12 text-blue-400 border border-blue-500/20' },
            ].map(f => (
              <div key={f.title} className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 hover:border-amber-500/25 hover:shadow-[0_4px_20px_rgba(245,158,11,0.06)] transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center">{f.icon}</div>
                  <span className={"text-[10px] font-bold px-2 py-1 rounded-lg " + f.badgeColor}>{f.badge}</span>
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLATFORM KAMI */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">Platform yang Kami Dukung</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Harga real-time dari <span className="text-white font-medium">{platformList.length} marketplace</span> terpopuler di Indonesia &amp; dunia
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {platformList.map(p => (
            <Link key={p.id} href={'/cari?platform=' + p.id}
              className="group bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-5 hover:border-transparent hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
              {/* Platform icon */}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold mb-3 shadow-md shrink-0"
                style={{ background: p.id === 'tiktok' ? '#1a1a1a' : p.color }}>
                {p.shortName.slice(0, 2)}
              </div>
              {/* Name + cashback */}
              <div className="font-semibold text-white text-sm mb-0.5 group-hover:text-white transition-colors">
                {p.name}
              </div>
              <div className="text-xs text-amber-400 font-medium mb-2">
                Cashback {p.cashbackPct}%
              </div>
              {/* Color accent bar */}
              <div className="mt-auto h-0.5 rounded-full w-0 group-hover:w-full transition-all duration-300"
                style={{ background: p.id === 'tiktok' ? '#fe2c55' : p.color }} />
            </Link>
          ))}
        </div>
        <div className="text-center mt-6">
          <p className="text-xs text-[var(--text-muted)]">
            Klik platform untuk melihat produk termurah di sana
          </p>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Jelajahi Kategori</h2>
          <Link href="/cari" className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
            Lihat semua <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map(cat => (
            <Link key={cat.id} href={"/cari?kategori=" + cat.id}
              className="flex flex-col items-center gap-2 p-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl hover:border-amber-500/35 hover:bg-[var(--bg-hover)] hover:scale-105 transition-all group text-center">
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-white transition-colors">{cat.label}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{(cat.count / 1000).toFixed(0)}rb+</span>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[var(--bg-card)] border-t border-b border-[var(--border-subtle)] py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Cara kerja harga.com</h2>
          <p className="text-[var(--text-secondary)] mb-12">Hemat uang dalam 3 langkah mudah</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '\U0001f50d', title: 'Cari Produk', desc: 'Ketik nama produk atau paste link dari marketplace manapun' },
              { step: '02', icon: '\U0001f4a1', title: 'Bandingkan Harga', desc: 'Lihat harga dari semua marketplace sekaligus + grafik historis' },
              { step: '03', icon: '\U0001f4b0', title: 'Beli & Dapat Cashback', desc: 'Beli melalui kami, cashback masuk otomatis ke wallet Anda' },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl mb-4 shadow-sm">
                  {s.icon}
                </div>
                <div className="text-xs font-bold text-amber-400 mb-2 tracking-wider">LANGKAH {s.step}</div>
                <h3 className="font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CASHBACK CTA */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="relative overflow-hidden bg-[var(--bg-card)] border border-amber-500/20 rounded-2xl p-8 sm:p-12 text-center shadow-[0_0_60px_rgba(245,158,11,0.06)]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.06),transparent)] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
          <div className="relative">
            <div className="text-5xl mb-4">&#x1F4B0;</div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Dapatkan cashback hingga <span className="text-gradient-gold">8%</span>
            </h2>
            <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
              Daftar gratis, mulai belanja melalui harga.com, dan saldo cashback langsung masuk ke wallet Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button className="px-8 py-3 text-sm font-bold rounded-xl transition-opacity hover:opacity-90"
                style={{background:'var(--gradient-gold)', color:'var(--text-on-brand)', boxShadow:'var(--shadow-button)'}}>
                Daftar Gratis
              </button>
              <button className="px-8 py-3 bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white font-semibold rounded-xl transition-colors">
                Pelajari Lebih Lanjut
              </button>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              {['Cashback otomatis', 'Tarik ke GoPay/OVO', 'Tanpa minimum pembelian'].map(b => (
                <div key={b} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                  <CheckCircle2 size={14} className="text-green-400" />{b}
                </div>
              ))}
            </div>
                </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                <Zap size={12} className="text-white" fill="white" />
              </div>
              <span className="font-extrabold text-lg">
                <span className="text-white">harga</span>
                <span className="text-gradient-gold">.com</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
              Platform perbandingan harga terlengkap di Indonesia. Hemat lebih banyak, belanja lebih cerdas.
            </p>
            <div className="flex gap-2">
              {[
                { label: 'Instagram', icon: 'IG', href: '#' },
                { label: 'Twitter',   icon: 'TW', href: '#' },
                { label: 'TikTok',   icon: 'TK', href: '#' },
                { label: 'YouTube',  icon: 'YT', href: '#' },
              ].map(s => (
                <a key={s.label} href={s.href} title={s.label}
                  className="w-7 h-7 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-subtle)] flex items-center justify-center text-[9px] font-bold text-[var(--text-muted)] hover:text-white hover:border-amber-500/30 transition-colors">
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
              <div className="font-semibold text-white text-sm mb-3">{col.title}</div>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l}><a href="#" className="text-xs text-[var(--text-muted)] hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--border-subtle)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[var(--text-muted)]">&#169; 2026 harga.com &#8212; Harga real-time, cashback nyata.</p>
          <p className="text-xs text-[var(--text-muted)]">Made with love in Indonesia</p>
        </div>
      </footer>
    </div>
  )
}
