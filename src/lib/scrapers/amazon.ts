import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'
import { EXCHANGE_RATES } from './types'

// Amazon scraper — targets amazon.com with USD→IDR conversion
// NOTE: Amazon is heavily bot-protected; this uses the public search API.
// For production, use Amazon Product Advertising API (PA API 5.0).
export class AmazonScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'amazon',
      baseUrl: 'https://www.amazon.com',
      searchPath: '/s',
      rateLimit: 3000,          // Amazon is strict — slower rate
      maxRetries: 2,
      timeout: 15_000,
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.amazon.com',
      },
    })
  }

  protected async search(req: ScrapeRequest): Promise<RawListing[]> {
    const limit = Math.min(req.limit ?? 40, 48)
    const page = req.page ?? 1

    // Amazon's unofficial product search JSON endpoint
    // (Used by many price tracking sites)
    const params = new URLSearchParams({
      k: req.query,
      page: String(page),
      'ref': 'sr_pg_' + page,
      'low-price': '',
      'high-price': '',
    })

    try {
      const html = await this.fetchHtml(`https://www.amazon.com/s?${params}`)
      return this.parseSearchHtml(html, limit)
    } catch {
      return []
    }
  }

  private parseSearchHtml(html: string, limit: number): RawListing[] {
    const results: RawListing[] = []

    // Extract product JSON from Amazon's search page data
    // Amazon embeds product data in <div data-asin=...> elements
    const asinBlocks = html.match(/<div[^>]+data-asin="([A-Z0-9]{10})"[^>]*>([\s\S]*?)(?=<div[^>]+data-asin="|$)/g) ?? []

    for (const block of asinBlocks.slice(0, limit)) {
      try {
        const asinMatch = block.match(/data-asin="([A-Z0-9]{10})"/)
        if (!asinMatch) continue
        const asin = asinMatch[1]

        const titleMatch = block.match(/<span[^>]*class="[^"]*a-text-normal[^"]*"[^>]*>([\s\S]*?)<\/span>/)
        const title = this.cleanTitle(titleMatch?.[1]?.replace(/<[^>]+>/g, '') ?? '')
        if (!title) continue

        // Price extraction
        const wholePriceMatch = block.match(/class="a-price-whole"[^>]*>([\d,]+)/)
        const fracPriceMatch = block.match(/class="a-price-fraction"[^>]*>(\d+)/)
        const priceUSD = wholePriceMatch
          ? parseFloat(`${wholePriceMatch[1].replace(/,/g, '')}.${fracPriceMatch?.[1] ?? '00'}`)
          : 0
        if (!priceUSD) continue

        const priceIDR = Math.round(priceUSD * EXCHANGE_RATES['USD'])

        // Original price
        const origMatch = block.match(/class="a-price a-text-price"[^>]*>[\s\S]*?<span class="a-offscreen">\$?([\d,.]+)/)
        const origUSD = origMatch ? parseFloat(origMatch[1].replace(/,/g, '')) : 0
        const origIDR = origUSD ? Math.round(origUSD * EXCHANGE_RATES['USD']) : 0

        // Rating
        const ratingMatch = block.match(/(\d+\.\d+) out of 5/)
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0

        // Review count
        const reviewMatch = block.match(/([\d,]+)\s+rating/)
        const reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, '')) : 0

        // Image
        const imgMatch = block.match(/<img[^>]+class="[^"]*s-image[^"]*"[^>]+src="([^"]+)"/)
        const imageUrl = imgMatch?.[1] ?? ''

        // Sold by
        const soldByMatch = block.match(/Sold by[^>]*>([^<]+)/)
        const shopName = soldByMatch ? this.cleanTitle(soldByMatch[1]) : 'Amazon'

        const isAmazonChoice = block.includes('amazon-choice') || block.includes("Amazon's Choice")

        results.push({
          platformId: 'amazon',
          productId: asin,
          title,
          price: priceIDR,
          originalPrice: origIDR && origIDR > priceIDR ? origIDR : undefined,
          currency: 'IDR',
          discount: origIDR && priceIDR ? Math.round((1 - priceIDR / origIDR) * 100) : undefined,
          rating,
          reviewCount,
          sold: 0,
          stock: 1,
          shopName,
          shopVerified: isAmazonChoice,
          freeShipping: block.includes('FREE delivery') || block.includes('FREE Shipping'),
          url: `https://www.amazon.com/dp/${asin}`,
          imageUrl,
          scrapedAt: new Date(),
        })
      } catch {
        continue
      }
    }

    return results
  }

  protected parseProduct(raw: unknown): RawListing | null {
    const id = String(this.get<unknown>(raw, 'asin', ''))
    const title = this.cleanTitle(this.get<string>(raw, 'title', ''))
    if (!id || !title) return null

    const priceUSD = parseFloat(String(this.get<unknown>(raw, 'price', 0)))
    const priceIDR = Math.round(priceUSD * EXCHANGE_RATES['USD'])

    return {
      platformId: 'amazon',
      productId: id,
      title,
      price: priceIDR,
      currency: 'IDR',
      rating: parseFloat(String(this.get<unknown>(raw, 'rating', 0))) || 0,
      reviewCount: parseInt(String(this.get<unknown>(raw, 'reviewCount', 0))) || 0,
      sold: 0,
      stock: 1,
      shopName: this.get<string>(raw, 'seller', 'Amazon'),
      shopVerified: false,
      freeShipping: false,
      url: `https://www.amazon.com/dp/${id}`,
      imageUrl: this.get<string>(raw, 'image', ''),
      scrapedAt: new Date(),
    }
  }
}
