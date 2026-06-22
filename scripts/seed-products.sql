-- ============================================================
-- harga.com — Comprehensive product seed
-- Run in Supabase SQL editor
-- Covers: Otomotif, Fashion, Rumah Tangga, Kecantikan
-- ============================================================

-- ── 1. Ensure vehicle columns exist ──────────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_brand        VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_model        VARCHAR(200);
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_year         INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_type         VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_mileage      INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_transmission VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_color        VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS vehicle_location     VARCHAR(100);

-- ── 2. Used cars (Otomotif / mobil) ──────────────────────────────────────────
INSERT INTO products (slug, name, brand, category, image_url, images, tags, specifications, vehicle_brand, vehicle_model, vehicle_year, vehicle_type, vehicle_mileage, vehicle_transmission, vehicle_color, vehicle_location, updated_at)
VALUES

-- Toyota Avanza 2020 — 5 variants
('toyota-avanza-1-3-g-mt-2020-silver-jkt', 'Toyota Avanza 1.3 G Manual 2020 Silver Jakarta', 'Toyota', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Toyota+Avanza+2020',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Toyota+Avanza+2020'],
 ARRAY['toyota','avanza','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1300","seats":7}'::jsonb,
 'Toyota','Avanza',2020,'mobil',45000,'Manual','Silver','Jakarta Selatan', NOW()),

('toyota-avanza-1-3-g-mt-2020-putih-bks', 'Toyota Avanza 1.3 G Manual 2020 Putih Bekasi', 'Toyota', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Toyota+Avanza+2020',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Toyota+Avanza+2020'],
 ARRAY['toyota','avanza','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1300","seats":7}'::jsonb,
 'Toyota','Avanza',2020,'mobil',38000,'Manual','Putih','Bekasi', NOW()),

('toyota-avanza-1-3-veloz-at-2020-hitam-bdg', 'Toyota Avanza Veloz 1.5 AT 2020 Hitam Bandung', 'Toyota', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Toyota+Avanza+2020',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Toyota+Avanza+2020'],
 ARRAY['toyota','avanza veloz','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1500","seats":7}'::jsonb,
 'Toyota','Avanza Veloz',2020,'mobil',52000,'Otomatis','Hitam','Bandung', NOW()),

('toyota-avanza-1-3-g-mt-2020-abu-tng', 'Toyota Avanza 1.3 G Manual 2020 Abu-abu Tangerang', 'Toyota', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Toyota+Avanza+2020',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Toyota+Avanza+2020'],
 ARRAY['toyota','avanza','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1300","seats":7}'::jsonb,
 'Toyota','Avanza',2020,'mobil',60000,'Manual','Abu-abu','Tangerang', NOW()),

('toyota-avanza-1-3-e-mt-2020-merah-sby', 'Toyota Avanza 1.3 E Manual 2020 Merah Surabaya', 'Toyota', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Toyota+Avanza+2020',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Toyota+Avanza+2020'],
 ARRAY['toyota','avanza','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1300","seats":7}'::jsonb,
 'Toyota','Avanza',2020,'mobil',55000,'Manual','Merah','Surabaya', NOW()),

-- Honda Brio 2021 — 4 variants
('honda-brio-satya-e-cvt-2021-putih-jkt', 'Honda Brio Satya E CVT 2021 Putih Jakarta', 'Honda', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Brio+2021',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Brio+2021'],
 ARRAY['honda','brio','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1200","seats":5}'::jsonb,
 'Honda','Brio Satya',2021,'mobil',28000,'CVT','Putih','Jakarta Pusat', NOW()),

('honda-brio-satya-e-mt-2021-silver-dpk', 'Honda Brio Satya E Manual 2021 Silver Depok', 'Honda', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Brio+2021',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Brio+2021'],
 ARRAY['honda','brio','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1200","seats":5}'::jsonb,
 'Honda','Brio Satya',2021,'mobil',32000,'Manual','Silver','Depok', NOW()),

('honda-brio-rs-cvt-2021-merah-bdg', 'Honda Brio RS CVT 2021 Merah Bandung', 'Honda', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Brio+2021',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Brio+2021'],
 ARRAY['honda','brio rs','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1200","seats":5}'::jsonb,
 'Honda','Brio RS',2021,'mobil',20000,'CVT','Merah','Bandung', NOW()),

('honda-brio-satya-s-mt-2021-hitam-sby', 'Honda Brio Satya S Manual 2021 Hitam Surabaya', 'Honda', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Brio+2021',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Brio+2021'],
 ARRAY['honda','brio','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1200","seats":5}'::jsonb,
 'Honda','Brio Satya',2021,'mobil',40000,'Manual','Hitam','Surabaya', NOW()),

-- Daihatsu Xenia 2019 — 4 variants
('daihatsu-xenia-1-3-r-at-2019-silver-jkt', 'Daihatsu Xenia 1.3 R AT 2019 Silver Jakarta', 'Daihatsu', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Daihatsu+Xenia+2019',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Daihatsu+Xenia+2019'],
 ARRAY['daihatsu','xenia','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1300","seats":7}'::jsonb,
 'Daihatsu','Xenia',2019,'mobil',65000,'Otomatis','Silver','Jakarta Barat', NOW()),

('daihatsu-xenia-1-0-m-mt-2019-putih-bks', 'Daihatsu Xenia 1.0 M Manual 2019 Putih Bekasi', 'Daihatsu', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Daihatsu+Xenia+2019',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Daihatsu+Xenia+2019'],
 ARRAY['daihatsu','xenia','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1000","seats":7}'::jsonb,
 'Daihatsu','Xenia',2019,'mobil',72000,'Manual','Putih','Bekasi', NOW()),

('daihatsu-xenia-1-3-x-at-2019-hitam-tng', 'Daihatsu Xenia 1.3 X AT 2019 Hitam Tangerang', 'Daihatsu', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Daihatsu+Xenia+2019',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Daihatsu+Xenia+2019'],
 ARRAY['daihatsu','xenia','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1300","seats":7}'::jsonb,
 'Daihatsu','Xenia',2019,'mobil',58000,'Otomatis','Hitam','Tangerang', NOW()),

('daihatsu-xenia-1-3-r-mt-2019-abu-bgr', 'Daihatsu Xenia 1.3 R Manual 2019 Abu-abu Bogor', 'Daihatsu', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Daihatsu+Xenia+2019',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Daihatsu+Xenia+2019'],
 ARRAY['daihatsu','xenia','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1300","seats":7}'::jsonb,
 'Daihatsu','Xenia',2019,'mobil',80000,'Manual','Abu-abu','Bogor', NOW()),

-- Suzuki Ertiga 2020 — 3 variants
('suzuki-ertiga-gl-mt-2020-putih-jkt', 'Suzuki Ertiga GL Manual 2020 Putih Jakarta', 'Suzuki', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Suzuki+Ertiga+2020',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Suzuki+Ertiga+2020'],
 ARRAY['suzuki','ertiga','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1462","seats":7}'::jsonb,
 'Suzuki','Ertiga',2020,'mobil',48000,'Manual','Putih','Jakarta Timur', NOW()),

('suzuki-ertiga-gx-at-2020-silver-bdg', 'Suzuki Ertiga GX AT 2020 Silver Bandung', 'Suzuki', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Suzuki+Ertiga+2020',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Suzuki+Ertiga+2020'],
 ARRAY['suzuki','ertiga','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1462","seats":7}'::jsonb,
 'Suzuki','Ertiga',2020,'mobil',55000,'Otomatis','Silver','Bandung', NOW()),

('suzuki-ertiga-sport-at-2020-hitam-sby', 'Suzuki Ertiga Sport AT 2020 Hitam Surabaya', 'Suzuki', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Suzuki+Ertiga+2020',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Suzuki+Ertiga+2020'],
 ARRAY['suzuki','ertiga sport','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1462","seats":7}'::jsonb,
 'Suzuki','Ertiga Sport',2020,'mobil',42000,'Otomatis','Hitam','Surabaya', NOW()),

-- Honda CR-V 2019 — 3 variants
('honda-crv-1-5-turbo-at-2019-putih-jkt', 'Honda CR-V 1.5 Turbo AT 2019 Putih Jakarta', 'Honda', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+CRV+2019',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+CRV+2019'],
 ARRAY['honda','cr-v','suv','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1500","seats":5}'::jsonb,
 'Honda','CR-V',2019,'mobil',45000,'Otomatis','Putih','Jakarta Selatan', NOW()),

('honda-crv-2-0-prestige-at-2019-hitam-tng', 'Honda CR-V 2.0 Prestige AT 2019 Hitam Tangerang', 'Honda', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+CRV+2019',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+CRV+2019'],
 ARRAY['honda','cr-v prestige','suv','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"2000","seats":5}'::jsonb,
 'Honda','CR-V Prestige',2019,'mobil',38000,'Otomatis','Hitam','Tangerang', NOW()),

('honda-crv-1-5-turbo-at-2019-silver-bdg', 'Honda CR-V 1.5 Turbo AT 2019 Silver Bandung', 'Honda', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+CRV+2019',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+CRV+2019'],
 ARRAY['honda','cr-v','suv','mobil bekas','otomotif'], '{"fuel":"Bensin","cc":"1500","seats":5}'::jsonb,
 'Honda','CR-V',2019,'mobil',52000,'Otomatis','Silver','Bandung', NOW())

ON CONFLICT (slug) DO UPDATE SET
  updated_at = EXCLUDED.updated_at,
  vehicle_mileage = EXCLUDED.vehicle_mileage;

-- ── 3. Offers for used cars ───────────────────────────────────────────────────
INSERT INTO offers (product_id, merchant_id, price, condition, in_stock, location, url, updated_at)
SELECT p.id, '00000000-0000-0000-0000-000000000011',
  CASE
    WHEN p.slug LIKE '%avanza%veloz%'   THEN 175000000
    WHEN p.slug LIKE '%avanza%e-mt%'    THEN 148000000
    WHEN p.slug LIKE '%avanza%2020%'    THEN 155000000 + (RANDOM() * 15000000)::INT
    WHEN p.slug LIKE '%brio-rs%'        THEN 165000000
    WHEN p.slug LIKE '%brio%satya%e-cvt%' THEN 145000000
    WHEN p.slug LIKE '%brio%'           THEN 130000000 + (RANDOM() * 15000000)::INT
    WHEN p.slug LIKE '%xenia%r-at%'     THEN 125000000
    WHEN p.slug LIKE '%xenia%x-at%'     THEN 120000000
    WHEN p.slug LIKE '%xenia%'          THEN 110000000 + (RANDOM() * 10000000)::INT
    WHEN p.slug LIKE '%ertiga-sport%'   THEN 195000000
    WHEN p.slug LIKE '%ertiga%gx%'      THEN 175000000
    WHEN p.slug LIKE '%ertiga%'         THEN 155000000 + (RANDOM() * 10000000)::INT
    WHEN p.slug LIKE '%crv%prestige%'   THEN 395000000
    WHEN p.slug LIKE '%crv%'            THEN 360000000 + (RANDOM() * 20000000)::INT
    ELSE 100000000
  END,
  'used', TRUE, p.vehicle_location,
  'https://www.olx.co.id/item/' || p.slug,
  NOW()
FROM products p
WHERE p.vehicle_type = 'mobil'
ON CONFLICT (product_id, merchant_id) DO UPDATE SET
  price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- Also add carousell offers at slightly different prices (same products, different seller)
INSERT INTO offers (product_id, merchant_id, price, condition, in_stock, location, url, updated_at)
SELECT p.id, '00000000-0000-0000-0000-000000000012',
  CASE
    WHEN p.slug LIKE '%avanza%veloz%'   THEN 178000000
    WHEN p.slug LIKE '%avanza%2020%'    THEN 158000000 + (RANDOM() * 10000000)::INT
    WHEN p.slug LIKE '%brio-rs%'        THEN 168000000
    WHEN p.slug LIKE '%brio%'           THEN 133000000 + (RANDOM() * 10000000)::INT
    WHEN p.slug LIKE '%xenia%'          THEN 113000000 + (RANDOM() * 8000000)::INT
    WHEN p.slug LIKE '%ertiga-sport%'   THEN 198000000
    WHEN p.slug LIKE '%ertiga%'         THEN 158000000 + (RANDOM() * 8000000)::INT
    WHEN p.slug LIKE '%crv%prestige%'   THEN 398000000
    WHEN p.slug LIKE '%crv%'            THEN 365000000 + (RANDOM() * 15000000)::INT
    ELSE 105000000
  END,
  'used', TRUE, p.vehicle_location,
  'https://www.carousell.co.id/p/' || p.slug,
  NOW()
FROM products p
WHERE p.vehicle_type = 'mobil'
  AND p.slug NOT LIKE '%-jkt'  -- only some products have Carousell listing too
ON CONFLICT (product_id, merchant_id) DO UPDATE SET
  price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- ── 4. Motorcycles (motor) ────────────────────────────────────────────────────
INSERT INTO products (slug, name, brand, category, image_url, images, tags, specifications, vehicle_brand, vehicle_model, vehicle_year, vehicle_type, vehicle_mileage, vehicle_transmission, vehicle_color, vehicle_location, updated_at)
VALUES

-- Honda Beat 2022 — 4 variants
('honda-beat-pop-esp-cbs-2022-putih-jkt', 'Honda Beat Pop ESP CBS 2022 Putih Jakarta', 'Honda', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Beat+2022',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Beat+2022'],
 ARRAY['honda','beat','motor bekas','otomotif'], '{"fuel":"Bensin","cc":"109.5","type":"matic"}'::jsonb,
 'Honda','Beat Pop',2022,'motor',12000,'CVT','Putih','Jakarta Barat', NOW()),

('honda-beat-street-esp-cbs-2022-hitam-bks', 'Honda Beat Street ESP CBS 2022 Hitam Bekasi', 'Honda', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Beat+2022',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Beat+2022'],
 ARRAY['honda','beat street','motor bekas','otomotif'], '{"fuel":"Bensin","cc":"109.5","type":"matic"}'::jsonb,
 'Honda','Beat Street',2022,'motor',18000,'CVT','Hitam','Bekasi', NOW()),

('honda-beat-pop-esp-cbs-2022-merah-tng', 'Honda Beat Pop ESP CBS 2022 Merah Tangerang', 'Honda', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Beat+2022',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Beat+2022'],
 ARRAY['honda','beat','motor bekas','otomotif'], '{"fuel":"Bensin","cc":"109.5","type":"matic"}'::jsonb,
 'Honda','Beat Pop',2022,'motor',15000,'CVT','Merah','Tangerang', NOW()),

('honda-beat-pop-esp-cbs-2022-biru-dpk', 'Honda Beat Pop ESP CBS 2022 Biru Depok', 'Honda', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Beat+2022',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Beat+2022'],
 ARRAY['honda','beat','motor bekas','otomotif'], '{"fuel":"Bensin","cc":"109.5","type":"matic"}'::jsonb,
 'Honda','Beat Pop',2022,'motor',20000,'CVT','Biru','Depok', NOW()),

-- Yamaha NMAX 2021 — 4 variants
('yamaha-nmax-abs-2021-hitam-jkt', 'Yamaha NMAX ABS 2021 Hitam Jakarta', 'Yamaha', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Yamaha+NMAX+2021',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Yamaha+NMAX+2021'],
 ARRAY['yamaha','nmax','motor bekas','otomotif'], '{"fuel":"Bensin","cc":"155","type":"matic"}'::jsonb,
 'Yamaha','NMAX ABS',2021,'motor',22000,'CVT','Hitam','Jakarta Selatan', NOW()),

('yamaha-nmax-non-abs-2021-putih-bdg', 'Yamaha NMAX Non ABS 2021 Putih Bandung', 'Yamaha', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Yamaha+NMAX+2021',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Yamaha+NMAX+2021'],
 ARRAY['yamaha','nmax','motor bekas','otomotif'], '{"fuel":"Bensin","cc":"155","type":"matic"}'::jsonb,
 'Yamaha','NMAX',2021,'motor',30000,'CVT','Putih','Bandung', NOW()),

('yamaha-nmax-abs-2021-abu-tng', 'Yamaha NMAX ABS 2021 Abu-abu Tangerang', 'Yamaha', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Yamaha+NMAX+2021',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Yamaha+NMAX+2021'],
 ARRAY['yamaha','nmax','motor bekas','otomotif'], '{"fuel":"Bensin","cc":"155","type":"matic"}'::jsonb,
 'Yamaha','NMAX ABS',2021,'motor',18000,'CVT','Abu-abu','Tangerang', NOW()),

('yamaha-nmax-non-abs-2021-biru-sby', 'Yamaha NMAX Non ABS 2021 Biru Surabaya', 'Yamaha', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Yamaha+NMAX+2021',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Yamaha+NMAX+2021'],
 ARRAY['yamaha','nmax','motor bekas','otomotif'], '{"fuel":"Bensin","cc":"155","type":"matic"}'::jsonb,
 'Yamaha','NMAX',2021,'motor',25000,'CVT','Biru','Surabaya', NOW()),

-- Honda Vario 160 2022 — 3 variants
('honda-vario-160-abs-2022-putih-jkt', 'Honda Vario 160 ABS 2022 Putih Jakarta', 'Honda', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Vario+160+2022',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Vario+160+2022'],
 ARRAY['honda','vario 160','motor bekas','otomotif'], '{"fuel":"Bensin","cc":"160","type":"matic"}'::jsonb,
 'Honda','Vario 160',2022,'motor',10000,'CVT','Putih','Jakarta Utara', NOW()),

('honda-vario-160-abs-2022-hitam-bks', 'Honda Vario 160 ABS 2022 Hitam Bekasi', 'Honda', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Vario+160+2022',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Vario+160+2022'],
 ARRAY['honda','vario 160','motor bekas','otomotif'], '{"fuel":"Bensin","cc":"160","type":"matic"}'::jsonb,
 'Honda','Vario 160',2022,'motor',15000,'CVT','Hitam','Bekasi', NOW()),

('honda-vario-160-cbs-2022-merah-dpk', 'Honda Vario 160 CBS 2022 Merah Depok', 'Honda', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Vario+160+2022',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Honda+Vario+160+2022'],
 ARRAY['honda','vario 160','motor bekas','otomotif'], '{"fuel":"Bensin","cc":"160","type":"matic"}'::jsonb,
 'Honda','Vario 160',2022,'motor',22000,'CVT','Merah','Depok', NOW()),

-- Yamaha Aerox 155 2022 — 3 variants
('yamaha-aerox-155-vva-s-abs-2022-hitam-jkt', 'Yamaha Aerox 155 VVA-S ABS 2022 Hitam Jakarta', 'Yamaha', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Yamaha+Aerox+2022',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Yamaha+Aerox+2022'],
 ARRAY['yamaha','aerox','motor bekas','otomotif'], '{"fuel":"Bensin","cc":"155","type":"matic"}'::jsonb,
 'Yamaha','Aerox 155',2022,'motor',12000,'CVT','Hitam','Jakarta Pusat', NOW()),

('yamaha-aerox-155-vva-2022-biru-tng', 'Yamaha Aerox 155 VVA 2022 Biru Tangerang', 'Yamaha', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Yamaha+Aerox+2022',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Yamaha+Aerox+2022'],
 ARRAY['yamaha','aerox','motor bekas','otomotif'], '{"fuel":"Bensin","cc":"155","type":"matic"}'::jsonb,
 'Yamaha','Aerox 155',2022,'motor',18000,'CVT','Biru','Tangerang', NOW()),

('yamaha-aerox-155-vva-2022-putih-bdg', 'Yamaha Aerox 155 VVA 2022 Putih Bandung', 'Yamaha', 'Otomotif',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Yamaha+Aerox+2022',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Yamaha+Aerox+2022'],
 ARRAY['yamaha','aerox','motor bekas','otomotif'], '{"fuel":"Bensin","cc":"155","type":"matic"}'::jsonb,
 'Yamaha','Aerox 155',2022,'motor',14000,'CVT','Putih','Bandung', NOW())

ON CONFLICT (slug) DO UPDATE SET updated_at = EXCLUDED.updated_at;

-- Offers for motorcycles
INSERT INTO offers (product_id, merchant_id, price, condition, in_stock, location, url, updated_at)
SELECT p.id, '00000000-0000-0000-0000-000000000011',
  CASE
    WHEN p.slug LIKE '%beat-street%'        THEN 17500000
    WHEN p.slug LIKE '%beat%'               THEN 15500000 + (RANDOM() * 2000000)::INT
    WHEN p.slug LIKE '%nmax-abs%'           THEN 28500000 + (RANDOM() * 2000000)::INT
    WHEN p.slug LIKE '%nmax%'               THEN 25500000 + (RANDOM() * 2000000)::INT
    WHEN p.slug LIKE '%vario-160-abs%'      THEN 24000000 + (RANDOM() * 1500000)::INT
    WHEN p.slug LIKE '%vario-160%'          THEN 22000000 + (RANDOM() * 1500000)::INT
    WHEN p.slug LIKE '%aerox%abs%'          THEN 27000000 + (RANDOM() * 2000000)::INT
    WHEN p.slug LIKE '%aerox%'              THEN 25000000 + (RANDOM() * 1500000)::INT
    ELSE 15000000
  END,
  'used', TRUE, p.vehicle_location,
  'https://www.olx.co.id/item/' || p.slug, NOW()
FROM products p
WHERE p.vehicle_type = 'motor'
ON CONFLICT (product_id, merchant_id) DO UPDATE SET
  price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- Carousell offers for motorcycles
INSERT INTO offers (product_id, merchant_id, price, condition, in_stock, location, url, updated_at)
SELECT p.id, '00000000-0000-0000-0000-000000000012',
  CASE
    WHEN p.slug LIKE '%beat%'    THEN 16000000 + (RANDOM() * 2000000)::INT
    WHEN p.slug LIKE '%nmax-abs%' THEN 29000000 + (RANDOM() * 2000000)::INT
    WHEN p.slug LIKE '%nmax%'     THEN 26000000 + (RANDOM() * 2000000)::INT
    WHEN p.slug LIKE '%vario%'    THEN 23000000 + (RANDOM() * 1500000)::INT
    WHEN p.slug LIKE '%aerox%'    THEN 26500000 + (RANDOM() * 1500000)::INT
    ELSE 16000000
  END,
  'used', TRUE, p.vehicle_location,
  'https://www.carousell.co.id/p/' || p.slug, NOW()
FROM products p
WHERE p.vehicle_type = 'motor'
  AND p.slug NOT LIKE '%-sby'
ON CONFLICT (product_id, merchant_id) DO UPDATE SET
  price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- ── 5. Fashion ────────────────────────────────────────────────────────────────
INSERT INTO products (slug, name, brand, category, image_url, images, tags, specifications, updated_at)
VALUES
-- Sepatu
('sepatu-nike-air-max-270-pria-hitam-42', 'Sepatu Nike Air Max 270 Pria Hitam Size 42', 'Nike', 'Fashion',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Nike+Air+Max+270',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Nike+Air+Max+270'],
 ARRAY['sepatu','nike','pria','fashion'], '{"size":"42","gender":"Pria","material":"Mesh"}'::jsonb, NOW()),
('sepatu-nike-air-force-1-putih-41', 'Sepatu Nike Air Force 1 Low Putih Size 41', 'Nike', 'Fashion',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Nike+Air+Force+1',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Nike+Air+Force+1'],
 ARRAY['sepatu','nike','pria','fashion'], '{"size":"41","gender":"Unisex","material":"Leather"}'::jsonb, NOW()),
('sepatu-adidas-ultraboost-22-pria-hitam-43', 'Sepatu Adidas Ultraboost 22 Pria Hitam Size 43', 'Adidas', 'Fashion',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Adidas+Ultraboost',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Adidas+Ultraboost'],
 ARRAY['sepatu','adidas','pria','fashion'], '{"size":"43","gender":"Pria","material":"Primeknit"}'::jsonb, NOW()),
('sepatu-vans-old-skool-hitam-putih-40', 'Sepatu Vans Old Skool Hitam Putih Size 40', 'Vans', 'Fashion',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Vans+Old+Skool',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Vans+Old+Skool'],
 ARRAY['sepatu','vans','unisex','fashion'], '{"size":"40","gender":"Unisex","material":"Canvas"}'::jsonb, NOW()),
('sepatu-converse-chuck-taylor-putih-38', 'Sepatu Converse Chuck Taylor All Star Putih Size 38', 'Converse', 'Fashion',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Converse+Chuck+Taylor',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Converse+Chuck+Taylor'],
 ARRAY['sepatu','converse','wanita','fashion'], '{"size":"38","gender":"Unisex","material":"Canvas"}'::jsonb, NOW()),

-- Baju / Kaos
('kaos-polo-lacoste-original-pria-putih-l', 'Kaos Polo Lacoste Original Pria Putih Size L', 'Lacoste', 'Fashion',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Polo+Lacoste',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Polo+Lacoste'],
 ARRAY['kaos','polo','pria','fashion'], '{"size":"L","gender":"Pria","material":"Cotton Pique"}'::jsonb, NOW()),
('kemeja-batik-pria-lengan-panjang-merah-xl', 'Kemeja Batik Pria Lengan Panjang Motif Parang Merah XL', NULL, 'Fashion',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Batik+Parang',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Batik+Parang'],
 ARRAY['batik','kemeja','pria','fashion'], '{"size":"XL","gender":"Pria","material":"Katun Batik"}'::jsonb, NOW()),
('dress-wanita-floral-hitam-m', 'Dress Wanita Floral Midi Lengan Panjang Hitam Size M', NULL, 'Fashion',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Dress+Floral',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Dress+Floral'],
 ARRAY['dress','wanita','fashion'], '{"size":"M","gender":"Wanita","material":"Chiffon"}'::jsonb, NOW()),
('celana-jeans-levis-511-slim-pria-32', 'Celana Jeans Levis 511 Slim Fit Pria Size 32 Biru', 'Levi''s', 'Fashion',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Levis+511',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Levis+511'],
 ARRAY['celana','jeans','levis','pria','fashion'], '{"size":"32","gender":"Pria","material":"Denim"}'::jsonb, NOW()),
('tas-wanita-branded-zara-shoulder-bag-hitam', 'Tas Shoulder Bag Zara Original Wanita Hitam', 'Zara', 'Fashion',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Tas+Zara',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Tas+Zara'],
 ARRAY['tas','zara','wanita','fashion'], '{"material":"PU Leather","color":"Hitam"}'::jsonb, NOW()),
('jaket-hoodie-pria-polos-abu-l', 'Jaket Hoodie Pria Polos Abu-abu Size L', NULL, 'Fashion',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Hoodie+Pria',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Hoodie+Pria'],
 ARRAY['jaket','hoodie','pria','fashion'], '{"size":"L","gender":"Pria","material":"Fleece"}'::jsonb, NOW()),
('topi-baseball-cap-new-era-hitam', 'Topi Baseball Cap New Era 9FORTY Hitam', 'New Era', 'Fashion',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=New+Era+Cap',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=New+Era+Cap'],
 ARRAY['topi','cap','fashion'], '{"gender":"Unisex","material":"Cotton"}'::jsonb, NOW()),
('sandal-pria-adidas-adilette-hitam-42', 'Sandal Pria Adidas Adilette Shower Hitam Size 42', 'Adidas', 'Fashion',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Adidas+Adilette',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Adidas+Adilette'],
 ARRAY['sandal','adidas','pria','fashion'], '{"size":"42","gender":"Pria","material":"Synthetic"}'::jsonb, NOW()),
('dompet-pria-fossil-kulit-coklat', 'Dompet Pria Fossil Leather Bifold Coklat', 'Fossil', 'Fashion',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Fossil+Wallet',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Fossil+Wallet'],
 ARRAY['dompet','fossil','pria','fashion'], '{"gender":"Pria","material":"Genuine Leather"}'::jsonb, NOW()),
('ikat-pinggang-pria-kulit-hitam-casual', 'Ikat Pinggang Pria Kulit Asli Hitam Casual', NULL, 'Fashion',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Ikat+Pinggang',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Ikat+Pinggang'],
 ARRAY['ikat pinggang','belt','pria','fashion'], '{"gender":"Pria","material":"Genuine Leather"}'::jsonb, NOW())

ON CONFLICT (slug) DO UPDATE SET updated_at = EXCLUDED.updated_at;

-- Offers for fashion products
INSERT INTO offers (product_id, merchant_id, price, original_price, discount_pct, in_stock, url, updated_at)
SELECT p.id,
  -- Alternate between Tokopedia (001), Shopee (002), Lazada (003)
  CASE (ROW_NUMBER() OVER (ORDER BY p.slug))::INT % 3
    WHEN 0 THEN '00000000-0000-0000-0000-000000000001'
    WHEN 1 THEN '00000000-0000-0000-0000-000000000002'
    ELSE        '00000000-0000-0000-0000-000000000003'
  END,
  CASE
    WHEN p.slug LIKE '%nike-air-max%'      THEN 1350000
    WHEN p.slug LIKE '%nike-air-force%'    THEN 1150000
    WHEN p.slug LIKE '%adidas-ultraboost%' THEN 1850000
    WHEN p.slug LIKE '%vans%'              THEN 750000
    WHEN p.slug LIKE '%converse%'          THEN 650000
    WHEN p.slug LIKE '%lacoste%'           THEN 890000
    WHEN p.slug LIKE '%batik%'             THEN 350000
    WHEN p.slug LIKE '%dress%'             THEN 280000
    WHEN p.slug LIKE '%levis%'             THEN 790000
    WHEN p.slug LIKE '%zara%'              THEN 550000
    WHEN p.slug LIKE '%hoodie%'            THEN 220000
    WHEN p.slug LIKE '%new-era%'           THEN 380000
    WHEN p.slug LIKE '%adilette%'          THEN 320000
    WHEN p.slug LIKE '%fossil%'            THEN 780000
    WHEN p.slug LIKE '%ikat-pinggang%'     THEN 180000
    ELSE 250000
  END,
  CASE
    WHEN p.slug LIKE '%nike-air-max%'      THEN 1650000
    WHEN p.slug LIKE '%adidas-ultraboost%' THEN 2300000
    WHEN p.slug LIKE '%levis%'             THEN 999000
    ELSE NULL
  END,
  CASE
    WHEN p.slug LIKE '%nike-air-max%'      THEN 18
    WHEN p.slug LIKE '%adidas-ultraboost%' THEN 20
    WHEN p.slug LIKE '%levis%'             THEN 21
    ELSE NULL
  END,
  TRUE,
  'https://www.tokopedia.com/search?q=' || p.slug,
  NOW()
FROM products p
WHERE p.category = 'Fashion'
ON CONFLICT (product_id, merchant_id) DO UPDATE SET
  price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- Second offers from TikTok Shop for fashion
INSERT INTO offers (product_id, merchant_id, price, in_stock, url, updated_at)
SELECT p.id, '00000000-0000-0000-0000-000000000006',
  CASE
    WHEN p.slug LIKE '%nike-air-max%'      THEN 1299000
    WHEN p.slug LIKE '%nike-air-force%'    THEN 1099000
    WHEN p.slug LIKE '%adidas-ultraboost%' THEN 1799000
    WHEN p.slug LIKE '%vans%'              THEN 699000
    WHEN p.slug LIKE '%converse%'          THEN 599000
    WHEN p.slug LIKE '%batik%'             THEN 299000
    WHEN p.slug LIKE '%dress%'             THEN 249000
    ELSE 200000
  END,
  TRUE, 'https://www.tiktok.com/search?q=' || p.slug, NOW()
FROM products p
WHERE p.category = 'Fashion'
  AND p.slug LIKE '%sepatu%' OR p.slug LIKE '%nike%' OR p.slug LIKE '%adidas%'
ON CONFLICT (product_id, merchant_id) DO UPDATE SET
  price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- ── 6. Rumah Tangga (Home Appliances) ────────────────────────────────────────
INSERT INTO products (slug, name, brand, category, image_url, images, tags, specifications, updated_at)
VALUES
('kulkas-sharp-2-pintu-sjx215hg-220l-silver', 'Kulkas Sharp 2 Pintu SJ-X215HG 220L Silver', 'Sharp', 'Rumah Tangga',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Sharp+Kulkas',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Sharp+Kulkas'],
 ARRAY['kulkas','sharp','rumah tangga'], '{"volume":"220L","color":"Silver","power":"105W"}'::jsonb, NOW()),
('kulkas-lg-2-pintu-gb-b247sqzb-260l-hitam', 'Kulkas LG 2 Pintu GB-B247SQZB 260L Matte Black', 'LG', 'Rumah Tangga',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=LG+Kulkas',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=LG+Kulkas'],
 ARRAY['kulkas','lg','rumah tangga'], '{"volume":"260L","color":"Matte Black","power":"120W"}'::jsonb, NOW()),
('kulkas-samsung-4-pintu-rf44a5002s9-458l', 'Kulkas Samsung French Door RF44A5002S9 458L', 'Samsung', 'Rumah Tangga',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Samsung+Kulkas+4+Pintu',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Samsung+Kulkas+4+Pintu'],
 ARRAY['kulkas','samsung','french door','rumah tangga'], '{"volume":"458L","color":"Silver","power":"160W"}'::jsonb, NOW()),
('mesin-cuci-lg-front-loading-9kg-fm1209n6w', 'Mesin Cuci LG Front Loading 9kg FM1209N6W Putih', 'LG', 'Rumah Tangga',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=LG+Mesin+Cuci',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=LG+Mesin+Cuci'],
 ARRAY['mesin cuci','lg','front loading','rumah tangga'], '{"capacity":"9kg","type":"Front Loading","color":"Putih"}'::jsonb, NOW()),
('mesin-cuci-samsung-top-loading-9kg-wa90a4002gs', 'Mesin Cuci Samsung Top Loading 9kg WA90A4002GS', 'Samsung', 'Rumah Tangga',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Samsung+Mesin+Cuci',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Samsung+Mesin+Cuci'],
 ARRAY['mesin cuci','samsung','top loading','rumah tangga'], '{"capacity":"9kg","type":"Top Loading","color":"Abu-abu"}'::jsonb, NOW()),
('ac-sharp-1-pk-ah-a9sey-split-inverter', 'AC Sharp 1 PK AH-A9SEY Split Inverter', 'Sharp', 'Rumah Tangga',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Sharp+AC',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Sharp+AC'],
 ARRAY['ac','sharp','inverter','rumah tangga'], '{"pk":"1 PK","type":"Inverter","watt":"750W"}'::jsonb, NOW()),
('ac-daikin-1-5-pk-ftne35jv14-split-standard', 'AC Daikin 1.5 PK FTNE35JV14 Split Standard', 'Daikin', 'Rumah Tangga',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Daikin+AC',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Daikin+AC'],
 ARRAY['ac','daikin','standard','rumah tangga'], '{"pk":"1.5 PK","type":"Standard","watt":"1200W"}'::jsonb, NOW()),
('dispenser-cosmos-top-loading-hot-normal-cold-cd-1988', 'Dispenser Cosmos Top Loading Hot Normal Cold CD-1988', 'Cosmos', 'Rumah Tangga',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Dispenser+Cosmos',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Dispenser+Cosmos'],
 ARRAY['dispenser','cosmos','rumah tangga'], '{"type":"Top Loading","temp":"Hot Normal Cold"}'::jsonb, NOW()),
('blender-philips-hr2115-350w-jar-1-5l', 'Blender Philips HR2115 350W Jar 1.5L', 'Philips', 'Rumah Tangga',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Philips+Blender',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Philips+Blender'],
 ARRAY['blender','philips','rumah tangga'], '{"power":"350W","volume":"1.5L","speed":2}'::jsonb, NOW()),
('rice-cooker-miyako-acm-509-1-8l-digital', 'Rice Cooker Miyako ACM-509 1.8L Digital', 'Miyako', 'Rumah Tangga',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Miyako+Rice+Cooker',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Miyako+Rice+Cooker'],
 ARRAY['rice cooker','miyako','rumah tangga'], '{"capacity":"1.8L","type":"Digital","color":"Putih"}'::jsonb, NOW()),
('setrika-philips-gc1905-2000w-anti-lengket', 'Setrika Philips GC1905 2000W Anti Lengket', 'Philips', 'Rumah Tangga',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Setrika+Philips',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Setrika+Philips'],
 ARRAY['setrika','philips','rumah tangga'], '{"power":"2000W","type":"Anti Lengket"}'::jsonb, NOW()),
('vacuum-cleaner-philips-fc8241-1600w-bagless', 'Vacuum Cleaner Philips FC8241 1600W Bagless', 'Philips', 'Rumah Tangga',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Vacuum+Philips',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Vacuum+Philips'],
 ARRAY['vacuum cleaner','philips','rumah tangga'], '{"power":"1600W","type":"Bagless"}'::jsonb, NOW()),
('tv-samsung-50-qled-4k-2023-q60c', 'TV Samsung 50" QLED 4K 2023 Q60C Smart TV', 'Samsung', 'Rumah Tangga',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Samsung+TV+50',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Samsung+TV+50'],
 ARRAY['tv','samsung','qled','smart tv','rumah tangga'], '{"size":"50 inch","resolution":"4K","type":"QLED Smart TV"}'::jsonb, NOW()),
('tv-lg-55-oled-4k-2023-oled55c3', 'TV LG 55" OLED 4K 2023 OLED55C3 evo', 'LG', 'Rumah Tangga',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=LG+TV+55+OLED',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=LG+TV+55+OLED'],
 ARRAY['tv','lg','oled','smart tv','rumah tangga'], '{"size":"55 inch","resolution":"4K","type":"OLED Smart TV"}'::jsonb, NOW()),
('kompor-gas-rinnai-2-tungku-ri-522e', 'Kompor Gas Rinnai 2 Tungku RI-522E Stainless', 'Rinnai', 'Rumah Tangga',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Kompor+Rinnai',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Kompor+Rinnai'],
 ARRAY['kompor','rinnai','rumah tangga'], '{"burners":2,"material":"Stainless Steel"}'::jsonb, NOW())

ON CONFLICT (slug) DO UPDATE SET updated_at = EXCLUDED.updated_at;

-- Offers for home appliances
INSERT INTO offers (product_id, merchant_id, price, original_price, discount_pct, in_stock, url, updated_at)
SELECT p.id,
  CASE (ROW_NUMBER() OVER (ORDER BY p.slug))::INT % 4
    WHEN 0 THEN '00000000-0000-0000-0000-000000000001'
    WHEN 1 THEN '00000000-0000-0000-0000-000000000002'
    WHEN 2 THEN '00000000-0000-0000-0000-000000000003'
    ELSE        '00000000-0000-0000-0000-000000000005'
  END,
  CASE
    WHEN p.slug LIKE '%kulkas-sharp%'      THEN 2750000
    WHEN p.slug LIKE '%kulkas-lg%'         THEN 3250000
    WHEN p.slug LIKE '%kulkas-samsung%'    THEN 8500000
    WHEN p.slug LIKE '%mesin-cuci-lg%'     THEN 3800000
    WHEN p.slug LIKE '%mesin-cuci-samsung%'THEN 3400000
    WHEN p.slug LIKE '%ac-sharp%'          THEN 3600000
    WHEN p.slug LIKE '%ac-daikin%'         THEN 5200000
    WHEN p.slug LIKE '%dispenser%'         THEN 450000
    WHEN p.slug LIKE '%blender%'           THEN 350000
    WHEN p.slug LIKE '%rice-cooker%'       THEN 280000
    WHEN p.slug LIKE '%setrika%'           THEN 220000
    WHEN p.slug LIKE '%vacuum%'            THEN 890000
    WHEN p.slug LIKE '%tv-samsung-50%'     THEN 7800000
    WHEN p.slug LIKE '%tv-lg-55%'          THEN 15500000
    WHEN p.slug LIKE '%kompor%'            THEN 580000
    ELSE 500000
  END,
  CASE
    WHEN p.slug LIKE '%kulkas-sharp%'      THEN 3200000
    WHEN p.slug LIKE '%tv-samsung-50%'     THEN 9500000
    WHEN p.slug LIKE '%tv-lg-55%'          THEN 18000000
    WHEN p.slug LIKE '%ac-daikin%'         THEN 6000000
    ELSE NULL
  END,
  CASE
    WHEN p.slug LIKE '%kulkas-sharp%'  THEN 14
    WHEN p.slug LIKE '%tv-samsung-50%' THEN 18
    WHEN p.slug LIKE '%tv-lg-55%'      THEN 14
    WHEN p.slug LIKE '%ac-daikin%'     THEN 13
    ELSE NULL
  END,
  TRUE, 'https://www.tokopedia.com/search?q=' || p.slug, NOW()
FROM products p
WHERE p.category = 'Rumah Tangga'
ON CONFLICT (product_id, merchant_id) DO UPDATE SET
  price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- Second offers from Shopee at slightly lower prices
INSERT INTO offers (product_id, merchant_id, price, in_stock, url, updated_at)
SELECT p.id, '00000000-0000-0000-0000-000000000002',
  CASE
    WHEN p.slug LIKE '%kulkas-sharp%'       THEN 2680000
    WHEN p.slug LIKE '%kulkas-lg%'          THEN 3150000
    WHEN p.slug LIKE '%mesin-cuci-lg%'      THEN 3690000
    WHEN p.slug LIKE '%ac-sharp%'           THEN 3480000
    WHEN p.slug LIKE '%tv-samsung-50%'      THEN 7650000
    WHEN p.slug LIKE '%tv-lg-55%'           THEN 15200000
    ELSE NULL
  END,
  TRUE, 'https://shopee.co.id/search?keyword=' || p.slug, NOW()
FROM products p
WHERE p.category = 'Rumah Tangga'
  AND (p.slug LIKE '%kulkas%' OR p.slug LIKE '%mesin-cuci%' OR p.slug LIKE '%ac-%' OR p.slug LIKE '%tv-%')
ON CONFLICT (product_id, merchant_id) DO UPDATE SET
  price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- ── 7. Kecantikan (Beauty / Skincare) ────────────────────────────────────────
INSERT INTO products (slug, name, brand, category, image_url, images, tags, specifications, updated_at)
VALUES
('wardah-lightening-serum-30ml', 'Wardah Lightening Serum 30ml Vitamin C', 'Wardah', 'Kecantikan',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Wardah+Serum',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Wardah+Serum'],
 ARRAY['serum','wardah','kecantikan','skincare'], '{"volume":"30ml","skin_type":"All","main_ingredient":"Vitamin C"}'::jsonb, NOW()),
('somethinc-niacinamide-10pct-serum-20ml', 'Somethinc Niacinamide + Moisture Beet 10% Serum 20ml', 'Somethinc', 'Kecantikan',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Somethinc+Niacinamide',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Somethinc+Niacinamide'],
 ARRAY['serum','somethinc','niacinamide','kecantikan','skincare'], '{"volume":"20ml","skin_type":"All","concentration":"10%"}'::jsonb, NOW()),
('ms-glow-luminous-series-serum-brightening', 'MS Glow Luminous Series Brightening Serum 20ml', 'MS Glow', 'Kecantikan',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=MS+Glow+Serum',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=MS+Glow+Serum'],
 ARRAY['serum','ms glow','brightening','kecantikan','skincare'], '{"volume":"20ml","skin_type":"All","series":"Luminous"}'::jsonb, NOW()),
('skintific-5x-ceramide-barrier-moisture-gel-40g', 'Skintific 5X Ceramide Barrier Moisture Gel 40g', 'Skintific', 'Kecantikan',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Skintific+Ceramide',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Skintific+Ceramide'],
 ARRAY['moisturizer','skintific','ceramide','kecantikan','skincare'], '{"volume":"40g","skin_type":"All","main_ingredient":"Ceramide 5X"}'::jsonb, NOW()),
('emina-bright-stuff-face-serum-30ml', 'Emina Bright Stuff Face Serum 30ml Vitamin C', 'Emina', 'Kecantikan',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Emina+Serum',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Emina+Serum'],
 ARRAY['serum','emina','vitamin c','kecantikan','skincare'], '{"volume":"30ml","skin_type":"Normal to Oily"}'::jsonb, NOW()),
('sunscreen-biore-uv-aqua-rich-spf50-50ml', 'Biore UV Aqua Rich Watery Essence SPF50+ PA++++ 50ml', 'Biore', 'Kecantikan',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Biore+Sunscreen',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Biore+Sunscreen'],
 ARRAY['sunscreen','biore','spf50','kecantikan','skincare'], '{"volume":"50ml","SPF":"50+","PA":"++++"}'::jsonb, NOW()),
('sunscreen-somethinc-uv-tone-up-spf50-30ml', 'Somethinc UV Daily Moisturizer Tone Up SPF50+ 30ml', 'Somethinc', 'Kecantikan',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Somethinc+Sunscreen',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Somethinc+Sunscreen'],
 ARRAY['sunscreen','somethinc','tone up','kecantikan','skincare'], '{"volume":"30ml","SPF":"50+","PA":"++++"}'::jsonb, NOW()),
('lipstik-wardah-exclusive-matte-lipcream-01', 'Wardah Exclusive Matte Lip Cream 01 3.5g', 'Wardah', 'Kecantikan',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Wardah+Lipstik',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Wardah+Lipstik'],
 ARRAY['lipstik','wardah','matte','kecantikan','makeup'], '{"size":"3.5g","finish":"Matte","shade":"01"}'::jsonb, NOW()),
('lipstik-ms-glow-exclusive-lip-matte-02', 'MS Glow Exclusive Lip Matte 02 Dusty Mauve 3g', 'MS Glow', 'Kecantikan',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=MS+Glow+Lipstik',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=MS+Glow+Lipstik'],
 ARRAY['lipstik','ms glow','matte','kecantikan','makeup'], '{"size":"3g","finish":"Matte","shade":"02 Dusty Mauve"}'::jsonb, NOW()),
('pelembab-cetaphil-moisturizing-lotion-250ml', 'Cetaphil Moisturizing Lotion 250ml Sensitive Skin', 'Cetaphil', 'Kecantikan',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Cetaphil+Lotion',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Cetaphil+Lotion'],
 ARRAY['pelembab','cetaphil','sensitive skin','kecantikan','skincare'], '{"volume":"250ml","skin_type":"Sensitive"}'::jsonb, NOW()),
('toner-skintific-mugwort-pore-5x-200ml', 'Skintific Mugwort Pore Clarifying Toner 5X 200ml', 'Skintific', 'Kecantikan',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Skintific+Toner',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Skintific+Toner'],
 ARRAY['toner','skintific','mugwort','kecantikan','skincare'], '{"volume":"200ml","skin_type":"Oily"}'::jsonb, NOW()),
('masker-wajah-innisfree-super-volcanic-pore-clay-100ml', 'Innisfree Super Volcanic Pore Clay Mask 2x 100ml', 'Innisfree', 'Kecantikan',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Innisfree+Clay+Mask',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Innisfree+Clay+Mask'],
 ARRAY['masker wajah','innisfree','clay mask','kecantikan','skincare'], '{"volume":"100ml","skin_type":"Oily"}'::jsonb, NOW()),
('face-wash-cetaphil-gentle-skin-cleanser-500ml', 'Cetaphil Gentle Skin Cleanser 500ml', 'Cetaphil', 'Kecantikan',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Cetaphil+Cleanser',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Cetaphil+Cleanser'],
 ARRAY['face wash','cetaphil','cleanser','kecantikan','skincare'], '{"volume":"500ml","skin_type":"All"}'::jsonb, NOW()),
('parfum-victoria-secret-love-spell-250ml', 'Victoria Secret Love Spell Body Mist 250ml', 'Victoria''s Secret', 'Kecantikan',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Victoria+Secret+Mist',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Victoria+Secret+Mist'],
 ARRAY['parfum','victoria secret','body mist','kecantikan'], '{"volume":"250ml","type":"Body Mist","fragrance":"Love Spell"}'::jsonb, NOW()),
('eyeshadow-palette-morphe-9b-boss-mood', 'Morphe 9B Boss Mood Artistry Palette', 'Morphe', 'Kecantikan',
 'https://placehold.co/400x400/1A1613/FAF9F6?text=Morphe+Palette',
 ARRAY['https://placehold.co/400x400/1A1613/FAF9F6?text=Morphe+Palette'],
 ARRAY['eyeshadow','morphe','palette','kecantikan','makeup'], '{"shades":9,"finish":"Matte & Shimmer"}'::jsonb, NOW())

ON CONFLICT (slug) DO UPDATE SET updated_at = EXCLUDED.updated_at;

-- Offers for beauty products
INSERT INTO offers (product_id, merchant_id, price, original_price, discount_pct, in_stock, url, updated_at)
SELECT p.id,
  CASE (ROW_NUMBER() OVER (ORDER BY p.slug))::INT % 3
    WHEN 0 THEN '00000000-0000-0000-0000-000000000001'
    WHEN 1 THEN '00000000-0000-0000-0000-000000000002'
    ELSE        '00000000-0000-0000-0000-000000000006'
  END,
  CASE
    WHEN p.slug LIKE '%wardah-lightening-serum%'   THEN 99000
    WHEN p.slug LIKE '%somethinc-niacinamide%'     THEN 138000
    WHEN p.slug LIKE '%ms-glow-luminous%serum%'    THEN 145000
    WHEN p.slug LIKE '%skintific%ceramide%'         THEN 119000
    WHEN p.slug LIKE '%emina%serum%'               THEN 49000
    WHEN p.slug LIKE '%biore%sunscreen%'            THEN 95000
    WHEN p.slug LIKE '%somethinc%sunscreen%'       THEN 128000
    WHEN p.slug LIKE '%lipstik-wardah%'             THEN 55000
    WHEN p.slug LIKE '%lipstik-ms-glow%'            THEN 69000
    WHEN p.slug LIKE '%cetaphil-moisturizing%'      THEN 135000
    WHEN p.slug LIKE '%skintific%toner%'            THEN 109000
    WHEN p.slug LIKE '%innisfree%clay%'             THEN 149000
    WHEN p.slug LIKE '%cetaphil-gentle%'            THEN 128000
    WHEN p.slug LIKE '%victoria-secret%'            THEN 225000
    WHEN p.slug LIKE '%morphe%'                     THEN 299000
    ELSE 89000
  END,
  CASE
    WHEN p.slug LIKE '%somethinc-niacinamide%' THEN 165000
    WHEN p.slug LIKE '%innisfree%'             THEN 189000
    WHEN p.slug LIKE '%morphe%'                THEN 399000
    WHEN p.slug LIKE '%victoria-secret%'       THEN 295000
    ELSE NULL
  END,
  CASE
    WHEN p.slug LIKE '%somethinc-niacinamide%' THEN 16
    WHEN p.slug LIKE '%innisfree%'             THEN 21
    WHEN p.slug LIKE '%morphe%'                THEN 25
    WHEN p.slug LIKE '%victoria-secret%'       THEN 24
    ELSE NULL
  END,
  TRUE, 'https://www.tokopedia.com/search?q=' || p.slug, NOW()
FROM products p
WHERE p.category = 'Kecantikan'
ON CONFLICT (product_id, merchant_id) DO UPDATE SET
  price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- TikTok Shop beauty offers
INSERT INTO offers (product_id, merchant_id, price, in_stock, url, updated_at)
SELECT p.id, '00000000-0000-0000-0000-000000000006',
  CASE
    WHEN p.slug LIKE '%wardah%serum%'          THEN 89000
    WHEN p.slug LIKE '%somethinc-niacinamide%' THEN 125000
    WHEN p.slug LIKE '%ms-glow%serum%'         THEN 139000
    WHEN p.slug LIKE '%skintific%ceramide%'     THEN 109000
    WHEN p.slug LIKE '%biore%sunscreen%'        THEN 87000
    WHEN p.slug LIKE '%lipstik-wardah%'         THEN 49000
    WHEN p.slug LIKE '%lipstik-ms-glow%'        THEN 59000
    ELSE NULL
  END,
  TRUE, 'https://www.tiktok.com/search?q=' || p.slug, NOW()
FROM products p
WHERE p.category = 'Kecantikan'
  AND (p.slug LIKE '%wardah%' OR p.slug LIKE '%ms-glow%' OR p.slug LIKE '%somethinc%'
       OR p.slug LIKE '%skintific%' OR p.slug LIKE '%biore%')
ON CONFLICT (product_id, merchant_id) DO UPDATE SET
  price = EXCLUDED.price, updated_at = EXCLUDED.updated_at;

-- ── 8. Refresh price history for all new offers ───────────────────────────────
INSERT INTO price_history (offer_id, price, recorded_at)
SELECT o.id, o.price, NOW()
FROM offers o
WHERE o.updated_at > NOW() - INTERVAL '5 minutes'
  AND NOT EXISTS (
    SELECT 1 FROM price_history ph WHERE ph.offer_id = o.id
  );
