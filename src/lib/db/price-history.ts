/**
 * price-history.ts — Data access layer for price history
 */

import { tryGetServerClient } from '../supabase'
import { MOCK_PRODUCTS } from '../mock-data'
import type { PriceHistory, PlatformId } from '../types'
import { format } from 'date-fns'

// ── getPriceHistory ─────────────────────────────────────────────────

export async function getPriceHistory(
  productId: string,
  days = 30
): Promise<PriceHistory[]> {
  const db = tryGetServerClient()

  if (db) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: offerRows } = await (db as any)
        .from('offers')
        .select('id, merchant:merchants(platform_id)')
        .eq('product_id', productId)

      if (!offerRows || offerRows.length === 0) throw new Error('No offers found')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const offerIds = (offerRows as any[]).map((o: any) => o.id)

      const since = new Date()
      since.setDate(since.getDate() - days)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: history, error } = await (db as any)
        .from('price_history')
        .select('offer_id, price, recorded_at')
        .in('offer_id', offerIds)
        .gte('recorded_at', since.toISOString())
        .order('recorded_at', { ascending: true })

      if (error) throw error

      // Build map: offer_id -> platform_id
      const offerPlatformMap: Record<string, string> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(offerRows as any[]).forEach((o: any) => {
        const merchant = o.merchant
        if (merchant?.platform_id) {
          offerPlatformMap[o.id] = merchant.platform_id
        }
      })

      // Group by day
      const byDay: Record<string, Record<string, number | null>> = {}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(history as any[])?.forEach((row: any) => {
        const day = format(new Date(row.recorded_at), 'yyyy-MM-dd')
        const platformId = offerPlatformMap[row.offer_id]
        if (!platformId) return

        if (!byDay[day]) {
          byDay[day] = {
            tokopedia: null, shopee: null, lazada: null,
            bukalapak: null, blibli: null, tiktok: null,
          }
        }
        byDay[day][platformId] = row.price
      })

      return Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, prices]) => ({
          date: new Date(day),
          prices: prices as Record<PlatformId, number | null>,
        }))
    } catch (err) {
      console.error('[db/price-history] error, falling back to mock:', err)
    }
  }

  // Mock fallback
  const product = MOCK_PRODUCTS.find(p => p.id === productId || p.slug === productId)
  if (!product) return []
  return product.priceHistory.slice(-days)
}

// ── getLowestPriceInPeriod ──────────────────────────────────────────

export async function getLowestPriceInPeriod(
  productId: string,
  days = 30
): Promise<{ price: number; date: Date; platformId: string } | null> {
  const history = await getPriceHistory(productId, days)
  if (!history.length) return null

  let lowest: { price: number; date: Date; platformId: string } | null = null

  history.forEach(h => {
    Object.entries(h.prices).forEach(([pid, price]) => {
      if (price != null && (lowest === null || price < lowest.price)) {
        lowest = { price, date: h.date, platformId: pid }
      }
    })
  })

  return lowest
}
