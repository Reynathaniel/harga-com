import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'

/**
 * Mobil123.com — OLX Group's dedicated used car marketplace Indonesia
 * https://www.mobil123.com
 * Largest car classifieds in Indonesia
 */
export class Mobil123Scraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'mobil123',
      baseUrl: 'https://www.mobil123.com',
      searchPath: '/jual-mobil-bekas',
      rateLimit: 2000,
      maxRetries: 2,
      timeout: 15_000,
      headers: {
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'id-ID,id;q=0.9',
        'Referer': 'https://www.mobil123.com/',
      },
    })
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const limit = Math.min(req.limit ?? 20, 40)

    // Try Mobil123 search API (OLX Cars API)
    try {
      const params = new URLSearchParams({
        search_text: req.query,
        page_number: String(req.page ?? 1),
        page_size: String(limit),
        country: 'id',
        lang: 'id',
      })

      const data = await this.fetchJson<unknown>(
        `https://www.mobil123.com/api/cars/search?${params}`
      )

      const listings = this.get<unknown[]>(data, 'results', [])
        || this.get<unknown[]>(data, 'data.results', [])
        || this.get<unknown[]>(data, 'cars', [])

      if (listings.length > 0) {
        return listings.slice(0, limit).map(l => this.parseProduct(l)).filter(Boolean) as RawListing[]
      }
    } catch {
      // fall through
    }

    // Fallback: HTML scraping with embedded JSON
    try {
      const url = `https://www.mobil123.com/jual-mobil-bekas?search_text=${encodeURIComponent(req.query)}`
      const html = await this.fetchHtml(url)
      return this.parseHtml(html, limit)
    } catch {
      return []
    }
  }

  private parseHtml(html: string, limit: number): RawListing[] {
    // Try __NEXT_DATA__ first (site uses Next.js)
    const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (nextMatch) {
      try {
        const data = JSON.parse(nextMatch[1])
        const listings: unknown[] =
          this.get<unknown[]>(data, 'props.pageProps.cars', [])
          || this.get<unknown[]>(data, 'props.pageProps.listings', [])
          || this.get<unknown[]>(data, 'props.pageProps.data', [])
          || []
        if (listings.length > 0) {
          return listings.slice(0, limit).map(l => this.parseProduct(l)).filter(Boolean) as RawListing[]
        }
      } catch { /* continue */ }
    }

    // Try window.__INITIAL_STATE__
    const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/)
    if (stateMatch) {
      try {
        const state = JSON.parse(stateMatch[1])
        const listings: unknown[] = this.get<unknown[]>(state, 'listing.listings', []) || []
        return listings.slice(0, limit).map(l => this.parseProduct(l)).filter(Boolean) as RawListing[]
      } catch { /* continue */ }
    }

    return []
  }

  protected parseProduct(raw: unknown): RawListing | null {
    try {
      const id = String(
        this.get<unknown>(raw, 'id', '')
        ?? this.get<unknown>(raw, 'ad_id', '')
        ?? this.get<unknown>(raw, 'listing_id', '')
      )
      if (!id || id === 'undefined' || id === 'null') return null

      const make = this.get<string>(raw, 'make', '')
        || this.get<string>(raw, 'brand', '')
        || this.get<string>(raw, 'car_make', '')
        || ''
      const model = this.get<string>(raw, 'model', '')
        || this.get<string>(raw, 'car_model', '')
        || ''
      const year = this.get<unknown>(raw, 'year', '')
        || this.get<unknown>(raw, 'manufacture_year', '')
        || ''

      const title = this.cleanTitle(
        this.get<string>(raw, 'title', '')
        || this.get<string>(raw, 'name', '')
        || this.get<string>(raw, 'subject', '')
        || `${year} ${make} ${model}`.trim()
      )
      if (!title || title.length < 3) return null

      const priceRaw =
        this.get<unknown>(raw, 'price', null)
        ?? this.get<unknown>(raw, 'price_value', null)
        ?? this.get<unknown>(raw, 'listing_price', null)
      const price = this.parsePrice(String(priceRaw ?? '0'))
      if (!price || price < 5_000_000) return null

      // Real images from Mobil123/OLX CDN
      const photos = this.get<unknown[]>(raw, 'photos', [])
        || this.get<unknown[]>(raw, 'images', [])
        || this.get<unknown[]>(raw, 'gallery', [])
      const imageUrl =
        this.get<string>(photos, '0.url', '')
        || this.get<string>(photos, '0.large', '')
        || this.get<string>(photos, '0', '')
        || this.get<string>(raw, 'main_photo', '')
        || this.get<string>(raw, 'image_url', '')
        || this.get<string>(raw, 'thumbnail', '')
        || ''

      const urlSlug = this.get<string>(raw, 'slug', '')
        || this.get<string>(raw, 'url_path', '')
      const url =
        this.get<string>(raw, 'url', '')
        || this.get<string>(raw, 'ad_url', '')
        || (urlSlug ? `https://www.mobil123.com/mobil-dijual/detail/${urlSlug}` : `https://www.mobil123.com/ads/detail/${id}`)

      const mileage = this.get<unknown>(raw, 'mileage', '')
        || this.get<unknown>(raw, 'odometer', '')
        || ''
      const transmission = this.get<string>(raw, 'transmission', '') || ''
      const city = this.get<string>(raw, 'city', '')
        || this.get<string>(raw, 'location.name', '')
        || this.get<string>(raw, 'location_name', '')
        || ''

      const specs: Record<string, string> = {}
      if (year) specs['Tahun'] = String(year)
      if (mileage) specs['Kilometer'] = `${mileage} km`
      if (transmission) specs['Transmisi'] = transmission

      return {
        platformId: 'mobil123',
        productId: id,
        title,
        price,
        currency: 'IDR',
        rating: 0,
        reviewCount: 0,
        sold: 0,
        stock: 1,
        shopName: this.get<string>(raw, 'seller.name', '') || this.get<string>(raw, 'dealer_name', '') || 'Dealer',
        shopVerified: this.get<boolean>(raw, 'seller.is_pro', false) || this.get<boolean>(raw, 'is_verified_dealer', false) || false,
        freeShipping: false,
        url,
        imageUrl,
        brand: make,
        category: 'Mobil Bekas',
        specs,
        condition: 'used',
        isUsed: true,
        location: city,
        scrapedAt: new Date(),
      }
    } catch {
      return null
    }
  }
}
