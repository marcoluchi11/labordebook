-- Postgres grants EXECUTE on new functions to PUBLIC by default. Since these
-- functions are SECURITY DEFINER (they run with the owner's privileges,
-- bypassing RLS), that default left them callable directly via the
-- PostgREST /rest/v1/rpc/ endpoint using nothing but the public anon key.
--
-- Confirmed exploitable: calling get_monthly_revenue / get_purchases_per_book /
-- get_daily_purchases with the anon key returned real revenue figures, and
-- consume_token executed (returned its "invalid_token" business error rather
-- than a permission error) for an arbitrary token hash.
--
-- All of these are only ever called from server code via the service-role
-- client, so lock them down to service_role only.

REVOKE EXECUTE ON FUNCTION consume_token(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_monthly_revenue() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_purchases_per_book() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_daily_purchases(integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION consume_token(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION get_monthly_revenue() TO service_role;
GRANT EXECUTE ON FUNCTION get_purchases_per_book() TO service_role;
GRANT EXECUTE ON FUNCTION get_daily_purchases(integer) TO service_role;

-- Rollback:
--   GRANT EXECUTE ON FUNCTION consume_token(text, text) TO PUBLIC;
--   GRANT EXECUTE ON FUNCTION get_monthly_revenue() TO PUBLIC;
--   GRANT EXECUTE ON FUNCTION get_purchases_per_book() TO PUBLIC;
--   GRANT EXECUTE ON FUNCTION get_daily_purchases(integer) TO PUBLIC;
