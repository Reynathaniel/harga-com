import type { Platform } from './types'

export const PLATFORMS: Record<string, Platform> = {
  tokopedia: {
    id: 'tokopedia',
    name: 'Tokopedia',
    shortName: 'Tokped',
    color: '#42b549',
    bgColor: '#e8f5e9',
    logo: '/logos/tokopedia.svg',
    affiliateBase: 'https://tokopedia.com/product/',
    cashbackPct: 5,
  },
  shopee: {
    id: 'shopee',
    name: 'Shopee',
    shortName: 'Shopee',
    color: '#ee4d2d',
    bgColor: '#fce8e4',
    logo: '/logos/shopee.svg',
    affiliateBase: 'https://shopee.co.id/product/',
    cashbackPct: 7,
  },
  lazada: {
    id: 'lazada',
    name: 'Lazada',
    shortName: 'Lazada',
    color: '#0f146d',
    bgColor: '#e8e9f8',
    logo: '/logos/lazada.svg',
    affiliateBase: 'https://lazada.co.id/product/',
    cashbackPct: 6,
  },
  bukalapak: {
    id: 'bukalapak',
    name: 'Bukalapak',
    shortName: 'BL',
    color: '#e31e52',
    bgColor: '#fce4eb',
    logo: '/logos/bukalapak.svg',
    affiliateBase: 'https://bukalapak.com/product/',
    cashbackPct: 4,
  },
  blibli: {
    id: 'blibli',
    name: 'Blibli',
    shortName: 'Blibli',
    color: '#0095da',
    bgColor: '#e0f4fd',
    logo: '/logos/blibli.svg',
    affiliateBase: 'https://blibli.com/product/',
    cashbackPct: 5,
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok Shop',
    shortName: 'TikTok',
    color: '#010101',
    bgColor: '#f0f0f0',
    logo: '/logos/tiktok.svg',
    affiliateBase: 'https://tiktok.com/shop/product/',
    cashbackPct: 8,
  },
}

export const PLATFORM_ORDER: string[] = [
  'tokopedia', 'shopee', 'lazada', 'bukalapak', 'blibli', 'tiktok'
]
