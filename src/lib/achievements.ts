import { supabase } from "@/integrations/supabase/client";
import { mediaPublicUrl, type MediaRef } from "@/lib/media";

export interface AchievementCategory {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  display_order: number;
}

export interface AchievementGalleryItem {
  id: string;
  caption_ar: string | null;
  caption_en: string | null;
  alt_ar: string | null;
  alt_en: string | null;
  display_order: number;
  url: string;
}

export interface AchievementListItem {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  cover_url: string | null;
  achieved_on: string | null;
  published_at: string | null;
  is_featured: boolean;
  is_pinned: boolean;
  show_on_homepage: boolean;
  show_on_about_timeline: boolean;
  category: Pick<AchievementCategory, "id" | "slug" | "name_ar"> | null;
  academic_year: string | null;
}

export interface AchievementStoryHighlight {
  title_ar: string;
  body_ar: string;
}

export interface AchievementStoryContent {
  layout: string | null;
  welcome_title_ar: string | null;
  welcome_body_ar: string | null;
  official_message_title_ar: string | null;
  official_message_ar: string | null;
  closing_title_ar: string | null;
  closing_body_ar: string | null;
  supervision_label_ar: string | null;
  supervision_name_ar: string | null;
  highlights: AchievementStoryHighlight[];
}

export interface AchievementDetail extends AchievementListItem {
  seo_title: string | null;
  seo_description: string | null;
  gallery: AchievementGalleryItem[];
  story: AchievementStoryContent | null;
}

const LIST_SELECT = `
  id, slug, title_ar, title_en, description_ar, cover_image_url, achieved_on,
  published_at, is_featured, is_pinned, show_on_homepage, show_on_about_timeline,
  category:achievement_categories!achievements_category_id_fkey(id, slug, name_ar),
  academic_year:academic_years!achievements_academic_year_id_fkey(name),
  cover_media:media!achievements_cover_image_media_id_fkey(bucket, storage_path, alt_ar, alt_en)
`;

function mapListRow(row: any): AchievementListItem {
  const mediaUrl = row.cover_media
    ? mediaPublicUrl(row.cover_media as MediaRef)
    : null;
  return {
    id: row.id,
    slug: row.slug,
    title_ar: row.title_ar,
    title_en: row.title_en,
    description_ar: row.description_ar,
    cover_url: mediaUrl ?? row.cover_image_url ?? null,
    achieved_on: row.achieved_on,
    published_at: row.published_at,
    is_featured: !!row.is_featured,
    is_pinned: !!row.is_pinned,
    show_on_homepage: !!row.show_on_homepage,
    show_on_about_timeline: !!row.show_on_about_timeline,
    category: row.category
      ? { id: row.category.id, slug: row.category.slug, name_ar: row.category.name_ar }
      : null,
    academic_year: row.academic_year?.name ?? null,
  };
}

function mapStoryContent(externalRef: unknown): AchievementStoryContent | null {
  if (!externalRef || typeof externalRef !== "object" || Array.isArray(externalRef)) {
    return null;
  }

  const data = externalRef as Record<string, unknown>;
  const rawHighlights = Array.isArray(data.highlights) ? data.highlights : [];

  return {
    layout: typeof data.story_layout === "string" ? data.story_layout : null,
    welcome_title_ar:
      typeof data.welcome_title_ar === "string" ? data.welcome_title_ar : null,
    welcome_body_ar:
      typeof data.welcome_body_ar === "string" ? data.welcome_body_ar : null,
    official_message_title_ar:
      typeof data.official_message_title_ar === "string"
        ? data.official_message_title_ar
        : null,
    official_message_ar:
      typeof data.official_message_ar === "string" ? data.official_message_ar : null,
    closing_title_ar:
      typeof data.closing_title_ar === "string" ? data.closing_title_ar : null,
    closing_body_ar:
      typeof data.closing_body_ar === "string" ? data.closing_body_ar : null,
    supervision_label_ar:
      typeof data.supervision_label_ar === "string" ? data.supervision_label_ar : null,
    supervision_name_ar:
      typeof data.supervision_name_ar === "string" ? data.supervision_name_ar : null,
    highlights: rawHighlights
      .map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return null;
        const entry = item as Record<string, unknown>;
        if (typeof entry.title_ar !== "string" || typeof entry.body_ar !== "string") {
          return null;
        }
        return {
          title_ar: entry.title_ar,
          body_ar: entry.body_ar,
        } satisfies AchievementStoryHighlight;
      })
      .filter((item): item is AchievementStoryHighlight => item !== null),
  };
}

export async function fetchAchievementCategories(): Promise<AchievementCategory[]> {
  const { data, error } = await supabase
    .from("achievement_categories")
    .select("id, name_ar, name_en, slug, display_order")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AchievementCategory[];
}

export interface AchievementListOptions {
  categorySlug?: string;
  onlyHomepage?: boolean;
  onlyTimeline?: boolean;
  excludeSlug?: string;
  limit?: number;
}

export async function fetchAchievementsList(
  opts: AchievementListOptions = {},
): Promise<AchievementListItem[]> {
  let q = supabase
    .from("achievements")
    .select(LIST_SELECT)
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false });

  if (opts.categorySlug) {
    const { data: cat } = await supabase
      .from("achievement_categories")
      .select("id")
      .eq("slug", opts.categorySlug)
      .maybeSingle();
    if (!cat?.id) return [];
    q = q.eq("category_id", cat.id);
  }
  if (opts.onlyHomepage) q = q.eq("show_on_homepage", true);
  if (opts.onlyTimeline) q = q.eq("show_on_about_timeline", true);
  if (opts.excludeSlug) q = q.neq("slug", opts.excludeSlug);
  if (opts.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapListRow);
}

export async function fetchFeaturedAchievement(): Promise<AchievementListItem | null> {
  const items = await fetchAchievementsList({ limit: 1 });
  const featured = items.find((i) => i.is_featured) ?? items[0] ?? null;
  return featured ?? null;
}

export async function fetchAchievementBySlug(
  slug: string,
): Promise<AchievementDetail | null> {
  const { data, error } = await supabase
    .from("achievements")
    .select(
      `${LIST_SELECT}, seo_title, seo_description, external_ref,
       gallery:achievement_media(id, caption_ar, caption_en, alt_ar, alt_en, display_order, image_url,
         media:media!achievement_media_media_id_fkey(bucket, storage_path, alt_ar, alt_en, file_name))`,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const base = mapListRow(data);
  const gallery: AchievementGalleryItem[] = ((data as any).gallery ?? [])
    .map((g: any) => {
      const url = g.media
        ? (mediaPublicUrl(g.media as MediaRef) ?? g.image_url)
        : g.image_url;
      if (!url) return null;
      return {
        id: g.id,
        caption_ar: g.caption_ar,
        caption_en: g.caption_en,
        alt_ar: g.alt_ar ?? g.media?.alt_ar ?? null,
        alt_en: g.alt_en ?? g.media?.alt_en ?? null,
        display_order: g.display_order ?? 0,
        url,
      } as AchievementGalleryItem;
    })
    .filter((x: AchievementGalleryItem | null): x is AchievementGalleryItem => x !== null)
    .sort(
      (a: AchievementGalleryItem, b: AchievementGalleryItem) =>
        a.display_order - b.display_order,
    );

  return {
    ...base,
    seo_title: (data as any).seo_title ?? null,
    seo_description: (data as any).seo_description ?? null,
    gallery,
    story: mapStoryContent((data as any).external_ref),
  };
}

export async function fetchAdjacentAchievements(publishedAt: string | null): Promise<{
  prev: { slug: string; title_ar: string } | null;
  next: { slug: string; title_ar: string } | null;
}> {
  if (!publishedAt) return { prev: null, next: null };
  const [{ data: prev }, { data: next }] = await Promise.all([
    supabase
      .from("achievements")
      .select("slug, title_ar, published_at")
      .eq("status", "published")
      .lt("published_at", publishedAt)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("achievements")
      .select("slug, title_ar, published_at")
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

export function formatAchievementDate(iso: string | null): string {
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
