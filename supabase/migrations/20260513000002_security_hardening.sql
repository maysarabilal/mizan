-- ═══════════════════════════════════════════════════════════════
-- SECURITY HARDENING: Revoke anon EXECUTE on sensitive functions
-- ═══════════════════════════════════════════════════════════════

-- These functions should NEVER be callable by unauthenticated users.
REVOKE EXECUTE ON FUNCTION public.create_office_transaction(uuid, text, uuid, timestamptz) FROM anon;
REVOKE EXECUTE ON FUNCTION public.nightly_maintenance() FROM anon;
REVOKE EXECUTE ON FUNCTION public.trigger_audit_log() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.global_search(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_office_financial_summary(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_sessions(text, text, text, text, date, date, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(text[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_subscription_valid() FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_office_id() FROM anon;

-- These trigger/internal functions should not be callable by authenticated users via API either.
REVOKE EXECUTE ON FUNCTION public.trigger_audit_log() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.nightly_maintenance() FROM authenticated;

-- Set immutable search_path on critical functions
ALTER FUNCTION public.create_office_transaction(uuid, text, uuid, timestamptz) SET search_path = public;
ALTER FUNCTION public.nightly_maintenance() SET search_path = public;
ALTER FUNCTION public.trigger_audit_log() SET search_path = public;
ALTER FUNCTION public.redeem_invitation(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_office_financial_summary(uuid) SET search_path = public;
ALTER FUNCTION public.trigger_set_updated_at() SET search_path = public;
