# PROGRESS.md — harga.com Knowledge Base

Last updated: 2026-06-22

## Current Status
- Vercel: deploying (commit 440a286 — fix truncated popular/route.ts)
- Supabase: 2,106 products · 17,997 offers · 9 categories

## Category Breakdown
| Category        | Count |
|-----------------|-------|
| Elektronik      | ~400  |
| Fashion         | ~300  |
| Motor Bekas     | 20    |
| Mobil Bekas     | 25    |
| + 5 others      | rest  |

## Supabase Schema
- `products`: id, name, slug, category, brand, image_url, images, description, average_rating, total_reviews
- `offers`: id, product_id, merchant_id, price, original_price, discount_pct, free_shipping, shop_verified, affiliate_url, condition, updated_at
- `merchants`: 12 rows — UUIDs `00000000-0000-0000-0000-00000000000{1-12}`
  - 01=Tokopedia, 02=Shopee, 03=Lazada, 11=OLX, 12=Carousell
- `products_with_best_offer`: DB view — columns include id, name, slug, brand, category, image_url, images, best_price, total_reviews, best_merchant_id

## Build Fix History
| Issue | Root Cause | Fix |
|-------|-----------|-----|
| SWC `Unexpected token div` | `Record<string,unknown>[]` in .tsx + bad imports | Removed problematic imports; used `typeof import('@/lib/types').Product[]` |
| `click_count` column missing | View has `total_reviews` not `click_count` | Updated popular/route.ts to use `total_reviews` |
| `Unexpected eof` in popular/route.ts | File truncated on GitHub push | Re-pushed complete file (commit 440a286) |

## GitHub
- Repo: `Reynathaniel/harga-com`
- Branch: `main`
- Latest commit: `440a286` — fix truncated popular/route.ts

## Pending Items
- [ ] Wire real price_history to product detail chart (currently synthetic)

## Completed (this session)
- [x] All 186 offers inserted to Supabase (5 batches) — Motor Bekas via OLX/Carousell, others via Tokopedia/Shopee
- [x] Motor Bekas & Mobil Bekas added to CATEGORIES (mock-data.ts) → auto-appear in /cari filter
- [x] Motor Bekas & Mobil Bekas added to CATEGORY_ID_TO_LABEL (products.ts) → DB query maps correctly
- [x] Homepage category row expanded to 8 cards (added 🏍️ Motor Bekas + 🚙 Mobil Bekas)
- [x] `/api/alerts` updated — now handles query-based mode from /alert page, stores to `price_alerts` table
- [x] `/api/waitlist` route created — stores email to `waitlist` table (was 404 before)
- [x] `price_alerts` and `waitlist` tables created in Supabase

## Known Non-Issues
- `adaptOfferToListing()` uses picsum.photos placeholder images (by design for now)
- No test suite exists
