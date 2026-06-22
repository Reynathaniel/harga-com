import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog | Harga.com',
  description: 'Tips belanja hemat, panduan marketplace, dan berita terbaru dari Harga.com.',
}

export default function BlogPage() {
  return (
    <div className="pt-[88px] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
            ← Beranda
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Blog</h1>
        <p className="text-[var(--text-secondary)] mb-12">
          Tips belanja hemat, panduan marketplace, dan berita dari Harga.com.
        </p>

        <div
          className="rounded-2xl p-12 text-center border border-[var(--border)]"
          style={{ background: 'var(--bg-card)' }}
        >
          <div className="text-5xl mb-4">✍️</div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3">Segera Hadir</h2>
          <p className="text-[var(--text-secondary)] max-w-sm mx-auto">
            Konten blog sedang dalam persiapan. Daftar ke waitlist untuk mendapat artikel pertama langsung
            di emailmu.
          </p>
          <Link
            href="/"
            className="inline-block mt-6 px-6 py-2.5 rounded-full text-sm font-medium"
            style={{ background: 'var(--brand)', color: '#fff' }}
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
