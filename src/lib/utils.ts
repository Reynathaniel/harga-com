import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number, compact = false): string {
  // Always show full numbers with dot-separator (Indonesian: Rp 848.000)
  // compact=true only abbreviates for amounts >= 1 billion
  if (compact && amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1).replace('.', ',')} M`
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}rb`
  return String(n)
}

export function priceDiffPercent(a: number, b: number): number {
  return Math.min(Math.round(((b - a) / b) * 100), 80)
}

export function lowestListingFirst<T extends { price: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => a.price - b.price)
}

export function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms = 300) {
  let timeout: ReturnType<typeof setTimeout>
  return function (...args: Parameters<T>) {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), ms)
  }
}

/**
 * Cleans marketplace product names by removing promotional prefixes, 
 * brackets, and keyword-stuffed noise common in Indonesian marketplace listings.
 */
export function cleanProductName(name: string): string {
  return name
    // Remove bracket prefixes: [Pre Order], [Pengiriman 2 Jul], [Free Ongkir], etc.
    .replace(/^\[.*?\]\s*/i, '')
    // Remove common promo prefixes — order matters: strip viral/trending words FIRST
    // so compound names like 'Trending Buy 1 Get 2 X' get fully cleaned
    .replace(/^(?:Trending|Viral|Terlaris|Best Seller|Hot)\s+/i, '')
    .replace(/^(?:Buy|Beli)\s+\d+\s+(?:Get|Dapat)\s+\d+\s*/i, '')
    .replace(/^(?:NEW|BARU|TERBARU|RESMI|OFFICIAL)\s+/i, '')
    // Strip [Pre-Order] / [PO] anywhere
    .replace(/\[Pre.?Order\]\s*/gi, '')
    .replace(/\[Pengiriman[^\]]*\]\s*/gi, '')
    .replace(/\[.*?Official.*?\]\s*/gi, '')
    // Clean excess whitespace and commas
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    // Strip trailing punctuation that scraper sometimes leaves
    .replace(/[\s\-\u2013\u2014,|]+$/, '')
    .trim()
    // Truncate very long names at a word boundary
    .slice(0, 120).replace(/\s\S*$/, '')
}

