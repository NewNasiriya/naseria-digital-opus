import { supabase } from "@/integrations/supabase/client";
import { mediaPublicUrl, type MediaRef } from "@/lib/media";

export interface ActivityCategory {
  id: string;
  key: string;
  name_ar: string;
  icon_key: string | null;
}

export interface ActivityGalleryItem {
  id: string;
  caption_ar: string | null;
  display_order: number;
  url: string;
}

export interface ActivityListItem {
  id: string;
  slug: string;
  title_ar: string;
  summary_ar: string | null;
  body_ar: string | null;
  event_date: string | null;
  published_at: string | null;
  is_featured: boolean;
  category: ActivityCategory | null;
  cover_url: string | null;
  gallery: ActivityGalleryItem[];
}

interface RawActivityRow {
  id: string;
  slug: string;
  title_ar: string;
  summary_ar: string | null;
  body_ar: string | null;
  event_date: string | null;
  published_at: string | null;
  is_featured: boolean;
  category: ActivityCategory | null;
  cover: MediaRef | null;
  gallery:
    | Array<{
        id: string;
        caption_ar: string | null;
        display_order: number;
        media: MediaRef | null;
      }>
    | null;
}

export interface ActivityListOptions {
  limit?: number;
  featuredOnly?: boolean;
}

export function mapActivityRow(row: RawActivityRow): ActivityListItem {
  const gallery = (row.gallery ?? [])
    .map((item) => {
      const url = mediaPublicUrl(item.media);
      if (!url) return null;
      return {
        id: item.id,
        caption_ar: item.caption_ar,
        display_order: item.display_order ?? 0,
        url,
      } satisfies ActivityGalleryItem;
    })
    .filter((item): item is ActivityGalleryItem => item !== null)
    .sort((a, b) => a.display_order - b.display_order);

  return {
    id: row.id,
    slug: row.slug,
    title_ar: row.title_ar,
    summary_ar: row.summary_ar,
    body_ar: row.body_ar,
    event_date: row.event_date,
    published_at: row.published_at,
    is_featured: !!row.is_featured,
    category: row.category,
    cover_url: mediaPublicUrl(row.cover) ?? gallery[0]?.url ?? null,
    gallery,
  };
}

export async function fetchActivities(
  options: ActivityListOptions = {},
): Promise<ActivityListItem[]> {
  let query = supabase
    .from("activities")
    .select(
      `id,slug,title_ar,summary_ar,body_ar,event_date,published_at,is_featured,
       category:activity_categories!activities_category_id_fkey(id,key,name_ar,icon_key),
       cover:media!activities_cover_image_media_id_fkey(bucket,storage_path,alt_ar,alt_en),
       gallery:activity_media(id,caption_ar,display_order,
         media:media!activity_media_media_id_fkey(bucket,storage_path,alt_ar,alt_en))`,
    )
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("published_at", { ascending: false, nullsFirst: false });

  if (options.featuredOnly) query = query.eq("is_featured", true);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as unknown as RawActivityRow[]).map(mapActivityRow);
}

export function activityExcerpt(item: ActivityListItem, maxChars = 190): string | null {
  const source = item.summary_ar?.trim() || item.body_ar?.trim();
  if (!source) return null;
  const clean = source.replace(/\s+/g, " ");
  if (clean.length <= maxChars) return clean;
  const slice = clean.slice(0, maxChars);
  const cut = Math.max(slice.lastIndexOf("،"), slice.lastIndexOf("."), slice.lastIndexOf(" "));
  return `${slice.slice(0, cut > 60 ? cut : maxChars).trim()}…`;
}

export function formatActivityDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
