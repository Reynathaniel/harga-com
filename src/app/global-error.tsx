'use client'

/**
 * global-error.tsx — Root layout error boundary.
 * Catches errors thrown in the root layout itself (e.g. Navbar crash).
 * Must include its own <html><body> since it replaces the layout.
 */

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log to an error reporting service
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="id">
      <body style={{
        background: '#0A0A0A', color: '#FFFFFF',
        fontFamily: 'system-ui, sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', margin: 0, flexDirection: 'column', gap: '16px',
        textAlign: 'center', padding: '0 16px',
      }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
          Terjadi kesalahan
        </h2>
        <p style={{ color: '#888', margin: 0, maxWidth: 400 }}>
          Maaf, ada kesalahan yang tidak terduga. Tim kami telah diberitahu.
        </p>
        <button
          onClick={() => reset()}
          style={{
            background: '#FF6B35', color: 'white', border: 'none',
            padding: '12px 24px', borderRadius: 12, cursor: 'pointer',
            fontSize: 14, fontWeight: 600, marginTop: 8,
          }}
        >
          Coba Lagi
        </button>
        <a href="/" style={{ color: '#FF6B35', fontSize: 14 }}>
          Kembali ke Beranda
        </a>
      </body>
    </html>
  )
}
