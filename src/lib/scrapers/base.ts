import type { RawListing, ScrapeRequest, ScrapeResult, ScraperConfig } from './types'

// ──────────────────────────────────────────────────────────────────────────────
// Base Scraper — all platform scrapers extend this
// ──────────────────────────────────────────────────────────────────────────────

const DEFAULT_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
]

export abstract class BaseScraper {
  protected config: ScraperConfig
  private requestCount = 0
  private lastRequestAt = 0

  constructor(config: Partial<ScraperConfig> & Pick<ScraperConfig, 'platformId' | 'baseUrl' | 'searchPath'>) {
    this.config = {
      rateLimit: 1500,
      maxRetries: 3,
      timeout: 15_000,
      userAgents: DEFAULT_USER_AGENTS,
      ...config,
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async scrape(req: ScrapeRequest): Promise<ScrapeResult> {
    const start = Date.now()
    try {
      const listings = await this.search(req)
      return {
        platformId: this.config.platformId,
        query: req.query,
        listings,
        totalFound: listings.length,
        scrapedAt: new Date(),
        durationMs: Date.now() - start,
      }
    } catch (err) {
      return {
        platformId: this.config.platformId,
        query: req.query,
        listings: [],
        totalFound: 0,
        scrapedAt: new Date(),
        durationMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  // ── Abstract — platform scrapers implement these ────────────────────────────

  protected abstract search(req: ScrapeRequest): Promise<RawListing[]>
  protected abstract parseProduct(raw: unknown): RawListing | null

  // ── Helpers ─────────────────────────────────────────────────────────────────

  protected async fetchJson<T = unknown>(
    url: string,
    options: RequestInit = {},
    retries = 0,
  ): Promise<T> {
    await this.throttle()
    const ua = this.config.userAgents[this.requestCount % this.config.userAgents.length]
    this.requestCount++

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': ua,
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          Referer: this.config.baseUrl,
          ...this.config.headers,
          ...options.headers,
        },
      })

      if (!res.ok) {
        if (res.status === 429 && retries < this.config.maxRetries) {
          const backoff = Math.pow(2, retries) * 1000
          await sleep(backoff)
          return this.fetchJson<T>(url, options, retries + 1)
        }
        throw new Error(`HTTP ${res.status}: ${url}`)
      }

      return res.json() as T
    } catch (err) {
      if (retries < this.config.maxRetries && !(err instanceof DOMException)) {
        await sleep(Math.pow(2, retries) * 500)
        return this.fetchJson<T>(url, options, retries + 1)
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }

  protected async fetchHtml(url: string, options: RequestInit = {}): Promise<string> {
    await this.throttle()
    const ua = this.config.userAgents[this.requestCount % this.config.userAgents.length]
    this.requestCount++

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': ua,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
          Referer: this.config.baseUrl,
          ...this.config.headers,
          ...options.headers,
        },
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
      return res.text()
    } finally {
      clearTimeout(timer)
    }
  }

  /** Rate-limit: ensure at least `config.rateLimit` ms between requests */
  private async throttle(): Promise<void> {
    const now = Date.now()
    const elapsed = now - this.lastRequestAt
    if (elapsed < this.config.rateLimit) {
      await sleep(this.config.rateLimit - elapsed)
    }
    this.lastRequestAt = Date.now()
  }

  /** Extract a numeric price from strings like "Rp 1.200.000", "$9.99", "200,000" */
  protected parsePrice(raw: string | number): number {
    if (typeof raw === 'number') return Math.round(raw)
    const cleaned = String(raw)
      .replace(/[^\d.,]/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
    return Math.round(parseFloat(cleaned)) || 0
  }

  /** Clean product name — strip excess whitespace, HTML entities */
  protected cleanTitle(raw: string): string {
    return raw
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#039;/g, "'")
      .replace(/\s+/g, ' ').trim()
  }

  /** Safe get a nested property from unknown JSON */
  protected get<T>(obj: unknown, path: string, fallback: T): T {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parts = path.split('.')
      let cur: any = obj
      for (const p of parts) {
        cur = cur?.[p]
        if (cur === undefined || cur === null) return fallback
      }
      return cur as T
    } catch {
      return fallback
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}
