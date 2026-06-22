import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'

// TikTok Shop uses shop.tiktok.com API
export class TiktokScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'tiktok',
      baseUrl: 'https://shop.tiktok.com',
      searchPath: '/search',
      rateLimit: 2000,
      maxRetries: 3,
      timeout: 15_000,
      headers: {
        Referer: 'https://shop.tiktok.com/search',
        'Content-Type': 'application/json',
      },
    })
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const limit = Math.min(req.limit ?? 40, 30)
    const page = req.page ?? 1

    // TikTok Shop search API (unofficial but stable for ID region)
    const params = new URLSearchParams({
      keyword: req.query,
      sort_type: '0',
      offset: String((page - 1) * limit),
      limit: String(limit),
      is_in_sale: '0',
      locale: 'id-ID',
      currency: 'IDR',
    })

    try {
      const data = await this.fetchJson<unknown>(
        `https://shop.tiktok.com/api/search?${params}`,
      )

      const items = this.get<unknown[]>(data, 'data.items', [])
        || this.get<unknown[]>(data, 'items', [])
      return items.map(i => this.parseProduct(i)).filter(Boolean) as RawListing[]
    } catch {
      // Fallback: use TikTok open platform search API format
      return this.searchFallback(req)
    }
  }

  private async searchFallback(req: ScrapeRequest): Promise<RawListing[]> {
    // TikTok Shop Indonesia via affiliate partner search
    const url = `https://affiliate.tiktok.com/connection/product/search?keyword=${encodeURIComponent(req.query)}&page=${req.page ?? 1}&page_size=${req.limit ?? 30}&sort_type=0&currency=IDR&locale=id-ID`
    try {
      const data = await this.fetchJson<unknown>(url)
      const items = this.get<unknown[]>(data, 'data.products', [])
      return items.map(i => this.parseProduct(i)).filter(Boolean) as RawListing[]
    } catch {
      return []
    }
  }

  protected parseProduct(raw: unknown): RawListing | null {
    try {
      const id = String(this.get<unknown>(raw, 'id', '') ?? this.get<unknown>(raw, 'product_id', ''))
      const title = this.cleanTitle(this.get<string>(raw, 'title', '') || this.get<string>(raw, 'product_name', ''))
      if (!title || !id) return null

      const priceRaw = this.get<unknown>(raw, 'price.original_price', null)
        ?? this.get<unknown>(raw, 'price', null)
        ?? this.get<unknown>(raw, 'sale_price', null)
      const price = this.parsePrice(String(priceRaw ?? '0'))
      if (!price) return null

      const origRaw = this.get<unknown>(raw, 'price.market_price', null)
      const originalPrice = origRaw ? this.parsePrice(String(origRaw)) : undefined

      const cover = this.get<string>(raw, 'cover', '')
        || this.get<string>(raw, 'main_image', '')
        || this.get<string>(raw, 'images.0', '')

      // TikTok products are video-native — extract video URL if present
      const videoUrl = this.get<string>(raw, 'video.play_url', '')
        || this.get<string>(raw, 'video_url', '')
        || this.get<string>(raw, 'video.url', '')
        || undefined
      const videoThumb = this.get<string>(raw, 'video.cover', '') || cover || undefined

      return {
        platformId: 'tiktok',
        productId: id,
        title,
        price,
        originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
        currency: 'IDR',
        discount: this.get<number>(raw, 'price.discount', 0) || undefined,
        rating: parseFloat(String(this.get<unknown>(raw, 'rating', 0))) || 0,
        reviewCount: parseInt(String(this.get<unknown>(raw, 'comment_count', 0))) || 0,
        sold: parseInt(String(this.get<unknown>(raw, 'sales', 0))) || 0,
        stock: parseInt(String(this.get<unknown>(raw, 'stock', 0))) || 0,
        shopName: this.get<string>(raw, 'shop.name', '') || this.get<string>(raw, 'seller_name', 'TikTok Shop'),
        shopVerified: this.get<boolean>(raw, 'shop.is_official', false),
        freeShipping: this.get<boolean>(raw, 'free_shipping', false),
        url: `https://shop.tiktok.com/view/product/${id}`,
        imageUrl: cover,
        videoUrl,
        videoThumb,
        scrapedAt: new Date(),
      }
    } catch {
      return null
    }
  }
}
