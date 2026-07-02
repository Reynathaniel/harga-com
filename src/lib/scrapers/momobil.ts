import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'

/**
 * Momobil.id — Moladin Group's used car marketplace
 * https://www.momobil.id
 * Inspected and certified used cars
 */
export class MomobilScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'momobil',
      baseUrl: 'https://www.momobil.id',
      searchPath: '/jual-mobil',
      rateLimit: 2000,
      maxRetries: 2,
      timeout: 15_000,
      headers: {
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'id-ID,id;q=0.9',
        'Referer': 'https://www.momobil.id/',
        'Origin': 'https://www.momobil.id',
      },
    })
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const limit = Math.min(req.limit ?? 20, 40)

    // Try Momobil REST API
    try {
      const params = new URLSearchParams({
        keyword: req.query,
        page: String(req.page ?? 1),
        limit: String(limit),
      })

      const data = await this.fetchJson<unknown>(
        `https://api.momobil.id/v1/cars?${params}`,
        {
          headers: {
            'Accept': 'application/json',
            'x-platform': 'web',
          },
        }
      )

      const listings = this.get<unknown[]>(data, 'data.cars', [])
        || this.get<unknown[]>(data, 'data', [])
        || this.get<unknown[]>(data, 'cars', [])

      if (listings.length > 0) {
        return listings.slice(0, limit).map(l => this.parseProduct(l)).filter(Boolean) as RawListing[]
      }
    } catch {
      // fall through
    }

    // Fallback: HTML
    try {
      const url = `https://www.momobil.id/jual-mobil?keyword=${encodeURIComponent(req.query)}`
      const html = await this.fetchHtml(url)
      return this.parseHtml(html, limit)
    } catch {
      return []
    }
  }

  private parseHtml(html: string, limit: number): RawListing[] {
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!match) return []
    try {
      const data = JSON.parse(match[1])
      const listings: unknown[] =
        this.get<unknown[]>(data, 'props.pageProps.cars', [])
        || this.get<unknown[]>(data, 'props.pageProps.listings', [])
        || this.get<unknown[]>(data, 'props.pageProps.data.cars', [])
        || []
      return listings.slice(0, limit).map(l => this.parseProduct(l)).filter(Boolean) as RawListing[]
    } catch {
      return []
    }
  }

  protected parseProduct(raw: unknown): RawListing | null {
    try {
      const id = String(
        this.get<unknown>(raw, 'id', '')
        ?? this.get<unknown>(raw, 'car_id', '')
        ?? this.get<unknown>(raw, 'stock_id', '')
      )
      if (!id || id === 'undefined' || id === 'null') return null

      const make = this.get<string>(raw, 'brand', '')
        || this.get<string>(raw, 'make', '')
        || this.get<string>(raw, 'car_brand', '')
        || ''
      const model = this.get<string>(raw, 'model', '')
        || this.get<string>(raw, 'car_model', '')
        || ''
      const year = this.get<unknown>(raw, 'year', '')
        || this.get<unknown>(raw, 'production_year', '')
        || ''
      const variant = this.get<string>(raw, 'variant', '')
        || this.get<string>(raw, 'type', '')
        || ''

      const title = this.cleanTitle(
        this.get<string>(raw, 'title', '')
        || this.get<string>(raw, 'name', '')
        || `${year} ${make} ${model} ${variant}`.trim()
      )
      if (!title || title.length < 3) return null

      const priceRaw =
        this.get<unknown>(raw, 'price', null)
        ?? this.get<unknown>(raw, 'selling_price', null)
        ?? this.get<unknown>(raw, 'price_value', null)
      const price = this.parsePrice(String(priceRaw ?? '0'))
      if (!price || price < 5_000_000) return null

      // Real car photos from Momobil CDN
      const photos = this.get<unknown[]>(raw, 'photos', [])
        || this.get<unknown[]>(raw, 'images', [])
        || this.get<unknown[]>(raw, 'gallery', [])
      const imageUrl =
        this.get<string>(photos, '0.url', '')
        || this.get<string>(photos, '0.original', '')
        || this.get<string>(photos, '0', '')
        || this.get<string>(raw, 'main_photo', '')
        || this.get<string>(raw, 'cover_image', '')
        || this.get<string>(raw, 'image_url', '')
        || ''

      const slug = this.get<string>(raw, 'slug', '') || id
      const url =
        this.get<string>(raw, 'url', '')
        || `https://www.momobil.id/mobil/${slug}`

      const mileage = this.get<unknown>(raw, 'mileage', '')
        || this.get<unknown>(raw, 'odometer', '')
        || this.get<unknown>(raw, 'km_usage', '')
        || ''
      const transmission = this.get<string>(raw, 'transmission', '') || ''
      const plate = this.get<string>(raw, 'plate_area', '')
        || this.get<string>(raw, 'police_number_area', '')
        || ''
      const city = this.get<string>(raw, 'city', '')
        || this.get<string>(raw, 'location', '')
        || plate
        || ''

      const specs: Record<string, string> = {}
      if (year) specs['Tahun'] = String(year)
      if (mileage) specs['Kilometer'] = `${mileage} km`
      if (transmission) specs['Transmisi'] = transmission

      return {
        platformId: 'momobil',
        productId: id,
        title,
        price,
        currency: 'IDR',
        rating: 0,
        reviewCount: 0,
        sold: 0,
        stock: 1,
        shopName: this.get<string>(raw, 'seller.name', '') || 'Momobil',
        shopVerified: true, // Momobil inspects all cars
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
