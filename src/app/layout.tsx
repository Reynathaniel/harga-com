import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { LiveBar } from '@/components/LiveBar'
import { ReferralHandler } from '@/components/ReferralHandler'

export const metadata: Metadata = {
  metadataBase: new URL('https://harga.com'),
  title: 'Harga.com — Temukan Harga Termurah di Seluruh Indonesia',
  description: 'Bandingkan harga dari Tokopedia, Shopee, Lazada, dan 14+ marketplace lainnya. Dapatkan cashback, set price alert, dan beli langsung dengan harga terbaik.',
  keywords: ['bandingkan harga', 'harga murah', 'cashback', 'price comparison', 'tokopedia', 'shopee', 'lazada'],
  openGraph: {
    title: 'Harga.com — Perbandingan Harga Terbaik Indonesia',
    description: 'Temukan harga terbaik dari Tokopedia, Shopee, Lazada dan platform lain',
    type: 'website',
    url: 'https://harga.com',
    siteName: 'Harga.com',
    locale: 'id_ID',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Harga.com — Perbandingan Harga Terbaik Indonesia',
    description: 'Temukan harga terbaik dari Tokopedia, Shopee, Lazada dan platform lain',
    site: '@hargacom',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <Suspense fallback={null}><ReferralHandler /></Suspense>
        <LiveBar />
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
