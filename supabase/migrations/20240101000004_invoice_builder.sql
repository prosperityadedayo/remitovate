-- ============================================
-- PASS 6 — Invoice Builder
-- ============================================
--
-- Adds safe invoice numbering and an atomic
-- invoice + invoice_items creation RPC.
-- ============================================

-- Add next_invoice_number to businesses for atomic numbering
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS next_invoice_number INTEGER;

-- Backfill from existing invoice_start_number
UPDATE businesses SET next_invoice_number = invoice_start_number WHERE next_invoice_number IS NULL;

ALTER TABLE businesses ALTER COLUMN next_invoice_number SET NOT NULL;
ALTER TABLE businesses ALTER COLUMN next_invoice_number SET DEFAULT 1;

-- Unique constraint on invoice numbers per business
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_business_number 
  ON invoices(business_id, invoice_number);

-- Atomic invoice creation RPC
CREATE OR REPLACE FUNCTION create_invoice_with_items(
  p_business_id UUID,
  p_customer_id UUID,
  p_invoice_date DATE,
  p_due_date DATE,
  p_notes TEXT,
  p_payment_information TEXT,
  p_items JSONB,
  p_status TEXT DEFAULT 'draft'
) RETURNS UUID AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_next_number INTEGER;
  v_prefix TEXT;
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
  -- Atomically increment and fetch next invoice number
  UPDATE businesses 
  SET next_invoice_number = next_invoice_number + 1 
  WHERE id = p_business_id 
  RETURNING next_invoice_number - 1, invoice_prefix INTO v_next_number, v_prefix;

  v_invoice_number := v_prefix || '-' || LPAD(v_next_number::TEXT, 4, '0');

  -- Create invoice header with zero totals
  INSERT INTO invoices (
    business_id, customer_id, invoice_number, status, 
    invoice_date, due_date, notes, payment_information,
    subtotal, discount_amount, tax_amount, total
  ) VALUES (
    p_business_id, p_customer_id, v_invoice_number, p_status,
    p_invoice_date, p_due_date, p_notes, p_payment_information,
    0, 0, 0, 0
  ) RETURNING id INTO v_invoice_id;

  -- Process items
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
      v_invoice_id,
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
    tax_amount = v_tax_amount,
    total = v_total,
    updated_at = NOW()
  WHERE id = v_invoice_id;

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql;
