/**
 * Unified search engine.
 *
 * Runs parallel ILIKE queries against every published content table and
 * normalizes results into a single `SearchHit` shape. Additionally
 * indexes the static public pages so that navigational queries like
 * "من نحن" or "تواصل" surface immediately.
 *
 * Visitors only see published rows — RLS enforces this at the database
 * layer. This module never queries drafts, archived rows, or private
 * tables.
 */
import { supabase } from "@/integrations/supabase/client";
import { mediaPublicUrl, type MediaRef } from "@/lib/media";

export type SearchGroup =
  | "pages"
  | "news"
  | "achievements"
  | "gallery"
  | "activities"
  | "honor"
  | "academic"
  | "media"
  | "faq";

export interface SearchHit {
  id: string;
  group: SearchGroup;
  title: string;
  excerpt?: string | null;
  breadcrumb: string;
  to: string;                // internal path
  params?: Record<string, string>;
  image?: string | null;
  updatedAt?: string | null;
  category?: string | null;
  score: number;             // higher = better
  featured?: boolean;
  pinned?: boolean;
  tags?: string[];
}

export const GROUP_LABELS: Record<SearchGroup, string> = {
  pages: "الصفحات",
  news: "الأخبار",
  achievements: "الإنجازات",
  gallery: "المعرض",
  activities: "الأنشطة",
  honor: "لوحة الشرف",
  academic: "الحياة الأكاديمية",
  media: "الصور والوسائط",
  faq: "الأسئلة الشائعة",
};

/** Static public routes indexed for navigational search. */
interface StaticPage {
  title: string;
  excerpt: string;
  to: string;
  breadcrumb: string;
  keywords: string[];
}

const STATIC_PAGES: StaticPage[] = [
  {
    title: "الرئيسية",
    excerpt: "الصفحة الرئيسية لمدرسة الناصرية الابتدائية الجديدة.",
    to: "/",
    breadcrumb: "الرئيسية",
    keywords: ["home", "الرئيسية", "المدرسة", "الصفحة الرئيسية"],
  },
  {
    title: "عن المدرسة",
    excerpt: "الرؤية والرسالة وقيم مدرسة الناصرية الابتدائية الجديدة.",
    to: "/about",
    breadcrumb: "عن المدرسة",
    keywords: ["about", "من نحن", "رؤية", "رسالة", "المدير", "الإدارة"],
  },
  {
    title: "الحياة الأكاديمية",
    excerpt: "الجداول الدراسية والتقويم والإرشادات الأكاديمية.",
    to: "/academic",
    breadcrumb: "الحياة الأكاديمية",
    keywords: ["academic", "أكاديمي", "دراسة", "جدول"],
  },
  {
    title: "التقويم الدراسي",
    excerpt: "التقويم الرسمي للعام الدراسي وأهم المحطات.",
    to: "/academic/calendar",
    breadcrumb: "الحياة الأكاديمية · التقويم",
    keywords: ["calendar", "تقويم", "عام دراسي", "إجازات"],
  },
  {
    title: "إرشادات الطلاب",
    excerpt: "توجيهات وإرشادات للطلاب.",
    to: "/academic/student-guidelines",
    breadcrumb: "الحياة الأكاديمية · إرشادات الطلاب",
    keywords: ["students", "طلاب", "إرشادات"],
  },
  {
    title: "إرشادات أولياء الأمور",
    excerpt: "توجيهات لأولياء الأمور.",
    to: "/academic/parent-guidelines",
    breadcrumb: "الحياة الأكاديمية · إرشادات أولياء الأمور",
    keywords: ["parents", "أولياء الأمور", "إرشادات"],
  },
  {
    title: "الحضور والانضباط",
    excerpt: "سياسات الحضور والسلوك في المدرسة.",
    to: "/academic/attendance-behaviour",
    breadcrumb: "الحياة الأكاديمية · الحضور والانضباط",
    keywords: ["attendance", "حضور", "سلوك", "انضباط"],
  },
  {
    title: "السياسات المدرسية",
    excerpt: "السياسات واللوائح المعتمدة.",
    to: "/academic/policies",
    breadcrumb: "الحياة الأكاديمية · السياسات",
    keywords: ["policies", "سياسات", "لوائح"],
  },
  {
    title: "الأسئلة الشائعة",
    excerpt: "إجابات على أكثر الأسئلة تكرارًا.",
    to: "/academic/faq",
    breadcrumb: "الحياة الأكاديمية · الأسئلة الشائعة",
    keywords: ["faq", "أسئلة", "استفسارات"],
  },
  {
    title: "الأخبار",
    excerpt: "آخر أخبار المدرسة.",
    to: "/news",
    breadcrumb: "الأخبار",
    keywords: ["news", "أخبار"],
  },
  {
    title: "الإنجازات",
    excerpt: "إنجازات المدرسة والطلاب.",
    to: "/achievements",
    breadcrumb: "الإنجازات",
    keywords: ["achievements", "إنجازات"],
  },
  {
    title: "لوحة الشرف",
    excerpt: "لوحات الشرف للطلاب المتفوقين.",
    to: "/honor",
    breadcrumb: "لوحة الشرف",
    keywords: ["honor", "شرف", "متفوقين"],
  },
  {
    title: "الأنشطة",
    excerpt: "الأنشطة المدرسية والفعاليات.",
    to: "/activities",
    breadcrumb: "الأنشطة",
    keywords: ["activities", "أنشطة", "فعاليات"],
  },
  {
    title: "المعرض",
    excerpt: "أرشيف صور المدرسة.",
    to: "/gallery",
    breadcrumb: "المعرض",
    keywords: ["gallery", "معرض", "صور", "ألبومات"],
  },
  {
    title: "تواصل معنا",
    excerpt: "معلومات الاتصال والموقع.",
    to: "/contact",
    breadcrumb: "تواصل معنا",
    keywords: ["contact", "تواصل", "اتصل", "عنوان"],
  },
];

function normalize(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().trim();
}

function scoreOf(term: string, ...fields: (string | null | undefined)[]): number {
  const t = normalize(term);
  if (!t) return 0;
  let score = 0;
  for (let i = 0; i < fields.length; i += 1) {
    const f = normalize(fields[i]);
    if (!f) continue;
    // First fields weighted higher (title > excerpt > body)
    const weight = Math.max(1, 5 - i);
    if (f === t) score += 100 * weight;
    else if (f.startsWith(t)) score += 40 * weight;
    else if (f.includes(t)) score += 20 * weight;
  }
  return score;
}

function like(term: string): string {
  // escape % and _ for ILIKE
  return `%${term.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

export interface SearchFilters {
  groups?: SearchGroup[];
  featuredOnly?: boolean;
  mediaOnly?: boolean;
}

const LIMIT_PER_TABLE = 12;

export async function runSearch(
  term: string,
  filters: SearchFilters = {},
): Promise<SearchHit[]> {
  const q = term.trim();
  if (!q) return [];
  const pattern = like(q);
  const groups = filters.groups && filters.groups.length ? new Set(filters.groups) : null;
  const wants = (g: SearchGroup) => (!groups || groups.has(g)) && (!filters.mediaOnly || g === "media" || g === "gallery");

  const jobs: Promise<SearchHit[]>[] = [];

  // ---- Static pages ------------------------------------------------------
  if (wants("pages")) {
    const pageHits: SearchHit[] = [];
    for (const p of STATIC_PAGES) {
      const s = scoreOf(q, p.title, p.excerpt, ...p.keywords);
      if (s > 0) {
        pageHits.push({
          id: `page:${p.to}`,
          group: "pages",
          title: p.title,
          excerpt: p.excerpt,
          breadcrumb: p.breadcrumb,
          to: p.to,
          score: s,
        });
      }
    }
    jobs.push(Promise.resolve(pageHits));
  }

  // ---- News --------------------------------------------------------------
  if (wants("news")) {
    jobs.push(
      Promise.resolve(supabase
        .from("news")
        .select(
          "id,slug,title_ar,summary_ar,published_at,is_featured,is_pinned,tags,category:news_categories!news_category_id_fkey(name_ar),featured_media:media!news_featured_image_media_id_fkey(bucket,storage_path,alt_ar)",
        )
        .eq("status", "published")
        .or(
          `title_ar.ilike.${pattern},title_en.ilike.${pattern},summary_ar.ilike.${pattern},body_ar.ilike.${pattern},seo_title.ilike.${pattern},seo_description.ilike.${pattern}`,
        )
        .limit(LIMIT_PER_TABLE)
        .then(({ data }) =>
          (data ?? []).map((r: any) => ({
            id: `news:${r.id}`,
            group: "news" as SearchGroup,
            title: r.title_ar,
            excerpt: r.summary_ar,
            breadcrumb: `الأخبار${r.category?.name_ar ? ` · ${r.category.name_ar}` : ""}`,
            to: "/news/$slug",
            params: { slug: r.slug },
            image: mediaPublicUrl(r.featured_media as MediaRef | null),
            updatedAt: r.published_at,
            category: r.category?.name_ar ?? null,
            featured: !!r.is_featured,
            pinned: !!r.is_pinned,
            tags: r.tags ?? undefined,
            score: scoreOf(q, r.title_ar, r.summary_ar) + (r.is_pinned ? 30 : 0) + (r.is_featured ? 15 : 0),
          })),
        )),
    );
  }

  // ---- Achievements ------------------------------------------------------
  if (wants("achievements")) {
    jobs.push(
      Promise.resolve(supabase
        .from("achievements")
        .select(
          "id,slug,title_ar,description_ar,published_at,is_featured,is_pinned,cover:cover_media_id(bucket,storage_path,alt_ar),category:achievement_categories!achievements_category_id_fkey(name_ar)",
        )
        .eq("status", "published")
        .or(
          `title_ar.ilike.${pattern},title_en.ilike.${pattern},description_ar.ilike.${pattern},seo_title.ilike.${pattern},seo_description.ilike.${pattern}`,
        )
        .limit(LIMIT_PER_TABLE)
        .then(({ data }) =>
          (data ?? []).map((r: any) => ({
            id: `ach:${r.id}`,
            group: "achievements" as SearchGroup,
            title: r.title_ar,
            excerpt: r.description_ar,
            breadcrumb: `الإنجازات${r.category?.name_ar ? ` · ${r.category.name_ar}` : ""}`,
            to: "/achievements/$slug",
            params: { slug: r.slug },
            image: mediaPublicUrl(r.cover as MediaRef | null),
            updatedAt: r.published_at,
            category: r.category?.name_ar ?? null,
            featured: !!r.is_featured,
            pinned: !!r.is_pinned,
            score: scoreOf(q, r.title_ar, r.description_ar) + (r.is_pinned ? 30 : 0) + (r.is_featured ? 15 : 0),
          })),
        )),
    );
  }

  // ---- Activities --------------------------------------------------------
  if (wants("activities")) {
    jobs.push(
      Promise.resolve(supabase
        .from("activities")
        .select(
          "id,slug,title_ar,summary_ar,published_at,is_featured,cover:cover_image_media_id(bucket,storage_path,alt_ar),category:activity_categories!activities_category_id_fkey(name_ar)",
        )
        .eq("status", "published")
        .or(
          `title_ar.ilike.${pattern},title_en.ilike.${pattern},summary_ar.ilike.${pattern},body_ar.ilike.${pattern}`,
        )
        .limit(LIMIT_PER_TABLE)
        .then(({ data }) =>
          (data ?? []).map((r: any) => ({
            id: `act:${r.id}`,
            group: "activities" as SearchGroup,
            title: r.title_ar,
            excerpt: r.summary_ar,
            breadcrumb: `الأنشطة${r.category?.name_ar ? ` · ${r.category.name_ar}` : ""}`,
            to: "/activities",
            image: mediaPublicUrl(r.cover as MediaRef | null),
            updatedAt: r.published_at,
            category: r.category?.name_ar ?? null,
            featured: !!r.is_featured,
            score: scoreOf(q, r.title_ar, r.summary_ar) + (r.is_featured ? 15 : 0),
          })),
        )),
    );
  }

  // ---- Gallery albums ----------------------------------------------------
  if (wants("gallery")) {
    jobs.push(
      Promise.resolve(supabase
        .from("gallery_albums")
        .select(
          "id,slug,title_ar,description_ar,category,published_at,is_featured,cover:cover_media_id(bucket,storage_path,alt_ar)",
        )
        .eq("status", "published")
        .or(`title_ar.ilike.${pattern},title_en.ilike.${pattern},description_ar.ilike.${pattern},category.ilike.${pattern}`)
        .limit(LIMIT_PER_TABLE)
        .then(({ data }) =>
          (data ?? []).map((r: any) => ({
            id: `gal:${r.id}`,
            group: "gallery" as SearchGroup,
            title: r.title_ar,
            excerpt: r.description_ar,
            breadcrumb: "المعرض · ألبوم",
            to: "/gallery/$slug",
            params: { slug: r.slug },
            image: mediaPublicUrl(r.cover as MediaRef | null),
            updatedAt: r.published_at,
            category: r.category ?? null,
            featured: !!r.is_featured,
            score: scoreOf(q, r.title_ar, r.description_ar) + (r.is_featured ? 15 : 0),
          })),
        )),
    );
  }

  // ---- Media library (public alt / captions) -----------------------------
  if (wants("media") || filters.mediaOnly) {
    jobs.push(
      Promise.resolve(supabase
        .from("media")
        .select("id,bucket,storage_path,alt_ar,alt_en,title_ar,file_name,tags,created_at")
        .or(
          `title_ar.ilike.${pattern},alt_ar.ilike.${pattern},alt_en.ilike.${pattern},file_name.ilike.${pattern}`,
        )
        .limit(LIMIT_PER_TABLE)
        .then(({ data }) =>
          (data ?? []).map((r: any) => ({
            id: `media:${r.id}`,
            group: "media" as SearchGroup,
            title: r.title_ar || r.alt_ar || r.file_name || "صورة",
            excerpt: r.alt_ar ?? r.file_name ?? null,
            breadcrumb: "مكتبة الوسائط",
            to: "/gallery",
            image: mediaPublicUrl(r as MediaRef),
            updatedAt: r.created_at,
            tags: r.tags ?? undefined,
            score: scoreOf(q, r.title_ar, r.alt_ar, r.file_name),
          })),
        )),
    );
  }

  // ---- Honor boards ------------------------------------------------------
  if (wants("honor")) {
    jobs.push(
      Promise.resolve(supabase
        .from("honor_boards")
        .select(
          "id,title_ar,description_ar,published_at,grade:grade_id(level),academic_year:academic_year_id(label)",
        )
        .eq("status", "published")
        .or(`title_ar.ilike.${pattern},description_ar.ilike.${pattern}`)
        .limit(LIMIT_PER_TABLE)
        .then(({ data }) =>
          (data ?? []).map((r: any) => {
            const level = r.grade?.level;
            return {
              id: `honor:${r.id}`,
              group: "honor" as SearchGroup,
              title: r.title_ar || `لوحة الشرف — الصف ${level ?? ""}`,
              excerpt: r.description_ar,
              breadcrumb: `لوحة الشرف${level ? ` · الصف ${level}` : ""}${r.academic_year?.label ? ` · ${r.academic_year.label}` : ""}`,
              to: level ? "/honor/grades/$level" : "/honor",
              params: level ? { level: String(level) } : undefined,
              updatedAt: r.published_at,
              score: scoreOf(q, r.title_ar, r.description_ar),
            } satisfies SearchHit;
          }),
        )),
    );

    jobs.push(
      Promise.resolve(supabase
        .from("honor_entries")
        .select(
          "id,student_name,description_ar,grade:grade_id(level),academic_year:academic_year_id(label)",
        )
        .eq("status", "published")
        .or(`student_name.ilike.${pattern},description_ar.ilike.${pattern},description_en.ilike.${pattern}`)
        .limit(LIMIT_PER_TABLE)
        .then(({ data }) =>
          (data ?? []).map((r: any) => {
            const level = r.grade?.level;
            return {
              id: `honor-entry:${r.id}`,
              group: "honor" as SearchGroup,
              title: r.student_name,
              excerpt: r.description_ar,
              breadcrumb: `لوحة الشرف${level ? ` · الصف ${level}` : ""}${r.academic_year?.label ? ` · ${r.academic_year.label}` : ""}`,
              to: level ? "/honor/grades/$level" : "/honor",
              params: level ? { level: String(level) } : undefined,
              score: scoreOf(q, r.student_name, r.description_ar),
            } satisfies SearchHit;
          }),
        )),
    );
  }

  // ---- Academic calendar + timeline + FAQ + policies ---------------------
  if (wants("academic")) {
    jobs.push(
      Promise.resolve(supabase
        .from("academic_calendar_events")
        .select("id,title_ar,description_ar,starts_on,category")
        .eq("status", "published")
        .or(`title_ar.ilike.${pattern},title_en.ilike.${pattern},description_ar.ilike.${pattern}`)
        .limit(LIMIT_PER_TABLE)
        .then(({ data }) =>
          (data ?? []).map((r: any) => ({
            id: `cal:${r.id}`,
            group: "academic" as SearchGroup,
            title: r.title_ar,
            excerpt: r.description_ar,
            breadcrumb: `الحياة الأكاديمية · التقويم${r.category ? ` · ${r.category}` : ""}`,
            to: "/academic/calendar",
            updatedAt: r.starts_on,
            score: scoreOf(q, r.title_ar, r.description_ar),
          })),
        )),
    );

    jobs.push(
      Promise.resolve(supabase
        .from("academic_timeline_events")
        .select("id,headline_ar,subtitle_ar,description_ar,starts_at")
        .eq("status", "published")
        .or(`headline_ar.ilike.${pattern},subtitle_ar.ilike.${pattern},description_ar.ilike.${pattern}`)
        .limit(LIMIT_PER_TABLE)
        .then(({ data }) =>
          (data ?? []).map((r: any) => ({
            id: `tl:${r.id}`,
            group: "academic" as SearchGroup,
            title: r.headline_ar,
            excerpt: r.subtitle_ar ?? r.description_ar,
            breadcrumb: "الحياة الأكاديمية · محطات العام",
            to: "/academic",
            updatedAt: r.starts_at,
            score: scoreOf(q, r.headline_ar, r.subtitle_ar, r.description_ar),
          })),
        )),
    );
  }

  // ---- FAQ ---------------------------------------------------------------
  if (wants("faq")) {
    jobs.push(
      Promise.resolve(supabase
        .from("faq_items")
        .select("id,question_ar,answer_ar")
        .eq("status", "published")
        .or(`question_ar.ilike.${pattern},answer_ar.ilike.${pattern}`)
        .limit(LIMIT_PER_TABLE)
        .then(({ data }) =>
          (data ?? []).map((r: any) => ({
            id: `faq:${r.id}`,
            group: "faq" as SearchGroup,
            title: r.question_ar,
            excerpt: r.answer_ar,
            breadcrumb: "الأسئلة الشائعة",
            to: "/academic/faq",
            score: scoreOf(q, r.question_ar, r.answer_ar),
          })),
        )),
    );
  }

  const settled = await Promise.allSettled(jobs);
  const merged: SearchHit[] = [];
  const seen = new Set<string>();
  for (const s of settled) {
    if (s.status !== "fulfilled") continue;
    for (const hit of s.value) {
      if (hit.score <= 0) continue;
      if (seen.has(hit.id)) continue;
      seen.add(hit.id);
      merged.push(hit);
    }
  }

  if (filters.featuredOnly) {
    for (let i = merged.length - 1; i >= 0; i -= 1) {
      if (!merged[i].featured && !merged[i].pinned) merged.splice(i, 1);
    }
  }

  merged.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const at = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    const bt = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    return bt - at;
  });

  return merged;
}

export function groupHits(hits: SearchHit[]): Array<{ group: SearchGroup; items: SearchHit[] }> {
  const buckets = new Map<SearchGroup, SearchHit[]>();
  for (const h of hits) {
    const arr = buckets.get(h.group) ?? [];
    arr.push(h);
    buckets.set(h.group, arr);
  }
  const order: SearchGroup[] = [
    "pages",
    "news",
    "achievements",
    "gallery",
    "activities",
    "honor",
    "academic",
    "faq",
    "media",
  ];
  const out: Array<{ group: SearchGroup; items: SearchHit[] }> = [];
  for (const g of order) {
    const items = buckets.get(g);
    if (items && items.length) out.push({ group: g, items });
  }
  return out;
}

// -------------------------------------------------------------------------
// Recent searches (localStorage). Public data — safe to persist.
// -------------------------------------------------------------------------

const RECENT_KEY = "school:recent-searches";
const MAX_RECENT = 8;

export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(term: string): void {
  if (typeof window === "undefined") return;
  const t = term.trim();
  if (!t) return;
  const list = getRecentSearches().filter((x) => x !== t);
  list.unshift(t);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    // ignore quota errors
  }
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RECENT_KEY);
  } catch {
    // ignore
  }
}

export const POPULAR_SEARCHES = [
  "رياض الأطفال",
  "الترميم",
  "التقويم",
  "الحضور",
  "أولياء الأمور",
  "الأنشطة",
];
