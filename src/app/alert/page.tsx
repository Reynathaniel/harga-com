'use client'

import { useState } from 'react'
import { Bell, Search, TrendingDown, CheckCircle2, Trash2, Plus, Zap, Mail, Phone } from 'lucide-react'
import Link from 'next/link'

const DEMO_ALERTS = [
  { id: 1, product: 'Sony WH-1000XM5', currentPrice: 3990000, targetPrice: 3500000, platform: 'Shopee', notifyType: 'email', active: true },
  { id: 2, product: 'iPhone 15 Pro Max 256GB', currentPrice: 18799000, targetPrice: 16000000, platform: 'Tokopedia', notifyType: 'wa', active: true },
  { id: 3, product: 'ASUS ROG Zephyrus G14', currentPrice: 21499000, targetPrice: 19000000, platform: 'TikTok Shop', notifyType: 'email', active: false },
]

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

export default function AlertPage() {
  const [query, setQuery] = useState('')
  const [email, setEmail] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [notifyType, setNotifyType] = useState<'email' | 'wa'>('email')
  const [submitted, setSubmitted] = useState(false)
  const [alerts, setAlerts] = useState(DEMO_ALERTS)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
    setQuery('')
    setEmail('')
    setTargetPrice('')
  }

  const removeAlert = (id: number) => setAlerts(prev => prev.filter(a => a.id !== id))

  return (
    <div className="pt-[92px] min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'var(--brand-soft-bg)', border: '1px solid var(--brand-soft-border)' }}>
            <Bell size={24} style={{ color: 'var(--brand)' }} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-editorial)',
            fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: 400, color: 'var(--text-primary)',
            margin: '0 0 10px',
          }}>
            Price Alert
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', fontSize: 15 }}>
            Set target harga — kami kabari via Email atau WhatsApp saat harga turun.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: <Search size={18} style={{ color: 'var(--brand)' }} />, title: 'Cari produk', desc: 'Temukan produk yang ingin dipantau' },
            { icon: <TrendingDown size={18} style={{ color: 'var(--win)' }} />, title: 'Set target harga', desc: 'Tentukan harga tujuan kamu' },
            { icon: <Bell size={18} style={{ color: '#facc15' }} />, title: 'Terima notifikasi', desc: 'Kami hubungi via Email atau WA' },
          ].map(s => (
            <div key={s.title} className="text-center p-4 rounded-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'var(--bg-hover)' }}>
                {s.icon}
              </div>
              <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>{s.title}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Create alert form */}
        <div className="rounded-2xl p-6 mb-8"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 12px rgba(26,24,20,0.06)' }}>
          <h2 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 20 }}>
            <Plus size={15} style={{ display: 'inline', marginRight: 6 }} />
            Buat Alert Baru
          </h2>

          {submitted ? (
            <div className="text-center py-6">
              <CheckCircle2 size={36} style={{ color: 'var(--win)', margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Alert berhasil dibuat!</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Kamu akan dihubungi saat harga mencapai target.</p>
            </div>
          ) : (
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Product search */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Cari Produk
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }} />
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    required
                    placeholder="Contoh: iPhone 15 Pro, Sony WH-1000XM5..."
                    style={{
                      width: '100%', paddingLeft: 36, paddingRight: 16, paddingTop: 10, paddingBottom: 10,
                      background: 'var(--bg-hover)', border: '1px solid var(--border)',
                      borderRadius: 12, fontSize: 13, color: 'var(--text-primary)',
                      outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-ui)',
                    }}
                  />
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Atau{' '}
                  <Link href="/cari" style={{ color: 'var(--brand)', textDecoration: 'none' }}>
                    cari produk
                  </Link>
                  {' '}dan klik tombol "Pantau Harga" di halaman produk.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Target price */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Target Harga (Rp)
                  </label>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={e => setTargetPrice(e.target.value)}
                    required
                    placeholder="Contoh: 3500000"
                    style={{
                      width: '100%', padding: '10px 12px',
                      background: 'var(--bg-hover)', border: '1px solid var(--border)',
                      borderRadius: 12, fontSize: 13, color: 'var(--text-primary)',
                      outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-ui)',
                    }}
                  />
                </div>

                {/* Notify type */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Notifikasi via
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { id: 'email' as const, label: 'Email', icon: <Mail size={12} /> },
                      { id: 'wa' as const, label: 'WA', icon: <Phone size={12} /> },
                    ].map(opt => (
                      <button key={opt.id} type="button" onClick={() => setNotifyType(opt.id)}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                          padding: '10px 0', borderRadius: 12, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          border: `1px solid ${notifyType === opt.id ? 'var(--brand)' : 'var(--border)'}`,
                          background: notifyType === opt.id ? 'var(--brand-soft-bg)' : 'var(--bg-hover)',
                          color: notifyType === opt.id ? 'var(--brand)' : 'var(--text-secondary)',
                          transition: 'all 0.15s',
                        }}>
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {notifyType === 'email' ? 'Alamat Email' : 'Nomor WhatsApp'}
                </label>
                <input
                  type={notifyType === 'email' ? 'email' : 'tel'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder={notifyType === 'email' ? 'nama@email.com' : '08xxxxxxxxxx'}
                  style={{
                    width: '100%', padding: '10px 14px',
                    background: 'var(--bg-hover)', border: '1px solid var(--border)',
                    borderRadius: 12, fontSize: 13, color: 'var(--text-primary)',
                    outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-ui)',
                  }}
                />
              </div>

              <button type="submit"
                style={{
                  width: '100%', padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 14,
                  fontFamily: 'var(--font-ui)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                <Bell size={15} /> Aktifkan Alert
              </button>
              <p style={{ fontSize: 11, textAlign: 'center', color: 'var(--text-muted)', margin: 0 }}>
                Gratis · Bisa dibatalkan kapan saja · Tidak ada spam
              </p>
            </form>
          )}
        </div>

        {/* Active alerts */}
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 14 }}>
            Alert Aktif ({alerts.filter(a => a.active).length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.map(alert => {
              const pct = Math.round(100 * (alert.currentPrice - alert.targetPrice) / alert.currentPrice)
              return (
                <div key={alert.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                    borderRadius: 16, background: 'var(--bg-card)',
                    border: `1px solid ${alert.active ? 'var(--border-subtle)' : 'var(--border)'}`,
                    opacity: alert.active ? 1 : 0.5,
                  }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: alert.active ? 'var(--brand-soft-bg)' : 'var(--bg-hover)',
                  }}>
                    <Bell size={16} style={{ color: alert.active ? 'var(--brand)' : 'var(--text-muted)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {alert.product}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      Target: <span style={{ color: 'var(--win)', fontWeight: 600 }}>{formatRupiah(alert.targetPrice)}</span>
                      {' · '}Hemat {pct}% dari harga sekarang
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100,
                      background: alert.notifyType === 'email' ? 'rgba(36,113,163,0.12)' : 'rgba(37,211,102,0.12)',
                      color: alert.notifyType === 'email' ? 'var(--blue-400)' : '#25d366',
                    }}>
                      {alert.notifyType === 'email' ? 'Email' : 'WhatsApp'}
                    </span>
                  </div>
                  <button onClick={() => removeAlert(alert.id)}
                    style={{
                      width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'transparent', color: 'var(--text-muted)', flexShrink: 0,
                    }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
            {alerts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                Belum ada alert aktif.
              </div>
            )}
          </div>
        </div>

        {/* Promo banner */}
        <div className="mt-10 p-5 rounded-2xl text-center"
          style={{ background: 'var(--brand-soft-bg)', border: '1px solid var(--brand-soft-border)' }}>
          <Zap size={20} style={{ color: 'var(--brand)', margin: '0 auto 8px' }} />
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', fontSize: 14 }}>
            Beli lewat harga.com = cashback otomatis
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
            Saat alert terpicu, beli langsung dari link kami dan cashback masuk otomatis ke wallet.
          </p>
          <Link href="/cashback"
            style={{
              display: 'inline-block', padding: '8px 20px', borderRadius: 100,
              background: 'var(--brand)', color: '#fff', fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
            }}>
            Pelajari Cashback →
          </Link>
        </div>

      </div>
    </div>
  )
}
