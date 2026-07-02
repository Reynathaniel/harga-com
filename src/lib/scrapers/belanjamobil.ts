import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'

/**
 * BelanjaMobil.co.id — Indonesian new & used car marketplace
 * https://belanjamobil.co.id
 * Multi-dealer car listings with price transparency
 */
export class BelanjaMobilScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'belanjamobil',
      baseUrl: 'https://belanjamobil.co.id',
      searchPath: '/search',
      rateLimit: 2000,
      maxRetries: 2,
      timeout: 15_000,
      headers: {
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'id-ID,id;q=0.9',
        'Referer': 'https://belanjamobil.co.id/',
      },
    })
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const limit = Math.min(req.limit ?? 20, 40)

    // Try BelanjaMobil API
    try {
      const params = new URLSearchParams({
        keyword: req.query,
        page: String(req.page ?? 1),
        per_page: String(limit),
        condition: 'used',
      })

      const data = await this.fetchJson<unknown>(
        `https://belanjamobil.co.id/api/cars?${params}`
      )

      const listings = this.get<unknown[]>(data, 'data', [])
        || this.get<unknown[]>(data, 'cars', [])
        || this.get<unknown[]>(data, 'results', [])

      if (listings.length > 0) {
        return listings.slice(0, limit).map(l => this.parseProduct(l)).filter(Boolean) as RawListing[]
      }
    } catch {
      // fall through
    }

    // Fallback: HTML
    try {
      const url = `https://belanjamobil.co.id/search?keyword=${encodeURIComponent(req.query)}&condition=used`
      const html = await this.fetchHtml(url)
      return this.parseHtml(html, limit)
    } catch {
      return []
    }
  }

  private parseHtml(html: string, limit: number): RawListing[] {
    // Try __NEXT_DATA__ (Laravel + Inertia.js or Next.js)
    const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (nextMatch) {
      try {
        const data = JSON.parse(nextMatch[1])
        const listings: unknown[] =
          this.get<unknown[]>(data, 'props.pageProps.cars', [])
          || this.get<unknown[]>(data, 'props.pageProps.data', [])
          || []
        if (listings.length > 0) {
          return listings.slice(0, limit).map(l => this.parseProduct(l)).filter(Boolean) as RawListing[]
        }
      } catch { /* continue */ }
    }

    // Inertia.js pattern
    const inertiaMatch = html.match(/data-page="([^"]+)"/)
    if (inertiaMatch) {
      try {
        const data = JSON.parse(inertiaMatch[1].replace(/&quot;/g, '"'))
        const listings: unknown[] =
          this.get<unknown[]>(data, 'props.cars.data', [])
          || this.get<unknown[]>(data, 'props.data', [])
          || []
        return listings.slice(0, limit).map(l => this.parseProduct(l)).filter(Boolean) as RawListing[]
      } catch { /* continue */ }
    }

    return []
  }

  protected parseProduct(raw: unknown): RawListing | null {
    try {
      const id = String(
        this.get<unknown>(raw, 'id', '')
        ?? this.get<unknown>(raw, 'car_id', '')
      )
      if (!id || id === 'undefined') return null

      const make = this.get<string>(raw, 'brand', '')
        || this.get<string>(raw, 'make', '')
        || this.get<string>(raw, 'merek', '')
        || ''
      const model = this.get<string>(raw, 'model', '')
        || this.get<string>(raw, 'tipe', '')
        || ''
      const year = this.get<unknown>(raw, 'year', '')
        || this.get<unknown>(raw, 'tahun', '')
        || ''

      const title = this.cleanTitle(
        this.get<string>(raw, 'title', '')
        || this.get<string>(raw, 'name', '')
        || this.get<string>(raw, 'judul', '')
        || `${year} ${make} ${model}`.trim()
      )
      if (!title || title.length < 3) return null

      const priceRaw =
        this.get<unknown>(raw, 'price', null)
        ?? this.get<unknown>(raw, 'harga', null)
        ?? this.get<unknown>(raw, 'selling_price', null)
      const price = this.parsePrice(String(priceRaw ?? '0'))
      if (!price || price < 5_000_000) return null

      // Real images from BelanjaMobil CDN
      const photos = this.get<unknown[]>(raw, 'images', [])
        || this.get<unknown[]>(raw, 'photos', [])
        || this.get<unknown[]>(raw, 'foto', [])
      const imageUrl =
        this.get<string>(photos, '0.url', '')
        || this.get<string>(photos, '0.path', '')
        || this.get<string>(photos, '0', '')
        || this.get<string>(raw, 'thumbnail', '')
        || this.get<string>(raw, 'foto_utama', '')
        || this.get<string>(raw, 'image_url', '')
        || ''

      const url =
        this.get<string>(raw, 'url', '')
        || this.get<string>(raw, 'link', '')
        || `https://belanjamobil.co.id/mobil/${id}`

      const mileage = this.get<unknown>(raw, 'mileage', '')
        || this.get<unknown>(raw, 'kilometer', '')
        || ''
      const transmission = this.get<string>(raw, 'transmission', '')
        || this.get<string>(raw, 'transmisi', '')
        || ''
      const city = this.get<string>(raw, 'city', '')
        || this.get<string>(raw, 'kota', '')
        || this.get<string>(raw, 'location', '')
        || ''

      const specs: Record<string, string> = {}
      if (year) specs['Tahun'] = String(year)
      if (mileage) specs['Kilometer'] = `${mileage} km`
      if (transmission) specs['Transmisi'] = transmission

      return {
        platformId: 'belanjamobil',
        productId: id,
        title,
        price,
        currency: 'IDR',
        rating: 0,
        reviewCount: 0,
        sold: 0,
        stock: 1,
        shopName: this.get<string>(raw, 'dealer.name', '') || this.get<string>(raw, 'showroom', '') || 'Dealer',
        shopVerified: false,
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
