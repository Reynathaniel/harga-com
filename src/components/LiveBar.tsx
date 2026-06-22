'use client'

const LIVE_DROPS = [
  { name: 'Sony WH-1000XM5', drop: '-12.5%', platform: 'Shopee', price: 'Rp 3.990.000' },
  { name: 'iPhone 15 128GB', drop: '-8.2%', platform: 'Tokopedia', price: 'Rp 12.499.000' },
  { name: 'Dyson V15 Detect', drop: '-15.3%', platform: 'Lazada', price: 'Rp 6.999.000' },
  { name: 'Samsung Galaxy S24', drop: '-6.8%', platform: 'Blibli', price: 'Rp 11.999.000' },
  { name: 'Nintendo Switch OLED', drop: '-9.1%', platform: 'TikTok Shop', price: 'Rp 3.899.000' },
  { name: 'MacBook Air M2', drop: '-5.4%', platform: 'Tokopedia', price: 'Rp 14.999.000' },
  { name: 'ASUS ROG Zephyrus G14', drop: '-11.2%', platform: 'Shopee', price: 'Rp 18.499.000' },
  { name: 'Xiaomi 14 Ultra', drop: '-7.6%', platform: 'Lazada', price: 'Rp 9.799.000' },
]

export function LiveBar() {
  const items = [...LIVE_DROPS, ...LIVE_DROPS]

  return (
    <div className="ticker-dark" style={{ zIndex: 40, position: 'relative' }}>
      {/* LIVE label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 14px',
        borderRight: '1px solid rgba(255,255,255,0.12)',
        height: '100%',
        flexShrink: 0,
        zIndex: 1,
        background: 'var(--bg-dark)',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--brand)',
          display: 'inline-block',
          flexShrink: 0,
          animation: 'harga-price-pulse 2s ease-in-out infinite',
        }} />
        <span style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.12em',
          color: 'var(--brand)',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-ui)',
        }}>LIVE DROPS</span>
      </div>

      {/* Scrolling content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Fade edges */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(to right, var(--bg-dark), transparent)',
        }} />
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(to left, var(--bg-dark), transparent)',
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          animation: 'ticker-scroll 36s linear infinite',
          width: 'max-content',
          height: '100%',
          willChange: 'transform',
        }}>
          {items.map((item, i) => (
            <span key={i} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 24px',
              whiteSpace: 'nowrap',
              fontSize: 12,
              fontFamily: 'var(--font-ui)',
              borderRight: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{item.name}</span>
              <span style={{
                color: '#4ADE80',
                fontWeight: 700,
                fontSize: 11,
              }}>{item.drop}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>@</span>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>{item.platform}</span>
              <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{item.price}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
