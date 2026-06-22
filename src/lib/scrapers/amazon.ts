import { BaseScraper } from './base'
import type { RawListing, ScrapeRequest } from './types'
import { toIDR } from './types'

// Amazon scraper — targets amazon.com with USD→IDR conversion
// Affiliate tag set via AFFILIATE_AMAZON_TAG env var (e.g. googleglobalp-20)
// NOTE: Amazon is heavily bot-protected; this parses public search HTML.
// For production volume, use Amazon Product Advertising API (PA API 5.0).

const AFFILIATE_TAG = process.env.AFFILIATE_AMAZON_TAG ?? ''

function buildAffiliateUrl(asin: string): string {
  const base = `https://www.amazon.com/dp/${asin}`
  if (!AFFILIATE_TAG) return base
  return `${base}?tag=${AFFILIATE_TAG}`
}

export class AmazonScraper extends BaseScraper {
  constructor() {
    super({
      platformId: 'amazon',
      baseUrl: 'https://www.amazon.com',
      searchPath: '/s',
      rateLimit: 3000,
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

    const params = new URLSearchParams({
      k: req.query,
      page: String(page),
      ref: 'sr_pg_' + page,
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

    // Amazon embeds product data in <div data-asin="ASIN"> blocks
    const asinBlocks =
      html.match(/<div[^>]+data-asin="([A-Z0-9]{10})"[^>]*>([\s\S]*?)(?=<div[^>]+data-asin="|$)/g) ?? []

    for (const block of asinBlocks.slice(0, limit)) {
      const listing = this.parseProductBlock(block)
      if (listing) results.push(listing)
    }

    return results
  }

  private parseProductBlock(block: string): RawListing | null {
    try {
      const asinMatch = block.match(/data-asin="([A-Z0-9]{10})"/)
      if (!asinMatch) return null
      const asin = asinMatch[1]

      // Title — Amazon uses a-text-normal span
      const titleMatch = block.match(/<span[^>]*class="[^"]*a-text-normal[^"]*"[^>]*>([\s\S]*?)<\/span>/)
      const title = this.cleanTitle(titleMatch?.[1]?.replace(/<[^>]+>/g, '') ?? '')
      if (!title) return null

      // Price — whole + fraction parts
      const wholePriceMatch = block.match(/class="a-price-whole"[^>]*>([\d,]+)/)
      const fracPriceMatch = block.match(/class="a-price-fraction"[^>]*>(\d+)/)
      const priceUSD = wholePriceMatch
        ? parseFloat(`${wholePriceMatch[1].replace(/,/g, '')}.${fracPriceMatch?.[1] ?? '00'}`)
        : 0
      if (!priceUSD) return null

      const priceIDR = toIDR(priceUSD, 'USD')

      // Original/struck-through price
      const origMatch = block.match(/class="a-price a-text-price"[^>]*>[\s\S]*?<span class="a-offscreen">\$?([\d,.]+)/)
      const origUSD = origMatch ? parseFloat(origMatch[1].replace(/,/g, '')) : 0
      const origIDR = origUSD ? toIDR(origUSD, 'USD') : 0

      // Rating (e.g. "4.5 out of 5")
      const ratingMatch = block.match(/(\d+(?:\.\d+)?)\s+out of 5/)
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0

      // Review count
      const reviewMatch = block.match(/([\d,]+)\s+rating/)
      const reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, ''), 10) : 0

      // Image
      const imgMatch = block.match(/<img[^>]+class="[^"]*s-image[^"]*"[^>]+src="([^"]+)"/)
      const imageUrl = imgMatch?.[1] ?? ''

      // Seller name
      const soldByMatch = block.match(/Sold by[^>]*>([^<]+)/)
      const shopName = soldByMatch ? this.cleanTitle(soldByMatch[1]) : 'Amazon'

      const isAmazonChoice = block.includes('amazon-choice') || block.includes("Amazon's Choice")
      const isFreeShipping = block.includes('FREE delivery') || block.includes('FREE Shipping')

      const affiliateUrl = buildAffiliateUrl(asin)

      return {
        platformId: 'amazon',
        productId: asin,
        title,
        price: priceIDR,
        originalPrice: origIDR && origIDR > priceIDR ? origIDR : undefined,
        currency: 'IDR',
        discount:
          origIDR && priceIDR && origIDR > priceIDR
            ? Math.round((1 - priceIDR / origIDR) * 100)
            : undefined,
        rating,
        reviewCount,
        sold: 0,
        stock: 1,
        shopName,
        shopVerified: isAmazonChoice,
        freeShipping: isFreeShipping,
        url: `https://www.amazon.com/dp/${asin}`,
        affiliateUrl: AFFILIATE_TAG ? affiliateUrl : undefined,
        imageUrl,
        scrapedAt: new Date(),
      }
    } catch {
      return null
    }
  }

  // parseProduct satisfies BaseScraper abstract requirement;
  // primary logic lives in parseProductBlock for HTML parsing
  protected parseProduct(raw: unknown): RawListing | null {
    const id = String(this.get<unknown>(raw, 'asin', ''))
    const title = this.cleanTitle(this.get<string>(raw, 'title', ''))
    if (!id || !title) return null

    const priceUSD = parseFloat(String(this.get<unknown>(raw, 'price', 0)))
    const priceIDR = toIDR(priceUSD, 'USD')
    const affiliateUrl = buildAffiliateUrl(id)

    return {
      platformId: 'amazon',
      productId: id,
      title,
      price: priceIDR,
      currency: 'IDR',
      rating: parseFloat(String(this.get<unknown>(raw, 'rating', 0))) || 0,
      reviewCount: parseInt(String(this.get<unknown>(raw, 'reviewCount', 0)), 10) || 0,
      sold: 0,
      stock: 1,
      shopName: this.get<string>(raw, 'seller', 'Amazon'),
      shopVerified: false,
      freeShipping: false,
      url: `https://www.amazon.com/dp/${id}`,
      affiliateUrl: AFFILIATE_TAG ? affiliateUrl : undefined,
      imageUrl: this.get<string>(raw, 'image', ''),
      scrapedAt: new Date(),
    }
  }
}
