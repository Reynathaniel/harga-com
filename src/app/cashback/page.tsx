import { Wallet, Zap, ShoppingBag, TrendingDown, Gift, ArrowRight, Star, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { PLATFORMS, PLATFORM_ORDER } from '@/lib/platforms'

const STEPS = [
  { icon: <TrendingDown size={20} style={{ color: '#4ade80' }} />, title: 'Bandingkan harga', desc: 'Temukan harga terbaik di seluruh marketplace Indonesia dalam satu halaman.' },
  { icon: <ShoppingBag size={20} style={{ color: 'var(--brand)' }} />, title: 'Beli lewat harga.com', desc: 'Klik tombol "Beli" — kami arahkan ke marketplace dengan link afiliasi kami.' },
  { icon: <Wallet size={20} style={{ color: '#facc15' }} />, title: 'Cashback otomatis', desc: 'Cashback dihitung otomatis dan masuk ke wallet dalam 7–14 hari setelah konfirmasi pesanan.' },
]

const FAQ = [
  { q: 'Kapan cashback masuk ke wallet?', a: '7–14 hari setelah status pesanan berubah menjadi "selesai" di marketplace asal.' },
  { q: 'Apakah semua produk dapat cashback?', a: 'Hampir semua produk, kecuali produk yang sudah ada promo khusus di luar program afiliasi.' },
  { q: 'Berapa minimum penarikan?', a: 'Minimum penarikan saldo cashback adalah Rp 50.000.' },
  { q: 'Bagaimana cara menarik cashback?', a: 'Masuk ke dashboard, klik "Tarik Saldo", pilih metode (transfer bank atau e-wallet), dan konfirmasi.' },
  { q: 'Apakah cashback bisa expired?', a: 'Cashback berlaku 12 bulan sejak diterima. Pastikan kamu tarik sebelum masa berlaku habis.' },
]

export default function CashbackPage() {
  const sortedPlatforms = PLATFORM_ORDER
    .map(id => PLATFORMS[id])
    .filter(Boolean)
    .sort((a, b) => b.cashbackPct - a.cashbackPct)

  const maxPct = Math.max(...sortedPlatforms.map(p => p.cashbackPct))

  return (
    <div className="pt-[92px] min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 text-xs font-bold"
            style={{ background: 'var(--brand-soft-bg)', border: '1px solid var(--brand-soft-border)', color: 'var(--brand)' }}>
            <Zap size={11} /> Otomatis · Gratis · Tanpa kode promo
          </div>
          <h1 style={{
            fontFamily: 'var(--font-editorial)',
            fontSize: 'clamp(32px, 6vw, 52px)',
            fontWeight: 400, color: 'var(--text-primary)',
            margin: '0 0 14px', lineHeight: 1.1,
          }}>
            Belanja dapat <span style={{ color: 'var(--brand)' }}>cashback</span>
            <br />otomatis
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Bandingkan harga, beli lewat harga.com, dan dapatkan cashback hingga <strong style={{ color: 'var(--text-primary)' }}>8%</strong> dari total belanja.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/cari"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 100, background: 'var(--brand)',
                color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none',
                fontFamily: 'var(--font-ui)',
              }}>
              Mulai Belanja <ArrowRight size={15} />
            </Link>
            <Link href="/alert"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 100,
                border: '1px solid var(--border)', color: 'var(--text-secondary)',
                fontWeight: 600, fontSize: 14, textDecoration: 'none',
                background: 'var(--bg-card)', fontFamily: 'var(--font-ui)',
              }}>
              Set Price Alert
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { value: 'Rp 18 Jt+', label: 'Cashback dibagikan' },
            { value: '1.400+', label: 'Produk tracked' },
            { value: '12', label: 'Marketplace' },
          ].map(s => (
            <div key={s.label} className="text-center p-5 rounded-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <p style={{ fontFamily: 'var(--font-editorial)', fontSize: 28, fontWeight: 400, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                {s.value}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mb-12">
          <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: 24, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 20 }}>
            Cara kerja
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 16,
                padding: '18px 20px', borderRadius: 16, background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg-hover)', position: 'relative',
                }}>
                  {step.icon}
                  <span style={{
                    position: 'absolute', top: -6, right: -6, width: 18, height: 18,
                    borderRadius: '50%', background: 'var(--brand)',
                    color: '#fff', fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{i + 1}</span>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', margin: '0 0 4px' }}>{step.title}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform rates */}
        <div className="mb-12">
          <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: 24, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 6 }}>
            Cashback per platform
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Persentase dari total harga produk (tidak termasuk ongkir).</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedPlatforms.map(p => {
              const barW = Math.round((p.cashbackPct / maxPct) * 100)
              return (
                <div key={p.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 16px', borderRadius: 14, background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                  {/* Platform dot */}
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: p.color,
                  }} />
                  {/* Name */}
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', width: 100, flexShrink: 0 }}>
                    {p.name}
                  </span>
                  {/* Bar */}
                  <div style={{ flex: 1, height: 6, borderRadius: 100, background: 'var(--bg-hover)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${barW}%`, height: '100%', borderRadius: 100,
                      background: `linear-gradient(90deg, ${p.color}80, ${p.color})`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  {/* Pct */}
                  <span style={{
                    fontSize: 13, fontWeight: 800, width: 36, textAlign: 'right', flexShrink: 0,
                    color: p.cashbackPct === maxPct ? 'var(--brand)' : 'var(--text-primary)',
                  }}>
                    {p.cashbackPct}%
                    {p.cashbackPct === maxPct && (
                      <Star size={10} style={{ color: 'var(--brand)', marginLeft: 2, display: 'inline' }} />
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-12 p-6 rounded-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 16 }}>
            Kenapa cashback harga.com?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { title: 'Otomatis', desc: 'Tidak perlu kode promo — cashback langsung terhitung dari link kami.' },
              { title: 'Transparan', desc: 'Tracking real-time — lihat status cashback tiap transaksi di dashboard.' },
              { title: 'Bebas biaya', desc: 'Tidak ada biaya pendaftaran, biaya keanggotaan, maupun komisi tersembunyi.' },
              { title: 'Penarikan mudah', desc: 'Tarik ke GoPay, OVO, DANA, atau transfer bank kapan saja.' },
            ].map(b => (
              <div key={b.title} style={{ display: 'flex', gap: 10 }}>
                <CheckCircle2 size={16} style={{ color: 'var(--win)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', margin: '0 0 2px' }}>{b.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: 24, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 20 }}>
            FAQ
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQ.map((item, i) => (
              <details key={i} style={{
                padding: '14px 18px', borderRadius: 14, background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)', cursor: 'pointer',
              }}>
                <summary style={{
                  fontWeight: 600, fontSize: 13, color: 'var(--text-primary)',
                  cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  {item.q}
                  <span style={{ fontSize: 18, color: 'var(--text-muted)', fontWeight: 300, flexShrink: 0, marginLeft: 12 }}>+</span>
                </summary>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '10px 0 0', lineHeight: 1.6 }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 rounded-2xl text-center"
          style={{ background: 'var(--brand-soft-bg)', border: '1px solid var(--brand-soft-border)' }}>
          <Gift size={28} style={{ color: 'var(--brand)', margin: '0 auto 12px' }} />
          <h3 style={{ fontFamily: 'var(--font-editorial)', fontSize: 26, fontWeight: 400, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            Siap dapat cashback?
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
            Cari produk, bandingkan harga, dan beli lewat harga.com.
          </p>
          <Link href="/cari"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px',
              borderRadius: 100, background: 'var(--brand)', color: '#fff',
              fontWeight: 700, fontSize: 14, textDecoration: 'none', fontFamily: 'var(--font-ui)',
            }}>
            Cari Produk Sekarang <ArrowRight size={15} />
          </Link>
        </div>

      </div>
    </div>
  )
}
