DO $$
DECLARE
  v_category_id uuid;
  v_year_id uuid;
  v_achievement_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.achievement_categories (slug, name_ar, name_en, display_order)
  VALUES ('kindergarten', 'رياض الأطفال', 'Kindergarten', 2)
  ON CONFLICT (slug) DO UPDATE
    SET name_ar = EXCLUDED.name_ar,
        name_en = EXCLUDED.name_en,
        display_order = EXCLUDED.display_order,
        updated_at = now();

  SELECT id INTO v_category_id
  FROM public.achievement_categories
  WHERE slug = 'kindergarten';

  SELECT id INTO v_year_id
  FROM public.academic_years
  WHERE name = '2025 / 2026'
  LIMIT 1;

  INSERT INTO public.achievements (
    id,
    category_id,
    academic_year_id,
    title_ar,
    title_en,
    slug,
    description_ar,
    description_en,
    cover_image_url,
    achieved_on,
    is_featured,
    is_pinned,
    show_on_homepage,
    show_on_about_timeline,
    seo_title,
    seo_description,
    status,
    published_at,
    external_ref
  )
  VALUES (
    v_achievement_id,
    v_category_id,
    v_year_id,
    'تجهيزات رياض الأطفال لاستقبال العام الدراسي الجديد',
    'Kindergarten Preparation for the New Academic Year',
    'kindergarten-preparation-2025-2026',
    'استعدادًا لاستقبال أطفالنا في بداية عام دراسي جديد، تم تجهيز بيئة رياض الأطفال بعناية لتكون مكانًا آمنًا، مريحًا، ومحفزًا على التعلم والاكتشاف، بما يساعد الأطفال على بدء رحلتهم التعليمية بثقة وسعادة.

في إطار الاستعداد لانطلاق العام الدراسي الجديد، استكملت مدرسة الناصرية الابتدائية الجديدة جميع تجهيزات قسم رياض الأطفال، بهدف توفير بيئة تعليمية متكاملة تليق بأطفالنا في أولى مراحل رحلتهم التعليمية.

ركزت أعمال التجهيز على تهيئة الفصول والمساحات التعليمية بصورة منظمة وجاذبة، بما يوفر بيئة آمنة ومريحة تساعد الأطفال على التعلم من خلال الاستكشاف واللعب والأنشطة التربوية.

وقد أُنجزت هذه التجهيزات تحت إشراف

الأستاذة / نادية طريح

وبجهود وتعاون معلمات أسرة رياض الأطفال، اللاتي حرصن على إعداد بيئة تعليمية دافئة تُشعر الأطفال بالترحيب والانتماء منذ يومهم الأول داخل المدرسة.

وتتطلع أسرة رياض الأطفال بكل سعادة لاستقبال أبنائنا وبناتنا، متمنية لهم عامًا دراسيًا مليئًا بالتعلم، والمرح، والنجاح، والذكريات الجميلة.

أهلًا وسهلًا بكم...

نحن في انتظاركم بكل حب.',
    'Kindergarten preparation for the new academic year.',
    '/__l5e/assets-v1/2483fbb5-ded6-40cd-bab3-8b55ad4cd9de/kindergarten-01-welcome-path-cleaning.png',
    '2026-07-01',
    true,
    false,
    true,
    true,
    'تجهيزات رياض الأطفال لاستقبال العام الدراسي الجديد | مدرسة الناصرية الابتدائية الجديدة',
    'توثيق رسمي لتجهيزات رياض الأطفال بمدرسة الناصرية الابتدائية الجديدة استعدادًا لاستقبال العام الدراسي الجديد في بيئة آمنة ومحفزة ودافئة للأطفال.',
    'published',
    now(),
    jsonb_build_object(
      'story_layout', 'kindergarten-welcome',
      'welcome_title_ar', 'بداية دافئة لأطفالنا الصغار',
      'welcome_body_ar', 'استعدادًا لاستقبال أطفالنا في بداية عام دراسي جديد، تم تجهيز بيئة رياض الأطفال بعناية لتكون مكانًا آمنًا، مريحًا، ومحفزًا على التعلم والاكتشاف، بما يساعد الأطفال على بدء رحلتهم التعليمية بثقة وسعادة.',
      'official_message_title_ar', 'الرسالة الرسمية',
      'official_message_ar', 'في إطار الاستعداد لانطلاق العام الدراسي الجديد، استكملت مدرسة الناصرية الابتدائية الجديدة جميع تجهيزات قسم رياض الأطفال، بهدف توفير بيئة تعليمية متكاملة تليق بأطفالنا في أولى مراحل رحلتهم التعليمية.\n\nركزت أعمال التجهيز على تهيئة الفصول والمساحات التعليمية بصورة منظمة وجاذبة، بما يوفر بيئة آمنة ومريحة تساعد الأطفال على التعلم من خلال الاستكشاف واللعب والأنشطة التربوية.\n\nوقد أُنجزت هذه التجهيزات تحت إشراف\n\nالأستاذة / نادية طريح\n\nوبجهود وتعاون معلمات أسرة رياض الأطفال، اللاتي حرصن على إعداد بيئة تعليمية دافئة تُشعر الأطفال بالترحيب والانتماء منذ يومهم الأول داخل المدرسة.',
      'closing_title_ar', 'أهلًا وسهلًا بكم',
      'closing_body_ar', 'وتتطلع أسرة رياض الأطفال بكل سعادة لاستقبال أبنائنا وبناتنا، متمنية لهم عامًا دراسيًا مليئًا بالتعلم، والمرح، والنجاح، والذكريات الجميلة.\n\nنحن في انتظاركم بكل حب.',
      'supervision_label_ar', 'تحت إشراف',
      'supervision_name_ar', 'الأستاذة / نادية طريح',
      'highlights', jsonb_build_array(
        jsonb_build_object('title_ar', 'بيئة تعليمية جاذبة', 'body_ar', 'تهيئة المساحات بصورة مبهجة ومنظمة تساعد الأطفال على الشعور بالألفة منذ لحظة الدخول.'),
        jsonb_build_object('title_ar', 'إعداد الفصول', 'body_ar', 'تنسيق القاعات التعليمية بما يدعم الأنشطة اليومية والتعلم من خلال المشاهدة والتفاعل.'),
        jsonb_build_object('title_ar', 'استقبال الأطفال', 'body_ar', 'تجهيز التفاصيل البصرية والترحيبية بما يعكس اهتمام المدرسة ببدء العام الدراسي بروح دافئة.'),
        jsonb_build_object('title_ar', 'السلامة والراحة', 'body_ar', 'الاهتمام بنظافة المساحات وترتيبها لتكون مناسبة ومريحة للأطفال في هذه المرحلة العمرية.'),
        jsonb_build_object('title_ar', 'جاهزية تربوية', 'body_ar', 'إعداد الأركان والوسائل بما يدعم التعلم والاكتشاف واللعب الهادف داخل رياض الأطفال.')
      )
    )
  )
  ON CONFLICT (slug) DO UPDATE
    SET category_id = EXCLUDED.category_id,
        academic_year_id = EXCLUDED.academic_year_id,
        title_ar = EXCLUDED.title_ar,
        title_en = EXCLUDED.title_en,
        description_ar = EXCLUDED.description_ar,
        description_en = EXCLUDED.description_en,
        cover_image_url = EXCLUDED.cover_image_url,
        achieved_on = EXCLUDED.achieved_on,
        is_featured = EXCLUDED.is_featured,
        is_pinned = EXCLUDED.is_pinned,
        show_on_homepage = EXCLUDED.show_on_homepage,
        show_on_about_timeline = EXCLUDED.show_on_about_timeline,
        seo_title = EXCLUDED.seo_title,
        seo_description = EXCLUDED.seo_description,
        status = EXCLUDED.status,
        published_at = EXCLUDED.published_at,
        external_ref = EXCLUDED.external_ref,
        updated_at = now();

  SELECT id INTO v_achievement_id
  FROM public.achievements
  WHERE slug = 'kindergarten-preparation-2025-2026';

  DELETE FROM public.achievement_media
  WHERE achievement_id = v_achievement_id;

  INSERT INTO public.achievement_media (
    achievement_id,
    image_url,
    display_order,
    caption_ar,
    alt_ar
  ) VALUES
    (v_achievement_id, '/__l5e/assets-v1/2483fbb5-ded6-40cd-bab3-8b55ad4cd9de/kindergarten-01-welcome-path-cleaning.png', 1, 'الممر الخارجي لرياض الأطفال بعد أعمال النظافة والاستعداد لاستقبال الأطفال', 'الممر الخارجي لرياض الأطفال بعد التنظيف والتجهيز'),
    (v_achievement_id, '/__l5e/assets-v1/631e3285-f859-4783-98f8-b81349ccd8ea/kindergarten-02-playground-preparation.png', 2, 'تجهيز منطقة اللعب وتنظيف الألعاب الخارجية استعدادًا للعام الدراسي', 'تنظيف منطقة الألعاب في رياض الأطفال'),
    (v_achievement_id, '/__l5e/assets-v1/ff2ebb1a-d1fc-4bd3-b572-436c46c77eed/kindergarten-03-mural-closeup.png', 3, 'تفاصيل الجداريات المبهجة داخل بيئة رياض الأطفال', 'جدارية مرسومة داخل مساحة رياض الأطفال'),
    (v_achievement_id, '/__l5e/assets-v1/09041480-0d07-4e92-9991-b088155556e9/kindergarten-04-classroom-preparation.png', 4, 'استكمال تجهيز الفصل وتنظيم المقاعد والمواد التعليمية', 'معلمة تُجهز الفصل لاستقبال الأطفال'),
    (v_achievement_id, '/__l5e/assets-v1/61095691-c211-434d-9b2f-ffec7b564f8f/kindergarten-05-learning-wall.png', 5, 'الوسائط التعليمية والزخارف الصفية داخل القاعة', 'واجهة تعليمية داخل فصل رياض الأطفال'),
    (v_achievement_id, '/__l5e/assets-v1/a85be9aa-e1c8-4425-ad84-cb09d4fc728e/kindergarten-06-classroom-welcome-tables.png', 6, 'ترتيب الطاولات وتجهيز القاعة في صورة ترحيبية مبهجة', 'طاولات قاعة رياض الأطفال بعد التجهيز النهائي');
END $$;