-- ============================================================
-- Radiant Rue — Migration 2: OT Records table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE TABLE ot_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name TEXT NOT NULL,
  week_start DATE NOT NULL,
  ot_hours NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_name, week_start)
);

ALTER TABLE ot_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all reads" ON ot_records FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON ot_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON ot_records FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON ot_records FOR DELETE USING (true);
