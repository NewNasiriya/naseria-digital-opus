/**
 * Analytics query layer (admin-only).
 *
 * Aggregates data from the three privacy-preserving analytics tables
 * plus counts across the existing CMS tables. Everything here runs
 * through Supabase RLS — only staff can read the analytics rows.
 */
import { supabase } from "@/integrations/supabase/client";

export interface RangeOption {
  key: "today" | "yesterday" | "7d" | "30d" | "year";
  label: string;
  days: number;
}

export const RANGE_OPTIONS: RangeOption[] = [
  { key: "today", label: "اليوم", days: 1 },
  { key: "yesterday", label: "أمس", days: 1 },
  { key: "7d", label: "آخر ٧ أيام", days: 7 },
  { key: "30d", label: "آخر ٣٠ يومًا", days: 30 },
  { key: "year", label: "العام الدراسي", days: 365 },
];

export function toDayStart(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function rangeBounds(key: RangeOption["key"]): { from: string; to: string } {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (key === "today") {
    return { from: toDayStart(today), to: toDayStart(today) };
  }
  if (key === "yesterday") {
    const y = new Date(today);
    y.setUTCDate(y.getUTCDate() - 1);
    return { from: toDayStart(y), to: toDayStart(y) };
  }
  const opt = RANGE_OPTIONS.find((r) => r.key === key)!;
  const from = new Date(today);
  from.setUTCDate(from.getUTCDate() - (opt.days - 1));
  return { from: toDayStart(from), to: toDayStart(today) };
}

// ---------- CMS content counts -------------------------------------------

export interface CmsCounts {
  publishedNews: number;
  publishedAchievements: number;
  galleryAlbums: number;
  mediaAssets: number;
  documents: number;
  honorBoards: number;
  activities: number;
  academicEvents: number;
  totalDrafts: number;
  totalArchived: number;
}

async function countTable(table: string, filter?: (q: any) => any): Promise<number> {
  let q = (supabase as any).from(table).select("id", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
}

export async function fetchCmsCounts(): Promise<CmsCounts> {
  const [
    publishedNews,
    publishedAchievements,
    galleryAlbums,
    mediaAssets,
    documents,
    honorBoards,
    activities,
    academicEvents,
  ] = await Promise.all([
    countTable("news", (q) => q.eq("status", "published")),
    countTable("achievements", (q) => q.eq("status", "published")),
    countTable("gallery_albums", (q) => q.eq("status", "published")),
    countTable("media"),
    countTable("media", (q) => q.eq("mime_type", "application/pdf")),
    countTable("honor_boards", (q) => q.eq("status", "published")),
    countTable("activities", (q) => q.eq("status", "published")),
    countTable("academic_calendar_events", (q) => q.eq("status", "published")),
  ]);

  const draftTables = ["news", "achievements", "activities", "gallery_albums", "honor_boards"];
  const [drafts, archived] = await Promise.all([
    Promise.all(draftTables.map((t) => countTable(t, (q) => q.eq("status", "draft")))).then(
      (arr) => arr.reduce((a, b) => a + b, 0),
    ),
    Promise.all(draftTables.map((t) => countTable(t, (q) => q.eq("status", "archived")))).then(
      (arr) => arr.reduce((a, b) => a + b, 0),
    ),
  ]);

  return {
    publishedNews,
    publishedAchievements,
    galleryAlbums,
    mediaAssets,
    documents,
    honorBoards,
    activities,
    academicEvents,
    totalDrafts: drafts,
    totalArchived: archived,
  };
}

// ---------- Traffic ------------------------------------------------------

export interface DailyPoint {
  day: string;
  views: number;
}

export async function fetchDailyTraffic(days: number): Promise<DailyPoint[]> {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - (days - 1));

  const { data, error } = await supabase
    .from("analytics_page_views")
    .select("day")
    .gte("day", toDayStart(from))
    .lte("day", toDayStart(to));
  if (error) return [];

  const counts = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(from);
    d.setUTCDate(d.getUTCDate() + i);
    counts.set(toDayStart(d), 0);
  }
  for (const row of data ?? []) {
    const day = row.day as string;
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([day, views]) => ({ day, views }));
}

export interface TrafficSummary {
  totalViews: number;
  uniquePaths: number;
  totalSearches: number;
  totalContentViews: number;
  previousViews: number;
}

export async function fetchTrafficSummary(days: number): Promise<TrafficSummary> {
  const now = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - (days - 1));
  const prevFrom = new Date(from);
  prevFrom.setUTCDate(prevFrom.getUTCDate() - days);
  const prevTo = new Date(from);
  prevTo.setUTCDate(prevTo.getUTCDate() - 1);

  const [{ data: current }, { count: searchCount }, { count: contentCount }, { data: prev }] =
    await Promise.all([
      supabase
        .from("analytics_page_views")
        .select("path")
        .gte("day", toDayStart(from))
        .lte("day", toDayStart(now)),
      supabase
        .from("analytics_search_queries")
        .select("id", { count: "exact", head: true })
        .gte("day", toDayStart(from))
        .lte("day", toDayStart(now)),
      supabase
        .from("analytics_content_views")
        .select("id", { count: "exact", head: true })
        .gte("day", toDayStart(from))
        .lte("day", toDayStart(now)),
      supabase
        .from("analytics_page_views")
        .select("id", { count: "exact", head: true })
        .gte("day", toDayStart(prevFrom))
        .lte("day", toDayStart(prevTo)),
    ]);

  const totalViews = current?.length ?? 0;
  const uniquePaths = new Set((current ?? []).map((r: any) => r.path)).size;
  return {
    totalViews,
    uniquePaths,
    totalSearches: searchCount ?? 0,
    totalContentViews: contentCount ?? 0,
    previousViews: (prev as any)?.count ?? 0,
  };
}

// ---------- Top lists ----------------------------------------------------

export interface TopPath {
  path: string;
  views: number;
}

export async function fetchTopPaths(days: number, limit = 8): Promise<TopPath[]> {
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - (days - 1));
  const { data, error } = await supabase
    .from("analytics_page_views")
    .select("path")
    .gte("day", toDayStart(from));
  if (error) return [];
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.path, (counts.get(row.path) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

export interface TopEntity {
  entityTable: string;
  entityId: string;
  title: string;
  views: number;
  href?: string;
  params?: Record<string, string>;
}

interface RawEntityRow {
  entity_table: string;
  entity_id: string;
  slug: string | null;
}

async function resolveEntityTitles(rows: Array<{ entity_table: string; entity_id: string; views: number; slug: string | null }>): Promise<TopEntity[]> {
  const byTable = new Map<string, string[]>();
  for (const r of rows) {
    const arr = byTable.get(r.entity_table) ?? [];
    arr.push(r.entity_id);
    byTable.set(r.entity_table, arr);
  }
  const titleMap = new Map<string, { title: string; slug?: string | null }>();
  await Promise.all(
    Array.from(byTable.entries()).map(async ([table, ids]) => {
      const cols = table === "gallery_albums" ? "id,title_ar,slug" : "id,title_ar,slug";
      const { data } = await (supabase as any).from(table).select(cols).in("id", ids);
      for (const row of (data ?? []) as any[]) {
        titleMap.set(`${table}:${row.id}`, { title: row.title_ar ?? "(بدون عنوان)", slug: row.slug });
      }
    }),
  );
  return rows.map((r) => {
    const info = titleMap.get(`${r.entity_table}:${r.entity_id}`);
    const slug = info?.slug ?? r.slug ?? null;
    let href: string | undefined;
    let params: Record<string, string> | undefined;
    if (slug) {
      if (r.entity_table === "news") { href = "/news/$slug"; params = { slug }; }
      else if (r.entity_table === "achievements") { href = "/achievements/$slug"; params = { slug }; }
      else if (r.entity_table === "gallery_albums") { href = "/gallery/$slug"; params = { slug }; }
    }
    return {
      entityTable: r.entity_table,
      entityId: r.entity_id,
      title: info?.title ?? "(محذوف)",
      views: r.views,
      href,
      params,
    };
  });
}

export async function fetchTopContent(entityTable: string, days: number, limit = 5): Promise<TopEntity[]> {
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - (days - 1));
  const { data, error } = await supabase
    .from("analytics_content_views")
    .select("entity_table,entity_id,slug")
    .eq("entity_table", entityTable)
    .gte("day", toDayStart(from));
  if (error) return [];
  const counts = new Map<string, { count: number; slug: string | null }>();
  for (const row of (data ?? []) as RawEntityRow[]) {
    const key = `${row.entity_table}:${row.entity_id}`;
    const cur = counts.get(key);
    counts.set(key, { count: (cur?.count ?? 0) + 1, slug: row.slug ?? cur?.slug ?? null });
  }
  const ranked = Array.from(counts.entries())
    .map(([k, v]) => {
      const [tbl, id] = k.split(":");
      return { entity_table: tbl, entity_id: id, views: v.count, slug: v.slug };
    })
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
  return resolveEntityTitles(ranked);
}

// ---------- Search analytics --------------------------------------------

export interface SearchTerm {
  term: string;
  count: number;
  avgResults: number;
  noResultRate: number;
}

export async function fetchSearchAnalytics(days: number, limit = 10): Promise<{
  top: SearchTerm[];
  noResults: SearchTerm[];
  totals: { totalSearches: number; noResultSearches: number; successRate: number };
}> {
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - (days - 1));
  const { data } = await supabase
    .from("analytics_search_queries")
    .select("normalized_term,term,result_count")
    .gte("day", toDayStart(from));
  const buckets = new Map<string, { term: string; count: number; results: number[]; noResults: number }>();
  for (const row of (data ?? []) as any[]) {
    const norm = row.normalized_term as string;
    const cur = buckets.get(norm) ?? { term: row.term, count: 0, results: [], noResults: 0 };
    cur.count += 1;
    cur.results.push(Number(row.result_count ?? 0));
    if ((row.result_count ?? 0) === 0) cur.noResults += 1;
    buckets.set(norm, cur);
  }
  const totalSearches = (data ?? []).length;
  const noResultSearches = (data ?? []).filter((r: any) => (r.result_count ?? 0) === 0).length;
  const successRate = totalSearches === 0 ? 0 : Math.round(((totalSearches - noResultSearches) / totalSearches) * 100);
  const terms: SearchTerm[] = Array.from(buckets.entries()).map(([, v]) => ({
    term: v.term,
    count: v.count,
    avgResults: v.results.length ? Math.round(v.results.reduce((a, b) => a + b, 0) / v.results.length) : 0,
    noResultRate: v.count === 0 ? 0 : Math.round((v.noResults / v.count) * 100),
  }));
  return {
    top: terms.sort((a, b) => b.count - a.count).slice(0, limit),
    noResults: terms
      .filter((t) => t.avgResults === 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit),
    totals: { totalSearches, noResultSearches, successRate },
  };
}

// ---------- Academic resources -------------------------------------------

const ACADEMIC_RESOURCE_PATHS: { path: string; label: string }[] = [
  { path: "/academic", label: "الحياة الأكاديمية" },
  { path: "/academic/calendar", label: "التقويم الأكاديمي" },
  { path: "/academic/student-guidelines", label: "إرشادات الطلاب" },
  { path: "/academic/parent-guidelines", label: "إرشادات أولياء الأمور" },
  { path: "/academic/attendance-behaviour", label: "الحضور والانضباط" },
  { path: "/academic/attendance", label: "الحضور" },
  { path: "/academic/behaviour", label: "السلوك" },
  { path: "/academic/policies", label: "السياسات المدرسية" },
  { path: "/academic/faq", label: "الأسئلة الشائعة" },
];

export interface ResourceUsage {
  label: string;
  path: string;
  views: number;
}

export async function fetchAcademicResourceUsage(days: number): Promise<ResourceUsage[]> {
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - (days - 1));
  const paths = ACADEMIC_RESOURCE_PATHS.map((p) => p.path);
  const gradePaths = [1, 2, 3, 4, 5, 6].map((n) => `/academic/grades/${n}`);
  const honorGradePaths = [1, 2, 3, 4, 5, 6].map((n) => `/honor/grades/${n}`);
  const all = [...paths, ...gradePaths, ...honorGradePaths];

  const { data } = await supabase
    .from("analytics_page_views")
    .select("path")
    .in("path", all as any)
    .gte("day", toDayStart(from));

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as any[]) {
    counts.set(row.path, (counts.get(row.path) ?? 0) + 1);
  }

  const rows: ResourceUsage[] = [
    ...ACADEMIC_RESOURCE_PATHS.map((p) => ({ label: p.label, path: p.path, views: counts.get(p.path) ?? 0 })),
    ...gradePaths.map((p, i) => ({ label: `جدول الصف ${i + 1}`, path: p, views: counts.get(p) ?? 0 })),
    ...honorGradePaths.map((p, i) => ({ label: `شرف الصف ${i + 1}`, path: p, views: counts.get(p) ?? 0 })),
  ];
  return rows.sort((a, b) => b.views - a.views);
}

// ---------- CSV export ---------------------------------------------------

export function toCsv(rows: Array<Record<string, string | number | null | undefined>>): string {
  if (!rows.length) return "";
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows.map((r) => headers.map((h) => escape(r[h])).join(",")).join("\n");
  return `${headers.join(",")}\n${body}`;
}

export function downloadCsv(name: string, csv: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.endsWith(".csv") ? name : `${name}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
