-- ============================================
-- PASS 3 — Initial Application Schema
-- ============================================
--
-- DESTRUCTIVE CLEANUP WARNING:
-- This migration DROPS existing tables before recreating them.
-- Only run this against a fresh development database.
-- DO NOT run this against a database containing real user data.
-- If this migration has already been applied, create a new
-- migration instead of re-running this one.
--
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CLEANUP (idempotent re-runs on fresh DB only)
-- ============================================
DO $$
BEGIN
  DROP TABLE IF EXISTS invoice_items CASCADE;
  DROP TABLE IF EXISTS invoices CASCADE;
  DROP TABLE IF EXISTS customers CASCADE;
  DROP TABLE IF EXISTS businesses CASCADE;
  DROP TABLE IF EXISTS profiles CASCADE;
END $$;

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BUSINESSES
-- One business per user for MVP.
-- ============================================
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  country TEXT,
  currency TEXT NOT NULL DEFAULT 'NGN',
  logo_url TEXT,
  brand_colour TEXT NOT NULL DEFAULT '#4F46E5',
  invoice_prefix TEXT NOT NULL DEFAULT 'INV',
  invoice_start_number INTEGER NOT NULL DEFAULT 1,
  default_payment_terms TEXT NOT NULL DEFAULT 'Net 30',
  invoice_template TEXT NOT NULL DEFAULT 'modern',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMERS
-- ============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICES
-- ============================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'fixed',
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  payment_information TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICE ITEMS
-- ============================================
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'fixed',
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_businesses_user_id ON businesses(user_id);
CREATE INDEX idx_customers_business_id ON customers(business_id);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_invoices_business_id ON invoices(business_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Businesses
CREATE POLICY "Users can view own business" ON businesses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own business" ON businesses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own business" ON businesses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own business" ON businesses FOR DELETE USING (auth.uid() = user_id);

-- Customers
CREATE POLICY "Users can view own customers" ON customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own customers" ON customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own customers" ON customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own customers" ON customers FOR DELETE USING (auth.uid() = user_id);

-- Invoices
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT WITH CHECK (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE USING (
  business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
);

-- Invoice Items
CREATE POLICY "Users can view own invoice items" ON invoice_items FOR SELECT USING (
  invoice_id IN (
    SELECT i.id FROM invoices i
    JOIN businesses b ON i.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert own invoice items" ON invoice_items FOR INSERT WITH CHECK (
  invoice_id IN (
    SELECT i.id FROM invoices i
    JOIN businesses b ON i.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update own invoice items" ON invoice_items FOR UPDATE USING (
  invoice_id IN (
    SELECT i.id FROM invoices i
    JOIN businesses b ON i.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);
CREATE POLICY "Users can delete own invoice items" ON invoice_items FOR DELETE USING (
  invoice_id IN (
    SELECT i.id FROM invoices i
    JOIN businesses b ON i.business_id = b.id
    WHERE b.user_id = auth.uid()
  )
);

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================
-- IMPORTANT: Create the 'business-logos' bucket manually in the
-- Supabase Dashboard under Storage.
-- Set it as a PRIVATE bucket.
--
-- Storage RLS policies enforce per-user ownership based on the
-- storage path structure: {user_id}/{timestamp}.{extension}
--
-- These policies verify that the authenticated user's ID matches
-- the first folder in the object path, ensuring users can only
-- access their own business logos.

-- Storage RLS policies for business-logos bucket (PRIVATE)
CREATE POLICY "Users can view own logos" ON storage.objects FOR SELECT USING (
  bucket_id = 'business-logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can upload own logos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'business-logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update own logos" ON storage.objects FOR UPDATE USING (
  bucket_id = 'business-logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own logos" ON storage.objects FOR DELETE USING (
  bucket_id = 'business-logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
