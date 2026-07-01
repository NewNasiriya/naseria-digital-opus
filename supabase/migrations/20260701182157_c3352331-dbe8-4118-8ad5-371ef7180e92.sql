
-- Public read for media & documents; staff-only writes across all app buckets.
CREATE POLICY "storage: public read media"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('media','documents'));

CREATE POLICY "storage: staff read private-uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'private-uploads' AND public.is_staff(auth.uid()));

CREATE POLICY "storage: staff insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('media','documents','private-uploads') AND public.is_staff(auth.uid()));

CREATE POLICY "storage: staff update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id IN ('media','documents','private-uploads') AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id IN ('media','documents','private-uploads') AND public.is_staff(auth.uid()));

CREATE POLICY "storage: staff delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id IN ('media','documents','private-uploads') AND public.is_staff(auth.uid()));
