
-- Academic year for the Honor Board
INSERT INTO public.academic_years (name, starts_on, ends_on, is_current)
VALUES ('2025 / 2026', '2025-09-01', '2026-06-30', true)
ON CONFLICT DO NOTHING;

-- Honor Boards: one sheet (image) per grade per academic year
CREATE TABLE public.honor_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  title_ar TEXT,
  description_ar TEXT,
  media_id UUID REFERENCES public.media(id) ON DELETE SET NULL,
  image_url TEXT,
  status public.content_status NOT NULL DEFAULT 'draft',
  display_order INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (grade_id, academic_year_id),
  CHECK (media_id IS NOT NULL OR image_url IS NOT NULL)
);

CREATE INDEX idx_honor_boards_year ON public.honor_boards(academic_year_id);
CREATE INDEX idx_honor_boards_grade ON public.honor_boards(grade_id);
CREATE INDEX idx_honor_boards_status ON public.honor_boards(status);

GRANT SELECT ON public.honor_boards TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.honor_boards TO authenticated;
GRANT ALL ON public.honor_boards TO service_role;

ALTER TABLE public.honor_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "honor_boards: public read published"
  ON public.honor_boards FOR SELECT
  USING (status = 'published');

CREATE POLICY "honor_boards: staff read all"
  ON public.honor_boards FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "honor_boards: staff write"
  ON public.honor_boards FOR ALL
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_honor_boards_updated_at
  BEFORE UPDATE ON public.honor_boards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed the four official 2025/2026 sheets (grades 3–6) using CDN URLs.
WITH y AS (SELECT id FROM public.academic_years WHERE name = '2025 / 2026' LIMIT 1)
INSERT INTO public.honor_boards (grade_id, academic_year_id, title_ar, image_url, status, display_order, published_at)
SELECT g.id, y.id,
  'كشف بأسماء أوائل ' || g.name_ar,
  urls.url,
  'published'::public.content_status,
  g.level,
  now()
FROM (VALUES
  (3, '/__l5e/assets-v1/6341ee93-2239-4384-82e9-20d38e080a06/grade-3-honor-2025-2026.png'),
  (4, '/__l5e/assets-v1/PLACEHOLDER_G4/grade-4-honor-2025-2026.png'),
  (5, '/__l5e/assets-v1/PLACEHOLDER_G5/grade-5-honor-2025-2026.png'),
  (6, '/__l5e/assets-v1/PLACEHOLDER_G6/grade-6-honor-2025-2026.png')
) AS urls(level, url)
JOIN public.grades g ON g.level = urls.level
CROSS JOIN y
ON CONFLICT (grade_id, academic_year_id) DO NOTHING;
