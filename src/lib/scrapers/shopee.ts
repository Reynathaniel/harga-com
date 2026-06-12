import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'

// Shopee uses an internal API at shopee.co.id/api/v4/search/search_items
export class ShopeeScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'shopee',
      baseUrl: 'https://shopee.co.id',
      searchPath: '/search',
      rateLimit: 1500,
      maxRetries: 3,
      timeout: 12_000,
      headers: {
        Referer: 'https://shopee.co.id/search',
        'X-API-Source': 'pc',
        'X-Shopee-Language': 'id',
        'If-None-Match-': '',
      },
    })
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const limit = Math.min(req.limit ?? 40, 60)
    const page = (req.page ?? 1) - 1

    const params = new URLSearchParams({
      keyword: req.query,
      limit: String(limit),
      newest: String(page * limit),
      order: 'desc',
      page_type: 'search',
      scenario: 'PAGE_GLOBAL_SEARCH',
      version: '2',
    })

    try {
      const data = await this.fetchJson<unknown>(
        `https://shopee.co.id/api/v4/search/search_items?${params}`,
      )

      const items = this.get<unknown[]>(data, 'items', [])
      return items.map(i => this.parseProduct(this.get<unknown>(i, 'item_basic', i))).filter(Boolean) as RawListing[]
    } catch {
      return []
    }
  }

  protected parseProduct(raw: unknown): RawListing | null {
    try {
      const id = String(this.get<unknown>(raw, 'itemid', '') ?? this.get<unknown>(raw, 'item_id', ''))
      const shopId = String(this.get<unknown>(raw, 'shopid', '') ?? this.get<unknown>(raw, 'shop_id', ''))
      const title = this.cleanTitle(this.get<string>(raw, 'name', ''))
      if (!title || !id) return null

      // Shopee stores price as integer * 100000
      const priceRaw = this.get<number>(raw, 'price', 0)
      const price = priceRaw > 100000 ? Math.round(priceRaw / 100000) : Math.round(priceRaw)
      if (!price) return null

      const origRaw = this.get<number>(raw, 'price_before_discount', 0)
      const originalPrice = origRaw > 100000 ? Math.round(origRaw / 100000) : Math.round(origRaw)

      const ratingStar = this.get<number>(raw, 'item_rating.rating_star', 0)
        || this.get<number>(raw, 'rating_star', 0)

      const images = this.get<string[]>(raw, 'images', [])
      const cover = this.get<string>(raw, 'image', '') || images[0] || ''
      const imageUrl = cover.startsWith('http') ? cover : `https://cf.shopee.co.id/file/${cover}_tn`

      return {
        platformId: 'shopee',
        productId: id,
        title,
        price,
        originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
        currency: 'IDR',
        discount: this.get<number>(raw, 'discount', 0) || undefined,
        rating: ratingStar,
        reviewCount: this.get<number>(raw, 'item_rating.rating_count.0', 0) || this.get<number>(raw, 'sold', 0),
        sold: this.get<number>(raw, 'historical_sold', 0) || this.get<number>(raw, 'sold', 0),
        stock: this.get<number>(raw, 'stock', 0),
        shopName: this.get<string>(raw, 'shop_name', 'Shopee Store'),
        shopVerified: this.get<boolean>(raw, 'is_official_shop', false) || this.get<boolean>(raw, 'shopee_verified', false),
        freeShipping: this.get<boolean>(raw, 'free_shipping', false),
        url: `https://shopee.co.id/product/${shopId}/${id}`,
        imageUrl,
        scrapedAt: new Date(),
      }
    } catch {
      return null
    }
  }
}
