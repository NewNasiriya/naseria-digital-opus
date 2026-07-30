-- Phase 2 forward-only production bootstrap remediation.
-- This file is intentionally applied only after all 30 historical migrations.

-- Refuse to leave a partially hardened database when the expected history is absent.
DO $assert$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(name, ', ' ORDER BY name) INTO missing
  FROM unnest(ARRAY[
    'profiles','user_roles','media','media_usages','site_settings','school_info',
    'news','achievements','activities','gallery_albums','honor_boards',
    'academic_notes','academic_resources','analytics_page_views'
  ]) AS expected(name)
  WHERE to_regclass('public.' || name) IS NULL;

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Phase 2 remediation aborted; expected historical tables are missing: %', missing;
  END IF;
  IF to_regprocedure('public.handle_new_user()') IS NULL
     OR to_regprocedure('public.has_role(uuid,public.app_role)') IS NULL
     OR to_regprocedure('public.is_staff(uuid)') IS NULL
     OR to_regprocedure('public.has_content_delete(uuid)') IS NULL
     OR to_regprocedure('public.has_media_delete(uuid)') IS NULL
     OR to_regprocedure('public.is_media_publicly_visible(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Phase 2 remediation aborted; one or more expected historical functions are missing';
  END IF;
END $assert$;

-- An Auth signup creates only a profile. Role assignment is a separate, audited,
-- manual bootstrap action; an empty user_roles set therefore denies staff access.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Pin definer lookup paths and fully qualify protected relations.
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = pg_catalog, public;
ALTER FUNCTION public.is_staff(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.has_content_delete(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.has_media_delete(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION public.handle_new_user() SET search_path = pg_catalog, public;
ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog, public;
ALTER FUNCTION public.is_media_publicly_visible(uuid) SET search_path = pg_catalog, public;

-- Functions are closed by default. Policy helpers retain only the callers that
-- evaluate their RLS policies; trigger functions have no client EXECUTE grant.
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_content_delete(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_media_delete(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_media_publicly_visible(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_content_delete(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_media_delete(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_media_publicly_visible(uuid) TO anon, authenticated, service_role;

-- Enforce RLS on every application table in public. Tables without anon grants
-- or public policies (RBAC, audit/outbox, media usages) remain intentionally dark.
DO $rls$
DECLARE r record;
BEGIN
  FOR r IN SELECT c.oid::regclass AS relation
           FROM pg_catalog.pg_class c
           JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relkind IN ('r','p')
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', r.relation);
    EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', r.relation);
  END LOOP;
END $rls$;

-- Remove legacy broad Storage policies before installing the final model.
DROP POLICY IF EXISTS "storage: public read media" ON storage.objects;
DROP POLICY IF EXISTS "storage: public read referenced media" ON storage.objects;
DROP POLICY IF EXISTS "storage: staff read private-uploads" ON storage.objects;
DROP POLICY IF EXISTS "storage: staff insert" ON storage.objects;
DROP POLICY IF EXISTS "storage: staff update" ON storage.objects;
DROP POLICY IF EXISTS "storage: staff delete" ON storage.objects;

-- All buckets are private. Public published assets are readable solely through
-- the SELECT policy below; private uploads never receive anonymous access.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('media', 'media', false, 26214400, ARRAY['image/png','image/jpeg','image/webp','image/gif','image/avif','application/pdf']),
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','text/plain','text/csv']),
  ('private-uploads', 'private-uploads', false, 52428800, ARRAY['image/png','image/jpeg','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain','text/csv'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "storage: published assets read"
ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id IN ('media','documents')
  AND EXISTS (SELECT 1 FROM public.media m
              WHERE m.bucket = storage.objects.bucket_id
                AND m.storage_path = storage.objects.name
                AND public.is_media_publicly_visible(m.id))
);

CREATE POLICY "storage: staff read private uploads"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'private-uploads' AND public.is_staff(auth.uid()));

CREATE POLICY "storage: staff create owned object"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('media','documents','private-uploads')
  AND public.is_staff(auth.uid())
  AND owner_id = auth.uid()::text
  AND name !~ '(^|/)\.\.(/|$)'
);

CREATE POLICY "storage: owner overwrite"
ON storage.objects FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid()) AND owner_id = auth.uid()::text)
WITH CHECK (bucket_id IN ('media','documents','private-uploads') AND owner_id = auth.uid()::text);

CREATE POLICY "storage: owner or media manager delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('media','documents','private-uploads')
  AND public.is_staff(auth.uid())
  AND (owner_id = auth.uid()::text OR public.has_media_delete(auth.uid()))
);

-- Final catalog assertions: fail the transaction rather than accepting drift.
DO $verify$
DECLARE missing_rls text;
BEGIN
  SELECT string_agg(c.relname, ', ' ORDER BY c.relname) INTO missing_rls
  FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p') AND NOT c.relrowsecurity;
  IF missing_rls IS NOT NULL THEN
    RAISE EXCEPTION 'Phase 2 remediation failed; RLS is disabled on: %', missing_rls;
  END IF;
  IF (SELECT count(*) FROM storage.buckets WHERE id IN ('media','documents','private-uploads') AND public = false) <> 3 THEN
    RAISE EXCEPTION 'Phase 2 remediation failed; required private buckets are absent or public';
  END IF;
END $verify$;
