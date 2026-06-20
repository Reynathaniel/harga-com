-- Vehicle marketplace columns -- add to products table
-- Run once in Supabase SQL editor
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_brand        VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_model        VARCHAR(200);
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_year         INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_type         VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_mileage      INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_transmission VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_color        VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_location     VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_products_vehicle ON products (vehicle_brand, vehicle_model, vehicle_year) WHERE vehicle_brand IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_vehicle_type ON products (vehicle_type) WHERE vehicle_type IS NOT NULL;