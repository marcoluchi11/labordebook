-- 006 and 007 didn't take: pg_proc.proacl still showed anon/authenticated
-- with EXECUTE after both were run. Redoing the revoke here, explicit and
-- self-contained, with a verification SELECT as the last statement so the
-- result is visible directly in the SQL editor's output pane.

REVOKE EXECUTE ON FUNCTION consume_token(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_monthly_revenue() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_purchases_per_book() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_daily_purchases(integer) FROM PUBLIC, anon, authenticated;

-- Expect: proacl should show ONLY postgres=X and service_role=X for each row
-- (no "anon=" or "authenticated=" substring left).
select
  p.proname as function_name,
  p.proacl as permisos
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('get_monthly_revenue', 'get_purchases_per_book', 'get_daily_purchases', 'consume_token');
