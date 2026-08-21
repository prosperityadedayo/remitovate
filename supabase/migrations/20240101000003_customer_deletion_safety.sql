-- ============================================
-- PASS 5 — Customer Deletion Safety
-- ============================================
--
-- The original schema defined invoices.customer_id as
-- NOT NULL with ON DELETE CASCADE, meaning deleting a
-- customer would permanently delete all their invoices.
--
-- This migration makes customer deletion safe by:
-- 1. Making invoices.customer_id nullable
-- 2. Changing the FK from ON DELETE CASCADE to
--    ON DELETE SET NULL, preserving invoice history
-- ============================================

ALTER TABLE invoices ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE invoices DROP CONSTRAINT invoices_customer_id_fkey;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_customer_id_fkey
  FOREIGN KEY (customer_id)
  REFERENCES customers(id)
  ON DELETE SET NULL;
