# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at localhost:3000
npm run build      # Production build
npm run lint       # ESLint via next lint
```

No test suite exists yet.

## Architecture

### Stack
- **Next.js 14 App Router** (TypeScript) deployed on **Vercel**
- **Supabase** (PostgreSQL) for products, offers, price history
- **Tailwind CSS** + inline styles (mixed pattern — existing pages use inline styles heavily)
- No state management library in use (no Zustand wired up despite being installed)

### Data flow: Supabase-first with mock fallback

Every data-access function in `src/lib/db/` calls `tryGetServerClient()` first. If Supabase is unreachable or unconfigured, it falls back to in-memory data from `src/lib/mock-data.ts`. This pattern appears in `getProducts`, `getProductBySlug`, `getCategories`, etc.

```
Server Component / API Route
  → src/lib/db/products.ts       (getProducts, getProductBySlug, ...)
      → tryGetServerClient()      ← service-role key, bypasses RLS
          Supabase view: products_with_best_offer
          Tables: products, offers, merchants, price_history
      → fallback: src/lib/mock-data.ts
  → src/lib/db/adapters.ts       (converts DB rows → Product type)
```

The canonical app type is `Product` in `src/lib/types.ts`. DB rows are converted via `adaptDbProductToAppProduct()` in `adapters.ts`.

### Supabase schema (key tables)

| Table | Purpose |
|-------|---------|
| `products` | 2,935 rows — name, slug, category, brand, images |
| `offers` | 16,176 active rows — product_id, merchant_id, price, discount_pct, free_shipping, shop_verified |
| `merchants` | 17 rows — one per platform (tokopedia, shopee, lazada, …, carsome, mobil123, oto, momobil, belanjakendaraan) |
| `price_history` | offer_id, price, recorded_at — appended each scrape run |
| `price_alerts` | query, email, target_price, notify_type, active, created_at — user price alert subscriptions |
| `products_with_best_offer` | DB view used for product listing queries |

Merchant UUIDs are hardcoded in `src/lib/db/scraper-save.ts` (seeded deterministically: `00000000-0000-0000-0000-00000000000{1-17}`).

### Supabase clients

```ts
// src/lib/supabase.ts
tryGetServerClient()   // server-side only (service role, bypasses RLS)
tryGetBrowserClient()  // client-side (anon key, respects RLS)
getServerClient()      // throws if SUPABASE_SERVICE_ROLE_KEY unset
getBrowserClient()     // throws if NEXT_PUBLIC_SUPABASE_ANON_KEY unset
```

Both clients use an 8-second fetch timeout to avoid hanging Vercel builds.

### Scraper architecture

`src/lib/scrapers/` contains one class per platform, all extending `BaseScraper` (`base.ts`). Each implements `search()` and `parseProduct()`. Results are persisted via `src/lib/db/scraper-save.ts` which upserts products/offers and appends price_history rows only when the price changed.

Scraping is triggered two ways:
1. **GitHub Actions** — `.github/workflows/scrape.yml` runs `scripts/scrape-cron.mjs` every 4 hours on Node 22 (Node 22 required for native WebSocket used by Supabase realtime)
2. **Vercel cron** — `.github/workflows/scraper-cron.yml` hits the `/api/scraper/cron` endpoint

### Pages & routing

| Route | Type | Notes |
|-------|------|-------|
| `/` | Server Component (`force-dynamic`) | Homepage; fetches popular/promo products from Supabase |
| `/cari` | Server Component (`force-dynamic`) | Search/browse; filters via URL params (`q`, `kategori`, `platform`, `condition`, `sort`, `min`, `max`, `offset`); smart platform filtering (vehicle categories show only vehicle platforms) |
| `/produk/[id]` | Server Component (ISR 300s) | Product detail; accepts slug or UUID; full openGraph/Twitter metadata |
| `/alert` | Client Component | Price alert form; persists to Supabase `price_alerts` table via `/api/alerts` |
| `/cashback` | Server Component | Cashback info page; reads from `src/lib/platforms.ts` |
| `/r/[code]` | Referral redirect | |
| `/referral` | Referral dashboard | |

### API routes

All API routes are under `src/app/api/`. Middleware (`src/middleware.ts`) applies to all `/api/*`: CORS headers + in-memory rate limiting (60 req/min per IP).

Key routes:
- `GET /api/live-drops` — real price drops via Supabase RPC `get_live_drops()` (5-min cache); falls back to hardcoded data if fewer than 3 real drops
- `GET /api/products/[slug]` — single product JSON
- `POST /api/alerts` — save price alert to `price_alerts` table; supports query-mode `{query, email, targetPrice, notifyType}` and product-mode `{productId, email, targetPrice, notifyType}`
- `POST /api/track/click` — affiliate click tracking
- `POST /api/checkout/initiate` — records checkout intent in `checkout_intents` table

### Styling conventions

- CSS variables are defined in `src/app/globals.css` (e.g., `--brand`, `--bg-primary`, `--text-primary`, `--border`, `--win`)
- `--brand` is the coral/amber accent color used for all CTAs
- Most components use inline `style={{ ... }}` with CSS variables rather than Tailwind classes
- `src/lib/utils.ts` exports `cn()` (clsx + tailwind-merge) but it's rarely used
- The `ticker-dark` CSS class (in globals.css) is used for the LiveBar strip at the top

### Platform config

`src/lib/platforms.ts` exports `PLATFORMS` (keyed by platform ID), `PLATFORM_ORDER`, `PLATFORM_PRIMARY`, `PLATFORM_INTL`, and `PLATFORM_VEHICLE`. 17 platforms total. Platform cashback percentages are defined here and used across the app.

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL          # public, used by both client + server
NEXT_PUBLIC_SUPABASE_ANON_KEY     # public, browser client
SUPABASE_SERVICE_ROLE_KEY         # secret, server only
SUPABASE_DB_PASSWORD              # secret, direct DB connection only
CORS_ORIGIN                       # optional, defaults to "*"
```

Local: copy values from `.env.local`. On Vercel, these must be set in project environment variables.

## Known issues / incomplete areas

- Vehicle platform scrapers (Carsome, Mobil123, Momobil, OTO, BelanjaMobil) haven't run yet — vehicle search shows OLX/Carousell real listings + Tokopedia/Shopee bulk-imported vehicle products
- `/alert` sends notifications via email/WA UI only — no actual sending logic (stored in DB, trigger not implemented)
- Price history chart uses synthetic data when no real `price_history` rows exist for a product (synthetic is now platform-aware and always shows something)

## File edit safety

**Critical:** When editing large files (>6KB) via GitHub API, always use Python `base64.b64encode()` + GitHub API PUT with string replacement on the full file content. Never use heredocs or shell `cat >` for large files — they truncate silently. Read the file SHA from GitHub first, then PUT the full modified content back.
