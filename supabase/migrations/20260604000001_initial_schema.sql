-- ============================================================
-- harga.com — Initial Schema
-- Migration: 20260604000001_initial_schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- trigram indexes for fuzzy search
CREATE EXTENSION IF NOT EXISTS "unaccent";    -- accent-insensitive search

-- ============================================================
-- 1. MERCHANTS (platforms: Tokopedia, Shopee, Lazada, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS merchants (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT        NOT NULL,
  slug              TEXT        UNIQUE NOT NULL,
  platform_id       TEXT        UNIQUE NOT NULL,  -- 'tokopedia' | 'shopee' | ...
  logo_url          TEXT,
  affiliate_base_url TEXT,
  color             TEXT,                          -- hex color for UI badges
  bg_color          TEXT,                          -- hex light bg color
  cashback_default_pct DECIMAL(4,2) DEFAULT 0,
  active            BOOLEAN     DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE merchants IS 'Marketplace platforms (Tokopedia, Shopee, Lazada, etc.)';

-- ============================================================
-- 2. PRODUCTS (canonical product catalogue, deduplicated)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  slug            TEXT        UNIQUE NOT NULL,
  brand           TEXT,
  category        TEXT,
  subcategory     TEXT,
  description     TEXT,
  image_url       TEXT,
  images          TEXT[]      DEFAULT '{}',
  tags            TEXT[]      DEFAULT '{}',
  specifications  JSONB       DEFAULT '{}',
  average_rating  DECIMAL(3,2),
  total_reviews   INTEGER     DEFAULT 0,
  search_vector   TSVECTOR,   -- full-text search index
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE products IS 'Canonical product catalogue — deduplicated across all platforms';

-- Full-text search index (name + brand + tags + description)
CREATE INDEX IF NOT EXISTS products_search_idx
  ON products USING GIN (search_vector);

-- Trigram index for ILIKE / fuzzy queries
CREATE INDEX IF NOT EXISTS products_name_trgm_idx
  ON products USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS products_slug_idx
  ON products (slug);

CREATE INDEX IF NOT EXISTS products_category_idx
  ON products (category, subcategory);

CREATE INDEX IF NOT EXISTS products_brand_idx
  ON products (brand);

-- Auto-update search_vector trigger
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('indonesian', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('indonesian', COALESCE(NEW.brand, '')), 'B') ||
    setweight(to_tsvector('indonesian', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('simple', array_to_string(COALESCE(NEW.tags, '{}'), ' ')), 'D');
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- ============================================================
-- 3. OFFERS (1 product × 1 merchant = 1 offer row, upserted)
-- ============================================================
CREATE TABLE IF NOT EXISTS offers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  merchant_id     UUID        NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  price           INTEGER     NOT NULL CHECK (price > 0),   -- IDR, stored as integer
  original_price  INTEGER     CHECK (original_price > 0),
  discount_pct    SMALLINT    CHECK (discount_pct BETWEEN 0 AND 100),
  shop_name       TEXT,
  shop_verified   BOOLEAN     DEFAULT FALSE,
  free_shipping   BOOLEAN     DEFAULT FALSE,
  rating          DECIMAL(3,2),
  review_count    INTEGER     DEFAULT 0,
  sold_count      INTEGER     DEFAULT 0,
  stock_count     INTEGER     DEFAULT 0,
  url             TEXT,
  affiliate_url   TEXT,
  in_stock        BOOLEAN     DEFAULT TRUE,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, merchant_id)
);

COMMENT ON TABLE offers IS 'One row per product-merchant pair. Upserted by scraper/feed jobs.';

CREATE INDEX IF NOT EXISTS offers_product_idx  ON offers (product_id);
CREATE INDEX IF NOT EXISTS offers_merchant_idx ON offers (merchant_id);
CREATE INDEX IF NOT EXISTS offers_price_idx    ON offers (price);
CREATE INDEX IF NOT EXISTS offers_in_stock_idx ON offers (in_stock) WHERE in_stock = TRUE;

-- ============================================================
-- 4. PRICE HISTORY (append-only price snapshots)
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id    UUID        NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  price       INTEGER     NOT NULL CHECK (price > 0),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE price_history IS 'Append-only price snapshots — one row per crawl per offer';

CREATE INDEX IF NOT EXISTS price_history_offer_idx
  ON price_history (offer_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS price_history_recorded_idx
  ON price_history (recorded_at DESC);

-- Partition hint: for scale, partition by month. For now, index is sufficient.

-- ============================================================
-- 5. CASHBACK RATES (per merchant, optionally per category)
-- ============================================================
CREATE TABLE IF NOT EXISTS cashback_rates (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID        NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  category    TEXT,                           -- NULL = applies to ALL categories
  rate_percent DECIMAL(4,2) NOT NULL CHECK (rate_percent >= 0 AND rate_percent <= 100),
  valid_from  TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,                    -- NULL = no expiry
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (merchant_id, category)
);

COMMENT ON TABLE cashback_rates IS 'Cashback % per merchant, optionally scoped to a product category';

CREATE INDEX IF NOT EXISTS cashback_rates_merchant_idx ON cashback_rates (merchant_id);

-- ============================================================
-- 6. CLICK TRACKING (affiliate attribution)
-- ============================================================
CREATE TABLE IF NOT EXISTS click_tracking (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id    UUID        REFERENCES offers(id) ON DELETE SET NULL,
  session_id  TEXT,
  user_agent  TEXT,
  ip_hash     TEXT,           -- SHA-256 hash of IP, never store raw IP
  referer     TEXT,
  clicked_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE click_tracking IS 'Affiliate click log for commission attribution';

CREATE INDEX IF NOT EXISTS click_tracking_offer_idx   ON click_tracking (offer_id);
CREATE INDEX IF NOT EXISTS click_tracking_clicked_idx ON click_tracking (clicked_at DESC);

-- ============================================================
-- 7. USERS / WALLET (Phase 2 — auth + cashback)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url  TEXT,
  wallet_balance INTEGER  DEFAULT 0,          -- IDR, stored as integer
  total_earned   INTEGER  DEFAULT 0,
  total_withdrawn INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_profiles IS 'Extended user profile — mirrors auth.users';

CREATE TABLE IF NOT EXISTS watchlist (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  target_price INTEGER,                       -- alert when price drops to this
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS watchlist_user_idx ON watchlist (user_id);

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE merchants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashback_rates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_tracking  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist       ENABLE ROW LEVEL SECURITY;

-- ── Public read (anon + authenticated) ──────────────────────
CREATE POLICY "merchants: public read"
  ON merchants FOR SELECT USING (TRUE);

CREATE POLICY "products: public read"
  ON products FOR SELECT USING (TRUE);

CREATE POLICY "offers: public read"
  ON offers FOR SELECT USING (in_stock = TRUE OR in_stock = FALSE);  -- all offers readable

CREATE POLICY "price_history: public read"
  ON price_history FOR SELECT USING (TRUE);

CREATE POLICY "cashback_rates: public read"
  ON cashback_rates FOR SELECT USING (
    valid_until IS NULL OR valid_until > NOW()
  );

-- ── Click tracking: anon INSERT, no read ────────────────────
CREATE POLICY "click_tracking: anon insert"
  ON click_tracking FOR INSERT WITH CHECK (TRUE);

-- No SELECT policy on click_tracking — only service role can read

-- ── User profiles: own row only ─────────────────────────────
CREATE POLICY "user_profiles: read own"
  ON user_profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "user_profiles: insert own"
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles: update own"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- ── Watchlist: own rows ──────────────────────────────────────
CREATE POLICY "watchlist: read own"
  ON watchlist FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "watchlist: insert own"
  ON watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "watchlist: delete own"
  ON watchlist FOR DELETE USING (auth.uid() = user_id);

-- ── Service role bypass (implicit — service_role bypasses RLS) ──

-- ============================================================
-- 9. HELPER VIEWS
-- ============================================================

-- products_with_best_offer: useful for listing pages
CREATE OR REPLACE VIEW products_with_best_offer AS
SELECT
  p.*,
  o.price         AS best_price,
  o.original_price AS best_original_price,
  o.merchant_id   AS best_merchant_id,
  m.name          AS best_merchant_name,
  m.platform_id   AS best_platform_id,
  m.color         AS best_merchant_color,
  o.affiliate_url AS best_affiliate_url,
  o.free_shipping AS best_free_shipping,
  COUNT(o2.id)    AS offer_count
FROM products p
LEFT JOIN LATERAL (
  SELECT * FROM offers
  WHERE product_id = p.id AND in_stock = TRUE
  ORDER BY price ASC
  LIMIT 1
) o ON TRUE
LEFT JOIN merchants m ON m.id = o.merchant_id
LEFT JOIN offers o2 ON o2.product_id = p.id AND o2.in_stock = TRUE
GROUP BY p.id, o.price, o.original_price, o.merchant_id, m.name, m.platform_id, m.color, o.affiliate_url, o.free_shipping;

-- ============================================================
-- 10. UPDATED_AT auto-trigger for tables that need it
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cashback_rates_updated_at
  BEFORE UPDATE ON cashback_rates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
