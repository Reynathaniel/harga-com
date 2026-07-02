import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'

/**
 * OTO.com — Indonesia's comprehensive automotive portal
 * https://www.oto.com
 * New and used cars, specs, reviews, and classifieds
 */
export class OtoScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'oto',
      baseUrl: 'https://www.oto.com',
      searchPath: '/jual-mobil-bekas',
      rateLimit: 2000,
      maxRetries: 2,
      timeout: 15_000,
      headers: {
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'id-ID,id;q=0.9',
        'Referer': 'https://www.oto.com/',
        'x-requested-with': 'XMLHttpRequest',
      },
    })
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const limit = Math.min(req.limit ?? 20, 40)

    // Try OTO search API
    try {
      const params = new URLSearchParams({
        q: req.query,
        page: String(req.page ?? 1),
        per_page: String(limit),
        country: 'ID',
        type: 'used', // focus on used cars
      })

      const data = await this.fetchJson<unknown>(
        `https://www.oto.com/api/v1/listings/search?${params}`
      )

      const listings = this.get<unknown[]>(data, 'listings', [])
        || this.get<unknown[]>(data, 'data.listings', [])
        || this.get<unknown[]>(data, 'results', [])

      if (listings.length > 0) {
        return listings.slice(0, limit).map(l => this.parseProduct(l)).filter(Boolean) as RawListing[]
      }
    } catch {
      // fall through
    }

    // Fallback: HTML scraping
    try {
      const url = `https://www.oto.com/jual-mobil-bekas?q=${encodeURIComponent(req.query)}`
      const html = await this.fetchHtml(url)
      return this.parseHtml(html, limit)
    } catch {
      return []
    }
  }

  private parseHtml(html: string, limit: number): RawListing[] {
    // Try __NEXT_DATA__
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (match) {
      try {
        const data = JSON.parse(match[1])
        const listings: unknown[] =
          this.get<unknown[]>(data, 'props.pageProps.listings', [])
          || this.get<unknown[]>(data, 'props.pageProps.cars', [])
          || this.get<unknown[]>(data, 'props.pageProps.classifieds', [])
          || []
        if (listings.length > 0) {
          return listings.slice(0, limit).map(l => this.parseProduct(l)).filter(Boolean) as RawListing[]
        }
      } catch { /* continue */ }
    }

    // Try JSON-LD schema markup
    const jsonLdMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)
    const results: RawListing[] = []
    for (const m of jsonLdMatches) {
      try {
        const schema = JSON.parse(m[1])
        if (schema['@type'] === 'Car' || schema['@type'] === 'Product') {
          const listing = this.parseProduct(schema)
          if (listing) results.push(listing)
        }
        if (results.length >= limit) break
      } catch { /* continue */ }
    }
    return results
  }

  protected parseProduct(raw: unknown): RawListing | null {
    try {
      const id = String(
        this.get<unknown>(raw, 'id', '')
        ?? this.get<unknown>(raw, '@id', '')
        ?? this.get<unknown>(raw, 'listing_id', '')
        ?? this.get<unknown>(raw, 'classified_id', '')
      )
      if (!id || id === 'undefined' || id === 'null') return null

      const make = this.get<string>(raw, 'make', '')
        || this.get<string>(raw, 'brand', '')
        || this.get<string>(raw, 'brand.name', '')
        || ''
      const model = this.get<string>(raw, 'model', '')
        || this.get<string>(raw, 'model.name', '')
        || ''
      const year = this.get<unknown>(raw, 'year', '')
        || this.get<unknown>(raw, 'modelYear', '')
        || this.get<unknown>(raw, 'manufacture_year', '')
        || ''

      const title = this.cleanTitle(
        this.get<string>(raw, 'title', '')
        || this.get<string>(raw, 'name', '')
        || `${year} ${make} ${model}`.trim()
      )
      if (!title || title.length < 3) return null

      const priceRaw =
        this.get<unknown>(raw, 'price', null)
        ?? this.get<unknown>(raw, 'offers.price', null)
        ?? this.get<unknown>(raw, 'listing_price', null)
        ?? this.get<unknown>(raw, 'asking_price', null)
      const price = this.parsePrice(String(priceRaw ?? '0'))
      if (!price || price < 5_000_000) return null

      // Real images from OTO CDN
      const images = this.get<unknown[]>(raw, 'image', [])
        || this.get<unknown[]>(raw, 'images', [])
        || this.get<unknown[]>(raw, 'photos', [])
      const imageUrl =
        (Array.isArray(images) && images.length > 0 ? String(images[0]) : '')
        || this.get<string>(raw, 'image', '')
        || this.get<string>(raw, 'main_image', '')
        || this.get<string>(raw, 'thumbnail_url', '')
        || ''

      const url =
        this.get<string>(raw, 'url', '')
        || this.get<string>(raw, '@id', '')
        || `https://www.oto.com/jual-mobil-bekas/${id}`

      const mileage = this.get<unknown>(raw, 'mileageFromOdometer.value', '')
        || this.get<unknown>(raw, 'mileage', '')
        || this.get<unknown>(raw, 'odometer', '')
        || ''
      const transmission = this.get<string>(raw, 'vehicleTransmission', '')
        || this.get<string>(raw, 'transmission', '')
        || ''
      const color = this.get<string>(raw, 'color', '')
        || this.get<string>(raw, 'vehicleInteriorColor', '')
        || ''
      const city = this.get<string>(raw, 'location', '')
        || this.get<string>(raw, 'city', '')
        || ''

      const specs: Record<string, string> = {}
      if (year) specs['Tahun'] = String(year)
      if (mileage) specs['Kilometer'] = `${mileage} km`
      if (transmission) specs['Transmisi'] = transmission
      if (color) specs['Warna'] = color

      return {
        platformId: 'oto',
        productId: id,
        title,
        price,
        currency: 'IDR',
        rating: parseFloat(String(this.get<unknown>(raw, 'aggregateRating.ratingValue', '0') || '0')) || 0,
        reviewCount: parseInt(String(this.get<unknown>(raw, 'aggregateRating.reviewCount', '0') || '0')) || 0,
        sold: 0,
        stock: 1,
        shopName: this.get<string>(raw, 'seller.name', '') || this.get<string>(raw, 'dealer_name', '') || 'OTO Seller',
        shopVerified: this.get<boolean>(raw, 'seller.verified', false) || false,
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
