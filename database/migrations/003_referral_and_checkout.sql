-- ============================================================
-- Migration 003: Sub-Affiliate (Referral) System + Direct Purchase
-- harga.com
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Extend user_profiles ───────────────────────────────────────
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS referral_code    VARCHAR(12)    UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_earned     DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Auto-generate referral code untuk existing users yang belum punya
UPDATE user_profiles
SET referral_code = UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE referral_code IS NULL;

-- ── 2. commission_settings ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commission_settings (
  id                  UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  user_share_percent  DECIMAL(5, 2)  NOT NULL DEFAULT 50.00,
  owner_share_percent DECIMAL(5, 2)  NOT NULL DEFAULT 50.00,
  min_payout          DECIMAL(12, 2) NOT NULL DEFAULT 50000.00,
  notes               TEXT,
  updated_by          UUID           REFERENCES user_profiles(id),
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT pct_sum_check CHECK (user_share_percent + owner_share_percent = 100)
);

-- Default 50/50
INSERT INTO commission_settings (user_share_percent, owner_share_percent, notes)
VALUES (50.00, 50.00, 'Default split — update via /api/admin/commission-settings')
ON CONFLICT DO NOTHING;

-- ── 3. referral_clicks ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_clicks (
  id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_code VARCHAR(12)  NOT NULL,
  user_id       UUID         REFERENCES user_profiles(id) ON DELETE SET NULL,
  product_id    UUID         REFERENCES products(id)      ON DELETE SET NULL,
  platform      VARCHAR(50),
  offer_id      UUID         REFERENCES offers(id)        ON DELETE SET NULL,
  ip_hash       VARCHAR(64),
  user_agent    TEXT,
  referer       TEXT,
  converted     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ref_clicks_code    ON referral_clicks(referral_code);
CREATE INDEX IF NOT EXISTS idx_ref_clicks_user_id ON referral_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_ref_clicks_date    ON referral_clicks(created_at DESC);

-- ── 4. referral_commissions ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_commissions (
  id                UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID           NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  referral_click_id UUID           REFERENCES referral_clicks(id) ON DELETE SET NULL,
  product_id        UUID           REFERENCES products(id) ON DELETE SET NULL,
  platform          VARCHAR(50),
  -- Gross affiliate commission harga.com dapat dari platform
  amount_gross      DECIMAL(12, 2) NOT NULL,
  platform_rate     DECIMAL(7, 6)  NOT NULL,  -- mis: 0.05 = 5%
  -- Split ke user
  user_rate         DECIMAL(7, 6)  NOT NULL,  -- mis: 0.50 = 50% dari gross
  user_amount       DECIMAL(12, 2) NOT NULL,
  owner_amount      DECIMAL(12, 2) NOT NULL,
  -- Status lifecycle
  status            VARCHAR(20)    NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  notes             TEXT,
  approved_at       TIMESTAMPTZ,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ref_comm_user_id ON referral_commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_ref_comm_status  ON referral_commissions(status);
CREATE INDEX IF NOT EXISTS idx_ref_comm_date    ON referral_commissions(created_at DESC);

-- ── 5. checkout_intents ───────────────────────────────────────────
-- Tracks "Beli di Harga.com" clicks sebelum redirect ke platform
CREATE TABLE IF NOT EXISTS checkout_intents (
  id            UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id    UUID         REFERENCES products(id)  ON DELETE SET NULL,
  offer_id      UUID         REFERENCES offers(id)    ON DELETE SET NULL,
  platform      VARCHAR(50),
  referral_code VARCHAR(12),                         -- siapa yang share link ini
  session_id    VARCHAR(255),
  ip_hash       VARCHAR(64),
  affiliate_url TEXT,
  converted     BOOLEAN      NOT NULL DEFAULT FALSE, -- set true jika user balik (pixel/postback)
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkout_product ON checkout_intents(product_id);
CREATE INDEX IF NOT EXISTS idx_checkout_date    ON checkout_intents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkout_ref     ON checkout_intents(referral_code);

-- ── 6. RLS Policies ───────────────────────────────────────────────
-- Enable RLS
ALTER TABLE referral_clicks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_intents     ENABLE ROW LEVEL SECURITY;

-- referral_clicks: user bisa lihat klik miliknya sendiri
CREATE POLICY "users_view_own_clicks" ON referral_clicks
  FOR SELECT USING (user_id = auth.uid());

-- referral_commissions: user bisa lihat komisi miliknya sendiri
CREATE POLICY "users_view_own_commissions" ON referral_commissions
  FOR SELECT USING (user_id = auth.uid());

-- commission_settings: semua authenticated user bisa baca, hanya service role yang bisa ubah
CREATE POLICY "anon_read_commission_settings" ON commission_settings
  FOR SELECT USING (true);

-- checkout_intents: service role only (inserted from API)

-- ── 7. Helper function: generate referral code ────────────────────
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate referral_code saat insert user_profiles baru
DROP TRIGGER IF EXISTS trg_gen_referral_code ON user_profiles;
CREATE TRIGGER trg_gen_referral_code
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- ── 8. Updated_at auto-update trigger ─────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_commission_settings_updated_at ON commission_settings;
CREATE TRIGGER trg_commission_settings_updated_at
  BEFORE UPDATE ON commission_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_referral_commissions_updated_at ON referral_commissions;
CREATE TRIGGER trg_referral_commissions_updated_at
  BEFORE UPDATE ON referral_commissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
