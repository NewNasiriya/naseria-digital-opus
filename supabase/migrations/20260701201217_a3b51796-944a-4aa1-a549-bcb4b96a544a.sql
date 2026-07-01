
-- 1) Extend achievements
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_on_homepage boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_on_about_timeline boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cover_image_url text;

-- 2) Extend achievement_media to allow direct URLs (fallback to CDN assets)
ALTER TABLE public.achievement_media
  ALTER COLUMN media_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS alt_ar text,
  ADD COLUMN IF NOT EXISTS alt_en text;

ALTER TABLE public.achievement_media
  DROP CONSTRAINT IF EXISTS achievement_media_source_chk;
ALTER TABLE public.achievement_media
  ADD CONSTRAINT achievement_media_source_chk
  CHECK (media_id IS NOT NULL OR image_url IS NOT NULL);

-- 3) Seed Infrastructure category
INSERT INTO public.achievement_categories (id, name_ar, name_en, slug, display_order)
VALUES (gen_random_uuid(), 'البنية التحتية والتطوير', 'Infrastructure & Development', 'infrastructure', 1)
ON CONFLICT (slug) DO NOTHING;

-- 4) Seed the achievement
DO $$
DECLARE
  v_cat_id uuid;
  v_year_id uuid;
  v_ach_id uuid;
  v_summary text := 'استعدادًا لانطلاق العام الدراسي الجديد، شهدت المدرسة مجموعة متكاملة من أعمال التطوير والتجهيز بهدف توفير بيئة تعليمية أكثر جودة وتنظيمًا، بما يعكس حرص إدارة المدرسة على توفير أفضل تجربة تعليمية للطلاب منذ اليوم الأول للدراسة.';
  v_full text := E'في إطار الاستعداد لاستقبال العام الدراسي الجديد، نفذت مدرسة الناصرية الابتدائية الجديدة مجموعة من أعمال التطوير والتجهيز داخل مرافق المدرسة، بهدف تهيئة بيئة تعليمية آمنة ومنظمة ومحفزة على التعلم.\n\nشملت هذه الأعمال أعمال الصيانة والتطوير والتجهيزات اللازمة لضمان جاهزية المدرسة لاستقبال الطلاب مع بداية العام الدراسي، بما يحقق أعلى مستويات التنظيم والجودة داخل البيئة التعليمية.\n\nوقد نُفذت هذه التجهيزات تحت الإشراف المباشر لمديرة المدرسة الأستاذة / شيرين البيلي، وبمتابعة وكيلة المدرسة الأستاذة / حنان الزيات.\n\nوتأتي هذه الجهود في إطار حرص إدارة المدرسة على الارتقاء بالعملية التعليمية، وتهيئة بيئة مدرسية مناسبة تدعم الطلاب والمعلمين وتوفر بداية متميزة للعام الدراسي الجديد.';
BEGIN
  SELECT id INTO v_cat_id FROM public.achievement_categories WHERE slug = 'infrastructure';
  SELECT id INTO v_year_id FROM public.academic_years WHERE name = '2025 / 2026';

  INSERT INTO public.achievements (
    id, category_id, academic_year_id, title_ar, title_en, slug,
    description_ar, description_en,
    cover_image_url, achieved_on,
    is_featured, is_pinned, show_on_homepage, show_on_about_timeline,
    seo_title, seo_description,
    status, published_at
  )
  VALUES (
    gen_random_uuid(), v_cat_id, v_year_id,
    'تجهيزات المدرسة واستعداداتها لاستقبال العام الدراسي الجديد',
    'School Renovation & Preparation for the New Academic Year',
    'school-renovation-2025-2026',
    v_full, NULL,
    '/__l5e/assets-v1/ebbfddae-08e0-4b9c-bfb4-0e8cd0ecb313/renovation-04-entrance-wall.png',
    CURRENT_DATE,
    true, true, true, true,
    'تجهيزات المدرسة للعام الدراسي الجديد | مدرسة الناصرية الابتدائية الجديدة',
    v_summary,
    'published', now()
  )
  ON CONFLICT (slug) DO UPDATE SET
    description_ar = EXCLUDED.description_ar,
    cover_image_url = EXCLUDED.cover_image_url,
    is_featured = EXCLUDED.is_featured,
    is_pinned = EXCLUDED.is_pinned,
    show_on_homepage = EXCLUDED.show_on_homepage,
    show_on_about_timeline = EXCLUDED.show_on_about_timeline,
    academic_year_id = EXCLUDED.academic_year_id,
    category_id = EXCLUDED.category_id,
    seo_title = EXCLUDED.seo_title,
    seo_description = EXCLUDED.seo_description,
    status = 'published',
    published_at = COALESCE(public.achievements.published_at, now())
  RETURNING id INTO v_ach_id;

  IF v_ach_id IS NULL THEN
    SELECT id INTO v_ach_id FROM public.achievements WHERE slug = 'school-renovation-2025-2026';
  END IF;

  -- Reset gallery for idempotent seeding
  DELETE FROM public.achievement_media WHERE achievement_id = v_ach_id;

  INSERT INTO public.achievement_media (achievement_id, image_url, caption_ar, alt_ar, display_order) VALUES
    (v_ach_id, '/__l5e/assets-v1/ebbfddae-08e0-4b9c-bfb4-0e8cd0ecb313/renovation-04-entrance-wall.png',
      'الواجهة الرئيسية للمدرسة بعد أعمال التطوير والدهانات', 'الواجهة الرئيسية للمدرسة بعد التجهيز', 1),
    (v_ach_id, '/__l5e/assets-v1/2f30b5c6-5071-49db-8526-f4afe37c1a70/renovation-05-mural.png',
      'جدارية فنية تزين السور الخارجي للمدرسة', 'جدارية فنية على سور المدرسة', 2),
    (v_ach_id, '/__l5e/assets-v1/8f63c8fe-9bc8-46b2-a596-df73c36b922b/renovation-06-courtyard.png',
      'الممر الخارجي المُهيَّأ للطلاب بعد أعمال التنسيق والتشجير', 'الممر الخارجي بعد التطوير', 3),
    (v_ach_id, '/__l5e/assets-v1/3e6d6b36-e36a-46f0-ac83-5c37534435b9/renovation-03-brick-planters.png',
      'إنشاء أحواض الزراعة الطوبية داخل فناء المدرسة', 'إنشاء أحواض الزراعة في الفناء', 4),
    (v_ach_id, '/__l5e/assets-v1/6acef323-ed52-4fef-b417-194a7377f0e8/renovation-01-planting.png',
      'أعمال تجهيز الأرض وزراعة الشتلات في محيط المدرسة', 'أعمال زراعة الشتلات في محيط المدرسة', 5),
    (v_ach_id, '/__l5e/assets-v1/c7ddc8f3-01c7-48d7-a189-2e01b177d139/renovation-02-tree-care.png',
      'العناية بالمساحات الخضراء وتثبيت الأشجار الحديثة', 'العناية بالمساحات الخضراء', 6),
    (v_ach_id, '/__l5e/assets-v1/625ed1c4-802b-4496-9c06-76112f62e4ef/renovation-07-classroom.png',
      'تجهيز الفصول الدراسية والوسائل التعليمية استعدادًا لاستقبال الطلاب', 'فصل دراسي مُجهَّز', 7);
END $$;
