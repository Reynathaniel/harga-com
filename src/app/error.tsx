'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', padding: '40px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>Terjadi Kesalahan</h2>
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
        Maaf, ada yang tidak beres. Silakan coba lagi.
      </p>
      <button
        onClick={reset}
        style={{ padding: '12px 24px', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
      >
        Coba Lagi
      </button>
    </div>
  )
}
