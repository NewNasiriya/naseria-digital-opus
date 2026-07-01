
-- =============== SCHOOL POLICIES ===============
CREATE TABLE IF NOT EXISTS public.school_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  summary_ar text,
  content_ar text,
  category_ar text,
  effective_date date,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  visibility text NOT NULL DEFAULT 'public',
  status public.content_status NOT NULL DEFAULT 'draft',
  display_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.school_policies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_policies TO authenticated;
GRANT ALL ON public.school_policies TO service_role;

ALTER TABLE public.school_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policies_public_read" ON public.school_policies
  FOR SELECT USING (status = 'published' AND visibility = 'public');
CREATE POLICY "policies_staff_all" ON public.school_policies
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_school_policies_updated_at
  BEFORE UPDATE ON public.school_policies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_school_policies_status_order
  ON public.school_policies (status, display_order);

-- =============== FAQ ===============
CREATE TABLE IF NOT EXISTS public.faq_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  slug text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.faq_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faq_categories TO authenticated;
GRANT ALL ON public.faq_categories TO service_role;

ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faq_cats_public_read" ON public.faq_categories
  FOR SELECT USING (status = 'published');
CREATE POLICY "faq_cats_staff_all" ON public.faq_categories
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_faq_categories_updated_at
  BEFORE UPDATE ON public.faq_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.faq_categories(id) ON DELETE SET NULL,
  question_ar text NOT NULL,
  answer_ar text,
  display_order integer NOT NULL DEFAULT 0,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.faq_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faq_items TO authenticated;
GRANT ALL ON public.faq_items TO service_role;

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faq_items_public_read" ON public.faq_items
  FOR SELECT USING (status = 'published');
CREATE POLICY "faq_items_staff_all" ON public.faq_items
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER trg_faq_items_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_faq_items_cat_order
  ON public.faq_items (category_id, display_order);

-- =============== SEED: Student guidelines ===============
DO $$
DECLARE
  v_list uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.instruction_lists WHERE audience = 'student') THEN
    INSERT INTO public.instruction_lists (audience, title_ar, description_ar, display_order, status)
    VALUES ('student', 'إرشادات الطالب الرسمية',
      'مجموعة من التوجيهات التعليمية التي تساعد الطالب على الالتزام والتميّز داخل المدرسة.',
      0, 'published')
    RETURNING id INTO v_list;

    INSERT INTO public.instruction_items (list_id, body_ar, display_order) VALUES
      (v_list, 'الالتزام بالحضور في الموعد المحدد وعدم التأخر.', 1),
      (v_list, 'ارتداء الزي المدرسي المعتمد والالتزام بالمظهر اللائق.', 2),
      (v_list, 'احترام المعلمين والإداريين والزملاء.', 3),
      (v_list, 'المحافظة على نظافة المدرسة والفصول والمرافق.', 4),
      (v_list, 'إحضار الأدوات والكتب المدرسية المطلوبة.', 5),
      (v_list, 'الالتزام بالتعليمات داخل الفصل وأثناء الفسحة.', 6),
      (v_list, 'عدم إحضار أي أدوات أو مواد قد تعرض الآخرين للخطر.', 7),
      (v_list, 'المحافظة على ممتلكات المدرسة واستخدامها بعناية.', 8),
      (v_list, 'المشاركة الإيجابية في الأنشطة المدرسية.', 9),
      (v_list, 'التحلي بالأمانة والصدق وحسن السلوك داخل المدرسة وخارجها.', 10);
  END IF;
END $$;

-- =============== SEED: Parent guidelines ===============
DO $$
DECLARE
  v_list uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.instruction_lists WHERE audience = 'parent') THEN
    INSERT INTO public.instruction_lists (audience, title_ar, description_ar, display_order, status)
    VALUES ('parent', 'إرشادات أولياء الأمور',
      'دليل ولي الأمر لدعم تعليم أبنائه والتواصل الفعّال مع المدرسة.',
      0, 'published')
    RETURNING id INTO v_list;

    INSERT INTO public.instruction_items (list_id, body_ar, display_order) VALUES
      (v_list, 'متابعة انتظام الطالب في الحضور.', 1),
      (v_list, 'التأكد من استعداد الطالب لليوم الدراسي.', 2),
      (v_list, 'متابعة الواجبات والأنشطة الدراسية.', 3),
      (v_list, 'تحديث بيانات التواصل عند الحاجة.', 4),
      (v_list, 'عدم إرسال الطالب إلى المدرسة عند وجود حالة مرضية.', 5),
      (v_list, 'الالتزام بمواعيد التواصل المعلنة مع المدرسة.', 6),
      (v_list, 'متابعة الإعلانات الرسمية عبر موقع المدرسة.', 7),
      (v_list, 'التعاون مع المدرسة في دعم السلوك الإيجابي.', 8),
      (v_list, 'إبلاغ المدرسة بأي ظروف قد تؤثر على الطالب.', 9),
      (v_list, 'تعزيز التواصل المستمر مع المدرسة.', 10);
  END IF;
END $$;

-- =============== SEED: Attendance philosophy ===============
UPDATE public.attendance_info
   SET content_ar = COALESCE(NULLIF(TRIM(content_ar), ''),
       'يُعدّ الحضور المنتظم ركيزة أساسية لنجاح الطالب الدراسي، إذ يُسهم في متابعة الدروس بشكل متسلسل، والمشاركة الفاعلة داخل الفصل، والاستفادة من الأنشطة التعليمية المصاحبة.'
       || E'\n\n' ||
       'تحرص المدرسة على متابعة انتظام الطلاب بالتعاون مع أولياء الأمور، وتوفير بيئة تعليمية داعمة تُشجّع على الاستمرارية والالتزام، مع مراعاة الظروف الاستثنائية التي قد تطرأ على الطالب.'
       || E'\n\n' ||
       'يُسهم الحضور المنتظم في بناء العادات الإيجابية لدى الطالب، وتعزيز إحساسه بالمسؤولية تجاه دراسته ومدرسته، وهو ما ينعكس مباشرة على تحصيله الأكاديمي وتفاعله مع زملائه ومعلميه.')
 WHERE id = 1;

-- =============== SEED: Behaviour values ===============
INSERT INTO public.behaviour_guidelines (title_ar, body_ar, icon_key, display_order, status)
SELECT * FROM (VALUES
  ('الاحترام', 'يحرص طلاب المدرسة على احترام معلميهم وإدارييهم وزملائهم، وتقدير مشاعر الآخرين، والتعامل معهم بأدب ولطف داخل المدرسة وخارجها.', 'respect', 1, 'published'::public.content_status),
  ('المسؤولية', 'يتحمّل الطالب مسؤولية أدواته ودراسته وسلوكه، ويسعى للوفاء بواجباته المدرسية والالتزام بمواعيده، بما يعزّز ثقته بنفسه واستقلاليته.', 'responsibility', 2, 'published'),
  ('الأمانة والصدق', 'الأمانة قيمة أصيلة في شخصية الطالب، تظهر في صدق حديثه، وأمانته في اختباراته وواجباته، والمحافظة على ممتلكات المدرسة وزملائه.', 'honesty', 3, 'published'),
  ('التعاون', 'نُشجّع الطلاب على العمل الجماعي والمشاركة الإيجابية في الأنشطة الصفية واللاصفية، ومساعدة زملائهم بروح الفريق الواحد.', 'cooperation', 4, 'published'),
  ('البيئة المدرسية', 'المحافظة على نظافة المدرسة وفصولها ومرافقها مسؤولية مشتركة، تُسهم في توفير بيئة تعليمية آمنة ومريحة للجميع.', 'environment', 5, 'published'),
  ('المشاركة الإيجابية', 'نُثمّن مشاركة الطلاب الفاعلة في الحصص الدراسية والأنشطة المدرسية والاحتفالات الوطنية، بما يعزّز شخصياتهم وانتماءهم لمدرستهم.', 'participation', 6, 'published'),
  ('المواطنة الرقمية', 'نُرسّخ لدى الطلاب مبادئ الاستخدام المسؤول للتقنية والاحترام في التواصل الرقمي، تمهيدًا لبناء وعي رقمي متكامل في المستقبل.', 'digital', 7, 'published')
) AS v(title_ar, body_ar, icon_key, display_order, status)
WHERE NOT EXISTS (SELECT 1 FROM public.behaviour_guidelines LIMIT 1);

-- =============== SEED: FAQ ===============
DO $$
DECLARE
  v_cat uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.faq_categories) THEN
    INSERT INTO public.faq_categories (title_ar, slug, display_order, status)
    VALUES ('أسئلة عامة', 'general', 0, 'published')
    RETURNING id INTO v_cat;

    INSERT INTO public.faq_items (category_id, question_ar, answer_ar, display_order, status) VALUES
      (v_cat, 'كيف يمكنني الاطلاع على الجداول الدراسية؟',
        'الجداول الدراسية متاحة داخل قسم الحياة الأكاديمية، وذلك في الصفحة المخصّصة لكل صف دراسي على حدة.', 1, 'published'),
      (v_cat, 'أين تُنشر جداول الامتحانات؟',
        'تُنشر جداول الامتحانات الرسمية داخل صفحة كل صف دراسي في قسم الحياة الأكاديمية فور اعتمادها من إدارة المدرسة.', 2, 'published'),
      (v_cat, 'كيف يمكن لأولياء الأمور متابعة إعلانات المدرسة؟',
        'يمكن متابعة الإعلانات والأخبار الرسمية من خلال قسم "الأخبار" على موقع المدرسة، حيث تُنشر جميع التعميمات فور صدورها.', 3, 'published'),
      (v_cat, 'أين يمكن العثور على المستندات الرسمية؟',
        'تُتاح المستندات الرسمية للتنزيل داخل الأقسام المرتبطة بها، مثل صفحة السياسات المدرسية وصفحة التقويم الأكاديمي.', 4, 'published');
  END IF;
END $$;
