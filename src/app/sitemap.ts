import { MetadataRoute } from 'next'
import { tryGetServerClient } from '@/lib/supabase'

const CATEGORY_SLUGS = [
  'elektronik',
  'fashion',
  'rumah-tangga',
  'gaming',
  'kecantikan',
  'olahraga',
  'motor-bekas',
  'mobil-bekas',
  'lainnya',
]

export const revalidate = 3600 // regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: 'https://harga.com',          lastModified: now, changeFrequency: 'daily',  priority: 1   },
    { url: 'https://harga.com/cari',     lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: 'https://harga.com/cashback', lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: 'https://harga.com/alert',    lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
  ]

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORY_SLUGS.map(slug => ({
    url: `https://harga.com/cari?kategori=${slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Fetch product slugs from Supabase for full crawlability
  let productRoutes: MetadataRoute.Sitemap = []
  try {
    const supabase = tryGetServerClient()
    if (supabase) {
      const { data } = await supabase
        .from('products')
        .select('slug, updated_at')
        .order('updated_at', { ascending: false })
        .limit(10000)
      if (data) {
        productRoutes = data.map((p: { slug: string; updated_at: string | null }) => ({
          url: `https://harga.com/produk/${encodeURIComponent(p.slug)}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : now,
          changeFrequency: 'daily' as const,
          priority: 0.7,
        }))
      }
    }
  } catch {
    // Supabase unavailable — return static + category routes only
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes]
}
