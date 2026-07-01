
-- Add 5 new kindergarten preparation photos and promote the educational-aids
-- classroom photograph to be the primary cover image.

WITH ach AS (
  SELECT id FROM public.achievements WHERE slug = 'kindergarten-preparation-2025-2026'
)
UPDATE public.achievements
SET cover_image_url = '/__l5e/assets-v1/18a41029-a9fd-4915-a8a2-5810c6dfac92/kindergarten-08-educational-aids.png',
    updated_at = now()
WHERE id = (SELECT id FROM ach);

-- Reorder existing media (shift to make room for the new cover at position 1)
WITH ach AS (
  SELECT id FROM public.achievements WHERE slug = 'kindergarten-preparation-2025-2026'
)
UPDATE public.achievement_media m
SET display_order = CASE image_url
  WHEN '/__l5e/assets-v1/61095691-c211-434d-9b2f-ffec7b564f8f/kindergarten-05-learning-wall.png' THEN 2
  WHEN '/__l5e/assets-v1/ff2ebb1a-d1fc-4bd3-b572-436c46c77eed/kindergarten-03-mural-closeup.png' THEN 3
  WHEN '/__l5e/assets-v1/09041480-0d07-4e92-9991-b088155556e9/kindergarten-04-classroom-preparation.png' THEN 4
  WHEN '/__l5e/assets-v1/a85be9aa-e1c8-4425-ad84-cb09d4fc728e/kindergarten-06-classroom-welcome-tables.png' THEN 8
  WHEN '/__l5e/assets-v1/2483fbb5-ded6-40cd-bab3-8b55ad4cd9de/kindergarten-01-welcome-path-cleaning.png' THEN 10
  WHEN '/__l5e/assets-v1/631e3285-f859-4783-98f8-b81349ccd8ea/kindergarten-02-playground-preparation.png' THEN 11
END
WHERE achievement_id = (SELECT id FROM ach);

-- Insert the 5 new photographs
INSERT INTO public.achievement_media (achievement_id, image_url, display_order, alt_ar)
SELECT a.id, m.url, m.ord, m.alt FROM public.achievements a
CROSS JOIN (VALUES
  ('/__l5e/assets-v1/18a41029-a9fd-4915-a8a2-5810c6dfac92/kindergarten-08-educational-aids.png', 1, 'الوسائط التعليمية والزخارف الصفية داخل قاعة رياض الأطفال'),
  ('/__l5e/assets-v1/e5665067-8e0b-4391-9c70-76876d8c4e3d/kindergarten-11-crafting-decorations.png', 5, 'تصميم الزخارف والوسائط اليدوية استعدادًا للعام الدراسي'),
  ('/__l5e/assets-v1/a10c92a3-25dc-44a8-8015-e3c953de71e5/kindergarten-09-paper-preparation-yellow.png', 6, 'إعداد وقص الأوراق الملونة لتزيين الفصول'),
  ('/__l5e/assets-v1/e4c1d78a-fa6b-45b6-ba1b-7e8fb32c94fa/kindergarten-10-paper-preparation-green.png', 7, 'تجهيز الأوراق الخضراء لأعمال الزينة الصفية'),
  ('/__l5e/assets-v1/8826ce64-b81c-4a87-ab3b-6b587af88bb2/kindergarten-07-birthday-celebration.png', 9, 'تجهيز الفصل بالبالونات لاستقبال الأطفال')
) AS m(url, ord, alt)
WHERE a.slug = 'kindergarten-preparation-2025-2026';
