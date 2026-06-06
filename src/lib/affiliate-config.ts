/**
 * affiliate-config.ts — Affiliate program IDs per platform
 *
 * Replace PENDING values with real IDs when accounts are approved.
 * These are injected into affiliate URLs at redirect time.
 */

export interface AffiliateConfig {
  /** Affiliate/partner ID registered with the platform */
  partnerId: string
  /** Campaign/tracking tag appended to URLs */
  campaignTag: string
  /** URL param name for the affiliate ID */
  paramName: string
  /** Whether the affiliate program is live */
  active: boolean
}

export const AFFILIATE_CONFIG: Record<string, AffiliateConfig> = {
  tokopedia: {
    partnerId:   process.env.AFFILIATE_TOKOPEDIA_ID  ?? 'PENDING',
    campaignTag: process.env.AFFILIATE_TOKOPEDIA_TAG ?? 'hargacom',
    paramName:   'aff_id',
    active:      false,
  },
  shopee: {
    partnerId:   process.env.AFFILIATE_SHOPEE_ID  ?? 'PENDING',
    campaignTag: process.env.AFFILIATE_SHOPEE_TAG ?? 'hargacom',
    paramName:   'af_id',
    active:      false,
  },
  lazada: {
    partnerId:   process.env.AFFILIATE_LAZADA_ID  ?? 'PENDING',
    campaignTag: process.env.AFFILIATE_LAZADA_TAG ?? 'hargacom',
    paramName:   'aff_id',
    active:      false,
  },
  bukalapak: {
    partnerId:   process.env.AFFILIATE_BUKALAPAK_ID  ?? 'PENDING',
    campaignTag: process.env.AFFILIATE_BUKALAPAK_TAG ?? 'hargacom',
    paramName:   'aff_source',
    active:      false,
  },
  blibli: {
    partnerId:   process.env.AFFILIATE_BLIBLI_ID  ?? 'PENDING',
    campaignTag: process.env.AFFILIATE_BLIBLI_TAG ?? 'hargacom',
    paramName:   'aff_id',
    active:      false,
  },
  tiktok: {
    partnerId:   process.env.AFFILIATE_TIKTOK_ID  ?? 'PENDING',
    campaignTag: process.env.AFFILIATE_TIKTOK_TAG ?? 'hargacom',
    paramName:   'affiliate_id',
    active:      false,
  },
}

/**
 * Appends affiliate tracking params to a URL.
 * Returns the original URL unchanged if config is not active or URL is invalid.
 */
export function buildAffiliateUrl(rawUrl: string, platformId: string): string {
  const config = AFFILIATE_CONFIG[platformId]
  if (!config || !config.active || config.partnerId === 'PENDING') {
    return rawUrl
  }

  try {
    const url = new URL(rawUrl)
    url.searchParams.set(config.paramName, config.partnerId)
    url.searchParams.set('utm_source', 'harga.com')
    url.searchParams.set('utm_medium', 'affiliate')
    url.searchParams.set('utm_campaign', config.campaignTag)
    return url.toString()
  } catch {
    return rawUrl
  }
}
