-- Migration: Multi-Carrier Shipping System
-- Description: Adds support for 8 Swedish shipping carriers with label generation and smart filtering
-- Date: 2025-12-25

-- ========================================
-- 1. Enhance shipping_rates table
-- ========================================

ALTER TABLE shipping_rates
ADD COLUMN IF NOT EXISTS carrier_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS service_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS color_scheme VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_eco_friendly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_weight DECIMAL(8,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone_based BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS base_price DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS price_per_kg DECIMAL(8,2);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shipping_rates_carrier_code ON shipping_rates(carrier_code);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_service_type ON shipping_rates(service_type);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_eco_friendly ON shipping_rates(is_eco_friendly);

-- ========================================
-- 2. Create shipping_labels table
-- ========================================

CREATE TABLE IF NOT EXISTS shipping_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number VARCHAR(100) NOT NULL UNIQUE,
  carrier_code VARCHAR(50) NOT NULL,
  label_pdf_url TEXT NOT NULL,
  barcode_data TEXT NOT NULL,
  qr_code_data TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_order_label UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_shipping_labels_order_id ON shipping_labels(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_tracking_number ON shipping_labels(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_carrier_code ON shipping_labels(carrier_code);

-- ========================================
-- 3. Enhance orders table
-- ========================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS carrier VARCHAR(100),
ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_carrier ON orders(carrier);

-- ========================================
-- 4. Create carrier_pricing_rules table
-- ========================================

CREATE TABLE IF NOT EXISTS carrier_pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  carrier_code VARCHAR(50) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  country VARCHAR(50) NOT NULL,
  weight_from DECIMAL(8,3) NOT NULL,
  weight_to DECIMAL(8,3) NOT NULL,
  postal_code_from VARCHAR(10),
  postal_code_to VARCHAR(10),
  base_price DECIMAL(8,2) NOT NULL,
  price_per_kg DECIMAL(8,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carrier_pricing_carrier ON carrier_pricing_rules(carrier_code);
CREATE INDEX IF NOT EXISTS idx_carrier_pricing_country ON carrier_pricing_rules(country);

-- ========================================
-- 5. Seed Carrier Data
-- ========================================

-- Clear existing shipping rates only if they exist (safe idempotent operation)
-- Use INSERT ... ON CONFLICT for idempotency instead of DELETE
-- This preserves custom shipping rates if migration is re-run
-- DELETE FROM shipping_rates;

-- PostNord (Swedish national postal service)
INSERT INTO shipping_rates (
  name, description, price, estimated_days, country, max_weight, min_weight,
  carrier_code, service_type, features, logo_url, color_scheme, is_eco_friendly
) VALUES
('PostNord Standard', 'Standard leverans inom Sverige', 49.00, 3, 'Sweden', 10.0, 0,
 'POSTNORD', 'STANDARD', '["Spårning", "Försäkring upp till 1000 SEK"]'::jsonb,
 '/images/carriers/postnord.svg', '#FFDB00', false),

('PostNord Paket', 'Paketleverans med spårning', 69.00, 2, 'Sweden', 35.0, 0,
 'POSTNORD', 'PAKET', '["Spårning", "Försäkring", "Leveransavi"]'::jsonb,
 '/images/carriers/postnord.svg', '#FFDB00', false),

('PostNord Express', 'Expressleverans nästa arbetsdag', 89.00, 1, 'Sweden', 35.0, 0,
 'POSTNORD', 'EXPRESS', '["Spårning", "Försäkring", "Leveransavi", "Express"]'::jsonb,
 '/images/carriers/postnord.svg', '#FFDB00', false);

-- DHL (International courier)
INSERT INTO shipping_rates (
  name, description, price, estimated_days, country, max_weight, min_weight,
  carrier_code, service_type, features, logo_url, color_scheme, is_eco_friendly
) VALUES
('DHL Standard', 'Standard paketleverans', 69.00, 2, 'Sweden', 31.5, 0,
 'DHL', 'STANDARD', '["Spårning", "Försäkring", "SMS-avisering"]'::jsonb,
 '/images/carriers/dhl.svg', '#FFCC00', false),

('DHL Express', 'Expressleverans före kl 12:00', 119.00, 1, 'Sweden', 31.5, 0,
 'DHL', 'EXPRESS', '["Spårning", "Försäkring", "SMS-avisering", "Express", "Signaturkrav"]'::jsonb,
 '/images/carriers/dhl.svg', '#FFCC00', false);

-- Bring (Nordic carrier)
INSERT INTO shipping_rates (
  name, description, price, estimated_days, country, max_weight, min_weight,
  carrier_code, service_type, features, logo_url, color_scheme, is_eco_friendly
) VALUES
('Bring Hemleverans', 'Leverans direkt hem till dörren', 79.00, 2, 'Sweden', 35.0, 0,
 'BRING', 'HOME_DELIVERY', '["Spårning", "Hemleverans", "SMS-avisering"]'::jsonb,
 '/images/carriers/bring.svg', '#00B2A9', false),

('Bring Servicepoint', 'Leverans till närmaste servicepunkt', 59.00, 2, 'Sweden', 35.0, 0,
 'BRING', 'SERVICEPOINT', '["Spårning", "Servicepunkt", "SMS-avisering", "Förlängd uthämtningstid"]'::jsonb,
 '/images/carriers/bring.svg', '#00B2A9', false),

('Bring Pickup', 'Upphämtning vid utlämningsställe', 49.00, 3, 'Sweden', 35.0, 0,
 'BRING', 'PICKUP', '["Spårning", "Servicepunkt", "Billigaste alternativet"]'::jsonb,
 '/images/carriers/bring.svg', '#00B2A9', false);

-- DB Schenker (Logistics company)
INSERT INTO shipping_rates (
  name, description, price, estimated_days, country, max_weight, min_weight,
  carrier_code, service_type, features, logo_url, color_scheme, is_eco_friendly
) VALUES
('DB Schenker Home Delivery', 'Hemleverans med tidsfönster', 89.00, 2, 'Sweden', 35.0, 0,
 'DB_SCHENKER', 'HOME_DELIVERY', '["Spårning", "Hemleverans", "Tidsfönster", "SMS-avisering"]'::jsonb,
 '/images/carriers/db-schenker.svg', '#EC0016', false),

('DB Schenker Parcel Box', 'Leverans till paketbox', 59.00, 2, 'Sweden', 20.0, 0,
 'DB_SCHENKER', 'PARCEL_BOX', '["Spårning", "Paketbox", "24/7 tillgång"]'::jsonb,
 '/images/carriers/db-schenker.svg', '#EC0016', false),

('DB Schenker Servicepoint', 'Leverans till servicepunkt', 49.00, 2, 'Sweden', 35.0, 0,
 'DB_SCHENKER', 'SERVICEPOINT', '["Spårning", "Servicepunkt", "Förlängd uthämtningstid"]'::jsonb,
 '/images/carriers/db-schenker.svg', '#EC0016', false);

-- Instabee (Same-day delivery)
INSERT INTO shipping_rates (
  name, description, price, estimated_days, country, max_weight, min_weight,
  carrier_code, service_type, features, logo_url, color_scheme, is_eco_friendly
) VALUES
('Instabee Home Delivery', 'Snabb hemleverans samma dag', 99.00, 0, 'Sweden', 20.0, 0,
 'INSTABEE', 'HOME_DELIVERY', '["Spårning", "Samma dag", "SMS-avisering", "Live-tracking"]'::jsonb,
 '/images/carriers/instabee.svg', '#FF6B6B', false),

('Instabee Evening Delivery', 'Kvällsleverans 17-21', 109.00, 0, 'Sweden', 20.0, 0,
 'INSTABEE', 'EVENING_DELIVERY', '["Spårning", "Kvällsleverans", "SMS-avisering", "Live-tracking"]'::jsonb,
 '/images/carriers/instabee.svg', '#FF6B6B', false);

-- Budbee (Eco-friendly last-mile delivery)
INSERT INTO shipping_rates (
  name, description, price, estimated_days, country, max_weight, min_weight,
  carrier_code, service_type, features, logo_url, color_scheme, is_eco_friendly
) VALUES
('Budbee Home Delivery', 'Hemleverans nästa arbetsdag', 69.00, 1, 'Sweden', 20.0, 0,
 'BUDBEE', 'HOME_DELIVERY', '["Spårning", "SMS-avisering", "Tidsfönster", "Miljövänlig"]'::jsonb,
 '/images/carriers/budbee.svg', '#00D9A5', true),

('Budbee Box', 'Leverans till Budbee Box', 49.00, 1, 'Sweden', 20.0, 0,
 'BUDBEE', 'BOX', '["Spårning", "SMS-avisering", "24/7 tillgång", "Miljövänlig"]'::jsonb,
 '/images/carriers/budbee.svg', '#00D9A5', true),

('Budbee Locker', 'Leverans till paketskåp', 39.00, 1, 'Sweden', 15.0, 0,
 'BUDBEE', 'LOCKER', '["Spårning", "SMS-avisering", "24/7 tillgång", "Billigaste alternativet", "Miljövänlig"]'::jsonb,
 '/images/carriers/budbee.svg', '#00D9A5', true);

-- Instabox (Locker delivery service)
INSERT INTO shipping_rates (
  name, description, price, estimated_days, country, max_weight, min_weight,
  carrier_code, service_type, features, logo_url, color_scheme, is_eco_friendly
) VALUES
('Instabox Locker', 'Leverans till paketskåp', 39.00, 1, 'Sweden', 20.0, 0,
 'INSTABOX', 'LOCKER', '["Spårning", "SMS-avisering", "24/7 tillgång", "Billigaste alternativet"]'::jsonb,
 '/images/carriers/instabox.svg', '#6C5CE7', false),

('Instabox Servicepoint', 'Leverans till servicepunkt', 49.00, 1, 'Sweden', 20.0, 0,
 'INSTABOX', 'SERVICEPOINT', '["Spårning", "SMS-avisering", "Förlängd uthämtningstid"]'::jsonb,
 '/images/carriers/instabox.svg', '#6C5CE7', false);

-- Early Bird (Eco-friendly carrier)
INSERT INTO shipping_rates (
  name, description, price, estimated_days, country, max_weight, min_weight,
  carrier_code, service_type, features, logo_url, color_scheme, is_eco_friendly
) VALUES
('Early Bird Eco Standard', 'Klimatneutral standardleverans', 59.00, 3, 'Sweden', 20.0, 0,
 'EARLY_BIRD', 'ECO_STANDARD', '["Spårning", "Klimatneutral", "Fossilfri transport", "Kompenserar CO2"]'::jsonb,
 '/images/carriers/early-bird.svg', '#4CAF50', true),

('Early Bird Eco Express', 'Klimatneutral expressleverans', 89.00, 1, 'Sweden', 20.0, 0,
 'EARLY_BIRD', 'ECO_EXPRESS', '["Spårning", "Klimatneutral", "Fossilfri transport", "Express", "Kompenserar CO2"]'::jsonb,
 '/images/carriers/early-bird.svg', '#4CAF50', true);

-- ========================================
-- 6. Carrier Pricing Rules (Weight-based)
-- ========================================

-- PostNord weight-based pricing
INSERT INTO carrier_pricing_rules (
  carrier_code, service_type, country, weight_from, weight_to, base_price, price_per_kg
) VALUES
('POSTNORD', 'STANDARD', 'Sweden', 0, 2.0, 49.00, 0),
('POSTNORD', 'STANDARD', 'Sweden', 2.0, 5.0, 59.00, 5.00),
('POSTNORD', 'STANDARD', 'Sweden', 5.0, 10.0, 69.00, 7.00);

-- DHL weight-based pricing
INSERT INTO carrier_pricing_rules (
  carrier_code, service_type, country, weight_from, weight_to, base_price, price_per_kg
) VALUES
('DHL', 'STANDARD', 'Sweden', 0, 5.0, 69.00, 0),
('DHL', 'STANDARD', 'Sweden', 5.0, 15.0, 89.00, 6.00),
('DHL', 'STANDARD', 'Sweden', 15.0, 31.5, 119.00, 8.00);

-- Bring weight-based pricing
INSERT INTO carrier_pricing_rules (
  carrier_code, service_type, country, weight_from, weight_to, base_price, price_per_kg
) VALUES
('BRING', 'HOME_DELIVERY', 'Sweden', 0, 5.0, 79.00, 0),
('BRING', 'HOME_DELIVERY', 'Sweden', 5.0, 15.0, 99.00, 5.00),
('BRING', 'HOME_DELIVERY', 'Sweden', 15.0, 35.0, 129.00, 7.00);

COMMENT ON TABLE shipping_labels IS 'Stores generated shipping labels with tracking numbers and PDF URLs';
COMMENT ON TABLE carrier_pricing_rules IS 'Dynamic pricing rules based on weight and destination';
COMMENT ON COLUMN shipping_rates.carrier_code IS 'Unique carrier identifier (e.g., POSTNORD, DHL)';
COMMENT ON COLUMN shipping_rates.features IS 'JSON array of service features like "Spårning", "Express"';
COMMENT ON COLUMN shipping_rates.is_eco_friendly IS 'Indicates if carrier uses eco-friendly methods';
