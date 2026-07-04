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
| `products` | ~2,000+ rows — name, slug, category, brand, images; categories include Elektronik, Fashion, Rumah Tangga, Kecantikan, Gaming, Mobil Bekas, Motor Bekas, Rumah Bekas, Tanah Bekas, Olahraga, Lainnya |
| `offers` | ~16,000+ active rows — product_id, merchant_id, price, discount_pct, free_shipping, shop_verified |
| `merchants` | 17 rows — one per platform (see merchant IDs below) |
| `price_history` | offer_id, price, recorded_at — appended each scrape run |
| `price_alerts` | query, email, target_price, notify_type, active, created_at — user price alert subscriptions |
| `products_with_best_offer` | DB view used for product listing queries |

### Merchant UUIDs (all 17)

| Platform | UUID |
|----------|------|
| tokopedia | `00000000-0000-0000-0000-000000000001` |
| shopee | `00000000-0000-0000-0000-000000000002` |
| lazada | `00000000-0000-0000-0000-000000000003` |
| bukalapak | `00000000-0000-0000-0000-000000000004` |
| blibli | `00000000-0000-0000-0000-000000000005` |
| tiktok | `00000000-0000-0000-0000-000000000006` |
| amazon | `00000000-0000-0000-0000-000000000007` |
| aliexpress | `00000000-0000-0000-0000-000000000008` |
| alibaba | `00000000-0000-0000-0000-000000000009` |
| jd | `00000000-0000-0000-0000-000000000010` |
| olx | `00000000-0000-0000-0000-000000000011` |
| carousell | `00000000-0000-0000-0000-000000000012` |
| carsome | `00000000-0000-0000-0000-000000000013` |
| mobil123 | `00000000-0000-0000-0000-000000000014` |
| momobil | `00000000-0000-0000-0000-000000000015` |
| oto | `00000000-0000-0000-0000-000000000016` |
| belanjamobil | `00000000-0000-0000-0000-000000000017` |

Hardcoded in `src/lib/db/scraper-save.ts` (seeded deterministically).

### Product categories

| Category | Platform(s) | Notes |
|----------|-------------|-------|
| Elektronik, Fashion, Rumah Tangga, Kecantikan, Gaming, Olahraga | Tokopedia, Shopee, Bukalapak, Blibli, etc. | Regular marketplace products |
| Mobil Bekas | OLX, Carousell + vehicle platforms | `condition: used`; auto-restricts to vehicle platforms in `getProducts()` |
| Motor Bekas | OLX, Carousell + vehicle platforms | `condition: used`; same vehicle platform restriction |
| Rumah Bekas | OLX only | `condition: used`; OLX category_id=5158; specs: land_area_m2, building_area_m2, floors, bedrooms, bathrooms, city, certificate |
| Tanah Bekas | OLX only | `condition: used`; OLX category_id=5159; specs: land_area_m2, city, certificate (no building_area_m2) |

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

**Scraper files:**
- `tokopedia.ts`, `shopee.ts`, `bukalapak.ts`, etc. — marketplace scrapers (search by keyword)
- `olx.ts`, `carousell.ts` — vehicle listing scrapers (Motor/Mobil Bekas)
- `olx-property.ts` — property scraper (Rumah Bekas + Tanah Bekas); uses OLX category API, not keyword search

**OLX property scraper (`src/lib/scrapers/olx-property.ts`):**
- API: `https://www.olx.co.id/api/relevance/v4/search?category_id={5158|5159}&location_id=1000&page=N`
- Image CDN: `https://apollo.olx.co.id/v1/files/{FILE_ID}-ID/image;s=644x461` — directly hotlinkable real listing photos
- Constructor: `new OlxPropertyScraper('rumah')` or `new OlxPropertyScraper('tanah')`
- Property params extracted: `p_sqr_land` (luas tanah), `p_sqr_building` (luas bangunan), `p_bedroom`, `p_bathroom`, `p_floor`

Scraping is triggered two ways:
1. **GitHub Actions** — `.github/workflows/scrape.yml` runs `scripts/scrape-cron.mjs` every 4 hours on Node 22 (Node 22 required for native WebSocket used by Supabase realtime)
2. **Vercel cron** — `.github/workflows/scraper-cron.yml` hits the `/api/scraper/cron` endpoint

### Platform filtering in `getProducts()`

`src/lib/db/products.ts` → `getProducts()` automatically restricts platforms based on category:
- **Motor Bekas / Mobil Bekas** → vehicle platforms only: olx, carousell, carsome, mobil123, momobil, oto, belanjamobil
- **Rumah Bekas / Tanah Bekas** → OLX only
- All other categories → no platform restriction (all platforms)

### Photo strategy

| Category | Image source | Notes |
|----------|-------------|-------|
| Rumah Bekas / Tanah Bekas | Real OLX CDN photos (`apollo.olx.co.id`) | Hotlinkable; from actual listings |
| Motor Bekas / Mobil Bekas | Wikipedia reference photos | Stopgap — OLX/Carousell don't expose image URLs in their listing JSON |
| Regular products | Platform CDN (Tokopedia/Shopee/etc.) | From scraper `imageUrl` field |

`scraper-save.ts` allows overwriting Unsplash placeholder URLs with real images on re-scrape.

### Pages & routing

| Route | Type | Notes |
|-------|------|-------|
| `/` | Server Component (`force-dynamic`) | Homepage; fetches popular/promo products from Supabase |
| `/cari` | Server Component (`force-dynamic`) | Search/browse; filters via URL params (`q`, `kategori`, `platform`, `condition`, `sort`, `min`, `max`, `offset`); smart platform filtering (vehicle/property categories auto-restricted) |
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

- Vehicle platform scrapers (Carsome, Mobil123, Momobil, OTO, BelanjaMobil) haven't run yet — vehicle search shows OLX/Carousell real listings only
- Motor/Mobil Bekas listings have no product images — OLX/Carousell don't expose image URLs in their listing JSON; Wikipedia reference photos used as stopgap
- `/alert` stores alerts in `price_alerts` table but no email/WA sending is implemented yet
- Price history chart uses synthetic data when no real `price_history` rows exist for a product (platform-aware, always shows something)
- ~5,700 offers use Tokopedia/Shopee search URLs (`/search?q=`) instead of direct product URLs — "Beli Sekarang" on those opens a search page

## File edit safety

**Critical:** When editing large files (>6KB) via GitHub API, always use Python `base64.b64encode()` + GitHub API PUT with string replacement on the full file content. Never use heredocs or shell `cat >` for large files — they truncate silently. Read the file SHA from GitHub first, then PUT the full modified content back.
