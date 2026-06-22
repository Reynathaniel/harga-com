# Local Scraper — Shopee & TikTok Shop

## Why local scraping?

Shopee and TikTok Shop block requests from cloud/datacenter IPs (Vercel, AWS, etc.).  
Running these scripts on your own Windows machine uses your **residential IP**, which both platforms allow.

---

## Prerequisites

1. Node.js 18+ installed
2. `.env.local` in project root with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
3. `@supabase/supabase-js` in `node_modules` (already in `package.json` — run `npm install` once)

---

## Single-query scraper

```bash
# Shopee only
node scripts/scrape-local.mjs --platform shopee --query "iphone 16" --limit 40

# TikTok Shop only
node scripts/scrape-local.mjs --platform tiktok --query "samsung" --limit 20

# Both platforms
node scripts/scrape-local.mjs --platform all --query "laptop" --limit 40

# Multiple keywords in one run
node scripts/scrape-local.mjs --platform shopee --queries "iphone,samsung,laptop,airpods" --limit 20

# Dry run (scrape but don't write to Supabase)
node scripts/scrape-local.mjs --platform shopee --query "test" --dry-run
```

Output:
```
[Shopee] iphone 16 → 40 results → saved: {"upserted":38,"skipped":0,"errors":2}
[Tiktok] iphone 16 → 18 results → saved: {"upserted":17,"skipped":0,"errors":1}
```

---

## Batch scraper (all default keywords)

```bash
node scripts/scrape-batch.mjs
```

Default keywords: `iphone`, `samsung galaxy`, `laptop`, `airpods`, `headphone sony`, `sepatu nike`, `baju pria`, `tas wanita`, `kulkas`, `TV LED`

Options:
```bash
# Custom keywords
node scripts/scrape-batch.mjs --keywords "xiaomi,oppo,vivo"

# Shopee only, higher limit
node scripts/scrape-batch.mjs --platform shopee --limit 40

# Dry run
node scripts/scrape-batch.mjs --dry-run
```

---

## Adding more keywords

**Option A** — pass via CLI:
```bash
node scripts/scrape-local.mjs --platform all --queries "keyword1,keyword2,keyword3" --limit 20
```

**Option B** — edit `DEFAULT_KEYWORDS` in `scripts/scrape-batch.mjs`:
```js
const DEFAULT_KEYWORDS = [
  'iphone',
  'your new keyword',
  // ...
]
```

---

## Checking results in Supabase

1. Open your Supabase project → **Table Editor**
2. Check `products`, `offers`, and `price_history` tables
3. Or run SQL:
   ```sql
   SELECT p.name, o.price, o.shop_name, m.name as platform
   FROM offers o
   JOIN products p ON p.id = o.product_id
   JOIN merchants m ON m.id = o.merchant_id
   WHERE m.name IN ('shopee', 'tiktok')
   ORDER BY o.updated_at DESC
   LIMIT 50;
   ```

---

## When Shopee/TikTok block the scraper

Both platforms occasionally rotate their anti-bot rules. If you see `0 results` or HTTP errors:

1. **Wait 10–30 min** and retry — rate limits reset
2. **Try `--limit 10`** (smaller requests are less suspicious)
3. **Check your IP** hasn't been temporarily flagged — connect to a different WiFi network
4. **Shopee**: verify the API endpoint is still `shopee.co.id/api/v4/search/search_items`
5. **TikTok**: primary endpoint is `shop.tiktok.com/api/search`, fallback is `affiliate.tiktok.com/connection/product/search`

---

## Notes

- Scripts are pure ESM (`.mjs`), no TypeScript compile step needed
- Rate limits: Shopee ~1.5s between requests, TikTok ~2s
- All prices stored in IDR
- Video URLs and thumbnails are stored as CDN links (no file downloads)
