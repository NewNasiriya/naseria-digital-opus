-- Complete only the three known published legacy articles whose body is
-- currently blank. The existing editorial summary is copied verbatim: no
-- facts are invented and any later editor-written body is preserved.
UPDATE public.news
SET
  body_ar = summary_ar,
  updated_at = now()
WHERE slug IN (
  'kindergarten-accreditation-appreciation',
  'admissions-open-new-students',
  'new-academic-year-start'
)
  AND NULLIF(btrim(body_ar), '') IS NULL
  AND NULLIF(btrim(summary_ar), '') IS NOT NULL;
