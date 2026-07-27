import { supabase } from "@/integrations/supabase/client";
import { mediaPublicUrl, mediaSignedUrl, type MediaRef } from "@/lib/media";

export interface NewsCategory {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  display_order: number;
}

export interface NewsListItem {
  id: string;
  title_ar: string;
  title_en: string | null;
  slug: string;
  summary_ar: string | null;
  summary_en: string | null;
  published_at: string | null;
  updated_at?: string | null;
  is_featured: boolean;
  is_pinned: boolean;
  reading_minutes: number | null;
  /** Present on list rows so excerpt + reading time can be derived. */
  body_ar?: string | null;
  category: Pick<NewsCategory, "id" | "slug" | "name_ar"> | null;
  featured_media: MediaRef | null;
  /** Resolved, ready-to-render cover URL (signed for private buckets). */
  cover_url: string | null;
}

export interface NewsDetail extends NewsListItem {
  body_ar: string | null;
  body_en: string | null;
  seo_title: string | null;
  seo_description: string | null;
  gallery: Array<{
    id: string;
    caption_ar: string | null;
    display_order: number;
    media: MediaRef & { file_name?: string };
    /** Resolved, ready-to-render URL. */
    url: string | null;
  }>;
}

const LIST_SELECT = `
  id,title_ar,title_en,slug,summary_ar,summary_en,published_at,updated_at,
  is_featured,is_pinned,reading_minutes,body_ar,
  category:news_categories!news_category_id_fkey(id,slug,name_ar),
  featured_media:media!news_featured_image_media_id_fkey(bucket,storage_path,alt_ar,alt_en)
`;

export interface ListOptions {
  categorySlug?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  onlyAnnouncements?: boolean;
  excludeFeatured?: boolean;
}

export const ANNOUNCEMENT_SLUGS = ["announcements", "announcement", "اعلانات", "إعلانات"];

/**
 * Resolve the cover image for a row.
 *
 * Media rows either point at a repo-hosted asset (`bucket = 'external'`,
 * root-relative path — normalized by `mediaPublicUrl`) or at an object in a
 * *private* Supabase Storage bucket, which requires a short-lived signed URL.
 * `mediaSignedUrl` handles both, so replacing a cover from the Media Library
 * keeps rendering on the public site.
 */
async function withCovers<T extends { featured_media: MediaRef | null }>(
  rows: T[],
): Promise<Array<T & { cover_url: string | null }>> {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      cover_url: await mediaSignedUrl(row.featured_media),
    })),
  );
}

export async function fetchCategories(): Promise<NewsCategory[]> {
  const { data, error } = await supabase
    .from("news_categories")
    .select("id,name_ar,name_en,slug,display_order")
    .order("display_order", { ascending: true })
    .order("name_ar", { ascending: true });
  if (error) throw error;
  return (data ?? []) as NewsCategory[];
}

export async function fetchPinned(limit = 3): Promise<NewsListItem[]> {
  const { data, error } = await supabase
    .from("news")
    .select(LIST_SELECT)
    .eq("status", "published")
    .eq("is_pinned", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return withCovers((data ?? []) as unknown as NewsListItem[]);
}

export async function fetchFeatured(limit = 3): Promise<NewsListItem[]> {
  const { data, error } = await supabase
    .from("news")
    .select(LIST_SELECT)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return withCovers((data ?? []) as unknown as NewsListItem[]);
}

export async function fetchNewsList(
  opts: ListOptions = {},
): Promise<{ items: NewsListItem[]; total: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.max(1, opts.pageSize ?? 9);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("news")
    .select(LIST_SELECT, { count: "exact" })
    .eq("status", "published");

  if (opts.categorySlug) {
    const { data: cat } = await supabase
      .from("news_categories")
      .select("id")
      .eq("slug", opts.categorySlug)
      .maybeSingle();
    if (cat?.id) query = query.eq("category_id", cat.id);
    else return { items: [], total: 0 };
  }

  if (opts.onlyAnnouncements) {
    const { data: cats } = await supabase
      .from("news_categories")
      .select("id")
      .in("slug", ANNOUNCEMENT_SLUGS);
    const ids = (cats ?? []).map((c) => c.id);
    if (ids.length === 0) return { items: [], total: 0 };
    query = query.in("category_id", ids);
  }

  if (opts.q && opts.q.trim().length > 1) {
    query = query.ilike("title_ar", `%${opts.q.trim()}%`);
  }

  const { data, error, count } = await query
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return {
    items: await withCovers((data ?? []) as unknown as NewsListItem[]),
    total: count ?? 0,
  };
}

export async function fetchNewsBySlug(slug: string): Promise<NewsDetail | null> {
  const { data, error } = await supabase
    .from("news")
    .select(
      `${LIST_SELECT},body_en,seo_title,seo_description,
       gallery:news_media(id,caption_ar,display_order,media:media!news_media_media_id_fkey(bucket,storage_path,alt_ar,alt_en,file_name))`,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const detail = data as unknown as NewsDetail;
  detail.cover_url = await mediaSignedUrl(detail.featured_media);
  const gallery = (detail.gallery ?? [])
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  detail.gallery = await Promise.all(
    gallery.map(async (g) => ({ ...g, url: await mediaSignedUrl(g.media) })),
  );
  return detail;
}

export async function fetchRelatedNews(
  categoryId: string | null | undefined,
  excludeId: string,
  limit = 3,
): Promise<NewsListItem[]> {
  let query = supabase
    .from("news")
    .select(LIST_SELECT)
    .eq("status", "published")
    .neq("id", excludeId)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return withCovers((data ?? []) as unknown as NewsListItem[]);
}

export async function fetchAdjacentNews(publishedAt: string | null): Promise<{
  prev: { slug: string; title_ar: string } | null;
  next: { slug: string; title_ar: string } | null;
}> {
  if (!publishedAt) return { prev: null, next: null };
  const [{ data: prev }, { data: next }] = await Promise.all([
    supabase
      .from("news")
      .select("slug,title_ar,published_at")
      .eq("status", "published")
      .lt("published_at", publishedAt)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("news")
      .select("slug,title_ar,published_at")
      .eq("status", "published")
      .gt("published_at", publishedAt)
      .order("published_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  return {
    prev: prev ? { slug: prev.slug, title_ar: prev.title_ar } : null,
    next: next ? { slug: next.slug, title_ar: next.title_ar } : null,
  };
}

export function formatArabicDate(iso: string | null): string {
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

/** Reading time fallback derived from the body when the CMS field is empty. */
export function readingMinutes(item: {
  reading_minutes?: number | null;
  body_ar?: string | null;
}): number | null {
  if (item.reading_minutes) return item.reading_minutes;
  const words = (item.body_ar ?? "").trim().split(/\s+/).filter(Boolean).length;
  if (!words) return null;
  return Math.max(1, Math.round(words / 180));
}

export function coverImageUrl(
  item: Pick<NewsListItem, "featured_media"> & { cover_url?: string | null },
): string | null {
  return item.cover_url ?? mediaPublicUrl(item.featured_media);
}
