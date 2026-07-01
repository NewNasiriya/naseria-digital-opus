
-- Extend contact_info with multi-value contacts, location and notices
ALTER TABLE public.contact_info
  ADD COLUMN IF NOT EXISTS emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS phones jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS google_maps_link text,
  ADD COLUMN IF NOT EXISTS plus_code text,
  ADD COLUMN IF NOT EXISTS directions_ar text,
  ADD COLUMN IF NOT EXISTS directions_en text,
  ADD COLUMN IF NOT EXISTS holiday_notice_ar text,
  ADD COLUMN IF NOT EXISTS special_announcement_ar text,
  ADD COLUMN IF NOT EXISTS educational_administration_ar text,
  ADD COLUMN IF NOT EXISTS governorate_ar text,
  ADD COLUMN IF NOT EXISTS country_ar text;

-- Ensure the singleton row exists
INSERT INTO public.contact_info (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Seed real official data
UPDATE public.contact_info SET
  email = 'info@newnasiriya.com',
  address_ar = 'الناصرية، مركز سمنود، محافظة الغربية، جمهورية مصر العربية',
  plus_code = 'W6RV+FJ7',
  educational_administration_ar = 'الإدارة التعليمية بسمنود',
  governorate_ar = 'محافظة الغربية',
  country_ar = 'جمهورية مصر العربية',
  emails = '[
    {"label":"البريد الرسمي","value":"info@newnasiriya.com","primary":true},
    {"label":"إدارة المدرسة","value":"administration@newnasiriya.com","primary":false},
    {"label":"القبول والتسجيل","value":"admissions@newnasiriya.com","primary":false}
  ]'::jsonb,
  phones = '[]'::jsonb
WHERE id = 1;

-- Seed school info with official names
UPDATE public.school_info SET
  welcome_message_ar = COALESCE(welcome_message_ar, welcome_message_ar)
WHERE id = 1;

-- Ensure site_settings has the official school names
INSERT INTO public.site_settings (id, school_name_ar, school_name_en)
VALUES (1, 'مدرسة الناصرية الابتدائية الجديدة', 'New Al-Nasiriyah Primary School')
ON CONFLICT (id) DO UPDATE SET
  school_name_ar = EXCLUDED.school_name_ar,
  school_name_en = EXCLUDED.school_name_en;

-- Seed working hours (Sunday=0 .. Saturday=6 in this project convention)
INSERT INTO public.working_hours (day_of_week, opens_at, closes_at, is_closed, note_ar, display_order) VALUES
  (0, '07:30', '14:30', false, NULL, 0),
  (1, '07:30', '14:30', false, NULL, 1),
  (2, '07:30', '14:30', false, NULL, 2),
  (3, '07:30', '14:30', false, NULL, 3),
  (4, '07:30', '14:30', false, NULL, 4),
  (5, NULL,   NULL,    true,  'إجازة رسمية', 5),
  (6, NULL,   NULL,    true,  'إجازة رسمية', 6)
ON CONFLICT DO NOTHING;
