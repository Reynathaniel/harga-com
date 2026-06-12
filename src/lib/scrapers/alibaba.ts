import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'
import { EXCHANGE_RATES } from './types'

// Alibaba.com (B2B wholesale) — prices in USD, converted to IDR
export class AlibabaScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'alibaba',
      baseUrl: 'https://www.alibaba.com',
      searchPath: '/trade/search',
      rateLimit: 2500,
      maxRetries: 3,
      timeout: 15_000,
      headers: {
        Referer: 'https://www.alibaba.com',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      },
    })
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const limit = Math.min(req.limit ?? 40, 48)
    const page = req.page ?? 1

    // Alibaba's unofficial search API endpoint
    const params = new URLSearchParams({
      fsb: 'y',
      IndexArea: 'product_en',
      CatId: '',
      SearchText: req.query,
      page: String(page),
      viewtype: 'G',
    })

    try {
      const html = await this.fetchHtml(`https://www.alibaba.com/trade/search?${params}`)
      return this.parseAlibaba(html, limit)
    } catch {
      return []
    }
  }

  private parseAlibaba(html: string, limit: number): RawListing[] {
    const results: RawListing[] = []

    // Alibaba embeds product list as JSON in window.__data or __page_data
    const jsonMatch = html.match(/window\.__page_data\s*=\s*(\{[\s\S]*?\});/) ||
      html.match(/window\.__data\s*=\s*(\{[\s\S]*?\});/)

    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1])
        const items = this.get<unknown[]>(data, 'pageInfo.offerList', [])
          || this.get<unknown[]>(data, 'result.offerList', [])
        return items.slice(0, limit).map(i => this.parseProduct(i)).filter(Boolean) as RawListing[]
      } catch { /* fall through to HTML parse */ }
    }

    // Regex fallback — extract product blocks
    const blocks = html.match(/<div[^>]+class="[^"]*J-offer-wrapper[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]+class="[^"]*J-offer-wrapper|$)/g) ?? []

    for (const block of blocks.slice(0, limit)) {
      try {
        // ID from data-key or href
        const idMatch = block.match(/data-key="([^"]+)"/) || block.match(/detail\.1688\.com\/offer\/(\d+)/)
        if (!idMatch) continue
        const id = idMatch[1]

        const titleMatch = block.match(/<h2[^>]*class="[^"]*offer-title[^"]*"[^>]*>([\s\S]*?)<\/h2>/)
          || block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)
        const title = this.cleanTitle(titleMatch?.[1]?.replace(/<[^>]+>/g, '') ?? '')
        if (!title) continue

        // Price range (min price)
        const priceMatch = block.match(/US\$\s*([\d.]+)/) || block.match(/\$\s*([\d.]+)/)
        const priceUSD = priceMatch ? parseFloat(priceMatch[1]) : 0
        if (!priceUSD) continue
        const priceIDR = Math.round(priceUSD * EXCHANGE_RATES['USD'])

        const imgMatch = block.match(/<img[^>]+(?:src|data-lazy-src)="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/)
        const imageUrl = imgMatch?.[1] ?? ''

        const soldMatch = block.match(/([\d,]+)\s+orders/)
        const sold = soldMatch ? parseInt(soldMatch[1].replace(/,/g, '')) : 0

        results.push({
          platformId: 'alibaba',
          productId: id,
          title,
          price: priceIDR,
          currency: 'IDR',
          rating: 0,
          reviewCount: 0,
          sold,
          stock: 0,
          shopName: 'Alibaba Supplier',
          shopVerified: block.includes('Gold Supplier') || block.includes('verified-label'),
          freeShipping: false,
          url: `https://www.alibaba.com/product-detail/${id}.html`,
          imageUrl,
          scrapedAt: new Date(),
        })
      } catch { continue }
    }

    return results
  }

  protected parseProduct(raw: unknown): RawListing | null {
    try {
      const id = String(this.get<unknown>(raw, 'offerId', '') ?? this.get<unknown>(raw, 'id', ''))
      const title = this.cleanTitle(this.get<string>(raw, 'subject', '') || this.get<string>(raw, 'title', ''))
      if (!id || !title) return null

      const priceRaw = this.get<unknown>(raw, 'tradePrice', null)
        ?? this.get<unknown>(raw, 'saleInfo.price', null)
        ?? this.get<unknown>(raw, 'price', null)
      const priceUSD = parseFloat(String(priceRaw ?? '0'))
      const priceIDR = Math.round(priceUSD * EXCHANGE_RATES['USD'])
      if (!priceIDR) return null

      const imageUrl = this.get<string>(raw, 'image.resources.0', '')
        || this.get<string>(raw, 'imageUrl', '')
        || this.get<string>(raw, 'mainImage', '')

      return {
        platformId: 'alibaba',
        productId: id,
        title,
        price: priceIDR,
        currency: 'IDR',
        rating: parseFloat(String(this.get<unknown>(raw, 'sellerInfo.score', 0))) || 0,
        reviewCount: 0,
        sold: parseInt(String(this.get<unknown>(raw, 'tradeCount', 0))) || 0,
        stock: 0,
        shopName: this.get<string>(raw, 'sellerInfo.companyName', 'Alibaba Supplier'),
        shopVerified: this.get<boolean>(raw, 'sellerInfo.isGoldPlus', false),
        freeShipping: false,
        url: `https://www.alibaba.com/product-detail/${id}.html`,
        imageUrl,
        scrapedAt: new Date(),
      }
    } catch {
      return null
    }
  }
}
