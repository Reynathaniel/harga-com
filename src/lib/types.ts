export type PlatformId =
  | 'tokopedia' | 'shopee' | 'lazada' | 'bukalapak' | 'blibli' | 'tiktok'
  | 'amazon' | 'alibaba' | 'aliexpress' | 'jd'
  | 'olx' | 'carousell'
  | 'carsome' | 'mobil123' | 'momobil' | 'oto' | 'belanjamobil'

export interface Platform {
  id: PlatformId
  name: string
  shortName: string
  color: string
  bgColor: string
  logo: string
  affiliateBase: string
  cashbackPct: number
}

export interface PriceListing {
  platformId: PlatformId
  price: number
  originalPrice?: number
  discount?: number
  rating: number
  reviewCount: number
  sold: number
  stock: number
  shopName: string
  shopVerified: boolean
  freeShipping: boolean
  url: string
  affiliateUrl: string
  imageUrl: string
  // Zero-storage media: URLs only, files stay on platform CDNs
  videoUrl?: string
  videoThumb?: string
  condition?: 'new' | 'used'
  updatedAt: Date
}

export interface PriceHistory {
  date: Date
  prices: Partial<Record<PlatformId, number | null>>
}

export interface Product {
  id: string
  name: string
  slug: string
  brand: string
  category: string
  subcategory: string
  description: string
  specifications: Record<string, string>
  images: string[]
  tags: string[]
  listings: PriceListing[]
  priceHistory: PriceHistory[]
  lowestPrice: number
  highestPrice: number
  averageRating: number
  totalReviews: number
  createdAt: Date
  updatedAt: Date
}

export interface SearchResult {
  products: Product[]
  total: number
  query: string
  filters?: SearchFilters
  suggestions?: string[]
}

export interface SearchFilters {
  minPrice?: number
  maxPrice?: number
  platforms?: PlatformId[]
  minRating?: number
  freeShipping?: boolean
  category?: string
}

export interface CashbackTransaction {
  id: string
  productName: string
  platform: PlatformId
  purchaseAmount: number
  cashbackAmount: number
  cashbackPct: number
  status: 'pending' | 'confirmed' | 'paid'
  date: Date
}

export interface PriceAlert {
  id: string
  productId: string
  productName: string
  productImage: string
  targetPrice: number
  currentPrice: number
  platforms: PlatformId[]
  active: boolean
  createdAt: Date
  triggeredAt?: Date
}

export interface UserWallet {
  balance: number
  totalEarned: number
  totalWithdrawn: number
  pendingAmount: number
  transactions: CashbackTransaction[]
}
