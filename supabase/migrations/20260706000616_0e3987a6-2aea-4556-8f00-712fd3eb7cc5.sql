ALTER TABLE public.school_info
  ADD COLUMN IF NOT EXISTS school_name_ar TEXT,
  ADD COLUMN IF NOT EXISTS school_name_en TEXT,
  ADD COLUMN IF NOT EXISTS educational_administration_ar TEXT,
  ADD COLUMN IF NOT EXISTS school_type_ar TEXT,
  ADD COLUMN IF NOT EXISTS educational_level_ar TEXT,
  ADD COLUMN IF NOT EXISTS working_hours_summary_ar TEXT,
  ADD COLUMN IF NOT EXISTS principal_position_ar TEXT;