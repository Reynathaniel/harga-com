/**
 * referral-utils.ts — Helpers untuk sistem sub-affiliate (referral)
 */

import { createHash, randomBytes } from 'crypto'

/**
 * Generate referral code unik: 8 karakter alfanumerik uppercase
 * Contoh: "A3KX92BF"
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // exclude 0/O, 1/I untuk clarity
  const bytes = randomBytes(8)
  return Array.from(bytes)
    .map(b => chars[b % chars.length])
    .join('')
}

/**
 * Hash IP address untuk privacy (SHA-256)
 */
export function hashIp(ip: string): string {
  return createHash('sha256').update(ip + (process.env.IP_HASH_SALT ?? 'harga-salt')).digest('hex')
}

/**
 * Extract IP dari Next.js request headers
 */
export function extractIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  )
}

/**
 * Build referral link untuk user
 * Format: https://harga.com/r/{referralCode}
 * atau untuk share produk: https://harga.com/produk/{id}?ref={referralCode}
 */
export function buildReferralLink(
  referralCode: string,
  productId?: string,
  baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://harga.com'
): string {
  if (productId) {
    return `${baseUrl}/produk/${productId}?ref=${referralCode}`
  }
  return `${baseUrl}/r/${referralCode}`
}

/**
 * Hitung split komisi berdasarkan settings
 */
export function splitCommission(
  grossAmount: number,
  userSharePercent: number // 0–100
): { userAmount: number; ownerAmount: number; userRate: number } {
  const userRate = userSharePercent / 100
  const userAmount  = Math.floor(grossAmount * userRate)
  const ownerAmount = grossAmount - userAmount
  return { userAmount, ownerAmount, userRate }
}

/**
 * Format referral code dari query param (strip non-alphanumeric, uppercase)
 */
export function sanitizeReferralCode(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 12)
}
