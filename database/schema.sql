-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE product_category AS ENUM (
  'essential-oils',
  'carrier-oils',
  'diffusers',
  'accessories',
  'gift-sets',
  'bundles'
);

CREATE TYPE order_status AS ENUM (
  'pending', 
  'confirmed', 
  'processing', 
  'shipped', 
  'delivered', 
  'cancelled'
);

CREATE TYPE payment_method AS ENUM (
  'swish', 
  'klarna', 
  'card', 
  'bank-transfer'
);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  country VARCHAR(50) DEFAULT 'Sweden',
  region VARCHAR(100),
  consent_given BOOLEAN NOT NULL DEFAULT false,
  marketing_opt_in BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price > 0),
  category product_category NOT NULL,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku VARCHAR(50) UNIQUE NOT NULL,
  weight DECIMAL(8,3) NOT NULL CHECK (weight > 0),
  length DECIMAL(8,2) NOT NULL CHECK (length > 0),
  width DECIMAL(8,2) NOT NULL CHECK (width > 0),
  height DECIMAL(8,2) NOT NULL CHECK (height > 0),
  is_active BOOLEAN DEFAULT true,
  name_sv VARCHAR(200) NOT NULL,
  description_sv TEXT NOT NULL,
  name_en VARCHAR(200) NOT NULL,
  description_en TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Carts table
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT cart_identifier CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL CHECK (total > 0),
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping DECIMAL(10,2) NOT NULL DEFAULT 0,
  status order_status DEFAULT 'pending',
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  payment_method payment_method NOT NULL,
  payment_id VARCHAR(255) NOT NULL,
  tracking_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory table
CREATE TABLE inventory (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  reorder_level INTEGER NOT NULL DEFAULT 5,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT stock_consistency CHECK (reserved_quantity <= quantity)
);

-- Shipping rates table
CREATE TABLE shipping_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(8,2) NOT NULL CHECK (price >= 0),
  estimated_days INTEGER NOT NULL CHECK (estimated_days > 0),
  country VARCHAR(50) NOT NULL,
  max_weight DECIMAL(8,3) NOT NULL CHECK (max_weight > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User consent table for GDPR compliance
CREATE TABLE user_consent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  marketing BOOLEAN NOT NULL DEFAULT false,
  analytics BOOLEAN NOT NULL DEFAULT false,
  functional BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  language VARCHAR(5) NOT NULL DEFAULT 'sv',
  currency VARCHAR(3) NOT NULL DEFAULT 'SEK',
  newsletter BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- GDPR activity log table
CREATE TABLE gdpr_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  activity VARCHAR(100) NOT NULL,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table for normalized order structure
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items table for normalized cart structure  
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cart_id, product_id)
);

-- Inventory movements table for tracking stock changes
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL, -- Can be negative for reductions
  type VARCHAR(50) NOT NULL, -- 'sale', 'restock', 'adjustment', 'reservation', etc.
  reference_id UUID, -- Order ID, shipment ID, etc.
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_session_id ON carts(session_id);
CREATE INDEX idx_shipping_rates_country ON shipping_rates(country);
CREATE INDEX idx_user_consent_user_id ON user_consent(user_id);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_gdpr_activity_log_user_id ON gdpr_activity_log(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipping_rates_updated_at BEFORE UPDATE ON shipping_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_last_updated BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for updated_at on new tables
CREATE TRIGGER update_user_consent_updated_at BEFORE UPDATE ON user_consent
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Customers can only see their own data
CREATE POLICY customers_own_data ON customers
  FOR ALL USING (auth.uid()::text = id::text);

-- Orders can only be seen by the customer who made them
CREATE POLICY orders_own_data ON orders
  FOR ALL USING (customer_id::text = auth.uid()::text);

-- Carts can only be seen by the owner
CREATE POLICY carts_own_data ON carts
  FOR ALL USING (user_id::text = auth.uid()::text);

-- User consent can only be seen by the user
CREATE POLICY user_consent_own_data ON user_consent
  FOR ALL USING (user_id::text = auth.uid()::text);

-- User preferences can only be seen by the user
CREATE POLICY user_preferences_own_data ON user_preferences
  FOR ALL USING (user_id::text = auth.uid()::text);

-- GDPR activity log can only be seen by the user
CREATE POLICY gdpr_activity_log_own_data ON gdpr_activity_log
  FOR ALL USING (user_id::text = auth.uid()::text);

-- Order items can only be seen by the customer who made the order
CREATE POLICY order_items_own_data ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.customer_id::text = auth.uid()::text
    )
  );

-- Cart items can only be seen by the cart owner
CREATE POLICY cart_items_own_data ON cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM carts 
      WHERE carts.id = cart_items.cart_id 
      AND carts.user_id::text = auth.uid()::text
    )
  );

-- Insert sample Swedish shipping rates
INSERT INTO shipping_rates (name, description, price, estimated_days, country, max_weight) VALUES
('PostNord Standard', 'Standard delivery within Sweden', 49.00, 3, 'Sweden', 10.0),
('PostNord Express', 'Express delivery within Sweden', 89.00, 1, 'Sweden', 10.0),
('DHL Standard', 'DHL standard delivery', 69.00, 2, 'Sweden', 20.0),
('Free Shipping', 'Free shipping for orders over 500 SEK', 0.00, 5, 'Sweden', 5.0);

-- Insert sample essential oil categories and products
INSERT INTO products (
  name, description, price, category, sku, weight, length, width, height,
  name_sv, description_sv, name_en, description_en, stock
) VALUES
(
  'Lavendel Eterisk Olja',
  'Premium lavendel eterisk olja från Frankrike. Lugnande och avslappnande.',
  89.00,
  'essential-oils',
  'LAV-EO-001',
  0.05,
  10.0,
  3.0,
  3.0,
  'Lavendel Eterisk Olja',
  'Premium lavendel eterisk olja från Frankrike. Lugnande och avslappnande.',
  'Lavender Essential Oil',
  'Premium French lavender essential oil. Calming and relaxing.',
  50
),
(
  'Eucalyptus Eterisk Olja', 
  'Ren eucalyptus eterisk olja. Perfekt för aromaterapi och andning.', 
  249.00, 
  'essential-oils', 
  'EUC-EO-002', 
  0.05, 
  10.0, 
  3.0, 
  3.0,
  'Eucalyptus Eterisk Olja',
  'Ren eucalyptus eterisk olja. Perfekt för aromaterapi och andning.',
  'Eucalyptus Essential Oil',
  'Pure eucalyptus essential oil. Perfect for aromatherapy and breathing.',
  35
),
(
  'Aroma Diffuser Trä', 
  'Elegant aroma diffuser i trä med LED-belysning.', 
  799.00, 
  'diffusers', 
  'DIF-WD-003', 
  0.8, 
  15.0, 
  15.0, 
  12.0,
  'Aroma Diffuser Trä',
  'Elegant aroma diffuser i trä med LED-belysning.',
  'Wooden Aroma Diffuser',
  'Elegant wooden aroma diffuser with LED lighting.',
  20
);

-- Insert corresponding inventory records
INSERT INTO inventory (product_id, quantity, reorder_level)
SELECT id, stock, 10 FROM products;

-- Create a function to automatically create inventory records for new products
CREATE OR REPLACE FUNCTION create_inventory_for_product()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO inventory (product_id, quantity, reorder_level)
  VALUES (NEW.id, NEW.stock, 10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create inventory records
CREATE TRIGGER create_inventory_trigger
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION create_inventory_for_product();