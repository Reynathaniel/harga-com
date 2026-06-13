/**
 * format.ts — shared formatting utilities for Harga.com
 * Complements the formatRupiah() in utils.ts with a standard long-form IDR formatter
 * and a discount-percentage formatter.
 */

/**
 * Formats a number as full Indonesian Rupiah.
 * e.g. 1299000 → "Rp 1.299.000"
 */
export function formatIDR(amount: number): string {
  return 'Rp ' + amount.toLocaleString('id-ID')
}

/**
 * Formats a discount percentage.
 * e.g. 15 → "-15%"
 */
export function formatDiscount(pct: number): string {
  return `-${pct}%`
}

/**
 * Formats a savings amount in IDR with a "Hemat" prefix.
 * e.g. 150000 → "Hemat Rp 150.000"
 */
export function formatSavings(amount: number): string {
  return 'Hemat ' + formatIDR(amount)
}
