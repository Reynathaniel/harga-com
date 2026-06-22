import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://harga.com', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://harga.com/cari', lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: 'https://harga.com/cashback', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: 'https://harga.com/alert', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ]
}
