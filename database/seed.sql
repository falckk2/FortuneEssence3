-- Seed data for Fortune Essence e-commerce platform

-- Additional essential oil products
INSERT INTO products (
  name, description, price, category, sku, weight, length, width, height,
  name_sv, description_sv, name_en, description_en, stock
) VALUES
(
  'Tea Tree Eterisk Olja', 
  'Australiensisk tea tree olja med antibakteriella egenskaper.', 
  279.00, 
  'essential-oils', 
  'TET-EO-004', 
  0.05, 
  10.0, 
  3.0, 
  3.0,
  'Tea Tree Eterisk Olja',
  'Australiensisk tea tree olja med antibakteriella egenskaper.',
  'Tea Tree Essential Oil',
  'Australian tea tree oil with antibacterial properties.',
  45
),
(
  'Pepparmynta Eterisk Olja', 
  'Uppfriskande pepparmynta eterisk olja från Oregon.', 
  319.00, 
  'essential-oils', 
  'PEP-EO-005', 
  0.05, 
  10.0, 
  3.0, 
  3.0,
  'Pepparmynta Eterisk Olja',
  'Uppfriskande pepparmynta eterisk olja från Oregon.',
  'Peppermint Essential Oil',
  'Refreshing peppermint essential oil from Oregon.',
  30
),
(
  'Citron Eterisk Olja', 
  'Energigivande citron eterisk olja från Italien.', 
  259.00, 
  'essential-oils', 
  'CIT-EO-006', 
  0.05, 
  10.0, 
  3.0, 
  3.0,
  'Citron Eterisk Olja',
  'Energigivande citron eterisk olja från Italien.',
  'Lemon Essential Oil',
  'Energizing lemon essential oil from Italy.',
  40
),
(
  'Rosmarin Eterisk Olja', 
  'Stimulerande rosmarin eterisk olja från Spanien.', 
  289.00, 
  'essential-oils', 
  'ROS-EO-007', 
  0.05, 
  10.0, 
  3.0, 
  3.0,
  'Rosmarin Eterisk Olja',
  'Stimulerande rosmarin eterisk olja från Spanien.',
  'Rosemary Essential Oil',
  'Stimulating rosemary essential oil from Spain.',
  25
);

-- Carrier oils
INSERT INTO products (
  name, description, price, category, sku, weight, length, width, height,
  name_sv, description_sv, name_en, description_en, stock
) VALUES
(
  'Jojoba Bärarolja', 
  'Ren jojoba bärarolja. Perfekt för hudvård och massage.', 
  199.00, 
  'carrier-oils', 
  'JOJ-CO-008', 
  0.1, 
  15.0, 
  4.0, 
  4.0,
  'Jojoba Bärarolja',
  'Ren jojoba bärarolja. Perfekt för hudvård och massage.',
  'Jojoba Carrier Oil',
  'Pure jojoba carrier oil. Perfect for skincare and massage.',
  60
),
(
  'Kokosolja Bärarolja', 
  'Ekologisk kokosolja. Naturligt fuktighetskräm.', 
  159.00, 
  'carrier-oils', 
  'KOK-CO-009', 
  0.2, 
  12.0, 
  8.0, 
  8.0,
  'Kokosolja Bärarolja',
  'Ekologisk kokosolja. Naturligt fuktighetskräm.',
  'Coconut Carrier Oil',
  'Organic coconut oil. Natural moisturizer.',
  40
),
(
  'Mandelolja Bärarolja', 
  'Söt mandelolja. Mild och lämplig för känslig hud.', 
  179.00, 
  'carrier-oils', 
  'MAN-CO-010', 
  0.1, 
  15.0, 
  4.0, 
  4.0,
  'Mandelolja Bärarolja',
  'Söt mandelolja. Mild och lämplig för känslig hud.',
  'Sweet Almond Carrier Oil',
  'Sweet almond oil. Gentle and suitable for sensitive skin.',
  35
);

-- Diffusers and accessories
INSERT INTO products (
  name, description, price, category, sku, weight, length, width, height,
  name_sv, description_sv, name_en, description_en, stock
) VALUES
(
  'Keramisk Diffuser Vit', 
  'Minimalistisk keramisk diffuser i vitt. Tyst drift.', 
  699.00, 
  'diffusers', 
  'CER-WH-011', 
  0.6, 
  12.0, 
  12.0, 
  10.0,
  'Keramisk Diffuser Vit',
  'Minimalistisk keramisk diffuser i vitt. Tyst drift.',
  'White Ceramic Diffuser',
  'Minimalist white ceramic diffuser. Quiet operation.',
  15
),
(
  'USB Diffuser Portabel', 
  'Kompakt USB-diffuser för resor och kontor.', 
  299.00, 
  'diffusers', 
  'USB-POR-012', 
  0.2, 
  8.0, 
  5.0, 
  5.0,
  'USB Diffuser Portabel',
  'Kompakt USB-diffuser för resor och kontor.',
  'Portable USB Diffuser',
  'Compact USB diffuser for travel and office.',
  25
),
(
  'Aromaterapi Halsband', 
  'Elegant halsband med lavasten för eteriska oljor.', 
  149.00, 
  'accessories', 
  'ARO-HAL-013', 
  0.03, 
  20.0, 
  5.0, 
  1.0,
  'Aromaterapi Halsband',
  'Elegant halsband med lavasten för eteriska oljor.',
  'Aromatherapy Necklace',
  'Elegant necklace with lava stones for essential oils.',
  30
),
(
  'Glasflaskor 10ml (6-pack)', 
  'Mörka glasflaskor med droppkork. Perfekt för blandningar.', 
  89.00, 
  'accessories', 
  'GLA-10-014', 
  0.15, 
  15.0, 
  10.0, 
  3.0,
  'Glasflaskor 10ml (6-pack)',
  'Mörka glasflaskor med droppkork. Perfekt för blandningar.',
  'Glass Bottles 10ml (6-pack)',
  'Dark glass bottles with dropper caps. Perfect for blends.',
  50
);

-- Gift sets
INSERT INTO products (
  name, description, price, category, sku, weight, length, width, height,
  name_sv, description_sv, name_en, description_en, stock
) VALUES
(
  'Avslappning Presentset', 
  'Presentset med lavendel, kamomilla och ylang ylang oljor.', 
  699.00, 
  'gift-sets', 
  'AVS-SET-015', 
  0.2, 
  25.0, 
  20.0, 
  5.0,
  'Avslappning Presentset',
  'Presentset med lavendel, kamomilla och ylang ylang oljor.',
  'Relaxation Gift Set',
  'Gift set with lavender, chamomile and ylang ylang oils.',
  20
),
(
  'Energi Presentset', 
  'Energigivande presentset med citrus och mynta oljor.', 
  649.00, 
  'gift-sets', 
  'ENE-SET-016', 
  0.2, 
  25.0, 
  20.0, 
  5.0,
  'Energi Presentset',
  'Energigivande presentset med citrus och mynta oljor.',
  'Energy Gift Set',
  'Energizing gift set with citrus and mint oils.',
  18
),
(
  'Nybörjar Startset', 
  'Komplett startset för nybörjare med diffuser och 4 oljor.', 
  999.00, 
  'gift-sets', 
  'NYB-SET-017', 
  1.0, 
  30.0, 
  25.0, 
  15.0,
  'Nybörjar Startset',
  'Komplett startset för nybörjare med diffuser och 4 oljor.',
  'Beginner Starter Set',
  'Complete starter set for beginners with diffuser and 4 oils.',
  12
);

-- Update inventory with new products
INSERT INTO inventory (product_id, quantity, reorder_level)
SELECT id, stock, 
  CASE 
    WHEN category = 'essential-oils' THEN 15
    WHEN category = 'carrier-oils' THEN 10
    WHEN category = 'diffusers' THEN 5
    WHEN category = 'accessories' THEN 20
    WHEN category = 'gift-sets' THEN 5
    ELSE 10
  END as reorder_level
FROM products 
WHERE id NOT IN (SELECT product_id FROM inventory);

-- Add more shipping options for different Nordic countries
INSERT INTO shipping_rates (name, description, price, estimated_days, country, max_weight) VALUES
('PostNord Nordic Standard', 'Standard delivery to Norway', 89.00, 5, 'Norway', 10.0),
('PostNord Nordic Express', 'Express delivery to Norway', 149.00, 2, 'Norway', 10.0),
('PostNord Nordic Standard', 'Standard delivery to Denmark', 79.00, 4, 'Denmark', 10.0),
('PostNord Nordic Express', 'Express delivery to Denmark', 129.00, 2, 'Denmark', 10.0),
('PostNord Nordic Standard', 'Standard delivery to Finland', 99.00, 6, 'Finland', 10.0),
('PostNord Nordic Express', 'Express delivery to Finland', 169.00, 3, 'Finland', 10.0);

-- Sample customer for testing (password would be hashed in real implementation)
INSERT INTO customers (
  email, first_name, last_name, phone, street, city, postal_code, 
  country, consent_given, marketing_opt_in
) VALUES
(
  'test@fortuneessence.se', 
  'Anna', 
  'Andersson', 
  '+46701234567', 
  'Storgatan 1', 
  'Stockholm', 
  '111 22', 
  'Sweden', 
  true, 
  true
);

-- Sample order for testing
INSERT INTO orders (
  customer_id, 
  items, 
  total, 
  tax, 
  shipping, 
  status, 
  shipping_address, 
  billing_address, 
  payment_method, 
  payment_id
)
SELECT 
  id as customer_id,
  '[{"productId":"' || (SELECT id FROM products WHERE sku = 'LAV-EO-001') || '","productName":"Lavendel Eterisk Olja","quantity":2,"price":299.00,"total":598.00}]'::jsonb as items,
  647.00 as total,
  129.40 as tax,
  49.00 as shipping,
  'confirmed' as status,
  '{"street":"Storgatan 1","city":"Stockholm","postalCode":"111 22","country":"Sweden"}'::jsonb as shipping_address,
  '{"street":"Storgatan 1","city":"Stockholm","postalCode":"111 22","country":"Sweden"}'::jsonb as billing_address,
  'klarna' as payment_method,
  'test_payment_123' as payment_id
FROM customers 
WHERE email = 'test@fortuneessence.se'
LIMIT 1;