
-- 1) Tighten permissive INSERT policies on analytics tables to enforce
--    data hygiene instead of an unconstrained WITH CHECK (true).

DROP POLICY IF EXISTS "Anyone can log a page view" ON public.analytics_page_views;
CREATE POLICY "Anyone can log a page view"
  ON public.analytics_page_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    path IS NOT NULL
    AND length(path) BETWEEN 1 AND 512
    AND (referrer_domain IS NULL OR length(referrer_domain) <= 253)
    AND (device IS NULL OR length(device) <= 64)
  );

DROP POLICY IF EXISTS "Anyone can log a content view" ON public.analytics_content_views;
CREATE POLICY "Anyone can log a content view"
  ON public.analytics_content_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    entity_table IS NOT NULL
    AND length(entity_table) BETWEEN 1 AND 64
    AND entity_id IS NOT NULL
    AND (slug IS NULL OR length(slug) <= 200)
  );

DROP POLICY IF EXISTS "Anyone can log a search" ON public.analytics_search_queries;
CREATE POLICY "Anyone can log a search"
  ON public.analytics_search_queries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    term IS NOT NULL
    AND length(term) BETWEEN 1 AND 200
    AND normalized_term IS NOT NULL
    AND length(normalized_term) BETWEEN 1 AND 200
    AND result_count >= 0
  );

-- 2) Restrict EXECUTE on SECURITY DEFINER functions so they aren't
--    part of the public API surface. Role-check helpers are still
--    reachable from RLS policies via the authenticated role;
--    handle_new_user is a trigger and needs no client access.

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_media_delete(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_media_delete(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_content_delete(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_content_delete(uuid) TO authenticated, service_role;
