import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'

// Bukalapak uses a public REST API
export class BukalapakScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'bukalapak',
      baseUrl: 'https://www.bukalapak.com',
      searchPath: '/products',
      rateLimit: 1500,
      maxRetries: 3,
      timeout: 12_000,
      headers: {
        Referer: 'https://www.bukalapak.com',
        'Content-Type': 'application/json',
      },
    })
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const limit = Math.min(req.limit ?? 40, 50)
    const page = req.page ?? 1
    const offset = (page - 1) * limit

    const params = new URLSearchParams({
      keywords: req.query,
      limit: String(limit),
      offset: String(offset),
      source: 'navbar-search',
    })

    try {
      const data = await this.fetchJson<unknown>(
        `https://api.bukalapak.com/multisearch/products?${params}`,
      )

      const items = this.get<unknown[]>(data, 'data.0.products', [])
        || this.get<unknown[]>(data, 'products', [])
      return items.map(i => this.parseProduct(i)).filter(Boolean) as RawListing[]
    } catch {
      return []
    }
  }

  protected parseProduct(raw: unknown): RawListing | null {
    try {
      const id = String(this.get<unknown>(raw, 'id', ''))
      const title = this.cleanTitle(this.get<string>(raw, 'name', ''))
      if (!id || !title) return null

      const priceRaw = this.get<unknown>(raw, 'price', null) ?? this.get<unknown>(raw, 'price_new', null)
      const price = this.parsePrice(String(priceRaw ?? '0'))
      if (!price) return null

      const origRaw = this.get<unknown>(raw, 'original_price', null)
      const originalPrice = origRaw ? this.parsePrice(String(origRaw)) : undefined

      const images = this.get<string[]>(raw, 'images', [])
      const cover = images[0] || this.get<string>(raw, 'small_image', '')

      return {
        platformId: 'bukalapak',
        productId: id,
        title,
        price,
        originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
        currency: 'IDR',
        discount: this.get<number>(raw, 'discount_percentage', 0) || undefined,
        rating: parseFloat(String(this.get<unknown>(raw, 'rating.average_rate', 0))) || 0,
        reviewCount: parseInt(String(this.get<unknown>(raw, 'rating.user_count', 0))) || 0,
        sold: parseInt(String(this.get<unknown>(raw, 'sold_count', 0))) || 0,
        stock: parseInt(String(this.get<unknown>(raw, 'stock', 0))) || 0,
        shopName: this.get<string>(raw, 'store.name', '') || this.get<string>(raw, 'seller_username', 'BL Store'),
        shopVerified: this.get<boolean>(raw, 'store.premium_top_seller', false),
        freeShipping: false,
        url: `https://www.bukalapak.com/p/${id}`,
        imageUrl: cover,
        scrapedAt: new Date(),
      }
    } catch {
      return null
    }
  }
}
