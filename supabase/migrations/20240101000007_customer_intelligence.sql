-- ============================================
-- PASS 9 — Customer Intelligence
-- ============================================
--
-- Adds get_customer_intelligence RPC for
-- per-customer financial metrics.
-- ============================================

CREATE OR REPLACE FUNCTION get_customer_intelligence(p_customer_id uuid)
RETURNS TABLE (
  total_invoiced numeric,
  total_paid numeric,
  total_outstanding numeric,
  total_overdue numeric,
  invoice_count bigint,
  paid_count bigint,
  outstanding_count bigint,
  overdue_count bigint,
  latest_invoice_date date
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN status NOT IN ('draft', 'cancelled') THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'sent' AND due_date >= CURRENT_DATE THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'sent' AND due_date < CURRENT_DATE THEN total ELSE 0 END), 0),
    COUNT(*),
    COUNT(CASE WHEN status = 'paid' THEN 1 END),
    COUNT(CASE WHEN status = 'sent' AND due_date >= CURRENT_DATE THEN 1 END),
    COUNT(CASE WHEN status = 'sent' AND due_date < CURRENT_DATE THEN 1 END),
    MAX(invoice_date)
  FROM invoices
  WHERE customer_id = p_customer_id
    AND business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql STABLE;
