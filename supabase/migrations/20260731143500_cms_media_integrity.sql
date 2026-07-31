-- =============================================================
-- CMS production integrity: authoritative media reference safety
-- =============================================================
-- SAFETY GUARANTEES
--   * Never deletes media, storage objects, news, or content rows.
--   * The only DELETE statement targets derived media_usages rows when a
--     content reference is changed or removed.
--   * Backfill is additive and idempotent via ON CONFLICT DO NOTHING.
--   * Database triggers are the final guard even if the UI is bypassed.

-- Deterministic UUID for singleton/non-UUID entity keys used by media_usages.
CREATE OR REPLACE FUNCTION public.media_usage_entity_uuid(
  _entity_table text,
  _entity_key text
)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = public
AS $$
  SELECT (
    substr(md5(_entity_table || ':' || _entity_key), 1, 8) || '-' ||
    substr(md5(_entity_table || ':' || _entity_key), 9, 4) || '-' ||
    substr(md5(_entity_table || ':' || _entity_key), 13, 4) || '-' ||
    substr(md5(_entity_table || ':' || _entity_key), 17, 4) || '-' ||
    substr(md5(_entity_table || ':' || _entity_key), 21, 12)
  )::uuid;
$$;

CREATE OR REPLACE FUNCTION public.media_usage_entity_id(
  _entity_table text,
  _entity_key text
)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
STRICT
SET search_path = public
AS $$
BEGIN
  RETURN _entity_key::uuid;
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN public.media_usage_entity_uuid(_entity_table, _entity_key);
END;
$$;

REVOKE ALL ON FUNCTION public.media_usage_entity_uuid(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.media_usage_entity_id(text, text) FROM PUBLIC;

-- Generic trigger for direct media columns and junction-table media columns.
-- TG_ARGV: media column, semantic field name, entity/parent id column.
CREATE OR REPLACE FUNCTION public.sync_media_usage_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_media_column text := TG_ARGV[0];
  v_field_name text := TG_ARGV[1];
  v_entity_column text := TG_ARGV[2];
  v_old_media uuid;
  v_new_media uuid;
  v_old_entity uuid;
  v_new_entity uuid;
  v_old_key text;
  v_new_key text;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    v_old_media := NULLIF(to_jsonb(OLD) ->> v_media_column, '')::uuid;
    v_old_key := NULLIF(to_jsonb(OLD) ->> v_entity_column, '');
    IF v_old_key IS NOT NULL THEN
      v_old_entity := public.media_usage_entity_id(TG_TABLE_NAME, v_old_key);
    END IF;
  END IF;

  IF TG_OP <> 'DELETE' THEN
    v_new_media := NULLIF(to_jsonb(NEW) ->> v_media_column, '')::uuid;
    v_new_key := NULLIF(to_jsonb(NEW) ->> v_entity_column, '');
    IF v_new_key IS NOT NULL THEN
      v_new_entity := public.media_usage_entity_id(TG_TABLE_NAME, v_new_key);
    END IF;
  END IF;

  IF v_old_media IS NOT NULL
     AND v_old_entity IS NOT NULL
     AND (
       TG_OP = 'DELETE'
       OR v_old_media IS DISTINCT FROM v_new_media
       OR v_old_entity IS DISTINCT FROM v_new_entity
     ) THEN
    DELETE FROM public.media_usages
    WHERE media_id = v_old_media
      AND entity_table = TG_TABLE_NAME
      AND entity_id = v_old_entity
      AND field_name = v_field_name;
  END IF;

  IF TG_OP <> 'DELETE'
     AND v_new_media IS NOT NULL
     AND v_new_entity IS NOT NULL THEN
    INSERT INTO public.media_usages (
      media_id,
      entity_table,
      entity_id,
      field_name
    )
    VALUES (
      v_new_media,
      TG_TABLE_NAME,
      v_new_entity,
      v_field_name
    )
    ON CONFLICT (media_id, entity_table, entity_id, field_name)
    DO NOTHING;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_media_usage_reference() FROM PUBLIC;

-- Install/reinstall tracking triggers only when both table and columns exist.
DO $$
DECLARE
  cfg record;
  v_trigger_name text;
BEGIN
  FOR cfg IN
    SELECT * FROM (VALUES
      ('profiles', 'avatar_media_id', 'avatar', 'id'),
      ('site_settings', 'logo_media_id', 'logo', 'id'),
      ('site_settings', 'favicon_media_id', 'favicon', 'id'),
      ('site_settings', 'default_og_image_id', 'default_og_image', 'id'),
      ('homepage_hero', 'hero_image_media_id', 'hero_image', 'id'),
      ('school_info', 'principal_photo_media_id', 'principal_photo', 'id'),
      ('news', 'featured_image_media_id', 'featured_image', 'id'),
      ('news', 'og_image_id', 'og_image', 'id'),
      ('news_media', 'media_id', 'gallery', 'news_id'),
      ('achievements', 'cover_image_media_id', 'cover_image', 'id'),
      ('achievements', 'og_image_id', 'og_image', 'id'),
      ('achievement_media', 'media_id', 'gallery', 'achievement_id'),
      ('activities', 'cover_image_media_id', 'cover_image', 'id'),
      ('activities', 'og_image_id', 'og_image', 'id'),
      ('activity_media', 'media_id', 'gallery', 'activity_id'),
      ('gallery_albums', 'cover_media_id', 'cover', 'id'),
      ('gallery_items', 'media_id', 'photos', 'album_id'),
      ('honor_boards', 'media_id', 'image', 'id'),
      ('honor_entry_media', 'media_id', 'gallery', 'honor_entry_id'),
      ('timetables', 'cover_image_media_id', 'cover_image', 'id'),
      ('timetables', 'document_media_id', 'document', 'id'),
      ('academic_notes', 'attachment_media_id', 'attachment', 'id'),
      ('academic_resources', 'media_id', 'file', 'id')
    ) AS refs(table_name, media_column, field_name, entity_column)
  LOOP
    IF to_regclass(format('public.%I', cfg.table_name)) IS NOT NULL
       AND EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = cfg.table_name
           AND column_name = cfg.media_column
       )
       AND EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = cfg.table_name
           AND column_name = cfg.entity_column
       ) THEN
      v_trigger_name := 'trg_mu_' || substr(
        md5(cfg.table_name || ':' || cfg.media_column),
        1,
        20
      );

      EXECUTE format(
        'DROP TRIGGER IF EXISTS %I ON public.%I',
        v_trigger_name,
        cfg.table_name
      );

      EXECUTE format(
        'CREATE TRIGGER %I AFTER INSERT OR DELETE OR UPDATE OF %I ON public.%I FOR EACH ROW EXECUTE FUNCTION public.sync_media_usage_reference(%L, %L, %L)',
        v_trigger_name,
        cfg.media_column,
        cfg.table_name,
        cfg.media_column,
        cfg.field_name,
        cfg.entity_column
      );
    END IF;
  END LOOP;
END;
$$;

-- Additive, repeat-safe backfill from authoritative content relationships.
DO $$
DECLARE
  cfg record;
BEGIN
  FOR cfg IN
    SELECT * FROM (VALUES
      ('profiles', 'avatar_media_id', 'avatar', 'id'),
      ('site_settings', 'logo_media_id', 'logo', 'id'),
      ('site_settings', 'favicon_media_id', 'favicon', 'id'),
      ('site_settings', 'default_og_image_id', 'default_og_image', 'id'),
      ('homepage_hero', 'hero_image_media_id', 'hero_image', 'id'),
      ('school_info', 'principal_photo_media_id', 'principal_photo', 'id'),
      ('news', 'featured_image_media_id', 'featured_image', 'id'),
      ('news', 'og_image_id', 'og_image', 'id'),
      ('news_media', 'media_id', 'gallery', 'news_id'),
      ('achievements', 'cover_image_media_id', 'cover_image', 'id'),
      ('achievements', 'og_image_id', 'og_image', 'id'),
      ('achievement_media', 'media_id', 'gallery', 'achievement_id'),
      ('activities', 'cover_image_media_id', 'cover_image', 'id'),
      ('activities', 'og_image_id', 'og_image', 'id'),
      ('activity_media', 'media_id', 'gallery', 'activity_id'),
      ('gallery_albums', 'cover_media_id', 'cover', 'id'),
      ('gallery_items', 'media_id', 'photos', 'album_id'),
      ('honor_boards', 'media_id', 'image', 'id'),
      ('honor_entry_media', 'media_id', 'gallery', 'honor_entry_id'),
      ('timetables', 'cover_image_media_id', 'cover_image', 'id'),
      ('timetables', 'document_media_id', 'document', 'id'),
      ('academic_notes', 'attachment_media_id', 'attachment', 'id'),
      ('academic_resources', 'media_id', 'file', 'id')
    ) AS refs(table_name, media_column, field_name, entity_column)
  LOOP
    IF to_regclass(format('public.%I', cfg.table_name)) IS NOT NULL
       AND EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = cfg.table_name
           AND column_name = cfg.media_column
       )
       AND EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = cfg.table_name
           AND column_name = cfg.entity_column
       ) THEN
      EXECUTE format(
        'INSERT INTO public.media_usages (media_id, entity_table, entity_id, field_name)
         SELECT %I, %L, public.media_usage_entity_id(%L, %I::text), %L
         FROM public.%I
         WHERE %I IS NOT NULL
         ON CONFLICT (media_id, entity_table, entity_id, field_name) DO NOTHING',
        cfg.media_column,
        cfg.table_name,
        cfg.table_name,
        cfg.entity_column,
        cfg.field_name,
        cfg.table_name,
        cfg.media_column
      );
    END IF;
  END LOOP;
END;
$$;

-- Authoritative reference count: independent of media_usages completeness.
CREATE OR REPLACE FUNCTION public.media_reference_count(_media_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(reference_count), 0)::bigint
  FROM (
    SELECT count(*)::bigint AS reference_count FROM public.profiles WHERE avatar_media_id = _media_id
    UNION ALL SELECT count(*) FROM public.site_settings WHERE logo_media_id = _media_id OR favicon_media_id = _media_id OR default_og_image_id = _media_id
    UNION ALL SELECT count(*) FROM public.homepage_hero WHERE hero_image_media_id = _media_id
    UNION ALL SELECT count(*) FROM public.school_info WHERE principal_photo_media_id = _media_id
    UNION ALL SELECT count(*) FROM public.news WHERE featured_image_media_id = _media_id OR og_image_id = _media_id
    UNION ALL SELECT count(*) FROM public.news_media WHERE media_id = _media_id
    UNION ALL SELECT count(*) FROM public.achievements WHERE cover_image_media_id = _media_id OR og_image_id = _media_id
    UNION ALL SELECT count(*) FROM public.achievement_media WHERE media_id = _media_id
    UNION ALL SELECT count(*) FROM public.activities WHERE cover_image_media_id = _media_id OR og_image_id = _media_id
    UNION ALL SELECT count(*) FROM public.activity_media WHERE media_id = _media_id
    UNION ALL SELECT count(*) FROM public.gallery_albums WHERE cover_media_id = _media_id
    UNION ALL SELECT count(*) FROM public.gallery_items WHERE media_id = _media_id
    UNION ALL SELECT count(*) FROM public.honor_boards WHERE media_id = _media_id
    UNION ALL SELECT count(*) FROM public.honor_entry_media WHERE media_id = _media_id
    UNION ALL SELECT count(*) FROM public.timetables WHERE cover_image_media_id = _media_id OR document_media_id = _media_id
    UNION ALL SELECT count(*) FROM public.academic_notes WHERE attachment_media_id = _media_id
    UNION ALL SELECT count(*) FROM public.academic_resources WHERE media_id = _media_id
  ) AS media_refs;
$$;

CREATE OR REPLACE FUNCTION public.media_is_referenced(_media_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.media_reference_count(_media_id) > 0;
$$;

REVOKE ALL ON FUNCTION public.media_reference_count(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.media_is_referenced(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.media_reference_count(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.media_is_referenced(uuid) TO authenticated, service_role;

-- Final database guard. It also protects service-role and non-CMS callers.
CREATE OR REPLACE FUNCTION public.prevent_referenced_media_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reference_count bigint;
BEGIN
  IF TG_OP = 'DELETE'
     OR (
       TG_OP = 'UPDATE'
       AND COALESCE(NEW.is_archived, false) = true
       AND COALESCE(OLD.is_archived, false) = false
     ) THEN
    v_reference_count := public.media_reference_count(OLD.id);
    IF v_reference_count > 0 THEN
      RAISE EXCEPTION
        'Media asset % is referenced by % content record(s)',
        OLD.id,
        v_reference_count
        USING
          ERRCODE = '23503',
          HINT = 'Remove or replace every content reference before archiving or deleting this asset.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_referenced_media_mutation() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_prevent_referenced_media_mutation ON public.media;
CREATE TRIGGER trg_prevent_referenced_media_mutation
BEFORE DELETE OR UPDATE OF is_archived ON public.media
FOR EACH ROW
EXECUTE FUNCTION public.prevent_referenced_media_mutation();

-- Keep public visibility explicit because the signed redirect endpoint calls
-- this function with a server client that can bypass table RLS.
CREATE OR REPLACE FUNCTION public.is_media_publicly_visible(_media_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT _media_id IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.site_settings s
      WHERE s.logo_media_id = _media_id
         OR s.favicon_media_id = _media_id
         OR s.default_og_image_id = _media_id
    )
    OR EXISTS (
      SELECT 1 FROM public.homepage_hero h
      WHERE h.hero_image_media_id = _media_id
        AND h.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.school_info si
      WHERE si.principal_photo_media_id = _media_id
    )
    OR EXISTS (
      SELECT 1 FROM public.news n
      WHERE (n.featured_image_media_id = _media_id OR n.og_image_id = _media_id)
        AND n.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.news_media nm
      JOIN public.news n ON n.id = nm.news_id
      WHERE nm.media_id = _media_id
        AND n.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.achievements a
      WHERE (a.cover_image_media_id = _media_id OR a.og_image_id = _media_id)
        AND a.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.achievement_media am
      JOIN public.achievements a ON a.id = am.achievement_id
      WHERE am.media_id = _media_id
        AND a.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.activities a
      WHERE (a.cover_image_media_id = _media_id OR a.og_image_id = _media_id)
        AND a.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.activity_media am
      JOIN public.activities a ON a.id = am.activity_id
      WHERE am.media_id = _media_id
        AND a.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.gallery_albums ga
      WHERE ga.cover_media_id = _media_id
        AND ga.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.gallery_items gi
      JOIN public.gallery_albums ga ON ga.id = gi.album_id
      WHERE gi.media_id = _media_id
        AND ga.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.honor_boards hb
      WHERE hb.media_id = _media_id
        AND hb.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.honor_entry_media hem
      JOIN public.honor_entries he ON he.id = hem.honor_entry_id
      WHERE hem.media_id = _media_id
        AND he.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.timetables t
      WHERE (t.cover_image_media_id = _media_id OR t.document_media_id = _media_id)
        AND t.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.academic_notes an
      WHERE an.attachment_media_id = _media_id
        AND an.status = 'published'
    )
    OR EXISTS (
      SELECT 1 FROM public.academic_resources ar
      WHERE ar.media_id = _media_id
        AND ar.status = 'published'
    )
  );
$$;

COMMENT ON FUNCTION public.media_reference_count(uuid)
IS 'Authoritative count of direct and junction-table references to a media row.';
COMMENT ON FUNCTION public.media_is_referenced(uuid)
IS 'Authoritative media reference check independent of media_usages.';
