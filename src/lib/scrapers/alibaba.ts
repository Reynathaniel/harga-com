import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'
import { toIDR } from './types'

// ──────────────────────────────────────────────────────────────────────────────
// Alibaba.com scraper — B2B wholesale, prices in USD → IDR
// No affiliate program — uses direct product URLs only
// ──────────────────────────────────────────────────────────────────────────────

export class AlibabaScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'alibaba',
      baseUrl: 'https://www.alibaba.com',
      searchPath: '/trade/search',
      rateLimit: 2500,
      maxRetries: 2,
      timeout: 15_000,
      headers: {
        Referer: 'https://www.alibaba.com',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
  }

  // ── Search ──────────────────────────────────────────────────────────────────

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const limit = Math.min(req.limit ?? 40, 48)
    const page  = req.page ?? 1

    // Try JSON API first
    try {
      const jsonUrl = 'https://www.alibaba.com/search/api/product/search.htm?' +
        new URLSearchParams({
          q:        req.query,
          page:     String(page),
          pageSize: String(limit),
        })
      const data = await this.fetchJson<unknown>(jsonUrl, {
        headers: { Accept: 'application/json, text/plain, */*' },
      })
      const items = this.get<unknown[]>(data, 'data.offerList', [])
        || this.get<unknown[]>(data, 'result.offerList', [])
        || this.get<unknown[]>(data, 'offerList', [])
      if (items.length > 0) {
        return items.slice(0, limit).map(i => this.parseProduct(i)).filter((x): x is RawListing => x !== null)
      }
    } catch { /* fall through */ }

    // Fallback: HTML scrape
    try {
      const params = new URLSearchParams({
        fsb:        'y',
        IndexArea:  'product_en',
        SearchText: req.query,
        page:       String(page),
        viewtype:   'G',
      })
      const html = await this.fetchHtml(`https://www.alibaba.com/trade/search?${params}`)
      return this.parseSearchHtml(html, limit)
    } catch {
      return []
    }
  }

  // ── HTML parse ──────────────────────────────────────────────────────────────

  private parseSearchHtml(html: string, limit: number): RawListing[] {
    const results: RawListing[] = []

    const jsonMatch =
      html.match(/window\.__page_data\s*=\s*(\{[\s\S]*?\});\s*(?:<|window|var)/) ||
      html.match(/window\.__data\s*=\s*(\{[\s\S]*?\});\s*(?:<|window|var)/)

    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1])
        const items: unknown[] =
          (this.get<unknown[] | null>(data, 'pageInfo.offerList', null) ??
          this.get<unknown[] | null>(data, 'result.offerList', null) ??
          [])
        if (items.length > 0) {
          return items.slice(0, limit).map(i => this.parseProduct(i)).filter((x): x is RawListing => x !== null)
        }
      } catch { /* fall through */ }
    }

    const blocks =
      html.match(/<div[^>]+class="[^"]*J-offer-wrapper[^"]*"[^>]*>[\s\S]*?(?=<div[^>]+class="[^"]*J-offer-wrapper|$)/g) ??
      html.match(/<div[^>]+class="[^"]*organic-offer-wrapper[^"]*"[^>]*>[\s\S]*?(?=<div[^>]+class="[^"]*organic-offer-wrapper|$)/g) ??
      []

    for (const block of blocks.slice(0, limit)) {
      const listing = this.parseHtmlBlock(block)
      if (listing) results.push(listing)
    }

    return results
  }

  private parseHtmlBlock(block: string): RawListing | null {
    try {
      const idMatch =
        block.match(/data-key="([^"]+)"/) ||
        block.match(/data-offer-id="([^"]+)"/) ||
        block.match(/\/product-detail\/[^/]+_(\d+)\.html/) ||
        block.match(/detail\.1688\.com\/offer\/(\d+)/)
      if (!idMatch) return null
      const productId = idMatch[1]

      const titleMatch =
        block.match(/<h2[^>]*class="[^"]*offer-title[^"]*"[^>]*>([\s\S]*?)<\/h2>/) ||
        block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)
      const title = this.cleanTitle(titleMatch?.[1]?.replace(/<[^>]+>/g, '') ?? '')
      if (!title) return null

      let currency = 'USD'
      let priceRaw = 0
      const usdMatch = block.match(/US\$\s*([\d,.]+)/) || block.match(/\$([\d,.]+)/)
      if (usdMatch) {
        priceRaw = parseFloat(usdMatch[1].replace(/,/g, ''))
        currency = 'USD'
      } else {
        const cnyMatch = block.match(/CN[Y¥]\s*([\d,.]+)/) || block.match(/¥\s*([\d,.]+)/)
        if (cnyMatch) {
          priceRaw = parseFloat(cnyMatch[1].replace(/,/g, ''))
          currency = 'CNY'
        }
      }
      if (!priceRaw) return null
      const priceIDR = toIDR(priceRaw, currency)

      const imgMatch = block.match(/<img[^>]+(?:src|data-lazy-src|data-src)="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/)
      const imageUrl = imgMatch?.[1] ?? ''

      const shopMatch = block.match(/class="[^"]*company-name[^"]*"[^>]*>([^<]+)/)
      const shopName = shopMatch ? this.cleanTitle(shopMatch[1]) : 'Alibaba Supplier'

      const soldMatch = block.match(/([\d,]+)\s*orders?/)
      const sold = soldMatch ? parseInt(soldMatch[1].replace(/,/g, ''), 10) : 0

      const shopVerified = block.includes('gold-supplier') || block.includes('Gold Supplier') ||
        block.includes('verified-label') || block.includes('Verified')

      const hrefMatch = block.match(/href="(https:\/\/www\.alibaba\.com\/product-detail\/[^"]+)"/)
      const url = hrefMatch?.[1] ?? `https://www.alibaba.com/product-detail/_${productId}.html`

      const ratingMatch = block.match(/(\d+(?:\.\d+)?)\s*\/\s*5/) || block.match(/score[^>]*>(\d+(?:\.\d+)?)/)
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0

      return {
        platformId:   'alibaba',
        productId,
        title,
        price:        priceIDR,
        currency:     'IDR',
        rating,
        reviewCount:  0,
        sold,
        stock:        0,
        shopName,
        shopVerified,
        freeShipping: false,
        url,
        imageUrl,
        scrapedAt:    new Date(),
      }
    } catch {
      return null
    }
  }

  // ── JSON product parser ─────────────────────────────────────────────────────

  protected parseProduct(raw: unknown): RawListing | null {
    try {
      const id = String(
        this.get<unknown>(raw, 'offerId', '') ??
        this.get<unknown>(raw, 'id', '')
      )
      const title = this.cleanTitle(
        this.get<string>(raw, 'subject', '') ||
        this.get<string>(raw, 'title', '')
      )
      if (!id || !title) return null

      const priceUsdRaw =
        this.get<unknown>(raw, 'tradePrice', null) ??
        this.get<unknown>(raw, 'saleInfo.price', null) ??
        this.get<unknown>(raw, 'price', null)
      const priceCnyRaw = this.get<unknown>(raw, 'priceInfo.price', null)

      let priceIDR = 0
      if (priceUsdRaw !== null && priceUsdRaw !== undefined && String(priceUsdRaw) !== '0') {
        priceIDR = toIDR(parseFloat(String(priceUsdRaw)), 'USD')
      } else if (priceCnyRaw !== null && priceCnyRaw !== undefined) {
        priceIDR = toIDR(parseFloat(String(priceCnyRaw)), 'CNY')
      }
      if (!priceIDR) return null

      const imageUrl =
        this.get<string>(raw, 'image.resources.0', '') ||
        this.get<string>(raw, 'imageUrl', '')         ||
        this.get<string>(raw, 'mainImage', '')         ||
        this.get<string>(raw, 'image', '')

      const hrefRaw = this.get<string>(raw, 'detailUrl', '') || this.get<string>(raw, 'url', '')
      const url = hrefRaw
        ? (hrefRaw.startsWith('http') ? hrefRaw : `https:${hrefRaw}`)
        : `https://www.alibaba.com/product-detail/_${id}.html`

      const shopName = this.get<string>(raw, 'sellerInfo.companyName', '')
        || this.get<string>(raw, 'company.companyName', '')
        || 'Alibaba Supplier'

      const shopVerified =
        this.get<boolean>(raw, 'sellerInfo.isGoldPlus', false) ||
        this.get<boolean>(raw, 'company.isGold', false)

      const rating = parseFloat(String(this.get<unknown>(raw, 'sellerInfo.score', 0))) || 0
      const sold   = parseInt(String(this.get<unknown>(raw, 'tradeCount', 0)), 10)    || 0

      return {
        platformId:   'alibaba',
        productId:    id,
        title,
        price:        priceIDR,
        currency:     'IDR',
        rating,
        reviewCount:  0,
        sold,
        stock:        0,
        shopName,
        shopVerified,
        freeShipping: false,
        url,
        imageUrl,
        scrapedAt:    new Date(),
      }
    } catch {
      return null
    }
  }
}