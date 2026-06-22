import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'

export class BlibliScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'blibli',
      baseUrl: 'https://www.blibli.com',
      searchPath: '/search',
      rateLimit: 1500,
      maxRetries: 3,
      timeout: 12_000,
      headers: {
        Referer: 'https://www.blibli.com',
        'Content-Type': 'application/json',
      },
    })
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const limit = Math.min(req.limit ?? 40, 40)
    const page = req.page ?? 1

    const params = new URLSearchParams({
      searchTerm: req.query,
      page: String(page - 1),
      itemPerPage: String(limit),
      sort: 'RELEVANCE',
      'https': 'true',
    })

    try {
      const data = await this.fetchJson<unknown>(
        `https://www.blibli.com/backend/search/products?${params}`,
        { headers: { Accept: 'application/json' } }
      )

      const items = this.get<unknown[]>(data, 'data.products', [])
      return items.map(i => this.parseProduct(i)).filter(Boolean) as RawListing[]
    } catch {
      return []
    }
  }

  protected parseProduct(raw: unknown): RawListing | null {
    try {
      const id = String(this.get<unknown>(raw, 'itemSku', '') ?? this.get<unknown>(raw, 'id', ''))
      const title = this.cleanTitle(this.get<string>(raw, 'name', ''))
      if (!id || !title) return null

      const priceRaw = this.get<unknown>(raw, 'price.offered', null)
        ?? this.get<unknown>(raw, 'price.start', null)
        ?? this.get<unknown>(raw, 'price', null)
      const price = typeof priceRaw === 'number' ? priceRaw : this.parsePrice(String(priceRaw ?? '0'))
      if (!price) return null

      const origRaw = this.get<unknown>(raw, 'price.base', null)
      const originalPrice = origRaw ? (typeof origRaw === 'number' ? origRaw : this.parsePrice(String(origRaw))) : undefined

      const images = this.get<Record<string, string>>(raw, 'images', {})
      const imageUrl = Object.values(images)[0] ?? ''

      return {
        platformId: 'blibli',
        productId: id,
        title,
        price,
        originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
        currency: 'IDR',
        rating: parseFloat(String(this.get<unknown>(raw, 'rating', 0))) || 0,
        reviewCount: parseInt(String(this.get<unknown>(raw, 'reviewCount', 0))) || 0,
        sold: 0,
        stock: parseInt(String(this.get<unknown>(raw, 'quantityAvailable', 0))) || 0,
        shopName: this.get<string>(raw, 'merchantName', '') || this.get<string>(raw, 'seller.name', 'Blibli Store'),
        shopVerified: this.get<boolean>(raw, 'freeShippingBadge', false),
        freeShipping: this.get<boolean>(raw, 'freeShipping', false),
        url: `https://www.blibli.com/p/${id}`,
        imageUrl,
        scrapedAt: new Date(),
      }
    } catch {
      return null
    }
  }
}
