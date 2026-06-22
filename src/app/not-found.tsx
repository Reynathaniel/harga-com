import Link from 'next/link'
import { Search, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-[88px]">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-[var(--brand)] mb-4 leading-none">404</div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Halaman tidak ditemukan
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
          Coba cari produk yang kamu butuhkan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/cari"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--brand)' }}
          >
            <Search size={16} />
            Cari Produk
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--brand)] transition-colors"
          >
            <Home size={16} />
            Ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
