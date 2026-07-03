import { notFound } from 'next/navigation'
import { getProductById, getProducts } from '@/lib/db/products'
import { PLATFORMS } from '@/lib/platforms'
import { formatRupiah, lowestListingFirst, priceDiffPercent, cleanProductName } from '@/lib/utils'
import { PriceChart } from '@/components/PriceChart'
import { ProductCard } from '@/components/ProductCard'
import { PlatformBadge } from '@/components/PlatformBadge'
import { ProductActions } from '@/components/ProductActions'
import { ImageGallery } from '@/components/ImageGallery'
import { BookmarkButton } from '@/components/BookmarkButton'
import {
  Star, ShoppingCart, Shield, Truck,
  TrendingDown,
  CheckCircle2, Info, Zap, Tag, Users, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { ShareButton } from '@/components/ShareButton'
import ProductLink from '@/components/ProductLink'
import type { PlatformId } from '@/lib/types'

export const revalidate = 300
// Return empty array — all product pages are ISR'd on first request.
// Avoids making Supabase network calls at build time which can hang
// the Vercel build if the project is unreachable (~55s TCP timeout).
export async function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id)
  if (!product) return {}
  const sorted = lowestListingFirst(product.listings)
  const cheapest = sorted[0]
  const priceStr = cheapest ? ` — mulai Rp${Math.round(cheapest.price).toLocaleString('id')}` : ''
  const title = `${product.name}${priceStr} | Harga.com`
  const description = `Bandingkan harga ${product.name} dari Tokopedia, Shopee, Lazada dan platform lainnya. Temukan harga terbaik dan cashback otomatis di Harga.com.`
  const image = product.images?.[0] ?? '/placeholder-product.png'
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image.startsWith('http') ? [{ url: image, width: 800, height: 800 }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProductById(params.id)
  if (!product) notFound()

  const sorted = lowestListingFirst(product.listings)
  const cheapest = sorted[0]
  // Guard: product exists but has no offers yet
  if (!cheapest) notFound()

  const mostExpensive = sorted[sorted.length - 1]
  const savings = mostExpensive.price - cheapest.price
  const savingsPct = priceDiffPercent(cheapest.price, mostExpensive.price)
  const activePlatforms = sorted.map(l => l.platformId) as PlatformId[]
  const cheapestPlatform = PLATFORMS[cheapest.platformId] ?? { name: cheapest.platformId, cashbackPct: 0, color: '#f59e0b' }
  const cashbackAmount = Math.round(cheapest.price * cheapestPlatform.cashbackPct / 100)
  const displayName = cleanProductName(product.name)

  // Related products: same category, similar price range (20% - 500% of current), sorted by popularity
  // Avoid showing completely unrelated cheap items (e.g., Alibaba Rp 3rb when viewing iPhone)
  const minRelatedPrice = cheapest.price * 0.2
  const maxRelatedPrice = cheapest.price * 5
  const { products: related } = await getProducts({
    category: product.category,
    limit: 20,
    sort: 'popular',
    minPrice: minRelatedPrice > 10_000 ? minRelatedPrice : undefined,
    maxPrice: maxRelatedPrice < 500_000_000 ? maxRelatedPrice : undefined,
  })
  const relatedFiltered = related
    .filter(p => p.id !== product.id)
    .filter(p => {
      // Exclude products from Alibaba/AliExpress if price < Rp 50.000 (likely irrelevant)
      const lowestP = Math.min(...p.listings.map(l => l.price))
      return lowestP >= 1000 // at least Rp 1.000
    })
    .slice(0, 6)

  // Build JSON-LD structured data for SEO (Product schema with multi-seller Offers)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: displayName,
    description: product.description || `Bandingkan harga ${displayName} dari ${sorted.length} platform marketplace Indonesia.`,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    image: product.images.filter(img => img.startsWith('http')),
    ...(product.totalReviews > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating.toFixed(1),
        reviewCount: product.totalReviews,
        bestRating: '5',
        worstRating: '1',
      }
    }),
    offers: sorted.map(listing => ({
      '@type': 'Offer',
      url: listing.affiliateUrl || listing.url,
      priceCurrency: 'IDR',
      price: listing.price,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: PLATFORMS[listing.platformId]?.name ?? listing.platformId,
      },
    })),
  }

  return (
    <div className="pt-[88px] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-6 flex-wrap">
          <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Beranda</Link>
          <ChevronRight size={12} className="shrink-0" />
          <Link href="/cari" className="hover:text-[var(--text-primary)] transition-colors">Cari</Link>
          <ChevronRight size={12} className="shrink-0" />
          <Link href={"/cari?kategori=" + product.category.toLowerCase().replace(/\s+/g, '-')} className="hover:text-[var(--text-primary)] transition-colors">
            {product.category}
          </Link>
          <ChevronRight size={12} className="shrink-0" />
          <span className="text-[var(--text-secondary)] truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: Image Gallery */}
          <div className="lg:col-span-4">
            {/* Action icons above gallery */}
            <div className="flex items-center justify-between mb-2">
              <PlatformBadge platformId={cheapest.platformId} size="sm" />
              <div className="flex items-center gap-2">
                <BookmarkButton productId={product.id} />
                <ShareButton productId={product.id} productSlug={product.slug} productName={product.name} variant="icon" />
              </div>
            </div>

            {/* Interactive gallery */}
            <ImageGallery images={product.images} alt={product.name} />

            {savings > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                <TrendingDown size={12} />
                Hemat {formatRupiah(savings, true)} vs platform termahal
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <Shield size={14} className="text-blue-400" />, label: 'Toko Resmi', sub: 'Terverifikasi' },
                { icon: <Truck size={14} className="text-green-400" />, label: 'Gratis Ongkir', sub: 'Semua area' },
                { icon: <Zap size={14} className="text-amber-400" />, label: 'Cashback', sub: cheapestPlatform.cashbackPct + '%' },
              ].map(t => (
                <div key={t.label} className="flex flex-col items-center gap-1 p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-center hover:border-amber-500/20 transition-colors">
                  {t.icon}
                  <span className="text-[10px] font-medium text-[var(--text-secondary)]">{t.label}</span>
                  <span className="text-[9px] text-[var(--text-muted)]">{t.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER: Info + Price table */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2.5 py-1 rounded-lg font-semibold">{product.brand}</span>
              <span className="text-xs bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-lg">{product.category}</span>
              {product.subcategory && (
                <span className="text-xs bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-lg">{product.subcategory}</span>
              )}
            </div>

            <h1 className="text-xl font-bold text-[var(--text-primary)] mb-3 leading-tight">{displayName}</h1>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14}
                      fill={i < Math.floor(product.averageRating) ? '#f59e0b' : 'transparent'}
                      className={i < Math.floor(product.averageRating) ? 'text-amber-400' : 'text-[var(--text-muted)]'} />
                  ))}
                </div>
                <span className="text-sm font-bold text-[var(--text-primary)]">{product.averageRating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-[var(--text-muted)]">{product.totalReviews.toLocaleString('id')} ulasan</span>
              <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] ml-auto">
                <Users size={12} />
                <span>{sorted.length} platform</span>
              </div>
            </div>

            {savings > 0 && (
              <div className="flex items-center gap-2 bg-green-500/5 border border-green-500/15 rounded-xl px-4 py-2.5 mb-5">
                <TrendingDown size={14} className="text-green-400 shrink-0" />
                <span className="text-sm text-green-400 font-semibold">Hemat hingga {formatRupiah(savings, true)}</span>
                <span className="text-xs text-green-400/70">({savingsPct}%)</span>
                <span className="text-xs text-[var(--text-muted)] ml-auto">vs termahal</span>
              </div>
            )}

            {/* Price comparison table */}
            <div className="mb-5">
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2">
                <Tag size={11} />
                Perbandingan Harga ({sorted.length} Platform)
              </div>
              <div className="grid grid-cols-4 gap-2 px-3 py-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border-subtle)] mb-1">
                <span>Platform</span>
                <span className="text-right">Harga</span>
                <span className="text-right">CB</span>
                <span className="text-right">Aksi</span>
              </div>
              <div className="space-y-1.5">
                {sorted.map((listing, idx) => {
                  const platform = PLATFORMS[listing.platformId]
                  if (!platform) return null
                  const isCheapest = idx === 0
                  const diff = priceDiffPercent(cheapest.price, listing.price)
                  const listingCashback = Math.round(listing.price * platform.cashbackPct / 100)
                  const bgColor = platform.id === 'tiktok' ? '#1a1a1a' : platform.color
                  return (
                    <div key={listing.platformId}
                      className={"relative flex items-center gap-2.5 px-3 py-3 rounded-xl border transition-all " +
                        (isCheapest ? 'border-green-500/25 bg-green-500/4' : 'border-[var(--border-subtle)] bg-[var(--bg-card)]')}>
                      {isCheapest && (
                        <span className="absolute -top-2 left-3 text-[10px] font-bold text-green-400 bg-[var(--bg-primary)] px-2 py-0.5 border border-green-500/25 rounded-full">
                          TERMURAH
                        </span>
                      )}
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ background: bgColor }}>
                        {platform.shortName.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{platform.name}</span>
                          {listing.shopVerified && <Shield size={10} className="text-blue-400" />}
                          {(listing as any).condition === 'used' && (
                            <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md border border-orange-200 font-bold">BEKAS</span>
                          )}
                          {listing.freeShipping && (
                            <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-md border border-blue-500/15">Gratis</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[100px]">{listing.shopName}</span>
                          {diff > 0 && <span className="text-[10px] text-red-400">+{diff}%</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-[var(--text-primary)] text-sm">{formatRupiah(listing.price, true)}</div>
                        {listing.originalPrice && listing.discount && listing.discount > 0 && (
                          <div className="text-[10px] text-[var(--text-muted)] line-through">{formatRupiah(listing.originalPrice, true)}</div>
                        )}
                      </div>
                      <div className="text-right shrink-0 min-w-[44px]">
                        <span className="text-[10px] font-bold text-amber-400">{platform.cashbackPct}%</span>
                        <div className="text-[9px] text-[var(--text-muted)]">{formatRupiah(listingCashback, true)}</div>
                      </div>
                      <ProductLink
                        productId={product.id}
                        offerId={listing.offerId}
                        url={listing.affiliateUrl}
                        platform={listing.platformId}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white transition-opacity hover:opacity-85"
                        style={{ background: bgColor }}>
                        <ShoppingCart size={10} />
                        Beli
                      </ProductLink>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cashback info */}
            <div className="bg-amber-500/6 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
              <div className="text-2xl">&#x1F4B0;</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-bold text-amber-400">Dapatkan Cashback</div>
                  <span className="text-lg font-black text-amber-400">{formatRupiah(cashbackAmount, true)}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-2">
                  Beli di {cheapestPlatform.name} ({formatRupiah(cheapest.price, true)}) via harga.com &#8594; cashback {cheapestPlatform.cashbackPct}% otomatis
                </p>
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] flex-wrap">
                  <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-green-400" /> GoPay/OVO</span>
                  <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-green-400" /> Tanpa minimum</span>
                  <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-green-400" /> Otomatis</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Chart + Alert + Specs */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-4">
              <PriceChart history={product.priceHistory} activePlatforms={activePlatforms.slice(0, 4)} />
            </div>
            <ProductActions
              productId={product.id}
              productName={displayName}
              productImage={product.images[0] ?? ''}
              currentPrice={cheapest.price}
              cheapestPlatformId={cheapest.platformId}
              affiliateUrl={cheapest.affiliateUrl}
              listings={product.listings}
            />
            {Object.keys(product.specifications).length > 0 && (
              <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-4">
                <div className="font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2 text-sm">
                  <Info size={14} className="text-[var(--text-muted)]" />
                  Spesifikasi
                </div>
                <div className="space-y-0">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="flex justify-between gap-3 text-xs py-2 border-b border-[var(--border-subtle)] last:border-0">
                      <span className="text-[var(--text-muted)] shrink-0">{key}</span>
                      <span className="text-[var(--text-secondary)] text-right">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-8 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">Deskripsi Produk</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{product.description}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {product.tags.map(tag => (
                <Link key={tag} href={"/cari?q=" + encodeURIComponent(tag)}
                  className="px-2.5 py-1 text-xs bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-amber-500/35 rounded-full transition-colors">
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related products */}
        {relatedFiltered.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Produk Serupa</h2>
                <p className="text-sm text-[var(--text-muted)]">Dari kategori {product.category}</p>
              </div>
              <Link href={"/cari?kategori=" + product.category.toLowerCase().replace(/\s+/g, '-')}
                className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
                Lihat semua <ChevronRight size={14} />
              </Link>
            </div>
            <div className="hidden sm:grid grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedFiltered.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            <div className="sm:hidden flex gap-3 scroll-x-hidden pb-3 -mx-4 px-4">
              {relatedFiltered.map(p => (
                <div key={p.id} className="shrink-0 w-44">
                  <ProductCard product={p} compact />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
