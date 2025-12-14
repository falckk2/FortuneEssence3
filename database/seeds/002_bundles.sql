-- Seed: Bundle products
-- Date: 2025-12-13
-- Description: Inserts 3 mix-and-match essential oil bundle products

-- Insert Duo Pack (2 oils, 169 SEK, saves 9 kr = 5.06% discount)
INSERT INTO products (
  name,
  description,
  price,
  category,
  sku,
  stock,
  weight,
  length,
  width,
  height,
  is_active,
  name_sv,
  description_sv,
  name_en,
  description_en,
  images
) VALUES (
  'Duo Pack - Välj 2 Oljor',
  'Välj 2 eteriska oljor (10ml vardera) och spara 9 kr! Normal pris: 178 kr, Du betalar: 169 kr.',
  169.00,
  'bundles',
  'BUNDLE-2PACK',
  999, -- Virtual stock - always available if components are in stock
  0.10, -- 2x 50g approx
  12.0,
  6.0,
  8.0,
  true,
  'Duo Pack - Välj 2 Oljor',
  'Skapa din perfekta kombination! Välj 2 eteriska oljor från vårt sortiment och spara 9 kr. Perfekt för att testa nya dofter eller komplettera din samling.',
  'Duo Pack - Choose 2 Oils',
  'Create your perfect combination! Choose 2 essential oils from our range and save 9 kr. Perfect for trying new scents or complementing your collection.',
  ARRAY['/images/bundles/duo-pack.png']
)
ON CONFLICT (sku) DO UPDATE SET
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  description_sv = EXCLUDED.description_sv,
  description_en = EXCLUDED.description_en;

-- Insert Trio Pack (3 oils, 239 SEK, saves 28 kr = 10.49% discount)
INSERT INTO products (
  name,
  description,
  price,
  category,
  sku,
  stock,
  weight,
  length,
  width,
  height,
  is_active,
  name_sv,
  description_sv,
  name_en,
  description_en,
  images
) VALUES (
  'Trio Pack - Välj 3 Oljor',
  'Välj 3 eteriska oljor (10ml vardera) och spara 28 kr! Normal pris: 267 kr, Du betalar: 239 kr.',
  239.00,
  'bundles',
  'BUNDLE-3PACK',
  999,
  0.15,
  12.0,
  9.0,
  8.0,
  true,
  'Trio Pack - Välj 3 Oljor',
  'Bästa valet! Skapa din perfekta trio av eteriska oljor och spara 28 kr. Välj tre oljor som kompletterar varandra för ditt välmående.',
  'Trio Pack - Choose 3 Oils',
  'Best value! Create your perfect trio of essential oils and save 28 kr. Choose three oils that complement each other for your wellbeing.',
  ARRAY['/images/bundles/trio-pack.png']
)
ON CONFLICT (sku) DO UPDATE SET
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  description_sv = EXCLUDED.description_sv,
  description_en = EXCLUDED.description_en;

-- Insert Mini Kit (4 oils, 299 SEK, saves 57 kr = 16.01% discount)
INSERT INTO products (
  name,
  description,
  price,
  category,
  sku,
  stock,
  weight,
  length,
  width,
  height,
  is_active,
  name_sv,
  description_sv,
  name_en,
  description_en,
  images
) VALUES (
  'Mini Kit - Välj 4 Oljor',
  'Välj 4 eteriska oljor (10ml vardera) och spara 57 kr! Normal pris: 356 kr, Du betalar: 299 kr.',
  299.00,
  'bundles',
  'BUNDLE-4PACK',
  999,
  0.20,
  15.0,
  12.0,
  8.0,
  true,
  'Mini Kit - Välj 4 Oljor',
  'Maximalt värde! Bygg ditt eget starter kit med 4 eteriska oljor och spara 57 kr. Perfekt för nybörjare eller för att utforska nya doftkombinationer.',
  'Mini Kit - Choose 4 Oils',
  'Maximum value! Build your own starter kit with 4 essential oils and save 57 kr. Perfect for beginners or exploring new scent combinations.',
  ARRAY['/images/bundles/mini-kit.png']
)
ON CONFLICT (sku) DO UPDATE SET
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  description_sv = EXCLUDED.description_sv,
  description_en = EXCLUDED.description_en;

-- Insert bundle configurations
-- Duo Pack configuration
INSERT INTO bundle_configurations (bundle_product_id, required_quantity, allowed_category, discount_percentage)
SELECT id, 2, 'essential-oils'::product_category, 5.06
FROM products
WHERE sku = 'BUNDLE-2PACK'
ON CONFLICT (bundle_product_id) DO UPDATE SET
  required_quantity = EXCLUDED.required_quantity,
  allowed_category = EXCLUDED.allowed_category,
  discount_percentage = EXCLUDED.discount_percentage;

-- Trio Pack configuration
INSERT INTO bundle_configurations (bundle_product_id, required_quantity, allowed_category, discount_percentage)
SELECT id, 3, 'essential-oils'::product_category, 10.49
FROM products
WHERE sku = 'BUNDLE-3PACK'
ON CONFLICT (bundle_product_id) DO UPDATE SET
  required_quantity = EXCLUDED.required_quantity,
  allowed_category = EXCLUDED.allowed_category,
  discount_percentage = EXCLUDED.discount_percentage;

-- Mini Kit configuration
INSERT INTO bundle_configurations (bundle_product_id, required_quantity, allowed_category, discount_percentage)
SELECT id, 4, 'essential-oils'::product_category, 16.01
FROM products
WHERE sku = 'BUNDLE-4PACK'
ON CONFLICT (bundle_product_id) DO UPDATE SET
  required_quantity = EXCLUDED.required_quantity,
  allowed_category = EXCLUDED.allowed_category,
  discount_percentage = EXCLUDED.discount_percentage;

-- Verify insertions
SELECT
  p.name,
  p.price,
  p.sku,
  bc.required_quantity,
  bc.discount_percentage
FROM products p
JOIN bundle_configurations bc ON p.id = bc.bundle_product_id
WHERE p.category = 'bundles'
ORDER BY bc.required_quantity;
