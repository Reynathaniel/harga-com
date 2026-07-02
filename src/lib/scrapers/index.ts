import type { ScrapeRequest, ScrapeResult, RawListing } from './types'
import { TokopediaScraper } from './tokopedia'
import { ShopeeScraper } from './shopee'
import { TiktokScraper } from './tiktok'
import { LazadaScraper } from './lazada'
import { BukalapakScraper } from './bukalapak'
import { BlibliScraper } from './blibli'
import { AmazonScraper } from './amazon'
import { AlibabaScraper } from './alibaba'
import { AliexpressScraper } from './aliexpress'
import { OlxScraper } from './olx'
import { CarousellScraper } from './carousell'
// Vehicle-specific scrapers
import { CarsomeScraper } from './carsome'
import { Mobil123Scraper } from './mobil123'
import { MomobilScraper } from './momobil'
import { OtoScraper } from './oto'
import { BelanjaMobilScraper } from './belanjamobil'
import { BaseScraper } from './base'

// ──────────────────────────────────────────────────────────────────────────────
// Scraper Registry
// ──────────────────────────────────────────────────────────────────────────────

let _registry: Map<string, BaseScraper> | null = null

function getRegistry(): Map<string, BaseScraper> {
  if (!_registry) {
    const entries: [string, BaseScraper][] = [
      ['tokopedia',  new TokopediaScraper()],
      ['shopee',     new ShopeeScraper()],
      ['tiktok',     new TiktokScraper()],
      ['lazada',     new LazadaScraper()],
      ['bukalapak',  new BukalapakScraper()],
      ['blibli',     new BlibliScraper()],
      ['amazon',     new AmazonScraper()],
      ['alibaba',    new AlibabaScraper()],
      ['aliexpress', new AliexpressScraper()],
      ['olx',          new OlxScraper()],
      ['carousell',    new CarousellScraper()],
      // Vehicle marketplaces
      ['carsome',      new CarsomeScraper()],
      ['mobil123',     new Mobil123Scraper()],
      ['momobil',      new MomobilScraper()],
      ['oto',          new OtoScraper()],
      ['belanjamobil', new BelanjaMobilScraper()],
    ]
    _registry = new Map(entries)
  }
  return _registry
}

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

export interface OrchestrateOptions {
  query: string
  platforms?: string[]          // default: all Indonesian platforms
  limit?: number                // per-platform
  page?: number
  concurrency?: number          // max parallel scrapers (default: 3)
  timeoutMs?: number            // per-platform timeout override
}

export interface OrchestrateResult {
  query: string
  results: ScrapeResult[]
  merged: RawListing[]          // deduped + sorted by price
  totalFound: number
  durationMs: number
  errors: { platformId: string; error: string }[]
}

const INDONESIAN_PLATFORMS = ['tokopedia', 'shopee', 'tiktok', 'lazada', 'blibli', 'bukalapak']
const PLATFORM_INTL = ['amazon', 'aliexpress', 'alibaba', 'jd']
const PLATFORM_USED = ['olx', 'carousell']
const PLATFORM_VEHICLE = ['carsome', 'mobil123', 'momobil', 'oto', 'belanjamobil']
const ALL_PLATFORMS = [...INDONESIAN_PLATFORMS, ...PLATFORM_INTL, ...PLATFORM_USED, ...PLATFORM_VEHICLE]

export async function scrapeAll(opts: OrchestrateOptions): Promise<OrchestrateResult> {
  const start = Date.now()
  const registry = getRegistry()
  const targetPlatforms = opts.platforms ?? INDONESIAN_PLATFORMS
  const concurrency = opts.concurrency ?? 3

  // Run scrapers in batches to limit concurrency
  const allResults: ScrapeResult[] = []
  for (let i = 0; i < targetPlatforms.length; i += concurrency) {
    const batch = targetPlatforms.slice(i, i + concurrency)
    const batchResults = await Promise.allSettled(
      batch.map(platformId => {
        const scraper = registry.get(platformId)
        if (!scraper) {
          return Promise.resolve({
            platformId,
            query: opts.query,
            listings: [],
            totalFound: 0,
            scrapedAt: new Date(),
            durationMs: 0,
            error: `No scraper registered for ${platformId}`,
          } satisfies ScrapeResult)
        }
        const req: ScrapeRequest = {
          query: opts.query,
          platformId,
          limit: opts.limit ?? 30,
          page: opts.page ?? 1,
        }
        return scraper.scrape(req)
      })
    )

    for (const r of batchResults) {
      if (r.status === 'fulfilled') allResults.push(r.value)
      // rejected should be rare — scraper.scrape() catches internally
    }
  }

  // Merge and deduplicate
  const merged = mergeListings(allResults)
  const errors = allResults
    .filter(r => r.error)
    .map(r => ({ platformId: r.platformId, error: r.error! }))

  return {
    query: opts.query,
    results: allResults,
    merged,
    totalFound: merged.length,
    durationMs: Date.now() - start,
    errors,
  }
}

/** Scrape a single platform */
export async function scrapePlatform(platformId: string, query: string, limit = 30): Promise<ScrapeResult> {
  const registry = getRegistry()
  const scraper = registry.get(platformId)
  if (!scraper) {
    return { platformId, query, listings: [], totalFound: 0, scrapedAt: new Date(), durationMs: 0, error: `Unknown platform: ${platformId}` }
  }
  return scraper.scrape({ query, platformId, limit })
}

/** Get all registered platform IDs */
export function getRegisteredPlatforms(): string[] {
  return Array.from(getRegistry().keys())
}

export { INDONESIAN_PLATFORMS, PLATFORM_INTL, PLATFORM_USED, PLATFORM_VEHICLE, ALL_PLATFORMS }
export type { RawListing, ScrapeResult, ScrapeRequest }

// ──────────────────────────────────────────────────────────────────────────────
// Merge helpers
// ─────────────