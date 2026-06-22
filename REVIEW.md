# REVIEW.md — Full Audit: Harga.com Codebase
**Tanggal Audit:** 23 Juni 2026  
**Auditor:** Claude (Anthropic)  
**Build Status:** ✅ READY di harga-com.vercel.app  
**Stack:** Next.js 14 App Router · TypeScript · Supabase · Tailwind CSS · Vercel

---

## Ringkasan Eksekutif

Codebase ini memiliki **arsitektur yang solid** dan desain UI yang baik. Namun ada **1 bug kritis yang menyebabkan seluruh integrasi Supabase gagal secara diam-diam**, yang artinya semua halaman saat ini kemungkinan besar menampilkan mock data. Selain itu, ditemukan beberapa celah keamanan, performa, dan kelengkapan fitur yang perlu ditangani sebelum launch maupun dalam roadmap jangka panjang.

---

## 🔴 CRITICAL — Harus Selesai Sebelum Launch

### 1. `enrichProductWithOffers` — Fungsi yang Tidak Pernah Didefinisikan

**File:** `src/lib/db/products.ts`  
**Dampak:** SELURUH data Supabase tidak pernah tampil. App selalu jatuh ke mock data.

Fungsi `enrichProductWithOffers` dipanggil di 5 tempat berbeda dalam `products.ts`, tetapi **tidak didefinisikan di mana pun dalam codebase**. Tidak ada import, tidak ada definisi lokal, tidak ada di file lain.

```ts
// products.ts baris 138 — ini ReferenceError di runtime!
(data ?? []).map((row: any) => enrichProductWithOffers(db, row as ProductRow))
```

Karena setiap pemanggilan berada di dalam `try-catch`, error ini ditangkap lalu jatuh ke mock fallback. Hasilnya: **tidak ada data live dari Supabase yang pernah ditampilkan** meski DB berisi 1.696 produk dan 17.494 offers.

Alasan ini tidak menyebabkan build gagal: `next.config.js` mengaktifkan `ignoreBuildErrors: true`.

**Fix:** Definisikan fungsi ini di `products.ts`. Berdasarkan pola penggunaan:

```ts
// Tambahkan di bawah products.ts — setelah semua fungsi yang ada
async function enrichProductWithOffers(
  db: ReturnType<typeof tryGetServerClient>,
  product: ProductRow,
  fetchHistory = false
): Promise<Product> {
  const { data: offerData } = await (db as any)
    .from('offers')
    .select('*, merchant:merchants(*)')
    .eq('product_id', product.id)
    .eq('in_stock', true)
    .order('price', { ascending: true })

  const offers: OfferWithMerchant[] = (offerData as OfferWithMerchant[]) ?? []

  let realHistory: PriceHistory[] = []
  if (fetchHistory) {
    realHistory = await getPriceHistory(product.id)
  }

  return adaptDbProductToAppProduct(product, offers, realHistory)
}
```

---

### 2. `next.config.js` — TypeScript dan ESLint Error Diabaikan di Production

**File:** `next.config.js`

```js
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
```

Konfigurasi ini menyebabkan bug #1 tidak terdeteksi saat build. Setelah bug #1 diperbaiki, kedua opsi ini harus dihapus agar error TS/ESLint kembali menghentikan build.

---

### 3. `/api/scraper/cron` — Tidak Ada Autentikasi

**File:** `src/app/api/scraper/cron/route.ts`

Endpoint ini dapat dipanggil oleh siapa saja via GET request tanpa auth. Scraping dari semua platform bisa dipicu secara eksternal, memboroskan resource server dan API quota.

```ts
// Tidak ada pengecekan auth sama sekali
export async function GET() {
  const result = await scrapeAll({ query: 'trending', platforms: INDONESIAN_PLATFORMS, ... })
```

**Fix:**
```ts
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... rest of handler
}
```

---

### 4. `ADMIN_SCRAPE_KEY` — Empty String Sebagai Default

**File:** `src/app/api/admin/scrape/route.ts`

```ts
const ADMIN_KEY = process.env.ADMIN_SCRAPE_KEY ?? ''
// Jika env var tidak diset, '' === '' = BYPASS auth!
if (providedKey !== ADMIN_KEY) { ... }
```

**Fix:**
```ts
const ADMIN_KEY = process.env.ADMIN_SCRAPE_KEY
if (!ADMIN_KEY || providedKey !== ADMIN_KEY) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

### 5. Rate Limiter Tidak Efektif di Vercel Serverless

**File:** `src/middleware.ts`

Rate limiter menggunakan `Map` in-memory:
```ts
const rateStore = new Map<string, RateEntry>()
```

Di Vercel, setiap request bisa masuk ke **instance serverless yang berbeda** (cold start). Setiap instance memiliki `rateStore` kosong. Efektivnya, rate limit 60 req/min tidak berfungsi di production.

**Fix:** Gunakan Redis/Upstash untuk rate limiting yang persistent:
```ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
```

---

### 6. Alert Page — Division by Zero Bug

**File:** `src/app/alert/page.tsx`, baris 251

```ts
const pct = Math.round(100 * (alert.currentPrice - alert.targetPrice) / alert.currentPrice)
```

Saat alert dibuat dari form, `currentPrice` di-set ke `0`:
```ts
setAlerts(prev => [...prev, {
  currentPrice: 0, // division by zero → NaN/Infinity
  ...
}])
```

**Fix:**
```ts
const pct = alert.currentPrice > 0
  ? Math.round(100 * (alert.currentPrice - alert.targetPrice) / alert.currentPrice)
  : 0
```

---

## 🟠 HIGH — Minggu Pertama Setelah Launch

### 7. Platform Filter Membuat N+2 Query Per Request

**File:** `src/lib/db/products.ts`, baris 91–113

Setiap kali user filter berdasarkan platform di `/cari`, kode membuat:
1. Query ke `merchants` table
2. Query ke `offers` table
3. Query utama ke `products_with_best_offer`

Dengan `force-dynamic` di `/cari/page.tsx`, ini berjalan **setiap request** tanpa cache. Untuk 40 product cards, ini 3× lebih banyak query yang diperlukan.

**Fix:** Cache merchant IDs (hanya 12 baris, sangat stabil) atau tambahkan JOIN di `products_with_best_offer` view.

---

### 8. Price History Chart Menampilkan Data Sintetis (Palsu)

**File:** `src/lib/db/adapters.ts`

```ts
const priceHistory = (realPriceHistory && realPriceHistory.length > 0)
  ? realPriceHistory
  : generateSyntheticHistory(lowestPrice)  // data random, bukan real
```

Ketika real price history kosong, chart menampilkan data random yang tidak mencerminkan harga aktual. Ini **menyesatkan pengguna** — mereka melihat grafik "historis" yang sebenarnya dibuat-buat.

**Fix jangka pendek:** Jangan tampilkan chart jika tidak ada real data. Tampilkan pesan "Riwayat harga belum tersedia."

---

### 9. `adaptOfferToListing` Menggunakan Picsum Placeholder Images

**File:** `src/lib/db/adapters.ts`, baris 30

```ts
imageUrl: fallbackImageUrl ?? `https://picsum.photos/seed/${offer.id...}/400/400`,
```

Setiap offer tanpa image_url akan menampilkan gambar random dari picsum.photos — gambar yang tidak ada hubungannya dengan produk. Ini masalah kepercayaan pengguna di production.

---

### 10. CORS Wildcard di Production

**File:** `src/middleware.ts`

```ts
'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? '*',
```

Default `*` memungkinkan domain manapun membuat request ke API.

**Fix:** Set `CORS_ORIGIN=https://harga.com` di Vercel environment variables.

---

### 11. Tidak Ada `robots.txt` dan `sitemap.xml`

Tidak ditemukan di `/public/` maupun `src/app/`. Ini memengaruhi SEO secara signifikan.

**Fix:**
```ts
// src/app/robots.ts
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://harga.com/sitemap.xml',
  }
}
```

---

### 12. SEO: Tidak Ada OG Image, `metadataBase` Tidak Diset

**File:** `src/app/layout.tsx`

Tidak ada `openGraph.images` atau `metadataBase`. Link yang dishare di WhatsApp/Twitter tidak memiliki preview image.

**Fix:**
```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://harga.com'),
  openGraph: {
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
}
```

---

### 13. JD.ID Masih Tercantum Padahal Sudah Tutup

**File:** `src/lib/platforms.ts`

JD.ID menutup operasinya di Indonesia pada Maret 2023. Platform ini masih tercantum sebagai aktif dengan cashback 4% yang tidak bisa diklaim.

**Fix:** Hapus `jd` dari `PLATFORMS` atau tandai sebagai deprecated.

---

### 14. Duplikasi Logika Click Tracking

**File:** `src/app/api/track/click/route.ts` dan `src/app/api/checkout/initiate/route.ts`

Logika `increment_product_clicks` dan `POPULARITY_THRESHOLD` diduplikasi di dua route berbeda. Jika threshold berubah, harus diubah di dua tempat.

**Fix:** Ekstrak ke fungsi `trackProductClick(productId, db)` di `src/lib/db/products.ts`.

---

### 15. `removeAlert` — Type Mismatch

**File:** `src/app/alert/page.tsx`, baris 64

```ts
const removeAlert = (id: number) => ...  // parameter: number
// Tapi AlertItem.id didefinisikan: string | number
```

Alert dengan `id` bertipe `string` (dari DB response) tidak bisa dihapus via tombol Trash.

---

### 16. Homepage `force-dynamic` + `revalidate = 0` — No Caching

**File:** `src/app/page.tsx`

Homepage di-fetch ulang dari DB setiap ada visitor. Data berubah setiap 4 jam (scraper), jadi caching seharusnya aman.

**Fix:** Hapus `force-dynamic` dan gunakan `export const revalidate = 14400` (4 jam).

---

### 17. Statistik Homepage Hardcoded dari Mock Data

**File:** `src/app/page.tsx`

```ts
import { STATS } from '@/lib/mock-data'
// STATS.products = 15000 (hardcoded)
```

Angka di hero section adalah konstanta statis, bukan data real dari DB.

---

### 18. Breadcrumb URL Kategori Tidak Konsisten

**File:** `src/app/produk/[id]/page.tsx`, baris 69

```ts
<Link href={"/cari?kategori=" + product.category.toLowerCase()}>
```

`product.category` dari DB adalah `"Rumah Tangga"`. Lowercase-nya `"rumah tangga"` (dengan spasi) tidak sama dengan slug URL `"rumah-tangga"`. Filter kategori tidak akan bekerja dari breadcrumb ini.

---

## 🟡 MEDIUM — Bulan Pertama Setelah Launch

### 19. Notifikasi WhatsApp Belum Diimplementasikan

Halaman `/alert` menawarkan notifikasi WA. Field tersimpan di DB, tapi tidak ada sistem yang membaca dan mengirim pesan WA. Perlu integrasi Twilio/WhatsApp Business API atau mock disclaimer di UI.

---

### 20. Sistem Cashback Tidak Ada Backend-nya

Seluruh app menjanjikan cashback 4–8%, namun tidak ada: tracking transaksi, wallet system, atau integrasi GoPay/OVO. Perlu disclaimer yang jelas di UI bahwa cashback "segera hadir" — saat ini terkesan menyesatkan.

---

### 21. `getCategories` — Full Table Scan Setiap Request

**File:** `src/lib/db/products.ts`, baris 241–244

```ts
const { data } = await (db as any)
  .from('products')
  .select('category')  // 1.696 baris diambil hanya untuk count
```

**Fix:** Buat DB view `category_counts` dengan `GROUP BY category`, atau cache dengan `unstable_cache` dari Next.js.

---

### 22. `ImageGallery` — Zoom Modal Tidak Accessible

**File:** `src/components/ImageGallery.tsx`

Modal zoom tidak memiliki: `role="dialog"`, `aria-modal="true"`, focus trap, atau keyboard Escape handler.

---

### 23. Scraper User Agents Sudah Usang

**File:** `src/lib/scrapers/base.ts`

Chrome 124 (April 2024) pada pertengahan 2026 sudah ketinggalan dan mudah dideteksi oleh anti-bot system Tokopedia/Shopee.

---

### 24. Tiga Vercel Cron Jobs Tanpa Koordinasi

**File:** `vercel.json`

Tiga endpoint scraping berjalan di jam berbeda tanpa koordinasi. Tidak ada distributed locking untuk mencegah overlap.

---

### 25. `BookmarkButton` — Data Tidak Persistent

**File:** `src/components/BookmarkButton.tsx`

Bookmark hanya di `localStorage` — hilang saat clear browser, tidak tersinkronisasi antar perangkat.

---

### 26. Terlalu Banyak `eslint-disable` untuk `any`

Lebih dari 50 komentar `eslint-disable-next-line @typescript-eslint/no-explicit-any`. Ini tanda `database.types.ts` tidak di-generate dari schema Supabase yang aktual.

**Fix:** Jalankan `npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts`.

---

### 27. Tidak Ada Error Boundary

Tidak ada `src/app/error.tsx` atau `src/app/global-error.tsx`. Crash di satu komponen dapat membuat seluruh halaman blank.

---

### 28. `searchParams` Tidak Divalidasi — Potential NaN

**File:** `src/app/cari/page.tsx`, baris 101–103

```ts
const minPrice = searchParams.min ? Number(searchParams.min) : undefined
// Number('abc') = NaN, query ke Supabase dengan NaN = bug
```

---

### 29. Homepage Self-Fetch ke API Route Sendiri

**File:** `src/app/page.tsx`, baris 18–28

```ts
const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/products/popular?...`)
```

Memanggil API route sendiri via HTTP saat render server-side tidak efisien. Jika `NEXT_PUBLIC_APP_URL` tidak diset, jatuh ke `localhost:3000` yang tidak berfungsi di Vercel.

**Fix:** Panggil fungsi DB secara langsung, bukan via HTTP.

---

### 30. `CLAUDE.md` Outdated

`CLAUDE.md` menyatakan `/api/waitlist` tidak ada, padahal file `src/app/api/waitlist/route.ts` sudah ada dan berfungsi dengan baik.

---

## 🟢 LOW — Roadmap Jangka Panjang

### 31. Sistem Autentikasi User

Tidak ada login/register. Diperlukan untuk price alerts yang ter-associate dengan user, cashback wallet, dan bookmark tersinkronisasi.

**Rekomendasi:** Supabase Auth (sudah tersedia di project) — relatif mudah diintegrasikan.

---

### 32. Tidak Ada Monitoring / Error Tracking

Tidak ada Sentry, Datadog, atau tools serupa. Error di production tidak ada notifikasi otomatis.

**Rekomendasi:** Sentry dengan `@sentry/nextjs` (free tier tersedia).

---

### 33. Email Notification System Belum Ada

`price_alerts` tersimpan di DB tapi tidak ada cron job yang memeriksa apakah alert sudah terpicu dan mengirim email. Perlu integrasi Resend atau SendGrid.

---

### 34. Fitur Referral Kelengkapannya Belum Jelas

Ada routes `/api/referral/`, halaman `/referral/`, dan `src/lib/db/referral.ts`, tapi tidak jelas apakah alur lengkap referral invite → tracking → reward sudah berfungsi end-to-end.

---

### 35. Tidak Ada Dark Mode

CSS variables sudah diset untuk theming, tapi tidak ada `prefers-color-scheme: dark` support atau toggle dark mode.

---

### 36. Font dari Google Fonts (Potensi Privacy Issue)

**File:** `src/app/globals.css`

```css
@import url('https://fonts.googleapis.com/css2?...');
```

Mengekspos IP user ke Google. Untuk compliance, pertimbangkan self-host via `next/font`.

---

### 37. Asumsi OLX/Carousell = Barang Bekas

**File:** `src/lib/db/products.ts`, baris 117–119

```ts
if (condition === 'used') {
  q = q.in('best_platform_id', ['olx', 'carousell'])
}
```

OLX dan Carousell juga memiliki listing baru. Lebih baik gunakan kolom `condition` di tabel `offers`.

---

### 38. `vercel.json` Tidak Ada Security Headers

Tidak ada `Content-Security-Policy`, `X-Frame-Options`, atau `Permissions-Policy`.

---

### 39. Accessibility — Beberapa Icon Button Tanpa `aria-label`

Beberapa tombol icon di `ImageGallery` (prev/next), `Navbar` (hamburger sudah ada), dan komponen lain tidak memiliki label yang memadai untuk screen reader.

---

### 40. Statistik "Tiap 4 Jam" di UI Tidak Akurat

UI menyatakan "Update Harga Tiap 4 Jam" tapi Vercel Hobby plan hanya mendukung cron sekali sehari. Scraper GitHub Actions juga hanya manual (`workflow_dispatch`). Klaim ini perlu disesuaikan.

---

## Ringkasan Prioritas

| Prioritas | Jumlah | Isu Utama |
|-----------|--------|-----------|
| 🔴 CRITICAL | 6 | `enrichProductWithOffers` hilang, cron tanpa auth, rate limiter tidak efektif, admin key default kosong |
| 🟠 HIGH | 12 | Platform filter N+2 query, chart palsu, picsum di production, CORS wildcard, robots.txt, JD.ID mati |
| 🟡 MEDIUM | 12 | WA notification unimplemented, cashback unimplemented, category scan penuh, breadcrumb URL bug |
| 🟢 LOW | 10 | Auth system, monitoring/Sentry, dark mode, A11y, email notification system |

---

## Pre-Launch Checklist (Action Items Segera)

- [ ] **Definisikan `enrichProductWithOffers`** di `src/lib/db/products.ts`
- [ ] **Hapus** `ignoreBuildErrors: true` dan `ignoreDuringBuilds: true` dari `next.config.js`
- [ ] **Tambahkan auth** ke `/api/scraper/cron` menggunakan `CRON_SECRET` env var
- [ ] **Fix** `ADMIN_SCRAPE_KEY` empty string default — tambahkan null check
- [ ] **Fix** division-by-zero di `src/app/alert/page.tsx` baris 251
- [ ] **Tambahkan** `src/app/robots.ts` dan `src/app/sitemap.ts`
- [ ] **Set** `CORS_ORIGIN` ke domain production di Vercel
- [ ] **Buat** `src/app/error.tsx` untuk error boundary global
- [ ] **Verifikasi** data dari Supabase mengalir dengan benar setelah fix enrichProductWithOffers
- [ ] **Update** `CLAUDE.md` — `/api/waitlist` sudah ada (pernyataan lama sudah tidak akurat)
- [ ] **Hapus atau beri disclaimer** pada chart price history yang menggunakan synthetic data
- [ ] **Hapus** JD.ID dari platform list atau tandai deprecated

---

## Catatan Positif

- Arsitektur Supabase-first dengan mock fallback adalah pattern yang sangat baik untuk resiliensi
- Timeout 8 detik di Supabase client mencegah build hang di Vercel — sangat thoughtful
- ISR `revalidate = 300` di product detail page sudah tepat
- `ImageGallery` sudah diimplementasikan dengan baik (thumbnail click berfungsi — berlawanan dengan catatan lama di CLAUDE.md)
- `BookmarkButton` menggunakan localStorage dengan graceful error handling
- `hashIp` di checkout/initiate menggunakan SHA256 + salt — sudah benar untuk privacy
- Middleware logging sudah ada dengan method, path, duration, IP
- Design system CSS variables konsisten dan well-organized di seluruh codebase
- `scraper-save.ts` dengan upsert strategy sudah benar — hanya simpan price_history jika harga berubah
