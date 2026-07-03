import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'

// OLX Property category IDs
const OLX_CAT_RUMAH  = '5158'  // Rumah Bekas
const OLX_CAT_TANAH  = '5159'  // Tanah Bekas

// City ID → display name (OLX location API)
const CITY_NAMES: Record<string, string> = {
  '4000030': 'Jakarta Selatan',
  '4000031': 'Jakarta Timur',
  '4000032': 'Jakarta Barat',
  '4000033': 'Jakarta Utara',
  '4000034': 'Jakarta Pusat',
  '4000001': 'Bandung',
  '4000022': 'Bandung Barat',
  '4000049': 'Semarang',
  '4000202': 'Surabaya',
  '4000212': 'Sidoarjo',
  '4000003': 'Bekasi',
  '4000004': 'Bogor',
  '4000005': 'Depok',
  '4000006': 'Tangerang',
  '4000007': 'Tangerang Selatan',
  '4000020': 'Yogyakarta',
  '4000021': 'Sleman',
  '4000028': 'Denpasar',
  '4000015': 'Medan',
  '4000013': 'Makassar',
  '4000050': 'Malang',
}

/**
 * OlxPropertyScraper — scrapes OLX Indonesia for property listings.
 * Uses OLX's internal JSON search API with category_id filtering.
 *
 * Rumah Bekas:  category_id=5158
 * Tanah Bekas:  category_id=5159
 *
 * Key property params in API response (item.parameters[]):
 *   p_sqr_land      → Luas Tanah (m²)
 *   p_sqr_building  → Luas Bangunan (m²)
 *   p_bedroom       → Kamar Tidur
 *   p_bathroom      → Kamar Mandi
 *   p_floor         → Jumlah Lantai
 *
 * Images use OLX CDN: https://apollo.olx.co.id/v1/files/{FILE_ID}-ID/image;s=850x0
 * These URLs are hotlinkable and hosted on OLX's CDN.
 */
export class OlxPropertyScraper extends BaseScraper {
  private readonly olxCategoryId: string
  private readonly categoryLabel: string

  constructor(category: 'rumah' | 'tanah') {
    super({
      platformId: 'olx',
      baseUrl: 'https://www.olx.co.id',
      searchPath: '/api/relevance/v4/search',
      rateLimit: 2000,
      maxRetries: 2,
      timeout: 20_000,
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'id-ID,id;q=0.9',
        'Referer': 'https://www.olx.co.id',
      },
    })
    this.olxCategoryId = category === 'rumah' ? OLX_CAT_RUMAH : OLX_CAT_TANAH
    this.categoryLabel = category === 'rumah' ? 'Rumah Bekas' : 'Tanah Bekas'
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const page = req.page ?? 1
    const url = `${this.config.baseUrl}/api/relevance/v4/search?category_id=${this.olxCategoryId}&location_id=1000&page=${page}`

    try {
      const data = await this.fetchJson<{ data?: unknown[] }>(url)
      const items = (data.data ?? []) as Record<string, unknown>[]

      // A listing qualifies as property if:
      //  - its category_id matches exactly, OR
      //  - it has property parameters (p_sqr_land or p_sqr_building)
      const qualifying = items.filter(item => {
        const catId = String(item.category_id ?? '')
        if (catId === this.olxCategoryId) return true

        const params = this.getPropertyParams(item)
        if (this.olxCategoryId === OLX_CAT_RUMAH) {
          return (params.buildingArea > 0 && params.bedrooms > 0) ||
                 (params.landArea > 0 && params.buildingArea > 0)
        }
        // Tanah: has land but no building
        return params.landArea > 0 && params.buildingArea === 0 && params.bedrooms === 0
      })

      return qualifying
        .map(item => this.parseProduct(item))
        .filter(Boolean) as RawListing[]
    } catch (err) {
      console.error(`[OlxPropertyScraper:${this.categoryLabel}] Search error:`, err)
      return []
    }
  }

  private getPropertyParams(item: Record<string, unknown>) {
    const params = (item.parameters as Array<Record<string, unknown>> | undefined) ?? []
    const map: Record<string, string> = {}
    for (const p of params) {
      if (p.key != null && p.value != null) {
        map[String(p.key)] = String(p.value)
      }
    }
    return {
      landArea:     parseInt(map['p_sqr_land']     ?? '0', 10) || 0,
      buildingArea: parseInt(map['p_sqr_building'] ?? '0', 10) || 0,
      bedrooms:     parseInt(map['p_bedroom']      ?? '0', 10) || 0,
      bathrooms:    parseInt(map['p_bathroom']     ?? '0', 10) || 0,
      floors:       parseInt(map['p_floor']        ?? '0', 10) || 0,
    }
  }

  protected parseProduct(raw: unknown): RawListing | null {
    try {
      const item = raw as Record<string, unknown>

      const id = String(item.id ?? item.ad_id ?? '')
      if (!id) return null

      const title = String(item.title ?? '').trim()
      if (!title) return null

      // Price
      const priceObj = item.price as Record<string, unknown> | undefined
      const priceValue = priceObj?.value as Record<string, unknown> | undefined
      const priceRaw = Number(priceValue?.raw ?? 0)
      if (!priceRaw || priceRaw <= 0) return null

      // Images — use "full" size URL, strip port
      const images = (item.images as Array<Record<string, unknown>> | undefined) ?? []
      if (images.length === 0) return null  // require at least one photo

      const fullImgUrl = (images[0].full as Record<string, unknown> | undefined)?.url
      const imgUrl = String(fullImgUrl ?? images[0].url ?? '').replace(':443', '')
      if (!imgUrl.startsWith('http')) return null

      // Additional images (up to 4 total)
      const allImages = images
        .slice(0, 4)
        .map(img => {
          const fu = (img.full as Record<string, unknown> | undefined)?.url
          return String(fu ?? img.url ?? '').replace(':443', '')
        })
        .filter(u => u.startsWith('http'))

      // Property parameters
      const { landArea, buildingArea, bedrooms, bathrooms, floors } = this.getPropertyParams(item)

      // Location
      const locs = (item.locations as Array<Record<string, unknown>> | undefined) ?? []
      const loc = locs[0] ?? {}
      const cityId = String(loc.city_id ?? '')
      const cityName = CITY_NAMES[cityId] ?? 'Indonesia'

      // Build specs
      const specs: Record<string, string> = {}
      if (landArea > 0)     specs['Luas Tanah']     = `${landArea} m²`
      if (buildingArea > 0) specs['Luas Bangunan']  = `${buildingArea} m²`
      if (bedrooms > 0)     specs['Kamar Tidur']    = String(bedrooms)
      if (bathrooms > 0)    specs['Kamar Mandi']    = String(bathrooms)
      if (floors > 0)       specs['Jumlah Lantai']  = String(floors)
      specs['Lokasi'] = cityName

      // Price per m²: use building area for rumah, land area for tanah
      const areaForCalc = buildingArea > 0 ? buildingArea : landArea
      if (areaForCalc > 0) {
        specs['Harga/m²'] = String(Math.round(priceRaw / areaForCalc))
      }

      // Listing URL
      const urlRaw = String(item.url ?? '')
      const listingUrl = urlRaw.startsWith('http')
        ? urlRaw
        : `https://www.olx.co.id/item/${id}.html`

      const shopName = String(item.user_name ?? 'OLX Seller')
      const shopVerified = Boolean(item.is_kyc_verified_user)

      return {
        platformId: 'olx',
        productId:   id,
        title:       this.cleanTitle(title),
        price:       Math.round(priceRaw),
        currency:    'IDR',
        rating:      0,
        reviewCount: 0,
        sold:        0,
        stock:       1,
        shopName,
        shopVerified,
        freeShipping: false,
        url:         listingUrl,
        imageUrl:    imgUrl,
        condition:   'used',
        isUsed:      true,
        location:    cityName,
        category:    this.categoryLabel,
        specs,
        scrapedAt:   new Date(),
      }
    } catch (err) {
      console.error('[OlxPropertyScraper] parseProduct error:', err)
      return null
    }
  }
}
