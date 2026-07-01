
-- Set cover to the tree-planted outdoor corridor
UPDATE public.achievements
SET cover_image_url = '/__l5e/assets-v1/8f63c8fe-9bc8-46b2-a596-df73c36b922b/renovation-06-courtyard.png'
WHERE id = 'f3309833-8eb3-4e65-b40d-a2481bc8daec';

-- Reorder existing media
UPDATE public.achievement_media SET display_order = 1,  caption_ar = 'الممر الخارجي المُهيَّأ للطلاب بعد أعمال التنسيق والتشجير' WHERE id = '86a03a59-7753-4287-a69e-135f510786a9';
UPDATE public.achievement_media SET display_order = 3,  caption_ar = 'الواجهة الرئيسية للمدرسة بعد أعمال التطوير والدهانات' WHERE id = '860f1580-2009-4fa4-9313-2c4b3a6683ae';
UPDATE public.achievement_media SET display_order = 4,  caption_ar = 'جدارية فنية تزين السور الخارجي للمدرسة' WHERE id = 'e016880d-7fcf-41cb-ba7e-29a60e60936b';
UPDATE public.achievement_media SET display_order = 5,  caption_ar = 'إنشاء أحواض الزراعة الطوبية داخل فناء المدرسة' WHERE id = '377bee60-6581-4001-bb39-aa961acebc4f';
UPDATE public.achievement_media SET display_order = 6,  caption_ar = 'أعمال تجهيز الأرض وزراعة الشتلات في محيط المدرسة' WHERE id = 'cb6d30d5-3fee-4b62-83e0-b81d49a80ffb';
UPDATE public.achievement_media SET display_order = 7,  caption_ar = 'العناية بالمساحات الخضراء وتثبيت الأشجار الحديثة' WHERE id = 'fc5d73e4-9763-45f2-b2e5-6acd3b1c577f';
UPDATE public.achievement_media SET display_order = 15, caption_ar = 'تجهيز الفصول الدراسية والوسائل التعليمية استعدادًا لاستقبال الطلاب' WHERE id = 'd48dc163-ea5c-42b4-94fb-bdc4165a59e2';

-- Add the 8 new media
INSERT INTO public.achievement_media (achievement_id, image_url, display_order, caption_ar, alt_ar) VALUES
('f3309833-8eb3-4e65-b40d-a2481bc8daec', '/__l5e/assets-v1/6390c39c-58e5-4702-967b-e5825059c63b/renovation-08-building-exterior.png', 2,  'مبنى المدرسة كما يظهر من الخارج بعد استكمال أعمال التطوير', 'مبنى مدرسة النصيرية الابتدائية الجديدة من الخارج'),
('f3309833-8eb3-4e65-b40d-a2481bc8daec', '/__l5e/assets-v1/9e44a5a9-46f6-4b4a-9c89-8f8070643c4a/renovation-12-corridor-murals.png',   8,  'الممرات الداخلية بعد إعادة الدهانات وتزيينها بالجداريات التربوية', 'ممر داخلي مزين بجداريات تربوية'),
('f3309833-8eb3-4e65-b40d-a2481bc8daec', '/__l5e/assets-v1/a2136794-5d6f-4e7f-8df2-d973b71aac2a/renovation-13-hallway-decorations.png', 9,  'أعمال التزيين الفني للأركان التعليمية داخل المدرسة',              'ركن تعليمي مزين بالرسومات'),
('f3309833-8eb3-4e65-b40d-a2481bc8daec', '/__l5e/assets-v1/11105040-2945-4695-98d5-e269d90ab317/renovation-15-stairwell-view.png',      10, 'المشهد من داخل المدرسة بعد أعمال النظافة العامة وتنسيق المحيط',   'إطلالة من داخل المدرسة على الفناء الخارجي'),
('f3309833-8eb3-4e65-b40d-a2481bc8daec', '/__l5e/assets-v1/b117e41d-50df-490a-b424-a0c63457cfb6/renovation-09-community-cleaning.png',  11, 'أعمال الغسيل والنظافة الشاملة لواجهة المدرسة ومحيطها',            'أعمال نظافة شاملة لواجهة المدرسة'),
('f3309833-8eb3-4e65-b40d-a2481bc8daec', '/__l5e/assets-v1/0873642c-78ce-46bc-bcd8-47e858d575b0/renovation-10-plumbing-taps.png',       12, 'صيانة شبكات المياه وتركيب حنفيات جديدة في وحدات الوضوء',          'صيانة شبكة المياه وتركيب الحنفيات'),
('f3309833-8eb3-4e65-b40d-a2481bc8daec', '/__l5e/assets-v1/769b56f7-1e9a-4e76-8f9e-901c35152fae/renovation-11-bathroom-maintenance.png',13, 'أعمال الصيانة الشاملة لدورات المياه وتجهيزاتها الصحية',           'صيانة دورات المياه'),
('f3309833-8eb3-4e65-b40d-a2481bc8daec', '/__l5e/assets-v1/c4104180-60bf-4472-91b0-b47bf2f31853/renovation-14-library-room.png',        14, 'تجهيز غرفة المكتبة والأنشطة بمقاعد وطاولات مناسبة للطلاب',        'غرفة المكتبة والأنشطة الصفية');
