import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'

// Tokopedia uses a GraphQL API under ace.tokopedia.com
// Public endpoint — no auth required for search
export class TokopediaScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'tokopedia',
      baseUrl: 'https://www.tokopedia.com',
      searchPath: '/search',
      rateLimit: 1200,
      maxRetries: 3,
      timeout: 12_000,
      headers: {
        Origin: 'https://www.tokopedia.com',
        'X-Source': 'tokopedia-lite',
      },
    })
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const limit = req.limit ?? 40
    const rows = Math.min(limit, 60)
    const page = req.page ?? 1

    const gqlUrl = 'https://gql.tokopedia.com/'
    const body = JSON.stringify([{
      operationName: 'SearchProductQueryV4',
      variables: {
        params: `q=${encodeURIComponent(req.query)}&rows=${rows}&start=${(page - 1) * rows}&ob=23&rt=4,7&srp_component_id=02.01.00.00&srp_page_id=1765&srp_page_title=&topadAds=true&official=false&page=${page}&user_id=0&device=desktop&source=search&scheme=https&navsource=`,
      },
      query: `query SearchProductQueryV4($params: String) {
        ace_search_product_v4(params: $params) {
          data { products {
            id name url imageUrl
            price { text value }
            originalPrice discountPercentage
            rating countReview totalSold stock
            shop { name appLink isOfficial }
            freeOngkir { isActive }
            labelGroups { title position }
          }}
        }
      }`,
    }])

    try {
      const res = await this.fetchJson<unknown[]>(gqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      // Detect GQL-level errors returned as HTTP 200 (anti-bot / schema mismatch)
      const gqlErrors = this.get<unknown[]>(res, '0.errors', [])
      if (gqlErrors.length > 0) {
        throw new Error(`Tokopedia GQL error: ${JSON.stringify(gqlErrors[0])}`)
      }

      const products = this.get<unknown[]>(res, '0.data.ace_search_product_v4.data.products', [])
      if (products.length === 0) {
        throw new Error('Tokopedia GQL returned empty products — trying HTML fallback')
      }
      return products.map(p => this.parseProduct(p)).filter(Boolean) as RawListing[]
    } catch {
      return this.searchFallback(req)
    }
  }

  private async searchFallback(req: ScrapeRequest): Promise<RawListing[]> {
    const url = `https://www.tokopedia.com/search?q=${encodeURIComponent(req.query)}&page=${req.page ?? 1}`
    try {
      const html = await this.fetchHtml(url)
      return this.parseSearchHtml(html)
    } catch {
      return []
    }
  }

  private parseSearchHtml(html: string): RawListing[] {
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!match) return []
    try {
      const data = JSON.parse(match[1])
      const items = this.get<unknown[]>(data, 'props.pageProps.searchResult.items', [])
      return items.map(i => this.parseProduct(i)).filter(Boolean) as RawListing[]
    } catch {
      return []
    }
  }

  protected parseProduct(raw: unknown): RawListing | null {
    try {
      const id = String(this.get<unknown>(raw, 'id', '') ?? this.get<unknown>(raw, 'product_id', ''))
      const title = this.cleanTitle(this.get<string>(raw, 'name', '') || this.get<string>(raw, 'product_name', ''))
      if (!title || !id) return null

      const priceRaw = this.get<unknown>(raw, 'price.value', null)
          ?? this.get<unknown>(raw, 'price', null)
      const price = this.parsePrice(String(priceRaw ?? '0'))
      if (!price) return null

      const origRaw = this.get<unknown>(raw, 'originalPrice', null) ?? this.get<unknown>(raw, 'original_price', null)
      const originalPrice = origRaw ? this.parsePrice(String(origRaw)) : undefined

      return {
        platformId: 'tokopedia',
        productId: id,
        title,
        price,
        originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
        currency: 'IDR',
        discount: this.get<number>(raw, 'discountPercentage', 0) || undefined,
        rating: parseFloat(String(this.get<unknown>(raw, 'rating', 0))) || 0,
        reviewCount: parseInt(String(this.get<unknown>(raw, 'countReview', 0))) || 0,
        sold: parseInt(String(this.get<unknown>(raw, 'totalSold', 0))) || 0,
        stock: parseInt(String(this.get<unknown>(raw, 'stock', 0))) || 0,
        shopName: this.get<string>(raw, 'shop.name', 'Tokopedia Store'),
        shopVerified: this.get<boolean>(raw, 'shop.isOfficial', false),
        freeShipping: this.get<boolean>(raw, 'freeOngkir.isActive', false),
        url: this.get<string>(raw, 'url', '') || `https://tokopedia.com/product/${id}`,
        imageUrl: this.get<string>(raw, 'imageUrl', '') || this.get<string>(raw, 'image', ''),
        scrapedAt: new Date(),
      }
    } catch {
      return null
    }
  }
}
