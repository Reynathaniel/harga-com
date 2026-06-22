import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'

// OLX Indonesia — Indonesia's largest second-hand marketplace
export class OlxScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'olx',
      baseUrl: 'https://www.olx.co.id',
      searchPath: '/items',
      rateLimit: 2000,
      maxRetries: 2,
      timeout: 15_000,
      headers: {
        'Accept': 'application/json',
        'Referer': 'https://www.olx.co.id',
        'x-requested-with': 'XMLHttpRequest',
      },
    })
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const limit = Math.min(req.limit ?? 20, 40)
    const page = Math.max((req.page ?? 1) - 1, 0) // OLX uses 0-based page

    // Try JSON API first
    try {
      const params = new URLSearchParams({
        query: req.query,
        page: String(page),
        size: String(limit),
        location_id: '1000000', // Indonesia nationwide
      })
      const data = await this.fetchJson<unknown>(
        `https://www.olx.co.id/api/relevance/v4/search?${params}`
      )
      const ads = this.get<unknown[]>(data, 'data.ads', [])
      if (ads.length > 0) {
        return ads.map(ad => this.parseProduct(ad)).filter(Boolean) as RawListing[]
      }
    } catch {
      // fall through to HTML scrape
    }

    // Fallback: HTML page with embedded JSON
    try {
      const url = `https://www.olx.co.id/items/q-${encodeURIComponent(req.query)}`
      const html = await this.fetchHtml(url, {
        headers: { Accept: 'text/html,application/xhtml+xml' },
      })
      return this.parseHtml(html, limit)
    } catch {
      return []
    }
  }

  private parseHtml(html: string, limit: number): RawListing[] {
    // OLX embeds window.__PRELOADED_STATE__ with listing data
    const match = html.match(/window\.__PRELOADED_STATE__\s*=\s*(\{[\s\S]*?\});\s*(?:<\/script>|window\.)/)
    if (!match) return []
    try {
      const state = JSON.parse(match[1])
      const ads: unknown[] = this.get<unknown[]>(state, 'listing.listingReducer.ads', [])
        || this.get<unknown[]>(state, 'ads.ads', [])
      return ads.slice(0, limit).map(ad => this.parseProduct(ad)).filter(Boolean) as RawListing[]
    } catch {
      return []
    }
  }

  protected parseProduct(raw: unknown): RawListing | null {
    try {
      const id = String(
        this.get<unknown>(raw, 'id', '')
        ?? this.get<unknown>(raw, 'ad_id', '')
        ?? this.get<unknown>(raw, 'adId', '')
      )
      const title = this.cleanTitle(
        this.get<string>(raw, 'title', '')
        || this.get<string>(raw, 'subject', '')
      )
      if (!title || !id || id === 'undefined') return null

      // Price: OLX API returns price object or flat number
      const priceRaw =
        this.get<unknown>(raw, 'price.value.raw', null)
        ?? this.get<unknown>(raw, 'price.value', null)
        ?? this.get<unknown>(raw, 'price', null)
      const price = this.parsePrice(String(priceRaw ?? '0'))
      if (!price) return null

      // Image
      const images = this.get<unknown[]>(raw, 'images', [])
      const imageUrl =
        this.get<string>(images, '0.url', '')
        || this.get<string>(raw, 'thumbnail', '')
        || this.get<string>(raw, 'mainImage.url', '')
        || ''

      // URL
      const urlRaw = this.get<string>(raw, 'url', '')
      const url = urlRaw.startsWith('http')
        ? urlRaw
        : `https://www.olx.co.id/item/${id}.html`

      // Location
      const location =
        this.get<string>(raw, 'location.name', '')
        || this.get<string>(raw, 'geo.cityName', '')
        || this.get<string>(raw, 'city', '')
        || ''

      // Seller
      const shopName =
        this.get<string>(raw, 'user.name', '')
        || this.get<string>(raw, 'seller.name', '')
        || 'OLX Seller'

      return {
        platformId: 'olx',
        productId: id,
        title,
        price,
        currency: 'IDR',
        rating: 0,
        reviewCount: 0,
        sold: 0,
        stock: 1,
        shopName,
        shopVerified: this.get<boolean>(raw, 'user.is_pro', false) ?? false,
        freeShipping: false,
        url,
        imageUrl,
        condition: 'used',
        isUsed: true,
        location,
        scrapedAt: new Date(),
      }
    } catch {
      return null
    }
  }
}
