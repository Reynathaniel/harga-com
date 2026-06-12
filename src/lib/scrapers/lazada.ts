import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'

// Lazada uses Lazada API (same as AliExpress family under Alibaba Group)
export class LazadaScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'lazada',
      baseUrl: 'https://www.lazada.co.id',
      searchPath: '/catalog/',
      rateLimit: 1500,
      maxRetries: 3,
      timeout: 12_000,
      headers: {
        Referer: 'https://www.lazada.co.id',
        'X-Lazada-Language': 'id',
      },
    })
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const limit = Math.min(req.limit ?? 40, 40)
    const page = req.page ?? 1

    const params = new URLSearchParams({
      q: req.query,
      _keyori: 'ss',
      from: 'input',
      spm: 'a2o4l.home.search.go.18951c47',
      page: String(page),
      ajax: 'true',
    })

    try {
      const data = await this.fetchJson<unknown>(
        `https://www.lazada.co.id/catalog/?${params}`,
        { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
      )

      const items = this.get<unknown[]>(data, 'mods.listItems', [])
        || this.get<unknown[]>(data, 'listItems', [])
      return items.slice(0, limit).map(i => this.parseProduct(i)).filter(Boolean) as RawListing[]
    } catch {
      return this.searchHtml(req)
    }
  }

  private async searchHtml(req: ScrapeRequest): Promise<RawListing[]> {
    try {
      const url = `https://www.lazada.co.id/catalog/?q=${encodeURIComponent(req.query)}`
      const html = await this.fetchHtml(url)
      const match = html.match(/window\.__moduleData__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/)
      if (!match) return []
      const data = JSON.parse(match[1])
      const items = this.get<unknown[]>(data, 'data.root.fields.mods.listItems', [])
      return items.map(i => this.parseProduct(i)).filter(Boolean) as RawListing[]
    } catch {
      return []
    }
  }

  protected parseProduct(raw: unknown): RawListing | null {
    try {
      const id = String(this.get<unknown>(raw, 'itemId', '') ?? this.get<unknown>(raw, 'nid', ''))
      const title = this.cleanTitle(this.get<string>(raw, 'name', ''))
      if (!title || !id) return null

      const priceRaw = this.get<unknown>(raw, 'price', null) ?? this.get<unknown>(raw, 'priceShow', null)
      const price = this.parsePrice(String(priceRaw ?? '0'))
      if (!price) return null

      const origRaw = this.get<unknown>(raw, 'originalPrice', null) ?? this.get<unknown>(raw, 'priceRemove', null)
      const originalPrice = origRaw ? this.parsePrice(String(origRaw)) : undefined

      return {
        platformId: 'lazada',
        productId: id,
        title,
        price,
        originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
        currency: 'IDR',
        discount: this.get<number>(raw, 'discount', 0) || undefined,
        rating: parseFloat(String(this.get<unknown>(raw, 'ratingScore', 0))) || 0,
        reviewCount: parseInt(String(this.get<unknown>(raw, 'review', 0))) || 0,
        sold: 0,
        stock: parseInt(String(this.get<unknown>(raw, 'stock', 0))) || 0,
        shopName: this.get<string>(raw, 'sellerName', '') || this.get<string>(raw, 'seller', 'Lazada Store'),
        shopVerified: this.get<boolean>(raw, 'isLazMall', false) || this.get<boolean>(raw, 'isOfficial', false),
        freeShipping: this.get<boolean>(raw, 'freeShipping', false),
        url: `https://www.lazada.co.id/products/-i${id}.html`,
        imageUrl: this.get<string>(raw, 'image', ''),
        scrapedAt: new Date(),
      }
    } catch {
      return null
    }
  }
}
