import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { ReferralHandler } from '@/components/ReferralHandler'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://harga-com.vercel.app'),
  title: 'Harga.com — Temukan Harga Termurah di Seluruh Indonesia',
  description: 'Bandingkan harga dari Tokopedia, Shopee, Lazada, dan 14+ marketplace lainnya. Dapatkan cashback, set price alert, dan beli langsung dengan harga terbaik.',
  keywords: ['bandingkan harga', 'harga murah', 'cashback', 'price comparison', 'tokopedia', 'shopee', 'lazada'],
  openGraph: {
    title: 'Harga.com — Perbandingan Harga Terbaik Indonesia',
    description: 'Temukan harga terbaik dari Tokopedia, Shopee, Lazada dan platform lain',
    type: 'website',
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://harga-com.vercel.app',
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
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
