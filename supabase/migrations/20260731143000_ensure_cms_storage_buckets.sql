-- Ensure the three CMS Storage buckets exist in clean, recovery, and local
-- environments. This migration is additive and idempotent:
--   * existing buckets and their limits/MIME configuration are untouched;
--   * no object, media row, content row, or bucket is updated or deleted.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('media', 'media', false),
  ('documents', 'documents', false),
  ('private-uploads', 'private-uploads', false)
ON CONFLICT (id) DO NOTHING;
