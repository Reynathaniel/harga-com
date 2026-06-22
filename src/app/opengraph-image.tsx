import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Harga.com — Temukan Harga Termurah di Seluruh Indonesia'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 50%, #C2410C 100%)',
          position: 'relative',
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-2px',
            marginBottom: 16,
          }}
        >
          Harga.com
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.90)',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
            marginBottom: 40,
          }}
        >
          Bandingkan harga dari 8 marketplace Indonesia sekaligus
        </div>

        {/* Platform pills */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Tokopedia', 'Shopee', 'Lazada', 'Blibli', 'TikTok Shop'].map(name => (
            <div
              key={name}
              style={{
                padding: '8px 20px',
                background: 'rgba(255,255,255,0.18)',
                borderRadius: 999,
                color: '#ffffff',
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Bottom badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            fontSize: 16,
            color: 'rgba(255,255,255,0.65)',
            fontWeight: 500,
          }}
        >
          Cashback otomatis · Price alert · Gratis
        </div>
      </div>
    ),
    { ...size }
  )
}
