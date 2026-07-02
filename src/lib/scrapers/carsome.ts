import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'

/**
 * Carsome Indonesia — Premium Used Car Marketplace
 * https://www.carsome.id
 * Sells certified used cars with warranty
 */
export class CarsomeScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'carsome',
      baseUrl: 'https://www.carsome.id',
      searchPath: '/beli/mobil-bekas',
      rateLimit: 2000,
      maxRetries: 2,
      timeout: 15_000,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
        'Referer': 'https://www.carsome.id/beli/mobil-bekas',
        'Origin': 'https://www.carsome.id',
      },
    })
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const limit = Math.min(req.limit ?? 20, 40)

    // Try Carsome's internal search API
    try {
      const params = new URLSearchParams({
        search: req.query,
        page: String(req.page ?? 1),
        limit: String(limit),
        country: 'ID',
      })

      const data = await this.fetchJson<unknown>(
        `https://api.carsome.id/api/v2/listings?${params}`,
        {
          headers: {
            'x-api-key': 'carsome-web',
            'Accept': 'application/json',
          },
        }
      )
      const listings = this.get<unknown[]>(data, 'data.listings', [])
        || this.get<unknown[]>(data, 'listings', [])
        || this.get<unknown[]>(data, 'data', [])

      if (listings.length > 0) {
        return listings.slice(0, limit).map(l => this.parseProduct(l)).filter(Boolean) as RawListing[]
      }
    } catch {
      // fall through to HTML
    }

    // Fallback: HTML with __NEXT_DATA__
    try {
      const query = req.query.toLowerCase().replace(/\s+/g, '-')
      const url = `https://www.carsome.id/beli/mobil-bekas?search=${encodeURIComponent(req.query)}`
      const html = await this.fetchHtml(url, {
        headers: { Accept: 'text/html,application/xhtml+xml' },
      })
      return this.parseHtml(html, limit)
    } catch {
      return []
    }
  }

  private parseHtml(html: string, limit: number): RawListing[] {
    // Try __NEXT_DATA__
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!match) return []
    try {
      const data = JSON.parse(match[1])
      const listings: unknown[] =
        this.get<unknown[]>(data, 'props.pageProps.listings', [])
        || this.get<unknown[]>(data, 'props.pageProps.cars', [])
        || this.get<unknown[]>(data, 'props.pageProps.data.listings', [])
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
        ?? this.get<unknown>(raw, 'listing_id', '')
      )
      if (!id || id === 'undefined') return null

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
      const variant = this.get<string>(raw, 'variant', '')
        || this.get<string>(raw, 'trim', '')
        || ''

      const title = this.cleanTitle(
        this.get<string>(raw, 'title', '')
        || this.get<string>(raw, 'name', '')
        || `${year} ${make} ${model} ${variant}`.trim()
      )
      if (!title || title.length < 3) return null

      const priceRaw =
        this.get<unknown>(raw, 'price', null)
        ?? this.get<unknown>(raw, 'listing_price', null)
        ?? this.get<unknown>(raw, 'selling_price', null)
        ?? this.get<unknown>(raw, 'price_value', null)
      const price = this.parsePrice(String(priceRaw ?? '0'))
      if (!price || price < 10_000_000) return null // min Rp 10 juta for cars

      // Images — use real listing photos from Carsome CDN
      const images = this.get<unknown[]>(raw, 'images', [])
        || this.get<unknown[]>(raw, 'photos', [])
      const imageUrl =
        this.get<string>(images, '0.url', '')
        || this.get<string>(images, '0', '')
        || this.get<string>(raw, 'image', '')
        || this.get<string>(raw, 'main_photo', '')
        || this.get<string>(raw, 'thumbnail', '')
        || this.get<string>(raw, 'cover_photo', '')
        || ''

      // Product URL
      const slug = this.get<string>(raw, 'slug', '') || id
      const url =
        this.get<string>(raw, 'url', '')
        || `https://www.carsome.id/beli/mobil-bekas/${slug}`

      // Mileage and specs
      const mileage = this.get<unknown>(raw, 'mileage', '')
        || this.get<unknown>(raw, 'odometer', '')
        || ''
      const transmission = this.get<string>(raw, 'transmission', '')
        || this.get<string>(raw, 'gear_type', '')
        || ''
      const color = this.get<string>(raw, 'color', '')
        || this.get<string>(raw, 'exterior_color', '')
        || ''
      const city = this.get<string>(raw, 'city', '')
        || this.get<string>(raw, 'location', '')
        || this.get<string>(raw, 'city_name', '')
        || 'Indonesia'

      const specs: Record<string, string> = {}
      if (year) specs['Tahun'] = String(year)
      if (mileage) specs['Kilometer'] = `${mileage} km`
      if (transmission) specs['Transmisi'] = transmission
      if (color) specs['Warna'] = color

      return {
        platformId: 'carsome',
        productId: id,
        title,
        price,
        currency: 'IDR',
        rating: 0,
        reviewCount: 0,
        sold: 0,
        stock: 1,
        shopName: 'Carsome Indonesia',
        shopVerified: true, // Carsome is always verified dealer
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
