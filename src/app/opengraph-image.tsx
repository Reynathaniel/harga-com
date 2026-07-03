import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background gradient blobs */}
        <div style={{
          position: 'absolute',
          top: -150,
          left: -150,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.25) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,165,0,0.15) 0%, transparent 70%)',
        }} />

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
          {/* Brand name */}
          <div style={{
            fontSize: 88,
            fontWeight: 800,
            color: '#FF6B35',
            letterSpacing: '-3px',
            marginBottom: 20,
            lineHeight: 1,
          }}>
            Harga.com
          </div>

          {/* Tagline */}
          <div style={{
            fontSize: 38,
            color: '#FFFFFF',
            fontWeight: 400,
            textAlign: 'center',
            marginBottom: 12,
            letterSpacing: '-0.5px',
          }}>
            Temukan Harga Termurah di Indonesia
          </div>

          {/* Sub-tagline */}
          <div style={{
            fontSize: 22,
            color: '#888888',
            textAlign: 'center',
            marginBottom: 56,
          }}>
            Bandingkan Barang Baru &amp; Bekas dari 17 Marketplace
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 80 }}>
            {[
              { value: '2.000+', label: 'Produk' },
              { value: '17', label: 'Marketplace' },
              { value: 'Real-time', label: 'Update Harga' },
            ].map(stat => (
              <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 42, fontWeight: 700, color: '#FF6B35', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 18, color: '#666666', marginTop: 8 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
