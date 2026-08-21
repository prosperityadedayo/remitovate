-- ============================================
-- PASS 4 — Dashboard Stats Aggregation RPC
-- ============================================
--
-- Aggregates invoice statistics server-side so the
-- dashboard does not need to download all invoice rows.
--
-- The caller's RLS policies restrict access to invoices
-- in the caller's own business, so no additional grants
-- are required.
-- ============================================

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
    COALESCE(SUM(CASE WHEN status = 'sent' THEN total ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN status = 'overdue' THEN total ELSE 0 END), 0)
  FROM invoices
  WHERE business_id = p_business_id;
END;
$$ LANGUAGE plpgsql STABLE;
