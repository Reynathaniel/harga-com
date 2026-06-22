/**
 * offers.ts — Data access layer for offers (per-platform prices)
 */

import { tryGetServerClient } from '../supabase'
import { MOCK_PRODUCTS } from '../mock-data'
import { lowestListingFirst } from '../utils'
import type { PriceListing } from '../types'
import type { OfferWithMerchant } from '../database.types'
import { adaptOfferToListing } from './adapters'

// ── getOffersByProduct ──────────────────────────────────────────────

export async function getOffersByProduct(productId: string): Promise<PriceListing[]> {
  const db = tryGetServerClient()

  if (db) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (db as any)
        .from('offers')
        .select('*, merchant:merchants(*)')
        .eq('product_id', productId)
        .order('price', { ascending: true })

      if (error) throw error
      return (data as OfferWithMerchant[]).map(offer => adaptOfferToListing(offer))
    } catch (err) {
      console.error('[db/offers] getOffersByProduct error, falling back to mock:', err)
    }
  }

  const product = MOCK_PRODUCTS.find(p => p.id === productId || p.slug === productId)
  if (!product) return []
  return lowestListingFirst(product.listings)
}

// ── getBestOffer ────────────────────────────────────────────────────

export async function getBestOffer(productId: string): Promise<PriceListing | null> {
  const offers = await getOffersByProduct(productId)
  return offers[0] ?? null
}

// ── getMerchants ─────────────────────────────────────────────────────

export async function getMerchants() {
  const db = tryGetServerClient()

  if (db) {
    try {
      const { data } = await db
        .from('merchants')
        .select('*')
        .eq('active', true)
        .order('cashback_default_pct', { ascending: false })

      if (data) return data
    } catch { /* fall through */ }
  }

  const { PLATFORMS } = await import('../platforms')
  return Object.values(PLATFORMS)
}

// ── logClick ────────────────────────────────────────────────────────

export async function logClick(opts: {
  offerId:   string
  sessionId: string
  userAgent: string
  ipHash:    string
  referer?:  string
}) {
  const db = tryGetServerClient()
  if (!db) return

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).from('click_tracking').insert({
      offer_id:   opts.offerId,
      session_id: opts.sessionId,
      user_agent: opts.userAgent,
      ip_hash:    opts.ipHash,
      referer:    opts.referer ?? null,
    })
  } catch (err) {
    console.error('[db/offers] logClick error (non-critical):', err)
  }
}
