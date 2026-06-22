import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'

// Carousell Indonesia — regional C2C second-hand marketplace
export class CarousellScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'carousell',
      baseUrl: 'https://id.carousell.com',
      searchPath: '/search',
      rateLimit: 2000,
      maxRetries: 2,
      timeout: 15_000,
      headers: {
        'Accept': 'application/json',
        'Referer': 'https://id.carousell.com',
        'Origin': 'https://id.carousell.com',
      },
    })
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const count = Math.min(req.limit ?? 20, 40)
    const start = ((req.page ?? 1) - 1) * count

    // Try official browse API
    try {
      const params = new URLSearchParams({
        query: req.query,
        count: String(count),
        start: String(start),
        countryCode: 'ID',
        includeCC2: 'true',
      })
      const data = await this.fetchJson<unknown>(
        `https://api.carousell.com/cs-browse-api/v1/search/?${params}`
      )
      const listings = this.get<unknown[]>(data, 'data.results', [])
        || this.get<unknown[]>(data, 'results', [])
      if (listings.length > 0) {
        return listings.map(l => this.parseProduct(l)).filter(Boolean) as RawListing[]
      }
    } catch {
      // fall through
    }

    // Fallback: try public search API
    try {
      const params = new URLSearchParams({
        keyword: req.query,
        limit: String(count),
        offset: String(start),
        country_id: '17', // Indonesia
      })
      const data = await this.fetchJson<unknown>(
        `https://api.carousell.com/cp-search-api/v3/search/?${params}`
      )
      const listings = this.get<unknown[]>(data, 'listings', [])
        || this.get<unknown[]>(data, 'data', [])
      if (listings.length > 0) {
        return listings.map(l => this.parseProduct(l)).filter(Boolean) as RawListing[]
      }
    } catch {
      // fall through
    }

    // Last resort: HTML with embedded JSON
    try {
      const url = `https://id.carousell.com/search/?keyword=${encodeURIComponent(req.query)}`
      const html = await this.fetchHtml(url, {
        headers: { Accept: 'text/html,application/xhtml+xml' },
      })
      return this.parseHtml(html, count)
    } catch {
      return []
    }
  }

  private parseHtml(html: string, limit: number): RawListing[] {
    // Carousell embeds __NEXT_DATA__ or window.__data
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(\{[\s\S]*?)\}<\/script>/)
    if (!match) return []
    try {
      const data = JSON.parse(match[1] + '}')
      const listings: unknown[] =
        this.get<unknown[]>(data, 'props.pageProps.initialData.results', [])
        || this.get<unknown[]>(data, 'props.initialProps.searchResults', [])
      return listings.slice(0, limit).map(l => this.parseProduct(l)).filter(Boolean) as RawListing[]
    } catch {
      return []
    }
  }

  protected parseProduct(raw: unknown): RawListing | null {
    try {
      // Carousell API shapes vary; handle multiple formats
      const id = String(
        this.get<unknown>(raw, 'id', '')
        ?? this.get<unknown>(raw, 'listing.id', '')
        ?? this.get<unknown>(raw, 'listingId', '')
      )
      const title = this.cleanTitle(
        this.get<string>(raw, 'title', '')
        || this.get<string>(raw, 'listing.title', '')
        || this.get<string>(raw, 'name', '')
      )
      if (!title || !id || id === 'undefined') return null

      // Price — various nested formats
      const priceValue =
        this.get<unknown>(raw, 'price.value', null)
        ?? this.get<unknown>(raw, 'listing.price.value', null)
        ?? this.get<unknown>(raw, 'priceCents', null)
        ?? this.get<unknown>(raw, 'price', null)
      const price = this.parsePrice(String(priceValue ?? '0'))
      if (!price) return null

      // Image
      const imageUrl =
        this.get<string>(raw, 'coverPhoto.url', '')
        || this.get<string>(raw, 'listing.coverPhoto.url', '')
        || this.get<string>(raw, 'photo', '')
        || this.get<string>(raw, 'thumbnail', '')
        || ''

      // URL
      const slug =
        this.get<string>(raw, 'slug', '')
        || this.get<string>(raw, 'listing.slug', '')
      const url = slug
        ? `https://id.carousell.com/p/${slug}/`
        : `https://id.carousell.com/p/${id}/`

      // Seller info
      const shopName =
        this.get<string>(raw, 'seller.username', '')
        || this.get<string>(raw, 'user.username', '')
        || this.get<string>(raw, 'sellerName', '')
        || 'Carousell Seller'

      // Condition — Carousell has explicit condition field
      const conditionRaw =
        this.get<string>(raw, 'condition.value', '')
        || this.get<string>(raw, 'listing.condition', '')
        || 'used'
      const condition: 'new' | 'used' | 'refurbished' =
        conditionRaw.toLowerCase().includes('new') ? 'new'
        : conditionRaw.toLowerCase().includes('refurb') ? 'refurbished'
        : 'used'

      return {
        platformId: 'carousell',
        productId: id,
        title,
        price,
        currency: 'IDR',
        rating: parseFloat(String(this.get<unknown>(raw, 'seller.rating', 0))) || 0,
        reviewCount: parseInt(String(this.get<unknown>(raw, 'seller.reviewCount', 0))) || 0,
        sold: parseInt(String(this.get<unknown>(raw, 'likesCount', 0))) || 0,
        stock: 1,
        shopName,
        shopVerified: this.get<boolean>(raw, 'seller.verified', false) ?? false,
        freeShipping: false,
        url,
        imageUrl,
        condition,
        isUsed: condition !== 'new',
        location: this.get<string>(raw, 'seller.city', '') || '',
        scrapedAt: new Date(),
      }
    } catch {
      return null
    }
  }
}
