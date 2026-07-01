
DO $$ BEGIN
  CREATE TYPE public.academic_event_type AS ENUM (
    'year_start','semester_1','exams_1','mid_year_break',
    'semester_2','exams_2','year_end','summer_break','custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.academic_timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  event_type public.academic_event_type NOT NULL DEFAULT 'custom',
  headline_ar TEXT NOT NULL,
  subtitle_ar TEXT,
  description_ar TEXT,
  icon TEXT,
  theme TEXT,
  cta_text_ar TEXT,
  cta_href TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  countdown_enabled BOOLEAN NOT NULL DEFAULT true,
  show_on_homepage BOOLEAN NOT NULL DEFAULT true,
  show_popup BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT ON public.academic_timeline_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_timeline_events TO authenticated;
GRANT ALL ON public.academic_timeline_events TO service_role;

ALTER TABLE public.academic_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published timeline events"
  ON public.academic_timeline_events FOR SELECT USING (status = 'published');
CREATE POLICY "Staff can view all timeline events"
  ON public.academic_timeline_events FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can insert timeline events"
  ON public.academic_timeline_events FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update timeline events"
  ON public.academic_timeline_events FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete timeline events"
  ON public.academic_timeline_events FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER trg_academic_timeline_events_updated_at
  BEFORE UPDATE ON public.academic_timeline_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_academic_timeline_events_starts_at
  ON public.academic_timeline_events(starts_at);

INSERT INTO public.academic_timeline_events
  (event_type, headline_ar, subtitle_ar, description_ar, icon, theme, starts_at, ends_at, sort_order)
VALUES
  ('year_start',     'بداية العام الدراسي 2026 / 2027','انطلاق الدراسة رسميًا',
     'تبدأ الدراسة في مدرسة الناصرية الابتدائية الجديدة يوم السبت الموافق 12 سبتمبر 2026.',
     '📚','primary',  '2026-09-12 07:00+02', NULL, 10),
  ('semester_1',     'الفصل الدراسي الأول','العام الدراسي جارٍ',
     'الفصل الدراسي الأول من العام الدراسي 2026 / 2027.',
     '🏫','success',  '2026-09-12 07:00+02', '2027-01-08 23:59+02', 20),
  ('exams_1',        'امتحانات الفصل الدراسي الأول','صفوف النقل',
     'تُعقد امتحانات الفصل الدراسي الأول لصفوف النقل خلال الفترة من 9 حتى 14 يناير 2027.',
     '✏️','warning',  '2027-01-09 08:00+02', '2027-01-14 14:00+02', 30),
  ('mid_year_break', 'إجازة نصف العام','استراحة نصف العام الدراسي',
     'إجازة نصف العام الرسمية من 23 يناير حتى 4 فبراير 2027.',
     '🌴','emerald',  '2027-01-23 00:00+02', '2027-02-04 23:59+02', 40),
  ('semester_2',     'الفصل الدراسي الثاني','استئناف الدراسة',
     'يستأنف الطلاب دراستهم في الفصل الدراسي الثاني اعتبارًا من 6 فبراير 2027.',
     '📖','success',  '2027-02-06 07:00+02', '2027-06-24 14:00+02', 50),
  ('year_end',       'نهاية العام الدراسي','ختام العام',
     'تنتهي الدراسة رسميًا يوم 24 يونيو 2027 بإجمالي 183 يومًا دراسيًا.',
     '🎓','primary',  '2027-06-24 14:00+02', NULL, 60),
  ('summer_break',   'الإجازة الصيفية','إجازة سعيدة',
     'الإجازة الصيفية تبدأ فور انتهاء العام الدراسي.',
     '🏖️','emerald', '2027-06-25 00:00+02', '2027-09-11 23:59+02', 70)
ON CONFLICT DO NOTHING;
