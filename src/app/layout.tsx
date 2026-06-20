import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { LiveBar } from '@/components/LiveBar'

export const metadata: Metadata = {
  title: 'harga.app â Temukan Harga Termurah di Seluruh Indonesia',
  description: 'Bandingkan harga dari Tokopedia, Shopee, Lazada, dan 5 marketplace lainnya. Dapatkan cashback, set price alert, dan beli langsung dengan harga terbaik.',
  keywords: ['bandingkan harga', 'harga murah', 'cashback', 'price comparison', 'tokopedia', 'shopee', 'lazada'],
  openGraph: {
    title: 'harga.app â Temukan Harga Termurah',
    description: 'Bandingkan harga dari 8 marketplace Indonesia sekaligus',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <LiveBar />
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
