
-- Split each public read policy into an anon (published/visible only) policy
-- and an authenticated (published/visible OR staff) policy. This lets us
-- revoke EXECUTE on is_staff/has_role for anon without breaking the site.

-- news
DROP POLICY IF EXISTS "news: public read published" ON public.news;
CREATE POLICY "news: anon read published" ON public.news FOR SELECT TO anon
  USING (status = 'published'::content_status);
CREATE POLICY "news: auth read published or staff" ON public.news FOR SELECT TO authenticated
  USING (status = 'published'::content_status OR public.is_staff(auth.uid()));

-- achievements
DROP POLICY IF EXISTS "achievements: public read published" ON public.achievements;
CREATE POLICY "achievements: anon read published" ON public.achievements FOR SELECT TO anon
  USING (status = 'published'::content_status);
CREATE POLICY "achievements: auth read published or staff" ON public.achievements FOR SELECT TO authenticated
  USING (status = 'published'::content_status OR public.is_staff(auth.uid()));

-- achievement_media
DROP POLICY IF EXISTS "achievement_media: public read" ON public.achievement_media;
CREATE POLICY "achievement_media: anon read" ON public.achievement_media FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.achievements a WHERE a.id = achievement_media.achievement_id AND a.status = 'published'::content_status));
CREATE POLICY "achievement_media: auth read" ON public.achievement_media FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.achievements a WHERE a.id = achievement_media.achievement_id AND (a.status = 'published'::content_status OR public.is_staff(auth.uid()))));

-- activities
DROP POLICY IF EXISTS "activities: public read published" ON public.activities;
CREATE POLICY "activities: anon read published" ON public.activities FOR SELECT TO anon
  USING (status = 'published'::content_status);
CREATE POLICY "activities: auth read published or staff" ON public.activities FOR SELECT TO authenticated
  USING (status = 'published'::content_status OR public.is_staff(auth.uid()));

-- activity_media
DROP POLICY IF EXISTS "activity_media: public read" ON public.activity_media;
CREATE POLICY "activity_media: anon read" ON public.activity_media FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_media.activity_id AND a.status = 'published'::content_status));
CREATE POLICY "activity_media: auth read" ON public.activity_media FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_media.activity_id AND (a.status = 'published'::content_status OR public.is_staff(auth.uid()))));

-- academic_calendar_events
DROP POLICY IF EXISTS "calendar_events: public read published" ON public.academic_calendar_events;
CREATE POLICY "calendar_events: anon read published" ON public.academic_calendar_events FOR SELECT TO anon
  USING (status = 'published'::content_status);
CREATE POLICY "calendar_events: auth read published or staff" ON public.academic_calendar_events FOR SELECT TO authenticated
  USING (status = 'published'::content_status OR public.is_staff(auth.uid()));

-- behaviour_guidelines
DROP POLICY IF EXISTS "guidelines: public read published" ON public.behaviour_guidelines;
CREATE POLICY "guidelines: anon read published" ON public.behaviour_guidelines FOR SELECT TO anon
  USING (status = 'published'::content_status);
CREATE POLICY "guidelines: auth read published or staff" ON public.behaviour_guidelines FOR SELECT TO authenticated
  USING (status = 'published'::content_status OR public.is_staff(auth.uid()));

-- gallery_albums
DROP POLICY IF EXISTS "gallery_albums: public read published" ON public.gallery_albums;
CREATE POLICY "gallery_albums: anon read published" ON public.gallery_albums FOR SELECT TO anon
  USING (status = 'published'::content_status);
CREATE POLICY "gallery_albums: auth read published or staff" ON public.gallery_albums FOR SELECT TO authenticated
  USING (status = 'published'::content_status OR public.is_staff(auth.uid()));

-- gallery_items
DROP POLICY IF EXISTS "gallery_items: public read" ON public.gallery_items;
CREATE POLICY "gallery_items: anon read" ON public.gallery_items FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.gallery_albums a WHERE a.id = gallery_items.album_id AND a.status = 'published'::content_status));
CREATE POLICY "gallery_items: auth read" ON public.gallery_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.gallery_albums a WHERE a.id = gallery_items.album_id AND (a.status = 'published'::content_status OR public.is_staff(auth.uid()))));

-- homepage_hero
DROP POLICY IF EXISTS "homepage_hero: public read published" ON public.homepage_hero;
CREATE POLICY "homepage_hero: anon read published" ON public.homepage_hero FOR SELECT TO anon
  USING (status = 'published'::content_status);
CREATE POLICY "homepage_hero: auth read published or staff" ON public.homepage_hero FOR SELECT TO authenticated
  USING (status = 'published'::content_status OR public.is_staff(auth.uid()));

-- homepage_hero_actions
DROP POLICY IF EXISTS "hero_actions: public read" ON public.homepage_hero_actions;
CREATE POLICY "hero_actions: anon read" ON public.homepage_hero_actions FOR SELECT TO anon
  USING (is_visible);
CREATE POLICY "hero_actions: auth read" ON public.homepage_hero_actions FOR SELECT TO authenticated
  USING (is_visible OR public.is_staff(auth.uid()));

-- honor_entries
DROP POLICY IF EXISTS "honor_entries: public read published" ON public.honor_entries;
CREATE POLICY "honor_entries: anon read published" ON public.honor_entries FOR SELECT TO anon
  USING (status = 'published'::content_status);
CREATE POLICY "honor_entries: auth read published or staff" ON public.honor_entries FOR SELECT TO authenticated
  USING (status = 'published'::content_status OR public.is_staff(auth.uid()));

-- honor_entry_media
DROP POLICY IF EXISTS "honor_entry_media: public read" ON public.honor_entry_media;
CREATE POLICY "honor_entry_media: anon read" ON public.honor_entry_media FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.honor_entries e WHERE e.id = honor_entry_media.honor_entry_id AND e.status = 'published'::content_status));
CREATE POLICY "honor_entry_media: auth read" ON public.honor_entry_media FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.honor_entries e WHERE e.id = honor_entry_media.honor_entry_id AND (e.status = 'published'::content_status OR public.is_staff(auth.uid()))));

-- instruction_lists
DROP POLICY IF EXISTS "instruction_lists: public read" ON public.instruction_lists;
CREATE POLICY "instruction_lists: anon read" ON public.instruction_lists FOR SELECT TO anon
  USING (status = 'published'::content_status);
CREATE POLICY "instruction_lists: auth read" ON public.instruction_lists FOR SELECT TO authenticated
  USING (status = 'published'::content_status OR public.is_staff(auth.uid()));

-- instruction_items
DROP POLICY IF EXISTS "instruction_items: public read" ON public.instruction_items;
CREATE POLICY "instruction_items: anon read" ON public.instruction_items FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.instruction_lists l WHERE l.id = instruction_items.list_id AND l.status = 'published'::content_status));
CREATE POLICY "instruction_items: auth read" ON public.instruction_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.instruction_lists l WHERE l.id = instruction_items.list_id AND (l.status = 'published'::content_status OR public.is_staff(auth.uid()))));

-- news_media
DROP POLICY IF EXISTS "news_media: public read" ON public.news_media;
CREATE POLICY "news_media: anon read" ON public.news_media FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.news n WHERE n.id = news_media.news_id AND n.status = 'published'::content_status));
CREATE POLICY "news_media: auth read" ON public.news_media FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.news n WHERE n.id = news_media.news_id AND (n.status = 'published'::content_status OR public.is_staff(auth.uid()))));

-- social_links
DROP POLICY IF EXISTS "social_links: public read visible" ON public.social_links;
CREATE POLICY "social_links: anon read visible" ON public.social_links FOR SELECT TO anon
  USING (is_visible);
CREATE POLICY "social_links: auth read visible or staff" ON public.social_links FOR SELECT TO authenticated
  USING (is_visible OR public.is_staff(auth.uid()));

-- statistics
DROP POLICY IF EXISTS "statistics: public read" ON public.statistics;
CREATE POLICY "statistics: anon read" ON public.statistics FOR SELECT TO anon
  USING (is_visible);
CREATE POLICY "statistics: auth read" ON public.statistics FOR SELECT TO authenticated
  USING (is_visible OR public.is_staff(auth.uid()));

-- timetables
DROP POLICY IF EXISTS "timetables: public read published" ON public.timetables;
CREATE POLICY "timetables: anon read published" ON public.timetables FOR SELECT TO anon
  USING (status = 'published'::content_status);
CREATE POLICY "timetables: auth read published or staff" ON public.timetables FOR SELECT TO authenticated
  USING (status = 'published'::content_status OR public.is_staff(auth.uid()));

-- Now safe to revoke anon access to internal role helpers again.
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
