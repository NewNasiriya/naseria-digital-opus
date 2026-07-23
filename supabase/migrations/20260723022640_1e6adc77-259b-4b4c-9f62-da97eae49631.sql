
CREATE OR REPLACE FUNCTION public.is_media_publicly_visible(_media_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _media_id IS NOT NULL AND (
      EXISTS (SELECT 1 FROM public.site_settings s WHERE s.logo_media_id = _media_id OR s.favicon_media_id = _media_id)
      OR EXISTS (SELECT 1 FROM public.homepage_hero h WHERE h.hero_image_media_id = _media_id)
      OR EXISTS (SELECT 1 FROM public.school_info si WHERE si.principal_photo_media_id = _media_id)
      OR EXISTS (SELECT 1 FROM public.news n WHERE n.featured_image_media_id = _media_id AND n.status = 'published')
      OR EXISTS (SELECT 1 FROM public.news_media nm JOIN public.news n ON n.id = nm.news_id WHERE nm.media_id = _media_id AND n.status = 'published')
      OR EXISTS (SELECT 1 FROM public.achievements a WHERE a.cover_image_media_id = _media_id AND a.status = 'published')
      OR EXISTS (SELECT 1 FROM public.achievement_media am JOIN public.achievements a ON a.id = am.achievement_id WHERE am.media_id = _media_id AND a.status = 'published')
      OR EXISTS (SELECT 1 FROM public.activities ac WHERE ac.cover_image_media_id = _media_id AND ac.status = 'published')
      OR EXISTS (SELECT 1 FROM public.activity_media avm JOIN public.activities ac ON ac.id = avm.activity_id WHERE avm.media_id = _media_id AND ac.status = 'published')
      OR EXISTS (SELECT 1 FROM public.gallery_albums ga WHERE ga.cover_media_id = _media_id AND ga.status = 'published')
      OR EXISTS (SELECT 1 FROM public.gallery_items gi JOIN public.gallery_albums ga ON ga.id = gi.album_id WHERE gi.media_id = _media_id AND ga.status = 'published')
      OR EXISTS (SELECT 1 FROM public.honor_boards hb WHERE hb.media_id = _media_id AND hb.status = 'published')
      OR EXISTS (SELECT 1 FROM public.honor_entry_media hem JOIN public.honor_entries he ON he.id = hem.honor_entry_id WHERE hem.media_id = _media_id AND he.status = 'published')
      OR EXISTS (SELECT 1 FROM public.timetables t WHERE (t.document_media_id = _media_id OR t.cover_image_media_id = _media_id) AND t.status = 'published')
      OR EXISTS (SELECT 1 FROM public.academic_notes an WHERE an.attachment_media_id = _media_id AND an.status = 'published')
      OR EXISTS (SELECT 1 FROM public.academic_resources ar WHERE ar.media_id = _media_id AND ar.status = 'published')
    )
$$;

REVOKE EXECUTE ON FUNCTION public.is_media_publicly_visible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_media_publicly_visible(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "media: public read" ON public.media;

CREATE POLICY "media: public read referenced"
ON public.media
FOR SELECT
TO anon, authenticated
USING (is_archived = false AND public.is_media_publicly_visible(id));
