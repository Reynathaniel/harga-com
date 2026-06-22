import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi | Harga.com',
  description: 'Kebijakan privasi Harga.com — bagaimana kami mengumpulkan, menggunakan, dan melindungi data Anda.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-[88px] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
            ← Beranda
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Kebijakan Privasi</h1>
        <p className="text-sm text-[var(--text-muted)] mb-10">Terakhir diperbarui: Juni 2026</p>

        <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">1. Informasi yang Kami Kumpulkan</h2>
            <p>
              Kami mengumpulkan informasi yang Anda berikan secara langsung, seperti alamat email saat mendaftar waitlist
              atau membuat price alert. Kami juga mengumpulkan data penggunaan secara anonim untuk meningkatkan layanan,
              termasuk halaman yang dikunjungi dan produk yang dicari.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">2. Penggunaan Informasi</h2>
            <p>
              Informasi yang kami kumpulkan digunakan untuk: mengirimkan notifikasi price alert yang Anda minta,
              menginformasikan pembaruan fitur, meningkatkan pengalaman pengguna, dan menganalisis tren penggunaan platform
              secara agregat dan anonim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">3. Berbagi Data</h2>
            <p>
              Kami tidak menjual, menyewakan, atau membagikan data pribadi Anda kepada pihak ketiga untuk tujuan pemasaran.
              Data dapat dibagikan kepada penyedia layanan teknis yang membantu operasional platform kami (seperti Supabase
              untuk penyimpanan data), dengan perjanjian kerahasiaan yang ketat.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">4. Keamanan Data</h2>
            <p>
              Kami menggunakan enkripsi standar industri untuk melindungi data Anda dalam transmisi dan penyimpanan.
              Namun, tidak ada metode transmisi melalui internet yang 100% aman. Kami akan memberi tahu Anda jika
              terjadi pelanggaran keamanan yang mempengaruhi data Anda.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">5. Cookie</h2>
            <p>
              Kami menggunakan cookie untuk menyimpan preferensi pengguna (seperti bookmark produk) secara lokal di
              perangkat Anda. Cookie ini tidak digunakan untuk melacak aktivitas lintas situs.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">6. Hak Anda</h2>
            <p>
              Anda berhak untuk mengakses, memperbarui, atau menghapus data pribadi Anda kapan saja. Untuk permintaan
              terkait data, hubungi kami di{' '}
              <a href="mailto:halo@harga.com" className="text-[var(--brand)] hover:underline">halo@harga.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">7. Perubahan Kebijakan</h2>
            <p>
              Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui email
              (bagi pengguna terdaftar) atau pengumuman di platform. Penggunaan layanan setelah pembaruan
              dianggap sebagai persetujuan terhadap kebijakan baru.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">8. Kontak</h2>
            <p>
              Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, hubungi kami di{' '}
              <a href="mailto:halo@harga.com" className="text-[var(--brand)] hover:underline">halo@harga.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
