import { ProductCard } from '@/components/ProductCard'
import { LiveBar } from '@/components/LiveBar'
import { HeroRealSearch } from '@/components/HeroSection'
import { getProducts, getCategories } from '@/lib/db/products'
import { STATS, TRENDING_SEARCHES } from '@/lib/mock-data'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah, lowestListingFirst, priceDiffPercent } from '@/lib/utils'
import { TrendingDown, Bell, Wallet, Shield, Zap, RefreshCw, ArrowRight, CheckCircle2, Star } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 3600

export default async function HomePage() {
  const { products: allProducts } = await getProducts({ sort: 'popular', limit: 16 })
  const featuredProducts = allProducts.slice(0, 8)
  const categories = await getCategories()
  const platformList = Object.values(PLATFORMS)

  // Hemat terbesar: largest price gap across platforms
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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-full px-4 py-1.5 text-xs text-[var(--text-secondary)] mb-8 fade-in">
          <span className="live-dot" />
          <span className="font-medium">HARGA LIVE DARI {STATS.platforms} MARKETPLACE</span>
          <span className="text-[var(--text-muted)]">·</span>
          <span>UPDATE TIAP {STATS.updateInterval}</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-4 max-w-4xl leading-[1.05] fade-in">
          Temukan harga<br />
          <span className="text-gradient-gold italic">termurah</span>{' '}
          <span className="text-[var(--text-primary)]">di seluruh</span><br />
          <span className="text-[var(--text-primary)]">Indonesia.</span>
        </h1>

        <p className="text-[var(--text-secondary)] text-lg max-w-xl mb-10 leading-relaxed fade-in">
          Bandingkan harga, lacak riwayat, dan klaim cashback dari{' '}
          <span className="text-white font-medium">Tokopedia</span>,{' '}
          <span className="text-white font-medium">Shopee</span>,{' '}
          <span className="text-white font-medium">Lazada</span>,{' '}
          <span className="text-white font-medium">TikTok Shop</span>, dan lainnya.
        </p>

        <HeroRealSearch />

        <div className="flex flex-wrap gap-2 justify-center mb-10 mt-4">
          {TRENDING_SEARCHES.slice(0, 8).map(t => (
            <Link key={t} href={`/cari?q=${encodeURIComponent(t)}`}
              className="px-3 py-1 text-xs bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-indigo-500/50 hover:text-white rounded-full transition-colors">
              {t}
            </Link>
          ))}
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-6 py-3 text-sm mb-8">
          <span className="text-white font-bold">22.000+</span>
          <span className="text-[var(--text-muted)]">produk</span>
          <span className="text-[var(--border)]">|</span>
          <span className="text-white font-bold">6</span>
          <span className="text-[var(--text-muted)]">platform</span>
          <span className="text-[var(--border)]">|</span>
          <span className="text-[var(--text-muted)]">Update tiap 4 jam</span>
          <span className="text-[var(--border)]">|</span>
          <span className="live-dot ml-0.5" />
          <span className="text-green-400 font-medium text-xs">Live</span>
        </div>

        {/* Platform logos */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <span className="text-xs text-[var(--text-muted)]">Harga dari:</span>
          {platformList.map(p => (
            <div key={p.id}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[10px] font-bold shadow-lg hover:scale-110 transition-transform cursor-default"
              style={{ background: p.id === 'tiktok' ? '#1a1a1a' : p.color }}
              title={p.name}>
              {p.shortName.slice(0, 2)}
            </div>
          ))}
        </div>
      </section>

      {/* LIVE BAR */}
      <LiveBar />

      {/* FEATURED PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Produk Terpopuler</h2>
            <p className="text-sm text-[var(--text-muted)]">Harga terupdate dari semua platform</p>
          </div>
          <Link href="/cari?sort=popular" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            Lihat semua <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
          {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* HEMAT TERBESAR */}
      {hematProducts.length > 0 && (
        <section className="bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-primary)] border-y border-[var(--border)] py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingDown size={20} className="text-green-400" />
                  Hemat Terbesar Hari Ini
                </h2>
                <p className="text-sm text-[var(--text-muted)]">Selisih harga terbesar antar platform</p>
              </div>
              <Link href="/cari?sort=hemat" className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1">
                Lihat semua <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hematProducts.map(({ product, diff, savings }) => {
                const sorted = lowestListingFirst(product.listings)
                const cheapest = sorted[0]
                const platform = PLATFORMS[cheapest.platformId]
                return (
                  <Link key={product.id} href={`/produk/${product.id}`}
                    className="group bg-[var(--bg-card)] border border-green-500/20 rounded-2xl p-4 hover:border-green-500/50 hover:shadow-[0_4px_30px_rgba(34,197,94,0.1)] transition-all">
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
      <section className="bg-[var(--bg-card)] border-y border-[var(--border)] py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Lebih dari sekadar perbandingan harga</h2>
            <p className="text-[var(--text-secondary)]">Semua yang Anda butuhkan dalam satu platform</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: <TrendingDown className="text-green-400" size={24} />, title: 'Bandingkan Real-Time', desc: 'Harga diperbarui setiap 4 jam dari semua marketplace. Selalu dapatkan harga terkini.', badge: 'LIVE', badgeColor: 'bg-green-500/15 text-green-400' },
              { icon: <Wallet className="text-amber-400" size={24} />, title: 'Cashback Otomatis', desc: 'Beli melalui kami dan dapatkan cashback 5-8%. Saldo bisa ditarik ke GoPay/OVO/Bank.', badge: 'S/D 8%', badgeColor: 'bg-amber-500/15 text-amber-400' },
              { icon: <Bell className="text-indigo-400" size={24} />, title: 'Price Alert Pintar', desc: 'Set target harga dan dapatkan notifikasi WA/Email saat harga turun ke target.', badge: 'WA + EMAIL', badgeColor: 'bg-indigo-500/15 text-indigo-400' },
              { icon: <Zap className="text-yellow-400" size={24} />, title: 'Beli Sekarang', desc: 'Tidak perlu pindah tab. Beli langsung melalui kami, cashback masuk otomatis.', badge: '1 KLIK', badgeColor: 'bg-yellow-500/15 text-yellow-400' },
              { icon: <RefreshCw className="text-cyan-400" size={24} />, title: 'Riwayat Harga', desc: 'Grafik harga 90 hari terakhir. Tahu kapan harga sedang turun atau naik.', badge: '90 HARI', badgeColor: 'bg-cyan-500/15 text-cyan-400' },
              { icon: <Shield className="text-purple-400" size={24} />, title: 'Toko Terverifikasi', desc: 'Hanya tampilkan listing dari toko resmi dan terverifikasi. Aman dari penipuan.', badge: 'VERIFIED', badgeColor: 'bg-purple-500/15 text-purple-400' },
            ].map(f => (
              <div key={f.title} className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl p-5 hover:border-indigo-500/30 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-card)] flex items-center justify-center">{f.icon}</div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${f.badgeColor}`}>{f.badge}</span>
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Jelajahi Kategori</h2>
          <Link href="/cari" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            Lihat semua <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map(cat => (
            <Link key={cat.id} href={`/cari?kategori=${cat.id}`}
              className="flex flex-col items-center gap-2 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl hover:border-indigo-500/40 hover:bg-[var(--bg-hover)] hover:scale-105 transition-all group text-center">
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-white transition-colors">{cat.label}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{(cat.count / 1000).toFixed(0)}rb+</span>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[var(--bg-card)] border-t border-b border-[var(--border)] py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Cara kerja harga.com</h2>
          <p className="text-[var(--text-secondary)] mb-12">Hemat uang dalam 3 langkah mudah</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '🔍', title: 'Cari Produk', desc: 'Ketik nama produk atau paste link dari marketplace manapun' },
              { step: '02', icon: '💡', title: 'Bandingkan Harga', desc: 'Lihat harga dari semua marketplace sekaligus + grafik historis' },
              { step: '03', icon: '💰', title: 'Beli & Dapat Cashback', desc: 'Beli melalui kami, cashback masuk otomatis ke wallet Anda' },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-3xl mb-4">{s.icon}</div>
                <div className="text-xs font-bold text-indigo-400 mb-2 tracking-wider">LANGKAH {s.step}</div>
                <h3 className="font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CASHBACK CTA */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600/20 via-indigo-800/10 to-amber-500/10 border border-indigo-500/20 rounded-2xl p-8 sm:p-12 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),transparent)] pointer-events-none" />
          <div className="relative">
            <div className="text-5xl mb-4">💰</div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Dapatkan cashback hingga <span className="text-gradient-gold">8%</span>
            </h2>
            <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
              Daftar gratis, mulai belanja melalui harga.com, dan saldo cashback langsung masuk ke wallet Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors">Daftar Gratis</button>
              <button className="px-8 py-3 bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white font-semibold rounded-xl transition-colors">Pelajari Lebih Lanjut</button>
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
      <footer className="border-t border-[var(--border)] bg-[#0a0a12] px-4 py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
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
                  className="w-7 h-7 rounded-lg bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[9px] font-bold text-[var(--text-muted)] hover:text-white hover:border-indigo-500/40 transition-colors">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
          {[
            { title: 'Fitur', links: ['Bandingkan Harga', 'Price Alert', 'Cashback', 'Browser Extension', 'Mobile App'] },
            { title: 'Platform', links: ['Tokopedia', 'Shopee', 'Lazada', 'Bukalapak', 'TikTok Shop'] },
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

        <div className="border-t border-[var(--border)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[var(--text-muted)]">© 2026 harga.com — Harga real-time, cashback nyata.</p>
          <p className="text-xs text-[var(--text-muted)]">Made with love in Indonesia</p>
        </div>
      </footer>
    </div>
  )
}
