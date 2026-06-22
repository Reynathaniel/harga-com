import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'FAQ — Pertanyaan Umum | Harga.com',
  description: 'Jawaban atas pertanyaan umum tentang cara kerja Harga.com, cashback, dan perbandingan harga.',
}

const FAQS = [
  {
    q: 'Apakah Harga.com gratis?',
    a: 'Ya, Harga.com sepenuhnya gratis untuk digunakan. Kami menghasilkan pendapatan dari komisi afiliasi saat kamu membeli produk melalui link kami.',
  },
  {
    q: 'Seberapa sering harga diperbarui?',
    a: 'Harga diperbarui setiap beberapa jam secara otomatis melalui sistem scraping kami. Namun harga di marketplace bisa berubah kapan saja, jadi selalu cek harga final sebelum checkout.',
  },
  {
    q: 'Bagaimana cara kerja program cashback?',
    a: 'Program cashback Harga.com sedang dalam pengembangan. Kami akan mengumumkan detailnya segera. Daftarkan emailmu untuk mendapat notifikasi pertama.',
  },
  {
    q: 'Apakah semua marketplace tersedia?',
    a: 'Saat ini kami mendukung Tokopedia, Shopee, Lazada, Blibli, TikTok Shop, Bukalapak, OLX, dan Carousell. Kami terus menambah platform baru.',
  },
  {
    q: 'Bagaimana cara set price alert?',
    a: 'Buka halaman produk yang ingin kamu pantau, klik "Pantau Harga", masukkan target harga dan emailmu. Kami akan kirim notifikasi saat harga turun ke target.',
  },
  {
    q: 'Apakah data saya aman?',
    a: 'Ya. Kami hanya menyimpan email untuk keperluan notifikasi. Kami tidak pernah menjual data pengguna. Baca kebijakan privasi kami untuk detail lebih lanjut.',
  },
]

export default function FaqPage() {
  return (
    <div className="pt-[88px] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
            ← Beranda
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-10">Pertanyaan Umum (FAQ)</h1>

        <div className="space-y-6">
          {FAQS.map((faq, i) => (
            <div key={i} className="border border-[var(--border)] rounded-xl p-6">
              <h2 className="font-bold text-[var(--text-primary)] mb-2">{faq.q}</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-xl" style={{ background: 'var(--bg-card)' }}>
          <p className="text-[var(--text-secondary)]">
            Masih punya pertanyaan?{' '}
            <a href="mailto:halo@harga.com" className="text-[var(--brand)] hover:underline">
              Hubungi kami
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
