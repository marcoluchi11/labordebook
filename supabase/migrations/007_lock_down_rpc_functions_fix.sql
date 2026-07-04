-- 006 revoked EXECUTE from PUBLIC, but that wasn't enough: Supabase's default
-- privileges (ALTER DEFAULT PRIVILEGES) grant EXECUTE on new public-schema
-- functions directly to anon/authenticated, not just via PUBLIC. Revoking
-- from PUBLIC alone left those direct grants in place, so the anon key could
-- still call these RPCs after 006 was applied — confirmed still exploitable.
--
-- Revoke from anon/authenticated explicitly this time.

REVOKE EXECUTE ON FUNCTION consume_token(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_monthly_revenue() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_purchases_per_book() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_daily_purchases(integer) FROM anon, authenticated;

-- Rollback:
--   GRANT EXECUTE ON FUNCTION consume_token(text, text) TO anon, authenticated;
--   GRANT EXECUTE ON FUNCTION get_monthly_revenue() TO anon, authenticated;
--   GRANT EXECUTE ON FUNCTION get_purchases_per_book() TO anon, authenticated;
--   GRANT EXECUTE ON FUNCTION get_daily_purchases(integer) TO anon, authenticated;
