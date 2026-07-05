
-- 1. Helper functions mirroring the app permission catalogue.
CREATE OR REPLACE FUNCTION public.has_content_delete(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('super_admin','admin','principal','vice_principal')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_media_delete(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('super_admin','admin','principal','media_coordinator')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_content_delete(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_media_delete(uuid) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_content_delete(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_media_delete(uuid) TO authenticated, service_role;

-- 2. Split every "staff ALL" policy on content/media tables into
--    SELECT/INSERT/UPDATE (is_staff) + DELETE (permission-gated).

DO $$
DECLARE
  content_tables text[] := ARRAY[
    'academic_calendar_events','academic_notes','academic_resources',
    'academic_years','achievement_categories','achievement_media',
    'achievements','activities','activity_categories','activity_media',
    'attendance_info','behaviour_guidelines','contact_info',
    'faq_categories','faq_items','gallery_albums','gallery_items',
    'grades','homepage_hero','homepage_hero_actions','homepage_sections',
    'honor_boards','honor_categories','honor_entries','honor_entry_media',
    'instruction_items','instruction_lists','media_usages',
    'news','news_categories','news_media','school_info','school_policies',
    'social_links','statistics','timetables','working_hours'
  ];
  media_tables text[] := ARRAY['media','media_categories'];
  tbl text;
  pol record;
BEGIN
  -- Drop existing ALL "staff" policies on the tables we're splitting.
  FOR pol IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND cmd = 'ALL'
      AND tablename = ANY(content_tables || media_tables)
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;

  -- Recreate as SELECT/INSERT/UPDATE + gated DELETE.
  FOREACH tbl IN ARRAY content_tables LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_staff(auth.uid()))', tbl || '_staff_select', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()))', tbl || '_staff_insert', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))', tbl || '_staff_update', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.has_content_delete(auth.uid()))', tbl || '_content_delete', tbl);
  END LOOP;

  FOREACH tbl IN ARRAY media_tables LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_staff(auth.uid()))', tbl || '_staff_select', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()))', tbl || '_staff_insert', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))', tbl || '_staff_update', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.has_media_delete(auth.uid()))', tbl || '_media_delete', tbl);
  END LOOP;
END $$;
