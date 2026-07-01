
-- =========================================================
-- Phase 2 — Content Architecture & CMS Data Foundation
-- =========================================================

-- ---------- Extensions ----------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Enums ----------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','editor','viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.content_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.timetable_kind AS ENUM ('academic','exam');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.instruction_audience AS ENUM ('student','parent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Utility: updated_at ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

-- =========================================================
-- 1) Roles & profiles
-- =========================================================

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','editor')
  );
$$;

CREATE POLICY "user_roles: user reads own"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "user_roles: admins manage"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Profiles (1:1 with auth.users) — media FK added after media table exists
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_media_id uuid,
  phone text,
  locale text NOT NULL DEFAULT 'ar',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: read own or staff"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles: admin manage"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-provision profile + bootstrap admin for the first user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_first boolean;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles) INTO v_is_first;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN v_is_first THEN 'admin'::public.app_role ELSE 'viewer'::public.app_role END)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- 2) Media Library
-- =========================================================

CREATE TABLE public.media_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text,
  slug text NOT NULL UNIQUE,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media_categories TO authenticated;
GRANT ALL ON public.media_categories TO service_role;
ALTER TABLE public.media_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_categories: public read" ON public.media_categories FOR SELECT USING (true);
CREATE POLICY "media_categories: staff write" ON public.media_categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_media_categories_updated_at BEFORE UPDATE ON public.media_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL DEFAULT 'media',
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  width int,
  height int,
  size_bytes bigint,
  alt_ar text,
  alt_en text,
  caption_ar text,
  caption_en text,
  category_id uuid REFERENCES public.media_categories(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  is_archived boolean NOT NULL DEFAULT false,
  external_ref jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, storage_path)
);
CREATE INDEX idx_media_category ON public.media (category_id);
CREATE INDEX idx_media_tags ON public.media USING GIN (tags);
GRANT SELECT ON public.media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media: public read" ON public.media FOR SELECT USING (is_archived = false);
CREATE POLICY "media: staff write" ON public.media FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_media_updated_at BEFORE UPDATE ON public.media FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Now add FK on profiles.avatar_media_id
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_avatar_media_fk FOREIGN KEY (avatar_media_id) REFERENCES public.media(id) ON DELETE SET NULL;

CREATE TABLE public.media_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  entity_table text NOT NULL,
  entity_id uuid NOT NULL,
  field_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (media_id, entity_table, entity_id, field_name)
);
CREATE INDEX idx_media_usages_media ON public.media_usages (media_id);
CREATE INDEX idx_media_usages_entity ON public.media_usages (entity_table, entity_id);
GRANT SELECT, INSERT, DELETE ON public.media_usages TO authenticated;
GRANT ALL ON public.media_usages TO service_role;
ALTER TABLE public.media_usages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_usages: staff read" ON public.media_usages FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "media_usages: staff write" ON public.media_usages FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- 3) Site Settings + Working Hours + School Info
-- =========================================================

CREATE TABLE public.site_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  school_name_ar text NOT NULL DEFAULT 'مدرسة الناصرية الابتدائية الجديدة',
  school_name_en text,
  logo_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  favicon_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  default_og_image_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  footer_text_ar text,
  footer_text_en text,
  copyright_text text,
  seo_default_title text,
  seo_default_description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings: public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings: admin write" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  opens_at time,
  closes_at time,
  is_closed boolean NOT NULL DEFAULT false,
  note_ar text,
  note_en text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (day_of_week)
);
GRANT SELECT ON public.working_hours TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.working_hours TO authenticated;
GRANT ALL ON public.working_hours TO service_role;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "working_hours: public read" ON public.working_hours FOR SELECT USING (true);
CREATE POLICY "working_hours: staff write" ON public.working_hours FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_working_hours_updated_at BEFORE UPDATE ON public.working_hours FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.school_info (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  welcome_message_ar text,
  welcome_message_en text,
  principal_message_ar text,
  principal_message_en text,
  principal_name text,
  principal_photo_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  mission_ar text,
  mission_en text,
  vision_ar text,
  vision_en text,
  history_ar text,
  history_en text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.school_info TO anon, authenticated;
GRANT INSERT, UPDATE ON public.school_info TO authenticated;
GRANT ALL ON public.school_info TO service_role;
ALTER TABLE public.school_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school_info: public read" ON public.school_info FOR SELECT USING (true);
CREATE POLICY "school_info: staff write" ON public.school_info FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_school_info_updated_at BEFORE UPDATE ON public.school_info FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.school_info (id) VALUES (1) ON CONFLICT DO NOTHING;

-- =========================================================
-- 4) Homepage
-- =========================================================

CREATE TABLE public.homepage_hero (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  headline_ar text,
  headline_en text,
  subheadline_ar text,
  subheadline_en text,
  hero_image_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.homepage_hero TO anon, authenticated;
GRANT INSERT, UPDATE ON public.homepage_hero TO authenticated;
GRANT ALL ON public.homepage_hero TO service_role;
ALTER TABLE public.homepage_hero ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homepage_hero: public read published" ON public.homepage_hero FOR SELECT USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "homepage_hero: staff write" ON public.homepage_hero FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_homepage_hero_updated_at BEFORE UPDATE ON public.homepage_hero FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.homepage_hero (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.homepage_hero_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_id smallint NOT NULL REFERENCES public.homepage_hero(id) ON DELETE CASCADE,
  label_ar text NOT NULL,
  label_en text,
  href text NOT NULL,
  variant text NOT NULL DEFAULT 'primary',
  display_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.homepage_hero_actions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.homepage_hero_actions TO authenticated;
GRANT ALL ON public.homepage_hero_actions TO service_role;
ALTER TABLE public.homepage_hero_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hero_actions: public read" ON public.homepage_hero_actions FOR SELECT USING (is_visible OR public.is_staff(auth.uid()));
CREATE POLICY "hero_actions: staff write" ON public.homepage_hero_actions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_hero_actions_updated_at BEFORE UPDATE ON public.homepage_hero_actions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label_ar text,
  label_en text,
  is_enabled boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.homepage_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.homepage_sections TO authenticated;
GRANT ALL ON public.homepage_sections TO service_role;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homepage_sections: public read" ON public.homepage_sections FOR SELECT USING (true);
CREATE POLICY "homepage_sections: staff write" ON public.homepage_sections FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_homepage_sections_updated_at BEFORE UPDATE ON public.homepage_sections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 5) Statistics
-- =========================================================

CREATE TABLE public.statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label_ar text NOT NULL,
  label_en text,
  value int NOT NULL DEFAULT 0,
  icon_key text,
  display_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.statistics TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.statistics TO authenticated;
GRANT ALL ON public.statistics TO service_role;
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "statistics: public read" ON public.statistics FOR SELECT USING (is_visible OR public.is_staff(auth.uid()));
CREATE POLICY "statistics: staff write" ON public.statistics FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_statistics_updated_at BEFORE UPDATE ON public.statistics FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 6) Academic Life
-- =========================================================

CREATE TABLE public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uniq_academic_years_current ON public.academic_years ((is_current)) WHERE is_current;
GRANT SELECT ON public.academic_years TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.academic_years TO authenticated;
GRANT ALL ON public.academic_years TO service_role;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "academic_years: public read" ON public.academic_years FOR SELECT USING (true);
CREATE POLICY "academic_years: staff write" ON public.academic_years FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_academic_years_updated_at BEFORE UPDATE ON public.academic_years FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text,
  level int NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (level)
);
GRANT SELECT ON public.grades TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.grades TO authenticated;
GRANT ALL ON public.grades TO service_role;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grades: public read" ON public.grades FOR SELECT USING (true);
CREATE POLICY "grades: staff write" ON public.grades FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.timetables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.timetable_kind NOT NULL,
  title_ar text NOT NULL,
  title_en text,
  description_ar text,
  description_en text,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  grade_id uuid REFERENCES public.grades(id) ON DELETE SET NULL,
  document_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  cover_image_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  display_order int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_timetables_kind ON public.timetables (kind, status);
GRANT SELECT ON public.timetables TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.timetables TO authenticated;
GRANT ALL ON public.timetables TO service_role;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timetables: public read published" ON public.timetables FOR SELECT USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "timetables: staff write" ON public.timetables FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_timetables_updated_at BEFORE UPDATE ON public.timetables FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.academic_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  title_ar text NOT NULL,
  title_en text,
  description_ar text,
  description_en text,
  starts_on date NOT NULL,
  ends_on date,
  category text,
  color text,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_calendar_events_dates ON public.academic_calendar_events (starts_on, ends_on);
GRANT SELECT ON public.academic_calendar_events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.academic_calendar_events TO authenticated;
GRANT ALL ON public.academic_calendar_events TO service_role;
ALTER TABLE public.academic_calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calendar_events: public read published" ON public.academic_calendar_events FOR SELECT USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "calendar_events: staff write" ON public.academic_calendar_events FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_calendar_events_updated_at BEFORE UPDATE ON public.academic_calendar_events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.attendance_info (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  content_ar text,
  content_en text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.attendance_info TO anon, authenticated;
GRANT INSERT, UPDATE ON public.attendance_info TO authenticated;
GRANT ALL ON public.attendance_info TO service_role;
ALTER TABLE public.attendance_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_info: public read" ON public.attendance_info FOR SELECT USING (true);
CREATE POLICY "attendance_info: staff write" ON public.attendance_info FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_attendance_info_updated_at BEFORE UPDATE ON public.attendance_info FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.attendance_info (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.behaviour_guidelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text,
  body_ar text,
  body_en text,
  icon_key text,
  display_order int NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.behaviour_guidelines TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.behaviour_guidelines TO authenticated;
GRANT ALL ON public.behaviour_guidelines TO service_role;
ALTER TABLE public.behaviour_guidelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guidelines: public read published" ON public.behaviour_guidelines FOR SELECT USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "guidelines: staff write" ON public.behaviour_guidelines FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_guidelines_updated_at BEFORE UPDATE ON public.behaviour_guidelines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 7) Activities
-- =========================================================

CREATE TABLE public.activity_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  name_en text,
  icon_key text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activity_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.activity_categories TO authenticated;
GRANT ALL ON public.activity_categories TO service_role;
ALTER TABLE public.activity_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_categories: public read" ON public.activity_categories FOR SELECT USING (true);
CREATE POLICY "activity_categories: staff write" ON public.activity_categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_activity_categories_updated_at BEFORE UPDATE ON public.activity_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.activity_categories(id) ON DELETE SET NULL,
  title_ar text NOT NULL,
  title_en text,
  slug text NOT NULL UNIQUE,
  summary_ar text,
  summary_en text,
  body_ar text,
  body_en text,
  cover_image_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  event_date date,
  seo_title text,
  seo_description text,
  og_image_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  is_featured boolean NOT NULL DEFAULT false,
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  scheduled_at timestamptz,
  view_count int NOT NULL DEFAULT 0,
  external_ref jsonb,
  search_tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title_ar,'') || ' ' || coalesce(title_en,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(summary_ar,'') || ' ' || coalesce(summary_en,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(body_ar,'') || ' ' || coalesce(body_en,'')), 'C')
  ) STORED,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activities_status ON public.activities (status, published_at DESC);
CREATE INDEX idx_activities_category ON public.activities (category_id);
CREATE INDEX idx_activities_search ON public.activities USING GIN (search_tsv);
GRANT SELECT ON public.activities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities: public read published" ON public.activities FOR SELECT USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "activities: staff write" ON public.activities FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.activity_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  caption_ar text,
  caption_en text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, media_id)
);
GRANT SELECT ON public.activity_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.activity_media TO authenticated;
GRANT ALL ON public.activity_media TO service_role;
ALTER TABLE public.activity_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_media: public read" ON public.activity_media FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_id AND (a.status = 'published' OR public.is_staff(auth.uid())))
);
CREATE POLICY "activity_media: staff write" ON public.activity_media FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- 8) Honor Board
-- =========================================================

CREATE TABLE public.honor_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text,
  slug text NOT NULL UNIQUE,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.honor_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.honor_categories TO authenticated;
GRANT ALL ON public.honor_categories TO service_role;
ALTER TABLE public.honor_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "honor_categories: public read" ON public.honor_categories FOR SELECT USING (true);
CREATE POLICY "honor_categories: staff write" ON public.honor_categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_honor_categories_updated_at BEFORE UPDATE ON public.honor_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.honor_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.honor_categories(id) ON DELETE SET NULL,
  student_name text NOT NULL,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  grade_id uuid REFERENCES public.grades(id) ON DELETE SET NULL,
  description_ar text,
  description_en text,
  achievement_date date,
  display_order int NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_honor_entries_category ON public.honor_entries (category_id);
CREATE INDEX idx_honor_entries_year ON public.honor_entries (academic_year_id);
GRANT SELECT ON public.honor_entries TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.honor_entries TO authenticated;
GRANT ALL ON public.honor_entries TO service_role;
ALTER TABLE public.honor_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "honor_entries: public read published" ON public.honor_entries FOR SELECT USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "honor_entries: staff write" ON public.honor_entries FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_honor_entries_updated_at BEFORE UPDATE ON public.honor_entries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.honor_entry_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  honor_entry_id uuid NOT NULL REFERENCES public.honor_entries(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (honor_entry_id, media_id)
);
GRANT SELECT ON public.honor_entry_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.honor_entry_media TO authenticated;
GRANT ALL ON public.honor_entry_media TO service_role;
ALTER TABLE public.honor_entry_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "honor_entry_media: public read" ON public.honor_entry_media FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.honor_entries e WHERE e.id = honor_entry_id AND (e.status = 'published' OR public.is_staff(auth.uid())))
);
CREATE POLICY "honor_entry_media: staff write" ON public.honor_entry_media FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- 9) Achievements
-- =========================================================

CREATE TABLE public.achievement_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text,
  slug text NOT NULL UNIQUE,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievement_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.achievement_categories TO authenticated;
GRANT ALL ON public.achievement_categories TO service_role;
ALTER TABLE public.achievement_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievement_categories: public read" ON public.achievement_categories FOR SELECT USING (true);
CREATE POLICY "achievement_categories: staff write" ON public.achievement_categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_achievement_categories_updated_at BEFORE UPDATE ON public.achievement_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.achievement_categories(id) ON DELETE SET NULL,
  title_ar text NOT NULL,
  title_en text,
  slug text NOT NULL UNIQUE,
  description_ar text,
  description_en text,
  cover_image_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  achieved_on date,
  is_featured boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  og_image_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  view_count int NOT NULL DEFAULT 0,
  external_ref jsonb,
  search_tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title_ar,'') || ' ' || coalesce(title_en,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description_ar,'') || ' ' || coalesce(description_en,'')), 'B')
  ) STORED,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_achievements_status ON public.achievements (status, published_at DESC);
CREATE INDEX idx_achievements_search ON public.achievements USING GIN (search_tsv);
GRANT SELECT ON public.achievements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements: public read published" ON public.achievements FOR SELECT USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "achievements: staff write" ON public.achievements FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_achievements_updated_at BEFORE UPDATE ON public.achievements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.achievement_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  caption_ar text,
  caption_en text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (achievement_id, media_id)
);
GRANT SELECT ON public.achievement_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.achievement_media TO authenticated;
GRANT ALL ON public.achievement_media TO service_role;
ALTER TABLE public.achievement_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievement_media: public read" ON public.achievement_media FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.achievements a WHERE a.id = achievement_id AND (a.status = 'published' OR public.is_staff(auth.uid())))
);
CREATE POLICY "achievement_media: staff write" ON public.achievement_media FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- 10) News
-- =========================================================

CREATE TABLE public.news_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text,
  slug text NOT NULL UNIQUE,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news_categories TO authenticated;
GRANT ALL ON public.news_categories TO service_role;
ALTER TABLE public.news_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_categories: public read" ON public.news_categories FOR SELECT USING (true);
CREATE POLICY "news_categories: staff write" ON public.news_categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_news_categories_updated_at BEFORE UPDATE ON public.news_categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.news_categories(id) ON DELETE SET NULL,
  title_ar text NOT NULL,
  title_en text,
  slug text NOT NULL UNIQUE,
  summary_ar text,
  summary_en text,
  body_ar text,
  body_en text,
  featured_image_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_featured boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  og_image_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  scheduled_at timestamptz,
  view_count int NOT NULL DEFAULT 0,
  external_ref jsonb,
  search_tsv tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title_ar,'') || ' ' || coalesce(title_en,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(summary_ar,'') || ' ' || coalesce(summary_en,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(body_ar,'') || ' ' || coalesce(body_en,'')), 'C')
  ) STORED,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_news_status ON public.news (status, published_at DESC);
CREATE INDEX idx_news_category ON public.news (category_id);
CREATE INDEX idx_news_search ON public.news USING GIN (search_tsv);
GRANT SELECT ON public.news TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news: public read published" ON public.news FOR SELECT USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "news: staff write" ON public.news FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_news_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.news_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  caption_ar text,
  caption_en text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (news_id, media_id)
);
GRANT SELECT ON public.news_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news_media TO authenticated;
GRANT ALL ON public.news_media TO service_role;
ALTER TABLE public.news_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_media: public read" ON public.news_media FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.news n WHERE n.id = news_id AND (n.status = 'published' OR public.is_staff(auth.uid())))
);
CREATE POLICY "news_media: staff write" ON public.news_media FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- 11) Gallery
-- =========================================================

CREATE TABLE public.gallery_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text,
  slug text NOT NULL UNIQUE,
  description_ar text,
  description_en text,
  cover_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  category text,
  display_order int NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_albums TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery_albums TO authenticated;
GRANT ALL ON public.gallery_albums TO service_role;
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery_albums: public read published" ON public.gallery_albums FOR SELECT USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "gallery_albums: staff write" ON public.gallery_albums FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_gallery_albums_updated_at BEFORE UPDATE ON public.gallery_albums FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.gallery_albums(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  caption_ar text,
  caption_en text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (album_id, media_id)
);
GRANT SELECT ON public.gallery_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery_items: public read" ON public.gallery_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.gallery_albums a WHERE a.id = album_id AND (a.status = 'published' OR public.is_staff(auth.uid())))
);
CREATE POLICY "gallery_items: staff write" ON public.gallery_items FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- 12) Instructions (student/parent)
-- =========================================================

CREATE TABLE public.instruction_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience public.instruction_audience NOT NULL,
  title_ar text NOT NULL,
  title_en text,
  description_ar text,
  description_en text,
  display_order int NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.instruction_lists TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.instruction_lists TO authenticated;
GRANT ALL ON public.instruction_lists TO service_role;
ALTER TABLE public.instruction_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "instruction_lists: public read" ON public.instruction_lists FOR SELECT USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "instruction_lists: staff write" ON public.instruction_lists FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_instruction_lists_updated_at BEFORE UPDATE ON public.instruction_lists FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.instruction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.instruction_lists(id) ON DELETE CASCADE,
  body_ar text NOT NULL,
  body_en text,
  icon_key text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.instruction_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.instruction_items TO authenticated;
GRANT ALL ON public.instruction_items TO service_role;
ALTER TABLE public.instruction_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "instruction_items: public read" ON public.instruction_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.instruction_lists l WHERE l.id = list_id AND (l.status = 'published' OR public.is_staff(auth.uid())))
);
CREATE POLICY "instruction_items: staff write" ON public.instruction_items FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_instruction_items_updated_at BEFORE UPDATE ON public.instruction_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 13) Contact + Social
-- =========================================================

CREATE TABLE public.contact_info (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  phone_primary text,
  phone_secondary text,
  email text,
  address_ar text,
  address_en text,
  google_maps_embed_url text,
  google_maps_lat numeric,
  google_maps_lng numeric,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contact_info TO anon, authenticated;
GRANT INSERT, UPDATE ON public.contact_info TO authenticated;
GRANT ALL ON public.contact_info TO service_role;
ALTER TABLE public.contact_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_info: public read" ON public.contact_info FOR SELECT USING (true);
CREATE POLICY "contact_info: staff write" ON public.contact_info FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_contact_info_updated_at BEFORE UPDATE ON public.contact_info FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.contact_info (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  label text,
  url text NOT NULL,
  icon_key text,
  display_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.social_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.social_links TO authenticated;
GRANT ALL ON public.social_links TO service_role;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_links: public read visible" ON public.social_links FOR SELECT USING (is_visible OR public.is_staff(auth.uid()));
CREATE POLICY "social_links: staff write" ON public.social_links FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_social_links_updated_at BEFORE UPDATE ON public.social_links FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 14) Administration: audit log, versions, outbox
-- =========================================================

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_table text NOT NULL,
  entity_id uuid,
  diff jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_entity ON public.audit_log (entity_table, entity_id);
CREATE INDEX idx_audit_log_actor ON public.audit_log (actor_id, created_at DESC);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log: admin read" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "audit_log: staff insert" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_table text NOT NULL,
  entity_id uuid NOT NULL,
  version int NOT NULL,
  snapshot jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_table, entity_id, version)
);
CREATE INDEX idx_content_versions_entity ON public.content_versions (entity_table, entity_id, version DESC);
GRANT SELECT, INSERT ON public.content_versions TO authenticated;
GRANT ALL ON public.content_versions TO service_role;
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_versions: staff read" ON public.content_versions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "content_versions: staff insert" ON public.content_versions FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "content_versions: admin delete" ON public.content_versions FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.notifications_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz,
  sent_at timestamptz,
  error text,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_status ON public.notifications_outbox (status, scheduled_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications_outbox TO authenticated;
GRANT ALL ON public.notifications_outbox TO service_role;
ALTER TABLE public.notifications_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_outbox: admin all" ON public.notifications_outbox FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_notifications_outbox_updated_at BEFORE UPDATE ON public.notifications_outbox FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
