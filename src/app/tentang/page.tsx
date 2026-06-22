import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tentang Kami | Harga.com',
  description: 'Harga.com — platform perbandingan harga dari marketplace Indonesia. Temukan harga terbaik dari Tokopedia, Shopee, Lazada, dan lainnya.',
}

export default function TentangPage() {
  return (
    <div className="pt-[88px] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
            ← Beranda
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">Tentang Harga.com</h1>

        <div className="space-y-6 text-[var(--text-secondary)] leading-relaxed">
          <p>
            Harga.com adalah platform perbandingan harga yang membantu konsumen Indonesia menemukan harga
            terbaik dari berbagai marketplace sekaligus — Tokopedia, Shopee, Lazada, Blibli, TikTok Shop,
            dan lainnya.
          </p>

          <p>
            Kami percaya belanja online seharusnya mudah dan transparan. Dengan Harga.com, kamu tidak
            perlu lagi membuka banyak tab untuk membandingkan harga — cukup cari produk sekali, dan kami
            tampilkan semua pilihan terbaik untukmu.
          </p>

          <h2 className="text-xl font-bold text-[var(--text-primary)] pt-4">Misi Kami</h2>
          <p>
            Membantu setiap orang Indonesia belanja lebih hemat dengan informasi harga yang akurat,
            real-time, dan mudah dipahami.
          </p>

          <h2 className="text-xl font-bold text-[var(--text-primary)] pt-4">Kontak</h2>
          <p>
            Punya pertanyaan atau masukan? Hubungi kami di{' '}
            <a href="mailto:halo@harga.com" className="text-[var(--brand)] hover:underline">
              halo@harga.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
