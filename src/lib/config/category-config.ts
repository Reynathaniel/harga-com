/**
 * category-config.ts — Data-driven display configuration for all product categories.
 *
 * ARCHITECTURE: "Excel formula" approach — instead of writing UI code per product,
 * define what each category looks like here. The UI components read this config and
 * render dynamically. Adding a new scraped category = one entry in this file.
 *
 * Usage:
 *   const config = getCategoryConfig(product.category)
 *   const imgSrc  = product.images[0] || config.placeholderUrl
 *   const buyUrl  = cheapest.url || config.buyUrlFallback(product)
 *   const specs   = config.specs.filter(s => product.specifications[s.key])
 */

export interface SpecField {
  key: string        // key in product.specifications JSONB
  label: string      // display label (e.g. 'Kamar Tidur')
  unit?: string      // append after value (e.g. 'm²')
  icon?: string      // emoji prefix
}

export interface CategoryConfig {
  dbLabel: string               // exact match for products.category in DB
  urlSlug: string               // URL param used in /cari?kategori=...
  icon: string                  // emoji icon for headings/badges
  imageStyle: 'contain' | 'cover'  // CSS object-fit for card image
  placeholderUrl: string        // fallback image URL when real image missing
  specs: SpecField[]            // ordered list of specs to show on card & detail
  buyUrlFallback: (product: { name: string; brand?: string; specifications?: Record<string, unknown> }) => string
  isUsedGoods: boolean          // show BEKAS badge, restrict to used-goods platforms
  vehicleCategory?: boolean     // filter listing to vehicle platforms
  propertyCategory?: boolean    // filter listing to property platforms
  forbiddenKeywords?: string[]  // product names containing these terms are excluded from this category
}

const olxVehicleSearch = (query: string) =>
  `https://www.olx.co.id/motor-bekas?q=${encodeURIComponent(query)}`

const olxCarSearch = (query: string) =>
  `https://www.olx.co.id/mobil-bekas?q=${encodeURIComponent(query)}`

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {

  'Motor Bekas': {
    dbLabel: 'Motor Bekas',
    urlSlug: 'motor-bekas',
    icon: '🏍️',
    imageStyle: 'contain',
    placeholderUrl: 'https://placehold.co/400x300/e8f0fe/4a5568?text=Motor+Bekas',
    specs: [
      { key: 'city', label: 'Kota', icon: '📍' },
      { key: 'location', label: 'Lokasi' },
      { key: 'year', label: 'Tahun' },
    ],
    buyUrlFallback: (p) => olxVehicleSearch(p.brand || p.name),
    isUsedGoods: true,
    vehicleCategory: true,
  },

  'Mobil Bekas': {
    dbLabel: 'Mobil Bekas',
    urlSlug: 'mobil-bekas',
    icon: '🚗',
    imageStyle: 'contain',
    placeholderUrl: 'https://placehold.co/400x300/fde8e8/4a5568?text=Mobil+Bekas',
    specs: [
      { key: 'city', label: 'Kota', icon: '📍' },
      { key: 'location', label: 'Lokasi' },
      { key: 'year', label: 'Tahun' },
    ],
    buyUrlFallback: (p) => olxCarSearch(p.brand || p.name),
    isUsedGoods: true,
    vehicleCategory: true,
  },

  'Rumah Bekas': {
    dbLabel: 'Rumah Bekas',
    urlSlug: 'rumah-bekas',
    icon: '🏠',
    imageStyle: 'cover',
    placeholderUrl: 'https://placehold.co/400x300/e8fde8/2d4a2d?text=Rumah+Bekas',
    specs: [
      { key: 'bedrooms', label: 'KT', icon: '🛏' },
      { key: 'bathrooms', label: 'KM', icon: '🚿' },
      { key: 'building_area_m2', label: 'LB', unit: 'm²' },
      { key: 'land_area_m2', label: 'LT', unit: 'm²' },
      { key: 'city', label: 'Kota', icon: '📍' },
    ],
    buyUrlFallback: (p) =>
      `https://www.olx.co.id/properti/rumah?q=${encodeURIComponent((p.specifications?.city as string) || '')}`,
    isUsedGoods: true,
    propertyCategory: true,
  },

  'Tanah Bekas': {
    dbLabel: 'Tanah Bekas',
    urlSlug: 'tanah-bekas',
    icon: '🌍',
    imageStyle: 'cover',
    placeholderUrl: 'https://placehold.co/400x300/fdf5e8/4a3d20?text=Tanah+Bekas',
    specs: [
      { key: 'land_area_m2', label: 'Luas', unit: 'm²', icon: '📐' },
      { key: 'city', label: 'Kota', icon: '📍' },
      { key: 'certificate', label: 'Sertifikat' },
    ],
    buyUrlFallback: (p) =>
      `https://www.olx.co.id/properti/tanah?q=${encodeURIComponent((p.specifications?.city as string) || '')}`,
    isUsedGoods: true,
    propertyCategory: true,
  },

  'Elektronik': {
    dbLabel: 'Elektronik',
    urlSlug: 'elektronik',
    icon: '📱',
    imageStyle: 'contain',
    placeholderUrl: 'https://placehold.co/400x300/e8f0fe/1a3a6e?text=Elektronik',
    specs: [
      { key: 'storage', label: 'Storage' },
      { key: 'ram', label: 'RAM' },
      { key: 'color', label: 'Warna' },
    ],
    buyUrlFallback: (p) =>
      `https://www.tokopedia.com/search?st=product&q=${encodeURIComponent(p.name)}`,
    isUsedGoods: false,
    forbiddenKeywords: ['parfum', 'minyak wangi', 'tasbih', 'jamu ', 'tas ransel', 'tas backpack', 'tas laptop'],
  },

  'Fashion': {
    dbLabel: 'Fashion',
    urlSlug: 'fashion',
    icon: '👗',
    imageStyle: 'cover',
    placeholderUrl: 'https://placehold.co/400x300/fde8f5/4a1a3a?text=Fashion',
    specs: [
      { key: 'size', label: 'Ukuran' },
      { key: 'color', label: 'Warna' },
    ],
    buyUrlFallback: (p) =>
      `https://www.tokopedia.com/search?st=product&q=${encodeURIComponent(p.name)}`,
    isUsedGoods: false,
  },

  'Rumah Tangga': {
    dbLabel: 'Rumah Tangga',
    urlSlug: 'rumah-tangga',
    icon: '🏡',
    imageStyle: 'contain',
    placeholderUrl: 'https://placehold.co/400x300/f0f5e8/2d4a1a?text=Rumah+Tangga',
    specs: [
      { key: 'material', label: 'Material' },
      { key: 'color', label: 'Warna' },
    ],
    buyUrlFallback: (p) =>
      `https://www.tokopedia.com/search?st=product&q=${encodeURIComponent(p.name)}`,
    isUsedGoods: false,
  },

  'Gaming': {
    dbLabel: 'Gaming',
    urlSlug: 'gaming',
    icon: '🎮',
    imageStyle: 'contain',
    placeholderUrl: 'https://placehold.co/400x300/1a1a2e/9b59b6?text=Gaming',
    specs: [
      { key: 'platform', label: 'Platform' },
      { key: 'genre', label: 'Genre' },
    ],
    buyUrlFallback: (p) =>
      `https://www.tokopedia.com/search?st=product&q=${encodeURIComponent(p.name)}`,
    isUsedGoods: false,
  },

  'Kecantikan': {
    dbLabel: 'Kecantikan',
    urlSlug: 'kecantikan',
    icon: '💄',
    imageStyle: 'contain',
    placeholderUrl: 'https://placehold.co/400x300/fde8f5/8b1a4a?text=Kecantikan',
    specs: [
      { key: 'volume', label: 'Volume' },
      { key: 'skin_type', label: 'Jenis Kulit' },
    ],
    buyUrlFallback: (p) =>
      `https://www.tokopedia.com/search?st=product&q=${encodeURIComponent(p.name)}`,
    isUsedGoods: false,
  },

  'Olahraga': {
    dbLabel: 'Olahraga',
    urlSlug: 'olahraga',
    icon: '⚽',
    imageStyle: 'contain',
    placeholderUrl: 'https://placehold.co/400x300/e8f5e8/1a4a1a?text=Olahraga',
    specs: [
      { key: 'size', label: 'Ukuran' },
      { key: 'color', label: 'Warna' },
    ],
    buyUrlFallback: (p) =>
      `https://www.tokopedia.com/search?st=product&q=${encodeURIComponent(p.name)}`,
    isUsedGoods: false,
  },

  'Lainnya': {
    dbLabel: 'Lainnya',
    urlSlug: 'lainnya',
    icon: '📦',
    imageStyle: 'contain',
    placeholderUrl: 'https://placehold.co/400x300/f0f0f0/666666?text=Produk',
    specs: [],
    buyUrlFallback: (p) =>
      `https://www.tokopedia.com/search?st=product&q=${encodeURIComponent(p.name)}`,
    isUsedGoods: false,
  },

}

const DEFAULT_CONFIG: CategoryConfig = {
  dbLabel: '',
  urlSlug: 'lainnya',
  icon: '📦',
  imageStyle: 'contain',
  placeholderUrl: 'https://placehold.co/400x300/f0f0f0/666666?text=Produk',
  specs: [],
  buyUrlFallback: (p) =>
    `https://www.tokopedia.com/search?st=product&q=${encodeURIComponent(p.name)}`,
  isUsedGoods: false,
}

export function getCategoryConfig(category: string | null | undefined): CategoryConfig {
  if (!category) return DEFAULT_CONFIG
  return CATEGORY_CONFIGS[category] ?? DEFAULT_CONFIG
}

export function buildBuyUrl(
  offerUrl: string | null | undefined,
  product: { name: string; brand?: string; category?: string; specifications?: Record<string, unknown> }
): string {
  if (offerUrl) return offerUrl
  const config = getCategoryConfig(product.category)
  return config.buyUrlFallback(product)
}
