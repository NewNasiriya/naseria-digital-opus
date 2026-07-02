
-- academic_notes
CREATE TABLE public.academic_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id uuid NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  body_ar text,
  attachment_media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  display_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.academic_notes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_notes TO authenticated;
GRANT ALL ON public.academic_notes TO service_role;

ALTER TABLE public.academic_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published academic notes"
  ON public.academic_notes FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Staff can manage academic notes"
  ON public.academic_notes FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_academic_notes_updated_at
  BEFORE UPDATE ON public.academic_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_academic_notes_grade_status
  ON public.academic_notes (grade_id, status, display_order);

-- academic_resources
CREATE TABLE public.academic_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id uuid NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  title_ar text NOT NULL,
  description_ar text,
  media_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  display_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.academic_resources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_resources TO authenticated;
GRANT ALL ON public.academic_resources TO service_role;

ALTER TABLE public.academic_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published academic resources"
  ON public.academic_resources FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Staff can manage academic resources"
  ON public.academic_resources FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_academic_resources_updated_at
  BEFORE UPDATE ON public.academic_resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_academic_resources_grade_status
  ON public.academic_resources (grade_id, status, display_order);
