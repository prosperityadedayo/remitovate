-- ============================================
-- PASS 7 — Invoice Lifecycle + Management
-- ============================================
--
-- 1. Updated get_dashboard_stats RPC
--    Computes "overdue" dynamically (sent + past due)
--    instead of relying on a stored 'overdue' status.
--
-- 2. New update_invoice_with_items RPC
--    Atomically updates an invoice header, replaces
--    all invoice_items, and recomputes totals.
--    Mirrors create_invoice_with_items calculation logic.
--
-- ============================================

-- ============================================
-- 1. Updated get_dashboard_stats RPC
-- ============================================
-- Drops and recreates the function with dynamic overdue.
-- Outstanding = sent invoices not yet past due.
-- Overdue = sent invoices that are past due.
-- ============================================
DROP FUNCTION IF EXISTS get_dashboard_stats(uuid);

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_business_id uuid)
RETURNS TABLE (
  total_invoiced numeric,
  paid numeric,
  outstanding numeric,
  overdue numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN status NOT IN ('draft', 'cancelled') THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'sent' AND due_date >= CURRENT_DATE THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'sent' AND due_date < CURRENT_DATE THEN total ELSE 0 END), 0)
  FROM invoices
  WHERE business_id = p_business_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 2. update_invoice_with_items RPC
-- ============================================
-- Updates invoice header fields, replaces all line items,
-- and recomputes invoice-level totals.
--
-- Calculation formula (matches create_invoice_with_items):
--   item_subtotal = quantity * unit_price
--   item_discount = percentage ? (subtotal * amount/100) : amount
--   item_tax = (subtotal - discount) * tax_rate/100
--   item_total = subtotal - discount + tax
--   invoice_subtotal = SUM(item_subtotal)
--   invoice_discount = SUM(item_discount)
--   invoice_tax = SUM(item_tax)
--   invoice_total = SUM(item_total)
-- ============================================
CREATE OR REPLACE FUNCTION update_invoice_with_items(
  p_invoice_id UUID,
  p_business_id UUID,
  p_customer_id UUID,
  p_invoice_date DATE,
  p_due_date DATE,
  p_notes TEXT,
  p_payment_information TEXT,
  p_items JSONB,
  p_status TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_item JSONB;
  v_subtotal NUMERIC := 0;
  v_discount_amount NUMERIC := 0;
  v_tax_amount NUMERIC := 0;
  v_total NUMERIC := 0;
  v_item_subtotal NUMERIC;
  v_item_discount NUMERIC;
  v_item_tax NUMERIC;
  v_item_total NUMERIC;
BEGIN
  -- Update invoice header (only if invoice belongs to business — enforced by RLS)
  UPDATE invoices SET
    customer_id = p_customer_id,
    invoice_date = p_invoice_date,
    due_date = p_due_date,
    notes = p_notes,
    payment_information = p_payment_information,
    updated_at = NOW()
  WHERE id = p_invoice_id AND business_id = p_business_id;

  -- Apply status update if provided
  IF p_status IS NOT NULL THEN
    UPDATE invoices SET status = p_status WHERE id = p_invoice_id;
  END IF;

  -- Delete existing invoice items
  DELETE FROM invoice_items WHERE invoice_id = p_invoice_id;

  -- Process items (same logic as create_invoice_with_items)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_subtotal := (v_item->>'quantity')::NUMERIC * (v_item->>'unit_price')::NUMERIC;

    IF (v_item->>'discount_type') = 'percentage' THEN
      v_item_discount := v_item_subtotal * ((v_item->>'discount_amount')::NUMERIC / 100);
    ELSE
      v_item_discount := (v_item->>'discount_amount')::NUMERIC;
    END IF;

    v_item_tax := (v_item_subtotal - v_item_discount) * ((v_item->>'tax_rate')::NUMERIC / 100);
    v_item_total := v_item_subtotal - v_item_discount + v_item_tax;

    INSERT INTO invoice_items (
      invoice_id, description, quantity, unit_price,
      discount_amount, discount_type, tax_rate, tax_amount, total
    ) VALUES (
      p_invoice_id,
      v_item->>'description',
      (v_item->>'quantity')::NUMERIC,
      (v_item->>'unit_price')::NUMERIC,
      v_item_discount,
      v_item->>'discount_type',
      (v_item->>'tax_rate')::NUMERIC,
      v_item_tax,
      v_item_total
    );

    v_subtotal := v_subtotal + v_item_subtotal;
    v_discount_amount := v_discount_amount + v_item_discount;
    v_tax_amount := v_tax_amount + v_item_tax;
    v_total := v_total + v_item_total;
  END LOOP;

  -- Update invoice totals
  UPDATE invoices SET
    subtotal = v_subtotal,
    discount_amount = v_discount_amount,
    tax_rate = 0,
    tax_amount = v_tax_amount,
    total = v_total,
    updated_at = NOW()
  WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql;
