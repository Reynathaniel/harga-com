export interface RawListing {
  platformId: string
  productId: string      // platform-native product ID
  title: string
  price: number          // current price in IDR (or converted)
  originalPrice?: number
  currency: string       // 'IDR' | 'USD' | 'CNY' etc.
  discount?: number      // percent
  rating: number
  reviewCount: number
  sold: number
  stock: number
  shopName: string
  shopVerified: boolean
  freeShipping: boolean
  url: string
  affiliateUrl?: string  // affiliate tracking URL (if program is active)
  imageUrl: string
  brand?: string
  category?: string
  specs?: Record<string, string>
  // Affiliate data (from affiliate program APIs)
  affiliateCommissionPct?: number  // e.g. 13.5 (from Shopee Affiliate)
  affiliateOfferType?: 'standard' | 'xtra' | 'sample' // offer badge type
  isAffiliateOffer?: boolean       // true = curated affiliate product
  scrapedAt: Date
}

export interface ScrapeRequest {
  query: string            // search keyword
  platformId: string
  limit?: number           // max results per platform
  page?: number
}

export interface ScrapeResult {
  platformId: string
  query: string
  listings: RawListing[]
  totalFound: number
  scrapedAt: Date
  durationMs: number
  error?: string
}

export interface ScraperConfig {
  platformId: string
  baseUrl: string
  searchPath: string
  rateLimit: number        // ms between requests
  maxRetries: number
  timeout: number          // ms
  userAgents: string[]
  headers?: Record<string, string>
  requiresJs?: boolean     // true if needs headless browser
}


// Exchange rates (IDR per 1 unit of currency)
export const EXCHANGE_RATES: Record<string, number> = {
  IDR: 1,
  USD: 16_200,
  CNY: 2_240,
  SGD: 12_100,
  MYR: 3_450,
}

export function toIDR(amount: number, currency: string): number {
  const rate = EXCHANGE_RATES[currency] ?? EXCHANGE_RATES['USD']
  return Math.round(amount * rate)
}
