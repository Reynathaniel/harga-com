-- alert_notifications: tracks price-alert notifications that have been triggered
-- Prevents duplicate sends for the same alert + product combination

CREATE TABLE IF NOT EXISTS alert_notifications (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id     UUID        NOT NULL REFERENCES price_alerts(id) ON DELETE CASCADE,
  product_id   UUID        REFERENCES products(id) ON DELETE SET NULL,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  sent         BOOLEAN     DEFAULT FALSE,
  channel      TEXT        NOT NULL,
  UNIQUE (alert_id, product_id)
);

ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

-- No public policies — only the service role (used by the check-price-alerts
-- edge function) may read/write this table.

CREATE INDEX IF NOT EXISTS alert_notifications_alert_idx     ON alert_notifications (alert_id);
CREATE INDEX IF NOT EXISTS alert_notifications_triggered_idx ON alert_notifications (triggered_at DESC);
