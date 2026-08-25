-- ============================================
-- PASS 9 — Payment Reminders
-- ============================================
--
-- Adds last_reminded_at to invoices for reminder
-- follow-up assistance tracking.
-- ============================================

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_invoices_last_reminded
  ON invoices(last_reminded_at);
