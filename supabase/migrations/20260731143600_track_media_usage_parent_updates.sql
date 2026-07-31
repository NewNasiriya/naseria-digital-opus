-- The primary integrity migration tracks media_id changes. These supplemental
-- triggers cover the rarer case where a junction row is moved to a different
-- parent while retaining the same media_id. The shared trigger function
-- removes the old derived usage and inserts the new one. No content or media
-- row is modified by this migration itself.

DROP TRIGGER IF EXISTS trg_mu_parent_news_media ON public.news_media;
CREATE TRIGGER trg_mu_parent_news_media
AFTER UPDATE OF news_id ON public.news_media
FOR EACH ROW
EXECUTE FUNCTION public.sync_media_usage_reference(
  'media_id',
  'gallery',
  'news_id'
);

DROP TRIGGER IF EXISTS trg_mu_parent_achievement_media ON public.achievement_media;
CREATE TRIGGER trg_mu_parent_achievement_media
AFTER UPDATE OF achievement_id ON public.achievement_media
FOR EACH ROW
EXECUTE FUNCTION public.sync_media_usage_reference(
  'media_id',
  'gallery',
  'achievement_id'
);

DROP TRIGGER IF EXISTS trg_mu_parent_activity_media ON public.activity_media;
CREATE TRIGGER trg_mu_parent_activity_media
AFTER UPDATE OF activity_id ON public.activity_media
FOR EACH ROW
EXECUTE FUNCTION public.sync_media_usage_reference(
  'media_id',
  'gallery',
  'activity_id'
);

DROP TRIGGER IF EXISTS trg_mu_parent_gallery_items ON public.gallery_items;
CREATE TRIGGER trg_mu_parent_gallery_items
AFTER UPDATE OF album_id ON public.gallery_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_media_usage_reference(
  'media_id',
  'photos',
  'album_id'
);

DROP TRIGGER IF EXISTS trg_mu_parent_honor_entry_media ON public.honor_entry_media;
CREATE TRIGGER trg_mu_parent_honor_entry_media
AFTER UPDATE OF honor_entry_id ON public.honor_entry_media
FOR EACH ROW
EXECUTE FUNCTION public.sync_media_usage_reference(
  'media_id',
  'gallery',
  'honor_entry_id'
);
