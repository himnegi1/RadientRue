-- ============================================
-- Radiant Rue — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Staff table
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  whatsapp_name TEXT,
  phone TEXT,
  pin TEXT,
  monthly_salary NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Service records (imported from WhatsApp)
CREATE TABLE IF NOT EXISTS service_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  staff_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  amount NUMERIC NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('paytm', 'cash')) DEFAULT 'paytm',
  entry_type TEXT CHECK (entry_type IN ('service', 'tip')) DEFAULT 'service',
  note TEXT DEFAULT '',
  source TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Attendance (from Login/Logout messages)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  staff_name TEXT NOT NULL,
  date DATE NOT NULL,
  login_time TIME,
  logout_time TIME,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bank transactions (HDFC statement)
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  narration TEXT,
  ref_no TEXT,
  value_date DATE,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  balance NUMERIC,
  category TEXT DEFAULT 'uncategorized',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses (manual + from bank)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  paid_to TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_service_date ON service_records(date);
CREATE INDEX IF NOT EXISTS idx_service_staff ON service_records(staff_name);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_bank_date ON bank_transactions(date);

-- ============================================
-- Seed: Known staff from WhatsApp
-- ============================================
INSERT INTO staff (name, whatsapp_name, monthly_salary) VALUES
  ('Sadiq Husain', 'Sadiq  Husain', 0),
  ('Azam', 'Mo Aazam', 17000),
  ('Shabana', 'Shabana Begam', 18000),
  ('Sawan', 'Sawan Kumar', 7233),
  ('Akram', 'Akaram Husain', 2100)
ON CONFLICT DO NOTHING;
