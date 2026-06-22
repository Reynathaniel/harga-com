import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan | Harga.com',
  description: 'Syarat dan ketentuan penggunaan layanan Harga.com — perbandingan harga marketplace Indonesia.',
}

export default function TermsPage() {
  return (
    <div className="pt-[88px] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors">
            ← Beranda
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Syarat &amp; Ketentuan</h1>
        <p className="text-sm text-[var(--text-muted)] mb-10">Terakhir diperbarui: Juni 2026</p>

        <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">1. Penerimaan Syarat</h2>
            <p>
              Dengan mengakses dan menggunakan Harga.com, Anda menyetujui syarat dan ketentuan ini. Jika Anda tidak
              menyetujui, mohon untuk tidak menggunakan layanan kami.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">2. Deskripsi Layanan</h2>
            <p>
              Harga.com adalah platform perbandingan harga yang mengumpulkan dan menampilkan informasi harga dari
              berbagai marketplace di Indonesia (Tokopedia, Shopee, Lazada, Blibli, TikTok Shop, dan lainnya).
              Kami bukan penjual produk — semua transaksi dilakukan langsung di platform marketplace tujuan.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">3. Akurasi Informasi Harga</h2>
            <p>
              Kami berupaya menyajikan informasi harga yang akurat dan terkini. Namun, harga dapat berubah sewaktu-waktu
              tanpa pemberitahuan. Harga yang ditampilkan di Harga.com bersifat indikatif dan mungkin berbeda dengan
              harga aktual di marketplace pada saat transaksi. Kami tidak bertanggung jawab atas perbedaan harga tersebut.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">4. Program Cashback</h2>
            <p>
              Program cashback Harga.com saat ini sedang dalam pengembangan. Informasi cashback yang ditampilkan
              merupakan estimasi berdasarkan program afiliasi masing-masing marketplace dan dapat berubah. Kami akan
              mengumumkan mekanisme pencairan cashback secara resmi sebelum fitur diluncurkan.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">5. Link Afiliasi</h2>
            <p>
              Harga.com menggunakan link afiliasi untuk mengarahkan pengguna ke marketplace. Kami mungkin menerima
              komisi dari transaksi yang terjadi melalui link tersebut. Hal ini tidak mempengaruhi harga yang Anda bayar.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">6. Pembatasan Tanggung Jawab</h2>
            <p>
              Harga.com tidak bertanggung jawab atas: kualitas produk yang dibeli melalui marketplace, sengketa antara
              pembeli dan penjual di marketplace, kerugian yang timbul dari ketidakakuratan informasi harga, atau
              gangguan layanan di marketplace tujuan.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">7. Perubahan Layanan</h2>
            <p>
              Kami berhak mengubah, menangguhkan, atau menghentikan layanan kapan saja. Perubahan signifikan akan
              diberitahukan melalui platform atau email.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">8. Hukum yang Berlaku</h2>
            <p>
              Syarat dan ketentuan ini diatur oleh hukum Republik Indonesia. Sengketa akan diselesaikan melalui
              musyawarah mufakat, atau jika tidak tercapai, melalui pengadilan yang berwenang di Jakarta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">9. Kontak</h2>
            <p>
              Pertanyaan tentang syarat dan ketentuan ini dapat disampaikan ke{' '}
              <a href="mailto:halo@harga.com" className="text-[var(--brand)] hover:underline">halo@harga.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
