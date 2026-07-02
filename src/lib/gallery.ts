import { supabase } from "@/integrations/supabase/client";
import { mediaPublicUrl, type MediaRef } from "@/lib/media";

export interface AlbumSummary {
  id: string;
  slug: string;
  title_ar: string;
  description_ar: string | null;
  category: string | null;
  published_at: string | null;
  cover: MediaRef | null;
  photo_count: number;
}

export interface AlbumPhoto {
  id: string;
  caption_ar: string | null;
  display_order: number;
  media: MediaRef & { file_name?: string | null } | null;
}

export interface AlbumDetail extends Omit<AlbumSummary, "photo_count"> {
  photos: AlbumPhoto[];
}

const ALBUM_SUMMARY_SELECT =
  "id,slug,title_ar,description_ar,category,published_at,cover:cover_media_id(bucket,storage_path,alt_ar,alt_en),items:gallery_items(count)";

interface RawAlbumRow {
  id: string;
  slug: string;
  title_ar: string;
  description_ar: string | null;
  category: string | null;
  published_at: string | null;
  cover: MediaRef | null;
  items: { count: number }[] | null;
}

function toSummary(row: RawAlbumRow): AlbumSummary {
  return {
    id: row.id,
    slug: row.slug,
    title_ar: row.title_ar,
    description_ar: row.description_ar,
    category: row.category,
    published_at: row.published_at,
    cover: row.cover,
    photo_count: row.items?.[0]?.count ?? 0,
  };
}

export async function fetchAlbums(): Promise<AlbumSummary[]> {
  const { data, error } = await supabase
    .from("gallery_albums")
    .select(ALBUM_SUMMARY_SELECT)
    .eq("status", "published")
    .order("display_order", { ascending: true })
    .order("published_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as RawAlbumRow[]).map(toSummary);
}

export async function fetchLatestAlbums(limit = 3): Promise<AlbumSummary[]> {
  const { data, error } = await supabase
    .from("gallery_albums")
    .select(ALBUM_SUMMARY_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as unknown as RawAlbumRow[]).map(toSummary);
}

export async function fetchAlbumBySlug(slug: string): Promise<AlbumDetail | null> {
  const { data, error } = await supabase
    .from("gallery_albums")
    .select(
      "id,slug,title_ar,description_ar,category,published_at,cover:cover_media_id(bucket,storage_path,alt_ar,alt_en),photos:gallery_items(id,caption_ar,display_order,media:media_id(bucket,storage_path,alt_ar,alt_en,file_name))"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as {
    id: string;
    slug: string;
    title_ar: string;
    description_ar: string | null;
    category: string | null;
    published_at: string | null;
    cover: MediaRef | null;
    photos: AlbumPhoto[] | null;
  };
  const photos = (row.photos ?? [])
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  return {
    id: row.id,
    slug: row.slug,
    title_ar: row.title_ar,
    description_ar: row.description_ar,
    category: row.category,
    published_at: row.published_at,
    cover: row.cover,
    photos,
  };
}

export function albumCoverUrl(album: Pick<AlbumSummary, "cover"> & { photos?: AlbumPhoto[] }): string | null {
  const direct = mediaPublicUrl(album.cover);
  if (direct) return direct;
  const first = album.photos?.[0]?.media;
  return first ? mediaPublicUrl(first) : null;
}

export function formatAlbumDate(iso: string | null): string {
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

export const CATEGORY_LABEL_AR: Record<string, string> = {
  renovation: "الترميم والتجهيز",
  kindergarten: "رياض الأطفال",
  events: "الفعاليات",
  activities: "الأنشطة",
  honor: "لوحة الشرف",
  news: "الأخبار",
  achievements: "الإنجازات",
};

export function categoryLabel(cat: string | null): string {
  if (!cat) return "عام";
  return CATEGORY_LABEL_AR[cat] ?? cat;
}
