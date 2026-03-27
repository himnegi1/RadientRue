-- ============================================================
-- Radiant Rue — Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Staff table (with PIN for login)
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pin TEXT NOT NULL UNIQUE,
  phone TEXT,
  monthly_salary NUMERIC,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Service records
CREATE TABLE service_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  amount NUMERIC NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('paytm', 'cash')),
  entry_type TEXT CHECK (entry_type IN ('service', 'tip')),
  source TEXT DEFAULT 'mobile',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name TEXT NOT NULL,
  date DATE NOT NULL,
  login_time TIME,
  logout_time TIME,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Bank transactions (for admin/web import later)
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  narration TEXT,
  ref_no TEXT,
  value_date DATE,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  balance NUMERIC,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

-- Allow all operations via anon key (PIN auth is app-level)
-- In production, replace with proper Supabase Auth + policies
CREATE POLICY "Allow all reads" ON staff FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON staff FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON staff FOR DELETE USING (true);

CREATE POLICY "Allow all reads" ON service_records FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON service_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all deletes" ON service_records FOR DELETE USING (true);

CREATE POLICY "Allow all reads" ON attendance FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON attendance FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all reads" ON bank_transactions FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON bank_transactions FOR INSERT WITH CHECK (true);

-- ============================================================
-- Seed initial staff with PINs
-- ============================================================
INSERT INTO staff (name, pin, phone) VALUES
  ('Akram Khan', '1234', '+91 6395 493 609'),
  ('Azad',       '2345', NULL),
  ('Sawan Kumar','3456', NULL),
  ('Sonu',       '4567', NULL),
  ('Umer',       '5678', NULL);

-- ============================================================
-- Create indexes for common queries
-- ============================================================
CREATE INDEX idx_service_records_date ON service_records (date);
CREATE INDEX idx_service_records_staff ON service_records (staff_name);
CREATE INDEX idx_attendance_date ON attendance (date);
CREATE INDEX idx_attendance_staff ON attendance (staff_name);
CREATE INDEX idx_staff_pin ON staff (pin);
