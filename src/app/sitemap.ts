import { MetadataRoute } from 'next'

const CATEGORY_SLUGS = [
  'elektronik',
  'fashion',
  'rumah-tangga',
  'gaming',
  'kecantikan',
  'olahraga',
  'motor-bekas',
  'mobil-bekas',
]

export default function sitemap(): MetadataRoute.Sitemap {
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
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  return [...staticRoutes, ...categoryRoutes]
}
