import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'
import { EXCHANGE_RATES } from './types'

// AliExpress — retail arm of Alibaba Group, direct consumer sales
// Uses a stable search API endpoint
export class AliexpressScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'aliexpress',
      baseUrl: 'https://www.aliexpress.com',
      searchPath: '/wholesale',
      rateLimit: 2000,
      maxRetries: 3,
      timeout: 15_000,
      headers: {
        Referer: 'https://www.aliexpress.com',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      },
    })
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const limit = Math.min(req.limit ?? 40, 60)
    const page = req.page ?? 1

    // AliExpress search datasource — same as the main search page
    const params = new URLSearchParams({
      SearchText: req.query,
      page: String(page),
      pageSize: String(limit),
      sortType: 'default',
      g: 'y',
      isrefine: 'y',
    })

    try {
      const html = await this.fetchHtml(`https://www.aliexpress.com/wholesale?${params}`)
      return this.parseHtml(html, limit)
    } catch {
      return []
    }
  }

  private parseHtml(html: string, limit: number): RawListing[] {
    // AliExpress embeds catalog data as JS variable
    const match = html.match(/window\.runParams\s*=\s*(\{[\s\S]*?\});\s*(?:window\.|var )/)
      || html.match(/_init_data_\s*=\s*\{[^{]*"mods"\s*:/)

    if (match) {
      try {
        const dataStr = match[0].replace(/^window\.runParams\s*=\s*/, '').replace(/;\s*$/, '')
        const data = JSON.parse(dataStr)
        const items = this.get<unknown[]>(data, 'mods.itemList.content', [])
          || this.get<unknown[]>(data, 'data.mods.itemList.content', [])
        return items.slice(0, limit).map(i => this.parseProduct(i)).filter(Boolean) as RawListing[]
      } catch { /* fall through */ }
    }

    // Regex extraction from product cards
    const results: RawListing[] = []
    const productBlocks = html.match(/class="[^"]*manhattan--container[^"]*"[\s\S]*?(?=class="[^"]*manhattan--container|$)/g) ?? []

    for (const block of productBlocks.slice(0, limit)) {
      try {
        const idMatch = block.match(/(?:item|product)[_-]?id[=":\s]+(\d{10,})/)
        if (!idMatch) continue
        const id = idMatch[1]

        const titleMatch = block.match(/(?:title|h1|h2|alt)[="\s>]+"([^"]{10,})"/)
        const title = this.cleanTitle(titleMatch?.[1] ?? '')
        if (!title) continue

        const priceMatch = block.match(/US\$\s*([\d.]+)/)
        const priceUSD = priceMatch ? parseFloat(priceMatch[1]) : 0
        const priceIDR = Math.round(priceUSD * EXCHANGE_RATES['USD'])
        if (!priceIDR) continue

        const imgMatch = block.match(/src="(https:\/\/ae\d*\.alicdn\.com\/[^"]+)"/)

        results.push({
          platformId: 'aliexpress',
          productId: id,
          title,
          price: priceIDR,
          currency: 'IDR',
          rating: 0,
          reviewCount: 0,
          sold: 0,
          stock: 0,
          shopName: 'AliExpress Store',
          shopVerified: false,
          freeShipping: block.toLowerCase().includes('free ship'),
          url: `https://www.aliexpress.com/item/${id}.html`,
          imageUrl: imgMatch?.[1] ?? '',
          scrapedAt: new Date(),
        })
      } catch { continue }
    }

    return results
  }

  protected parseProduct(raw: unknown): RawListing | null {
    try {
      const id = String(this.get<unknown>(raw, 'productId', '') ?? this.get<unknown>(raw, 'itemId', ''))
      const title = this.cleanTitle(this.get<string>(raw, 'title', '') || this.get<string>(raw, 'name', ''))
      if (!id || !title) return null

      const priceRaw = this.get<unknown>(raw, 'prices.salePrice.minPrice', null)
        ?? this.get<unknown>(raw, 'salePrice', null)
        ?? this.get<unknown>(raw, 'price', null)
      const priceUSD = parseFloat(String(priceRaw ?? '0'))
      const priceIDR = Math.round(priceUSD * EXCHANGE_RATES['USD'])
      if (!priceIDR) return null

      const origRaw = this.get<unknown>(raw, 'prices.originalPrice.minPrice', null)
      const origIDR = origRaw ? Math.round(parseFloat(String(origRaw)) * EXCHANGE_RATES['USD']) : 0

      const imgRaw = this.get<string>(raw, 'imageUrl', '') || this.get<string>(raw, 'img', '')
      const imageUrl = imgRaw.startsWith('//') ? 'https:' + imgRaw : imgRaw

      return {
        platformId: 'aliexpress',
        productId: id,
        title,
        price: priceIDR,
        originalPrice: origIDR && origIDR > priceIDR ? origIDR : undefined,
        currency: 'IDR',
        rating: parseFloat(String(this.get<unknown>(raw, 'averageStar', 0))) || 0,
        reviewCount: parseInt(String(this.get<unknown>(raw, 'reviewCount', 0))) || 0,
        sold: parseInt(String(this.get<unknown>(raw, 'orders', 0))) || 0,
        stock: 0,
        shopName: this.get<string>(raw, 'store.storeName', 'AliExpress Store'),
        shopVerified: this.get<boolean>(raw, 'store.topRatedSeller', false),
        freeShipping: this.get<boolean>(raw, 'logistics.hasFreeShipping', false),
        url: `https://www.aliexpress.com/item/${id}.html`,
        imageUrl,
        scrapedAt: new Date(),
      }
    } catch {
      return null
    }
  }
}
