'use client'

import { useState } from 'react'
import { X, Zap, CheckCircle2, Loader2, Bell } from 'lucide-react'

interface WaitlistModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })
      if (!res.ok) throw new Error('Server error')
      setDone(true)
    } catch {
      setError('Ups, ada masalah. Coba lagi ya.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => { setDone(false); setEmail(''); setName(''); setError('') }, 300)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 201,
        width: '100%', maxWidth: 400,
        padding: '0 16px',
        animation: 'slideUp 0.2s ease',
      }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          padding: 28,
          boxShadow: '0 24px 60px rgba(26,24,20,0.18)',
        }}>
          {/* Close */}
          <button onClick={handleClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 32, height: 32, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)',
            }}>
            <X size={16} />
          </button>

          {done ? (
            /* Success state */
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(74,222,128,0.12)',
              }}>
                <CheckCircle2 size={28} style={{ color: '#4ade80' }} />
              </div>
              <h2 style={{
                fontFamily: 'var(--font-editorial)', fontSize: 22, fontWeight: 400,
                color: 'var(--text-primary)', margin: '0 0 8px',
              }}>
                Kamu masuk daftar! 🎉
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 20px' }}>
                Kami akan kirim notifikasi ke <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> saat fitur-fitur baru siap.
              </p>
              <button onClick={handleClose}
                style={{
                  width: '100%', padding: '11px', borderRadius: 12, border: 'none',
                  background: 'var(--bg-hover)', color: 'var(--text-secondary)',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-ui)',
                }}>
                Tutup
              </button>
            </div>
          ) : (
            /* Form state */
            <>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--brand-soft-bg)',
                  border: '1px solid var(--brand-soft-border)',
                }}>
                  <Zap size={20} style={{ color: 'var(--brand)' }} />
                </div>
                <div>
                  <h2 style={{
                    fontFamily: 'var(--font-editorial)', fontSize: 20, fontWeight: 400,
                    color: 'var(--text-primary)', margin: 0,
                  }}>
                    Daftar Akses Awal
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Gratis · Notifikasi saat fitur ready
                  </p>
                </div>
              </div>

              {/* Perks */}
              <div style={{
                background: 'var(--bg-hover)', borderRadius: 12, padding: '12px 14px',
                marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 7,
              }}>
                {[
                  'Price alert tanpa batas',
                  'Cashback otomatis setiap pembelian',
                  'Laporan harga mingguan via email',
                ].map(perk => (
                  <div key={perk} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bell size={11} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{perk}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Nama
                  </label>
                  <input
                    type="text" value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nama kamu"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      background: 'var(--bg-hover)', border: '1px solid var(--border)',
                      fontSize: 13, color: 'var(--text-primary)', outline: 'none',
                      fontFamily: 'var(--font-ui)', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Email <span style={{ color: 'var(--brand)' }}>*</span>
                  </label>
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    required placeholder="nama@email.com"
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10,
                      background: 'var(--bg-hover)', border: '1px solid var(--border)',
                      fontSize: 13, color: 'var(--text-primary)', outline: 'none',
                      fontFamily: 'var(--font-ui)', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {error && (
                  <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>
                )}

                <button type="submit" disabled={loading}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                    background: 'var(--brand)', color: '#fff',
                    fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'var(--font-ui)',
                    transition: 'opacity 0.15s',
                  }}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                  {loading ? 'Mendaftarkan...' : 'Daftar Sekarang — Gratis'}
                </button>

                <p style={{ fontSize: 11, textAlign: 'center', color: 'var(--text-muted)', margin: 0 }}>
                  Tidak ada spam. Bisa berhenti langganan kapan saja.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}
