import { supabase } from "@/integrations/supabase/client";
import { mediaPublicUrl, type MediaRef } from "@/lib/media";

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
  is_featured: boolean;
  is_pinned: boolean;
  reading_minutes: number | null;
  category: Pick<NewsCategory, "id" | "slug" | "name_ar"> | null;
  featured_media: MediaRef | null;
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
  }>;
}

const LIST_SELECT = `
  id,title_ar,title_en,slug,summary_ar,summary_en,published_at,
  is_featured,is_pinned,reading_minutes,
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
  return (data ?? []) as unknown as NewsListItem[];
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
  return (data ?? []) as unknown as NewsListItem[];
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
    items: (data ?? []) as unknown as NewsListItem[],
    total: count ?? 0,
  };
}

export async function fetchNewsBySlug(slug: string): Promise<NewsDetail | null> {
  const { data, error } = await supabase
    .from("news")
    .select(
      `${LIST_SELECT},body_ar,body_en,seo_title,seo_description,
       gallery:news_media(id,caption_ar,display_order,media:media!news_media_media_id_fkey(bucket,storage_path,alt_ar,alt_en,file_name))`,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const detail = data as unknown as NewsDetail;
  detail.gallery = (detail.gallery ?? []).slice().sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
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
  return (data ?? []) as unknown as NewsListItem[];
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

export function coverImageUrl(item: Pick<NewsListItem, "featured_media">): string | null {
  return mediaPublicUrl(item.featured_media);
}
