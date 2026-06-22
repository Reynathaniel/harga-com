-- ============================================================
-- harga.com — Seed Data
-- Run AFTER migration: 20260604000001_initial_schema.sql
-- Usage: psql $DATABASE_URL -f supabase/seed.sql
--        OR paste into Supabase SQL Editor
-- ============================================================

-- ── 1. MERCHANTS (6 platforms) ──────────────────────────────

INSERT INTO merchants (id, name, slug, platform_id, logo_url, affiliate_base_url, color, bg_color, cashback_default_pct) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Tokopedia',   'tokopedia',  'tokopedia',  '/logos/tokopedia.svg',  'https://tokopedia.com/product/',       '#42b549', '#e8f5e9', 5.0),
  ('00000000-0000-0000-0000-000000000002', 'Shopee',      'shopee',     'shopee',     '/logos/shopee.svg',     'https://shopee.co.id/product/',         '#ee4d2d', '#fce8e4', 7.0),
  ('00000000-0000-0000-0000-000000000003', 'Lazada',      'lazada',     'lazada',     '/logos/lazada.svg',     'https://lazada.co.id/product/',         '#0f146d', '#e8e9f8', 6.0),
  ('00000000-0000-0000-0000-000000000004', 'Bukalapak',   'bukalapak',  'bukalapak',  '/logos/bukalapak.svg',  'https://bukalapak.com/product/',        '#e31e52', '#fce4eb', 4.0),
  ('00000000-0000-0000-0000-000000000005', 'Blibli',      'blibli',     'blibli',     '/logos/blibli.svg',     'https://blibli.com/product/',           '#0095da', '#e0f4fd', 5.0),
  ('00000000-0000-0000-0000-000000000006', 'TikTok Shop', 'tiktok',     'tiktok',     '/logos/tiktok.svg',     'https://tiktok.com/shop/product/',      '#010101', '#f0f0f0', 8.0)
ON CONFLICT (platform_id) DO UPDATE
  SET cashback_default_pct = EXCLUDED.cashback_default_pct,
      color = EXCLUDED.color;

-- ── 2. CASHBACK RATES (global — NULL category = all products) ──

INSERT INTO cashback_rates (merchant_id, category, rate_percent) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 5.0),  -- Tokopedia global
  ('00000000-0000-0000-0000-000000000002', NULL, 7.0),  -- Shopee global
  ('00000000-0000-0000-0000-000000000003', NULL, 6.0),  -- Lazada global
  ('00000000-0000-0000-0000-000000000004', NULL, 4.0),  -- Bukalapak global
  ('00000000-0000-0000-0000-000000000005', NULL, 5.0),  -- Blibli global
  ('00000000-0000-0000-0000-000000000006', NULL, 8.0)   -- TikTok global
ON CONFLICT (merchant_id, category) DO UPDATE
  SET rate_percent = EXCLUDED.rate_percent;

-- ── 3. PRODUCTS ─────────────────────────────────────────────

INSERT INTO products (id, name, slug, brand, category, subcategory, description, image_url, images, tags, specifications, average_rating, total_reviews) VALUES

-- Smartphones
('10000000-0000-0000-0000-000000000001',
 'Apple iPhone 15 Pro Max 256GB Natural Titanium',
 'apple-iphone-15-pro-max-256gb',
 'Apple', 'Elektronik', 'Smartphone',
 'iPhone 15 Pro Max hadir dengan chip A17 Pro, kamera 48MP dengan lensa telephoto 5x, layar Super Retina XDR 6.7 inci, dan bodi titanium premium.',
 'https://picsum.photos/seed/iphone15pm/600/600',
 ARRAY['https://picsum.photos/seed/iphone15pm/600/600','https://picsum.photos/seed/iphone15pm2/600/600'],
 ARRAY['iphone','apple','smartphone','5g','titanium'],
 '{"Layar":"6.7\" Super Retina XDR OLED","Prosesor":"Apple A17 Pro","RAM":"8 GB","Storage":"256 GB","Baterai":"4422 mAh","OS":"iOS 17"}',
 4.8, 12847),

('10000000-0000-0000-0000-000000000002',
 'Samsung Galaxy S24 Ultra 256GB Titanium Black',
 'samsung-galaxy-s24-ultra-256gb',
 'Samsung', 'Elektronik', 'Smartphone',
 'Galaxy S24 Ultra dengan AI Galaxy, S Pen terintegrasi, kamera 200MP, dan layar Dynamic AMOLED 2X 6.8 inci.',
 'https://picsum.photos/seed/s24ultra/600/600',
 ARRAY['https://picsum.photos/seed/s24ultra/600/600'],
 ARRAY['samsung','galaxy','s24','spen','android'],
 '{"Layar":"6.8\" Dynamic AMOLED 2X","Prosesor":"Snapdragon 8 Gen 3","RAM":"12 GB","Storage":"256 GB","Baterai":"5000 mAh"}',
 4.7, 8432),

('10000000-0000-0000-0000-000000000003',
 'Xiaomi 14 Ultra 512GB Titanium White',
 'xiaomi-14-ultra-512gb',
 'Xiaomi', 'Elektronik', 'Smartphone',
 'Xiaomi 14 Ultra menggabungkan sistem kamera Leica terbaik dengan chip Snapdragon 8 Gen 3.',
 'https://picsum.photos/seed/xiaomi14u/600/600',
 ARRAY['https://picsum.photos/seed/xiaomi14u/600/600'],
 ARRAY['xiaomi','14 ultra','leica','smartphone','flagship'],
 '{"Layar":"6.73\" LTPO AMOLED 120Hz","Prosesor":"Snapdragon 8 Gen 3","RAM":"16 GB","Storage":"512 GB","Baterai":"5000 mAh"}',
 4.7, 5612),

('10000000-0000-0000-0000-000000000004',
 'Samsung Galaxy A55 5G 256GB Awesome Iceblue',
 'samsung-galaxy-a55-5g-256gb',
 'Samsung', 'Elektronik', 'Smartphone',
 'Samsung Galaxy A55 5G dengan desain premium, kamera 50MP OIS, Exynos 1480, dan layar Super AMOLED 6.6 inci.',
 'https://picsum.photos/seed/samsungA55/600/600',
 ARRAY['https://picsum.photos/seed/samsungA55/600/600'],
 ARRAY['samsung','galaxy a55','5g','midrange','android'],
 '{"Layar":"6.6\" Super AMOLED 120Hz","Prosesor":"Exynos 1480","RAM":"8 GB","Storage":"256 GB","Baterai":"5000 mAh"}',
 4.5, 9841),

('10000000-0000-0000-0000-000000000005',
 'OPPO Reno 11 Pro 5G 256GB Rock Grey',
 'oppo-reno-11-pro-5g-256gb',
 'OPPO', 'Elektronik', 'Smartphone',
 'OPPO Reno 11 Pro 5G dengan Dimensity 8200, kamera portrait 50MP, dan layar AMOLED 6.74 inci.',
 'https://picsum.photos/seed/opporeno11/600/600',
 ARRAY['https://picsum.photos/seed/opporeno11/600/600'],
 ARRAY['oppo','reno 11','5g','portrait','android'],
 '{"Layar":"6.74\" AMOLED 120Hz","Prosesor":"Dimensity 8200","RAM":"12 GB","Storage":"256 GB","Baterai":"4600 mAh"}',
 4.4, 4203),

-- Laptops
('10000000-0000-0000-0000-000000000006',
 'Apple MacBook Pro 14" M3 Pro 18GB 512GB Space Black',
 'apple-macbook-pro-14-m3-pro',
 'Apple', 'Elektronik', 'Laptop',
 'MacBook Pro 14" dengan chip M3 Pro, layar Liquid Retina XDR, baterai 18 jam.',
 'https://picsum.photos/seed/macm3/600/600',
 ARRAY['https://picsum.photos/seed/macm3/600/600'],
 ARRAY['macbook','apple','laptop','m3','pro'],
 '{"Layar":"14.2\" Liquid Retina XDR","Chip":"Apple M3 Pro","RAM":"18 GB","Storage":"512 GB SSD","Baterai":"18 jam"}',
 4.9, 3291),

('10000000-0000-0000-0000-000000000007',
 'ASUS ROG Zephyrus G14 2024 AMD Ryzen 9 RTX 4060',
 'asus-rog-zephyrus-g14-2024',
 'ASUS', 'Elektronik', 'Laptop Gaming',
 'ROG Zephyrus G14 2024 dengan panel OLED 3K 120Hz, Ryzen 9 8945HS, RTX 4060.',
 'https://picsum.photos/seed/rogzeph/600/600',
 ARRAY['https://picsum.photos/seed/rogzeph/600/600'],
 ARRAY['asus','rog','gaming','laptop','rtx 4060','amd'],
 '{"Layar":"14\" OLED 3K 120Hz","Prosesor":"AMD Ryzen 9 8945HS","GPU":"NVIDIA RTX 4060","RAM":"16 GB DDR5","Storage":"1 TB NVMe"}',
 4.7, 2108),

('10000000-0000-0000-0000-000000000008',
 'Lenovo ThinkPad X1 Carbon Gen 12 Intel Core Ultra 7',
 'lenovo-thinkpad-x1-carbon-gen12',
 'Lenovo', 'Elektronik', 'Laptop',
 'ThinkPad X1 Carbon Gen 12 dengan Intel Core Ultra 7, layar IPS 2K, bobot 1.12 kg.',
 'https://picsum.photos/seed/thinkpadx1/600/600',
 ARRAY['https://picsum.photos/seed/thinkpadx1/600/600'],
 ARRAY['lenovo','thinkpad','bisnis','laptop','intel','ultra slim'],
 '{"Layar":"14\" IPS 2.8K 120Hz","Prosesor":"Intel Core Ultra 7 165U","RAM":"16 GB","Storage":"512 GB SSD","Berat":"1.12 kg"}',
 4.8, 987),

-- Tablets
('10000000-0000-0000-0000-000000000009',
 'Apple iPad Pro 11" M4 256GB WiFi Space Black',
 'apple-ipad-pro-11-m4-256gb',
 'Apple', 'Elektronik', 'Tablet',
 'iPad Pro terbaru dengan chip M4, layar Ultra Retina XDR OLED tandem.',
 'https://picsum.photos/seed/ipadprom4/600/600',
 ARRAY['https://picsum.photos/seed/ipadprom4/600/600'],
 ARRAY['ipad','apple','tablet','m4','pro','oled'],
 '{"Layar":"11\" Ultra Retina XDR OLED","Chip":"Apple M4","RAM":"8 GB","Storage":"256 GB","Baterai":"10 jam"}',
 4.9, 2403),

('10000000-0000-0000-0000-000000000010',
 'Samsung Galaxy Tab S9 256GB WiFi Graphite + S Pen',
 'samsung-galaxy-tab-s9-256gb',
 'Samsung', 'Elektronik', 'Tablet',
 'Galaxy Tab S9 dengan Dynamic AMOLED 2X 11 inci, Snapdragon 8 Gen 2, IP68.',
 'https://picsum.photos/seed/galtabs9/600/600',
 ARRAY['https://picsum.photos/seed/galtabs9/600/600'],
 ARRAY['samsung','galaxy tab','tablet','s pen','android'],
 '{"Layar":"11\" Dynamic AMOLED 2X 120Hz","Prosesor":"Snapdragon 8 Gen 2","RAM":"8 GB","Storage":"256 GB","Baterai":"8400 mAh"}',
 4.7, 3876),

-- Audio
('10000000-0000-0000-0000-000000000011',
 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
 'sony-wh-1000xm5-headphones',
 'Sony', 'Elektronik', 'Headphone',
 'WH-1000XM5 dengan teknologi noise cancelling terdepan industri, baterai 30 jam.',
 'https://picsum.photos/seed/sonywh1000/600/600',
 ARRAY['https://picsum.photos/seed/sonywh1000/600/600'],
 ARRAY['sony','headphone','noise cancelling','wireless','anc'],
 '{"Baterai":"30 jam (ANC on)","Codec":"LDAC, AAC, SBC","Konektivitas":"Bluetooth 5.2 multipoint"}',
 4.8, 18934),

('10000000-0000-0000-0000-000000000012',
 'JBL Flip 6 Portable Bluetooth Speaker Squad',
 'jbl-flip-6-bluetooth-speaker',
 'JBL', 'Elektronik', 'Speaker',
 'JBL Flip 6 dengan suara bold & punchy, IP67 waterproof, baterai 12 jam.',
 'https://picsum.photos/seed/jblflip6/600/600',
 ARRAY['https://picsum.photos/seed/jblflip6/600/600'],
 ARRAY['jbl','speaker','bluetooth','waterproof','portable'],
 '{"Output":"30W RMS","Baterai":"12 jam","IP Rating":"IP67","Bluetooth":"5.1"}',
 4.7, 24701),

-- Gaming
('10000000-0000-0000-0000-000000000013',
 'Sony PlayStation 5 Slim Disc Edition',
 'sony-ps5-slim-disc-edition',
 'Sony', 'Gaming', 'Konsol',
 'PS5 Slim lebih ramping 30%, SSD custom 1TB, DualSense wireless controller.',
 'https://picsum.photos/seed/ps5slim/600/600',
 ARRAY['https://picsum.photos/seed/ps5slim/600/600'],
 ARRAY['ps5','playstation','sony','gaming','konsol'],
 '{"CPU":"AMD Zen 2 3.5 GHz","GPU":"AMD RDNA 2 10.3 TFLOPS","Storage":"1 TB SSD","RAM":"16 GB GDDR6"}',
 4.9, 6721),

('10000000-0000-0000-0000-000000000014',
 'Nintendo Switch OLED Model White',
 'nintendo-switch-oled-white',
 'Nintendo', 'Gaming', 'Konsol',
 'Nintendo Switch OLED dengan layar OLED 7 inci, stand adjustable, port LAN, 64GB internal.',
 'https://picsum.photos/seed/switcholed/600/600',
 ARRAY['https://picsum.photos/seed/switcholed/600/600'],
 ARRAY['nintendo','switch','oled','gaming','portable'],
 '{"Layar":"7\" OLED","Storage":"64 GB","Baterai":"4.5 - 9 jam","Mode":"TV, Tabletop, Handheld"}',
 4.8, 11243),

-- Smartwatch
('10000000-0000-0000-0000-000000000015',
 'Samsung Galaxy Watch 6 Classic 47mm Black Stainless',
 'samsung-galaxy-watch6-classic-47mm',
 'Samsung', 'Elektronik', 'Smartwatch',
 'Galaxy Watch 6 Classic dengan bezel putar ikonik, ECG, tekanan darah, sleep tracking.',
 'https://picsum.photos/seed/gwatch6/600/600',
 ARRAY['https://picsum.photos/seed/gwatch6/600/600'],
 ARRAY['samsung','galaxy watch','smartwatch','ecg','wearable'],
 '{"Layar":"1.4\" Super AMOLED","Baterai":"425 mAh","IP Rating":"IP68 MIL-STD-810H"}',
 4.6, 7823),

-- Home Appliances
('10000000-0000-0000-0000-000000000016',
 'Dyson V15 Detect Absolute Cordless Vacuum',
 'dyson-v15-detect-absolute',
 'Dyson', 'Rumah Tangga', 'Vacuum Cleaner',
 'Vacuum cordless Dyson V15 dengan laser deteksi debu, sensor piezo, suction 230AW.',
 'https://picsum.photos/seed/dysonv15/600/600',
 ARRAY['https://picsum.photos/seed/dysonv15/600/600'],
 ARRAY['dyson','vacuum','cordless','rumah tangga'],
 '{"Daya Hisap":"230 AW","Kapasitas":"0.76L","Baterai":"60 menit"}',
 4.6, 2847),

-- Beauty
('10000000-0000-0000-0000-000000000017',
 'Dyson Airwrap Complete Long Hair Styler Nickel/Copper',
 'dyson-airwrap-complete-long',
 'Dyson', 'Kecantikan', 'Alat Rambut',
 'Dyson Airwrap Complete Long dengan Coanda effect, 8 attachment untuk semua jenis rambut.',
 'https://picsum.photos/seed/dysonair/600/600',
 ARRAY['https://picsum.photos/seed/dysonair/600/600'],
 ARRAY['dyson','airwrap','rambut','styling','kecantikan'],
 '{"Teknologi":"Coanda effect airflow","Attachment":"8 buah","Tegangan":"220-240V"}',
 4.7, 6104),

-- Monitor
('10000000-0000-0000-0000-000000000018',
 'LG 27GP850-B UltraGear 27" QHD 165Hz IPS Gaming Monitor',
 'lg-27gp850-gaming-monitor',
 'LG', 'Elektronik', 'Monitor',
 'LG UltraGear 27GP850 dengan Nano IPS, QHD 2560x1440, 165Hz, 1ms GtG, G-Sync Compatible.',
 'https://picsum.photos/seed/lgmonitor/600/600',
 ARRAY['https://picsum.photos/seed/lgmonitor/600/600'],
 ARRAY['lg','monitor','gaming','qhd','165hz','nano ips'],
 '{"Layar":"27\" Nano IPS","Resolusi":"2560 x 1440","Refresh Rate":"165Hz","Response":"1ms GtG"}',
 4.7, 4512),

-- Fashion
('10000000-0000-0000-0000-000000000019',
 'Nike Air Max 270 React Mens Running Shoes',
 'nike-air-max-270-react-mens',
 'Nike', 'Fashion', 'Sepatu Olahraga',
 'Nike Air Max 270 React dengan unit Air terbesar, kenyamanan dan gaya maksimal.',
 'https://picsum.photos/seed/nikeam270/600/600',
 ARRAY['https://picsum.photos/seed/nikeam270/600/600'],
 ARRAY['nike','air max','sepatu','running','olahraga'],
 '{"Material":"Engineered mesh","Sole":"React foam + Air Max 270","Kegunaan":"Lifestyle/Casual"}',
 4.5, 15632),

('10000000-0000-0000-0000-000000000020',
 'Adidas Ultraboost 22 Core Black Running Shoes',
 'adidas-ultraboost-22-core-black',
 'Adidas', 'Fashion', 'Sepatu Olahraga',
 'Adidas Ultraboost 22 dengan Boost terbaru, Primeknit+, Continental rubber outsole.',
 'https://picsum.photos/seed/adidasub22/600/600',
 ARRAY['https://picsum.photos/seed/adidasub22/600/600'],
 ARRAY['adidas','ultraboost','sepatu','lari','running','boost'],
 '{"Material":"Primeknit+","Midsole":"Boost + Linear Energy Push","Outsole":"Continental Rubber"}',
 4.6, 9874),

('10000000-0000-0000-0000-000000000021',
 'Uniqlo Ultra Light Down Compact Jacket Olive',
 'uniqlo-ultra-light-down-jacket',
 'Uniqlo', 'Fashion', 'Jaket',
 'Jaket Uniqlo Ultra Light Down yang bisa dilipat ke saku, 90% bulu bebek, ringan hangat.',
 'https://picsum.photos/seed/uniqlodown/600/600',
 ARRAY['https://picsum.photos/seed/uniqlodown/600/600'],
 ARRAY['uniqlo','jaket','down','packable','fashion'],
 '{"Material":"100% Nylon / 90% Bulu Bebek","Berat":"~200g","Fitur":"Packable into pocket"}',
 4.5, 31204),

-- Camera
('10000000-0000-0000-0000-000000000022',
 'Fujifilm Instax Mini 12 Instant Camera Pastel Blue',
 'fujifilm-instax-mini-12-pastel-blue',
 'Fujifilm', 'Elektronik', 'Kamera Instan',
 'Instax Mini 12 dengan desain compact, mode Close-Up, Auto Exposure, film Instax Mini.',
 'https://picsum.photos/seed/instaxmini12/600/600',
 ARRAY['https://picsum.photos/seed/instaxmini12/600/600'],
 ARRAY['fujifilm','instax','kamera instan','polaroid','foto'],
 '{"Jenis":"Kamera Instan","Film":"Instax Mini","Ukuran Foto":"54mm x 86mm","Flash":"Built-in Auto"}',
 4.6, 22187)

ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      average_rating = EXCLUDED.average_rating,
      total_reviews  = EXCLUDED.total_reviews,
      updated_at     = NOW();

-- ── 4. OFFERS (prices per platform per product) ─────────────

-- iPhone 15 Pro Max
INSERT INTO offers (product_id, merchant_id, price, original_price, discount_pct, shop_name, shop_verified, free_shipping, rating, review_count, sold_count, affiliate_url, in_stock) VALUES
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',19299000,23000000,16,'iBox Official Store',        TRUE, TRUE,  4.9,3200,850,'https://harga.app/go/tokopedia/iphone15pm',TRUE),
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',18799000,22500000,16,'Apple Authorized Reseller',  TRUE, TRUE,  4.9,4100,1200,'https://harga.app/go/shopee/iphone15pm',   TRUE),
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003',19499000,23500000,17,'Lazada Official',            TRUE, FALSE, 4.8,1800,420,'https://harga.app/go/lazada/iphone15pm',   TRUE),
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004',19100000,22800000,16,'BL Mall Apple',              TRUE, TRUE,  4.7,900, 280,'https://harga.app/go/bukalapak/iphone15pm',TRUE),
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000005',19599000,23200000,16,'Blibli Apple Store',         TRUE, TRUE,  4.8,2100,510,'https://harga.app/go/blibli/iphone15pm',   TRUE),
  ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000006',18599000,21900000,15,'TikTok Flash Sale',          FALSE,FALSE, 4.6,1500,680,'https://harga.app/go/tiktok/iphone15pm',   TRUE)
ON CONFLICT (product_id, merchant_id) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

-- Samsung S24 Ultra
INSERT INTO offers (product_id, merchant_id, price, original_price, discount_pct, shop_name, shop_verified, free_shipping, rating, review_count, sold_count, affiliate_url, in_stock) VALUES
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001',16799000,19500000,14,'Samsung Official Store',TRUE, TRUE, 4.8,2100,640,'https://harga.app/go/tokopedia/s24ultra',TRUE),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002',16299000,19000000,14,'Samsung Store ID',      TRUE, TRUE, 4.8,3200,980,'https://harga.app/go/shopee/s24ultra',   TRUE),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003',16999000,19800000,14,'Samsung Lazada',        TRUE, FALSE,4.7,1200,310,'https://harga.app/go/lazada/s24ultra',   TRUE),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000005',17099000,19900000,14,'Blibli Samsung',        TRUE, TRUE, 4.7,890, 220,'https://harga.app/go/blibli/s24ultra',   TRUE),
  ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000006',15999000,18800000,15,'TikTok Flash Deal',     FALSE,FALSE,4.6,1800,720,'https://harga.app/go/tiktok/s24ultra',   TRUE)
ON CONFLICT (product_id, merchant_id) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

-- MacBook Pro M3
INSERT INTO offers (product_id, merchant_id, price, original_price, discount_pct, shop_name, shop_verified, free_shipping, rating, review_count, sold_count, affiliate_url, in_stock) VALUES
  ('10000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000001',29999000,32000000, 6,'iBox Official',           TRUE, TRUE, 4.9,820,180,'https://harga.app/go/tokopedia/macm3', TRUE),
  ('10000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000002',29499000,31500000, 6,'Apple Auth Reseller',     TRUE, TRUE, 4.9,1100,240,'https://harga.app/go/shopee/macm3',    TRUE),
  ('10000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000003',30299000,32500000, 7,'Lazada Official',         TRUE, FALSE,4.8,460, 90,'https://harga.app/go/lazada/macm3',    TRUE),
  ('10000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000005',30499000,32800000, 7,'Blibli Tech Store',       TRUE, TRUE, 4.8,380, 75,'https://harga.app/go/blibli/macm3',    TRUE)
ON CONFLICT (product_id, merchant_id) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

-- PS5 Slim
INSERT INTO offers (product_id, merchant_id, price, original_price, discount_pct, shop_name, shop_verified, free_shipping, rating, review_count, sold_count, affiliate_url, in_stock) VALUES
  ('10000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000001',7999000, 8500000, 6,'Sony Official Store',  TRUE, TRUE, 4.9,1800,520,'https://harga.app/go/tokopedia/ps5slim',TRUE),
  ('10000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000002',7799000, 8300000, 6,'Sony Store ID',        TRUE, TRUE, 4.9,2400,680,'https://harga.app/go/shopee/ps5slim',   TRUE),
  ('10000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000003',8099000, 8600000, 6,'Lazada Sony',          TRUE, FALSE,4.8,920, 210,'https://harga.app/go/lazada/ps5slim',   TRUE),
  ('10000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000005',8199000, 8700000, 6,'Blibli Game Store',    TRUE, TRUE, 4.8,780, 185,'https://harga.app/go/blibli/ps5slim',   TRUE)
ON CONFLICT (product_id, merchant_id) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

-- Sony WH-1000XM5
INSERT INTO offers (product_id, merchant_id, price, original_price, discount_pct, shop_name, shop_verified, free_shipping, rating, review_count, sold_count, affiliate_url, in_stock) VALUES
  ('10000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001',4299000,5000000,14,'Sony Official Store',  TRUE, TRUE, 4.8,3200,1200,'https://harga.app/go/tokopedia/wh1000xm5',TRUE),
  ('10000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000002',3999000,4700000,15,'Sony Store ID',        TRUE, TRUE, 4.9,4800,1900,'https://harga.app/go/shopee/wh1000xm5',   TRUE),
  ('10000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000003',4499000,5200000,13,'Lazada Sony',          TRUE, FALSE,4.7,1800,620,'https://harga.app/go/lazada/wh1000xm5',   TRUE),
  ('10000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000005',4599000,5300000,13,'Blibli Electronics',   TRUE, TRUE, 4.7,1200,380,'https://harga.app/go/blibli/wh1000xm5',   TRUE),
  ('10000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000006',3799000,4500000,16,'TikTok Flash Sale',    FALSE,FALSE,4.6,2900,1400,'https://harga.app/go/tiktok/wh1000xm5',   TRUE)
ON CONFLICT (product_id, merchant_id) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

-- Nike Air Max 270
INSERT INTO offers (product_id, merchant_id, price, original_price, discount_pct, shop_name, shop_verified, free_shipping, rating, review_count, sold_count, affiliate_url, in_stock) VALUES
  ('10000000-0000-0000-0000-000000000019','00000000-0000-0000-0000-000000000001',1899000,2200000,14,'Nike Official Store',  TRUE, TRUE, 4.7,2800,3200,'https://harga.app/go/tokopedia/nikeam270',TRUE),
  ('10000000-0000-0000-0000-000000000019','00000000-0000-0000-0000-000000000002',1799000,2100000,14,'Nike Indonesia',       TRUE, TRUE, 4.6,3600,4800,'https://harga.app/go/shopee/nikeam270',   TRUE),
  ('10000000-0000-0000-0000-000000000019','00000000-0000-0000-0000-000000000003',1949000,2300000,15,'Lazada Nike',          TRUE, FALSE,4.5,1200,1400,'https://harga.app/go/lazada/nikeam270',   TRUE),
  ('10000000-0000-0000-0000-000000000019','00000000-0000-0000-0000-000000000004',1849000,2200000,16,'Bukalapak Fashion',    FALSE,TRUE, 4.5,890, 980,'https://harga.app/go/bukalapak/nikeam270',TRUE),
  ('10000000-0000-0000-0000-000000000019','00000000-0000-0000-0000-000000000005',1999000,2400000,17,'Blibli Fashion',       TRUE, TRUE, 4.6,1400,1600,'https://harga.app/go/blibli/nikeam270',   TRUE),
  ('10000000-0000-0000-0000-000000000019','00000000-0000-0000-0000-000000000006',1699000,2000000,15,'TikTok Fashion Sale',  FALSE,FALSE,4.4,4200,6800,'https://harga.app/go/tiktok/nikeam270',   TRUE)
ON CONFLICT (product_id, merchant_id) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

-- Uniqlo Down Jacket
INSERT INTO offers (product_id, merchant_id, price, original_price, discount_pct, shop_name, shop_verified, free_shipping, rating, review_count, sold_count, affiliate_url, in_stock) VALUES
  ('10000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000001',599000, 699000,14,'Uniqlo Official',      TRUE, TRUE, 4.5,4200,8900,'https://harga.app/go/tokopedia/uniqlodown',TRUE),
  ('10000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000002',549000, 649000,15,'UNIQLO Indonesia',     TRUE, TRUE, 4.6,6800,14000,'https://harga.app/go/shopee/uniqlodown',   TRUE),
  ('10000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000003',619000, 719000,14,'Lazada Fashion',       TRUE, FALSE,4.4,1800,3200,'https://harga.app/go/lazada/uniqlodown',   TRUE),
  ('10000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000006',529000, 620000,15,'TikTok Fashion',       FALSE,FALSE,4.3,5600,12000,'https://harga.app/go/tiktok/uniqlodown',   TRUE)
ON CONFLICT (product_id, merchant_id) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

-- ── 5. SAMPLE PRICE HISTORY for iPhone (demonstration) ──────

INSERT INTO price_history (offer_id, price, recorded_at)
SELECT
  o.id,
  CASE
    WHEN gs.day % 5 = 0 THEN 18299000
    WHEN gs.day % 3 = 0 THEN 19199000
    ELSE 18799000
  END,
  NOW() - (gs.day * INTERVAL '1 day')
FROM offers o
JOIN products p ON p.id = o.product_id
CROSS JOIN generate_series(0, 29) AS gs(day)
WHERE p.slug = 'apple-iphone-15-pro-max-256gb'
  AND NOT EXISTS (
    SELECT 1 FROM price_history ph
    WHERE ph.offer_id = o.id
    AND ph.recorded_at > NOW() - INTERVAL '31 days'
  );

-- ============================================================
-- Done! Verify with:
--   SELECT COUNT(*) FROM merchants;        -- expect 6
--   SELECT COUNT(*) FROM products;         -- expect 22
--   SELECT COUNT(*) FROM offers;           -- expect 20+
-- ============================================================
