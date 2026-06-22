import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cara Kerja | Harga.com',
  description: 'Pelajari bagaimana Harga.com mengumpulkan dan membandingkan harga dari berbagai marketplace Indonesia.',
}

const STEPS = [
  {
    num: '01',
    title: 'Scraping Otomatis',
    desc: 'Robot kami mengunjungi Tokopedia, Shopee, Lazada, dan marketplace lain setiap beberapa jam untuk mengambil data harga terbaru secara otomatis.',
  },
  {
    num: '02',
    title: 'Normalisasi Data',
    desc: 'Data harga dari berbagai sumber dibersihkan dan distandarisasi agar kamu bisa membandingkan apel dengan apel — bukan apel dengan jeruk.',
  },
  {
    num: '03',
    title: 'Tampilkan Perbandingan',
    desc: 'Harga dari semua platform ditampilkan berdampingan dalam satu halaman, diurutkan dari termurah. Kamu bisa filter berdasarkan kondisi, platform, dan range harga.',
  },
  {
    num: '04',
    title: 'Klik & Beli',
    desc: 'Pilih penawaran terbaik dan klik untuk langsung diarahkan ke halaman produk di marketplace. Transaksi terjadi sepenuhnya di platform tujuan.',
  },
  {
    num: '05',
    title: 'Price Alert (Segera)',
    desc: 'Set target harga dan kami akan kirim notifikasi saat harga turun. Tidak perlu cek manual setiap hari.',
  },
]

export default function CaraKerjaPage() {
  return (
    <div className="pt-[88px] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
            ← Beranda
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Cara Kerja Harga.com</h1>
        <p className="text-[var(--text-secondary)] mb-12 leading-relaxed">
          Harga.com bekerja di balik layar agar kamu bisa fokus pada hal yang penting: menemukan harga terbaik.
        </p>

        <div className="space-y-8">
          {STEPS.map((step) => (
            <div key={step.num} className="flex gap-6">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: 'var(--brand)', color: '#fff' }}
              >
                {step.num}
              </div>
              <div className="pt-1">
                <h2 className="font-bold text-[var(--text-primary)] mb-1">{step.title}</h2>
                <p className="text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-xl border border-[var(--border)]">
          <h2 className="font-bold text-[var(--text-primary)] mb-2">Tentang Akurasi Harga</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Harga yang ditampilkan bersifat indikatif dan diperbarui berkala. Harga aktual bisa berbeda
            saat transaksi karena perubahan stok, promo flash sale, atau kebijakan penjual. Selalu konfirmasi
            harga final di halaman checkout marketplace.
          </p>
        </div>
      </div>
    </div>
  )
}
