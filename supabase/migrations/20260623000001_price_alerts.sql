-- price_alerts: unauthenticated price alert subscriptions
-- Allows anonymous users to set alerts without requiring sign-in

CREATE TABLE IF NOT EXISTS price_alerts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID        REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT,
  target_price NUMERIC     NOT NULL,
  email        TEXT,
  phone        TEXT,
  query        TEXT,
  notify_type  TEXT        DEFAULT 'email',
  is_active    BOOLEAN     DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_alerts: anon insert"
  ON price_alerts FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "price_alerts: service role select"
  ON price_alerts FOR SELECT USING (TRUE);

CREATE INDEX IF NOT EXISTS price_alerts_product_idx ON price_alerts (product_id);
CREATE INDEX IF NOT EXISTS price_alerts_email_idx   ON price_alerts (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS price_alerts_active_idx  ON price_alerts (is_active) WHERE is_active = TRUE;
