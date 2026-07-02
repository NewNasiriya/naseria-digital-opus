/**
 * Enterprise analytics dashboard (/admin/analytics).
 *
 * Consumes the privacy-preserving analytics tables and existing CMS
 * counts to give administrators an at-a-glance operational overview:
 * traffic trends, top content, academic resource usage, search health
 * and system state. Access is gated by the parent /admin route's
 * staff-only beforeLoad.
 */
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Archive,
  Award,
  BookOpen,
  Calendar,
  Download,
  Eye,
  FileText,
  FolderOpen,
  GraduationCap,
  Images,
  LineChart as LineChartIcon,
  Newspaper,
  Printer,
  Search as SearchIcon,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  RANGE_OPTIONS,
  downloadCsv,
  fetchAcademicResourceUsage,
  fetchCmsCounts,
  fetchDailyTraffic,
  fetchSearchAnalytics,
  fetchTopContent,
  fetchTopPaths,
  fetchTrafficSummary,
  toCsv,
  type RangeOption,
} from "@/lib/analytics-query";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "التحليلات · لوحة الإدارة" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [range, setRange] = useState<RangeOption["key"]>("30d");
  const days = RANGE_OPTIONS.find((r) => r.key === range)?.days ?? 30;

  const cmsQ = useQuery({
    queryKey: ["analytics", "cms-counts"],
    queryFn: fetchCmsCounts,
    staleTime: 60_000,
  });

  const summaryQ = useQuery({
    queryKey: ["analytics", "summary", days],
    queryFn: () => fetchTrafficSummary(days),
    staleTime: 30_000,
  });

  const trafficQ = useQuery({
    queryKey: ["analytics", "traffic", days],
    queryFn: () => fetchDailyTraffic(days),
    staleTime: 30_000,
  });

  const topPathsQ = useQuery({
    queryKey: ["analytics", "top-paths", days],
    queryFn: () => fetchTopPaths(days, 8),
    staleTime: 30_000,
  });

  const topNewsQ = useQuery({
    queryKey: ["analytics", "top", "news", days],
    queryFn: () => fetchTopContent("news", days, 5),
    staleTime: 30_000,
  });
  const topAchQ = useQuery({
    queryKey: ["analytics", "top", "achievements", days],
    queryFn: () => fetchTopContent("achievements", days, 5),
    staleTime: 30_000,
  });
  const topGalleryQ = useQuery({
    queryKey: ["analytics", "top", "gallery_albums", days],
    queryFn: () => fetchTopContent("gallery_albums", days, 5),
    staleTime: 30_000,
  });

  const academicQ = useQuery({
    queryKey: ["analytics", "academic", days],
    queryFn: () => fetchAcademicResourceUsage(days),
    staleTime: 30_000,
  });

  const searchQ = useQuery({
    queryKey: ["analytics", "search", days],
    queryFn: () => fetchSearchAnalytics(days, 10),
    staleTime: 30_000,
  });

  const summary = summaryQ.data;
  const cms = cmsQ.data;
  const traffic = trafficQ.data ?? [];

  const delta = useMemo(() => {
    if (!summary) return { pct: 0, up: true };
    const prev = summary.previousViews;
    if (prev === 0 && summary.totalViews === 0) return { pct: 0, up: true };
    if (prev === 0) return { pct: 100, up: true };
    const pct = Math.round(((summary.totalViews - prev) / prev) * 100);
    return { pct: Math.abs(pct), up: pct >= 0 };
  }, [summary]);

  const contentStatusChart = useMemo(() => {
    if (!cms) return [];
    return [
      { name: "منشور", value: cms.publishedNews + cms.publishedAchievements + cms.galleryAlbums + cms.activities + cms.honorBoards, color: "hsl(var(--primary))" },
      { name: "مسودة", value: cms.totalDrafts, color: "hsl(var(--warning))" },
      { name: "مؤرشف", value: cms.totalArchived, color: "hsl(var(--muted-foreground))" },
    ];
  }, [cms]);

  const handleExport = () => {
    const rows: Array<Record<string, string | number>> = [];
    for (const p of topPathsQ.data ?? []) rows.push({ type: "page", label: p.path, views: p.views });
    for (const n of topNewsQ.data ?? []) rows.push({ type: "news", label: n.title, views: n.views });
    for (const a of topAchQ.data ?? []) rows.push({ type: "achievement", label: a.title, views: a.views });
    for (const g of topGalleryQ.data ?? []) rows.push({ type: "gallery", label: g.title, views: g.views });
    for (const s of searchQ.data?.top ?? []) rows.push({ type: "search", label: s.term, views: s.count });
    downloadCsv(`analytics-${range}-${new Date().toISOString().slice(0, 10)}`, toCsv(rows));
  };

  return (
    <>
      <AdminSectionHeader
        eyebrow="تحليلات ورؤى"
        title="التحليلات والرؤى"
        description="نظرة تنفيذية على استخدام الموقع ومحتوى المدرسة. البيانات مجمّعة ومحمية للخصوصية."
        crumbs={[{ label: "لوحة التحكم", to: "/admin" }, { label: "التحليلات" }]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" /> طباعة
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" /> تصدير CSV
            </Button>
          </div>
        }
      />

      {/* Range switcher */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-2">
        {RANGE_OPTIONS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            aria-pressed={range === r.key}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              range === r.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Overview cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Eye}
          label="مشاهدات الصفحات"
          value={summary?.totalViews ?? 0}
          hint={
            summary && summary.previousViews > 0 ? (
              <span className={cn("inline-flex items-center gap-1 text-xs", delta.up ? "text-emerald-600" : "text-destructive")}>
                {delta.up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {delta.pct}% مقابل الفترة السابقة
              </span>
            ) : null
          }
        />
        <MetricCard icon={Users} label="مسارات فريدة" value={summary?.uniquePaths ?? 0} />
        <MetricCard icon={SearchIcon} label="عمليات بحث" value={summary?.totalSearches ?? 0} />
        <MetricCard icon={BookOpen} label="فتح محتوى" value={summary?.totalContentViews ?? 0} />
      </div>

      {/* Traffic + content status */}
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="تدفق الزيارات"
          subtitle={`مشاهدات يومية · ${RANGE_OPTIONS.find((r) => r.key === range)?.label}`}
          icon={LineChartIcon}
          className="lg:col-span-2"
        >
          <div className="h-64">
            {traffic.length === 0 ? (
              <SoftEmpty text="لا توجد بيانات لهذه الفترة بعد." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={traffic} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 11 }} reversed />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    labelFormatter={(v) => `يوم ${v}`}
                    formatter={(v: number) => [v, "مشاهدات"]}
                  />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="حالة المحتوى" subtitle="التوزيع الحالي" icon={Activity}>
          <div className="h-64">
            {contentStatusChart.every((c) => c.value === 0) ? (
              <SoftEmpty text="لا توجد بيانات." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={contentStatusChart} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {contentStatusChart.map((c, i) => (
                      <Cell key={i} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="mt-3 space-y-1.5 text-xs">
            {contentStatusChart.map((c) => (
              <li key={c.name} className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-foreground">
                  <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                  {c.name}
                </span>
                <span className="text-muted-foreground">{c.value.toLocaleString("ar-EG")}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      {/* CMS content counts */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniCount label="أخبار منشورة" value={cms?.publishedNews ?? 0} icon={Newspaper} />
        <MiniCount label="إنجازات منشورة" value={cms?.publishedAchievements ?? 0} icon={Trophy} />
        <MiniCount label="ألبومات المعرض" value={cms?.galleryAlbums ?? 0} icon={Images} />
        <MiniCount label="أصول الوسائط" value={cms?.mediaAssets ?? 0} icon={FolderOpen} />
        <MiniCount label="المستندات (PDF)" value={cms?.documents ?? 0} icon={FileText} />
        <MiniCount label="لوحات الشرف" value={cms?.honorBoards ?? 0} icon={Award} />
        <MiniCount label="الأنشطة" value={cms?.activities ?? 0} icon={Sparkles} />
        <MiniCount label="فعاليات أكاديمية" value={cms?.academicEvents ?? 0} icon={Calendar} />
      </div>

      {/* Top content */}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <TopList
          title="أكثر الصفحات زيارة"
          icon={Eye}
          items={(topPathsQ.data ?? []).map((p) => ({ label: p.path, value: p.views }))}
          emptyText="لم يتم تسجيل زيارات بعد."
        />
        <TopList
          title="الأخبار الأكثر مشاهدة"
          icon={Newspaper}
          items={(topNewsQ.data ?? []).map((n) => ({
            label: n.title,
            value: n.views,
            to: n.href,
            params: n.params,
          }))}
          emptyText="لا توجد مشاهدات للأخبار بعد."
        />
        <TopList
          title="الإنجازات الأكثر مشاهدة"
          icon={Trophy}
          items={(topAchQ.data ?? []).map((a) => ({
            label: a.title,
            value: a.views,
            to: a.href,
            params: a.params,
          }))}
          emptyText="لا توجد مشاهدات للإنجازات بعد."
        />
        <TopList
          title="ألبومات المعرض الأكثر مشاهدة"
          icon={Images}
          items={(topGalleryQ.data ?? []).map((a) => ({
            label: a.title,
            value: a.views,
            to: a.href,
            params: a.params,
          }))}
          emptyText="لا توجد مشاهدات للألبومات بعد."
        />
      </div>

      {/* Academic + Search */}
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="استخدام الموارد الأكاديمية"
          subtitle="بما فيها جداول الصفوف ولوحات الشرف"
          icon={GraduationCap}
          className="lg:col-span-2"
        >
          <div className="h-72">
            {(academicQ.data ?? []).every((r) => r.views === 0) ? (
              <SoftEmpty text="لا توجد مشاهدات للموارد الأكاديمية بعد." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(academicQ.data ?? []).slice(0, 12)} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={130} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="تحليل البحث" subtitle="أكثر الكلمات ونسبة النجاح" icon={SearchIcon}>
          <div className="mb-3 rounded-xl bg-surface-muted/50 p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>معدل نجاح البحث</span>
              <span className="font-semibold text-foreground">
                {searchQ.data?.totals.successRate ?? 0}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${searchQ.data?.totals.successRate ?? 0}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {searchQ.data?.totals.totalSearches ?? 0} عملية بحث · {searchQ.data?.totals.noResultSearches ?? 0} بدون نتائج
            </p>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">الكلمات الأكثر بحثًا</p>
            {(searchQ.data?.top.length ?? 0) === 0 ? (
              <SoftEmpty text="لم يتم تسجيل بحث بعد." small />
            ) : (
              <ul className="space-y-1">
                {searchQ.data!.top.slice(0, 6).map((s) => (
                  <li
                    key={s.term}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <span className="truncate text-foreground">{s.term}</span>
                    <span className="text-xs text-muted-foreground">{s.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {(searchQ.data?.noResults.length ?? 0) > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-semibold text-warning">بحث بدون نتائج</p>
              <ul className="space-y-1">
                {searchQ.data!.noResults.slice(0, 4).map((s) => (
                  <li key={s.term} className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs">
                    <span className="truncate text-foreground">{s.term}</span>
                    <span className="text-muted-foreground">{s.count} مرة</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ChartCard>
      </div>

      {/* System insights */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniCount label="مسودات" value={cms?.totalDrafts ?? 0} icon={FileText} />
        <MiniCount label="محتوى مؤرشف" value={cms?.totalArchived ?? 0} icon={Archive} />
        <MiniCount label="عمليات البحث" value={summary?.totalSearches ?? 0} icon={SearchIcon} />
        <MiniCount label="فتح محتوى" value={summary?.totalContentViews ?? 0} icon={Eye} />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        البيانات مجمّعة ومحمية — لا يتم تخزين هوية الزوار أو عناوين IP.
      </p>
    </>
  );
}

// ---- Small building blocks ---------------------------------------------

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 elevation-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {value.toLocaleString("ar-EG")}
          </p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      {hint && <div className="mt-3">{hint}</div>}
    </div>
  );
}

function MiniCount({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Eye;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value.toLocaleString("ar-EG")}</p>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon: typeof Eye;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 elevation-sm", className)}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Icon className="h-4 w-4 text-primary" aria-hidden="true" /> {title}
          </h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function TopList({
  title,
  icon: Icon,
  items,
  emptyText,
}: {
  title: string;
  icon: typeof Eye;
  items: Array<{ label: string; value: number; to?: string; params?: Record<string, string> }>;
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 elevation-sm">
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" /> {title}
      </h3>
      {items.length === 0 ? (
        <EmptyState icon={Icon} title="لا توجد بيانات بعد" description={emptyText} className="border-none py-6" />
      ) : (
        <ol className="space-y-1.5">
          {items.map((it, i) => {
            const max = items[0]?.value || 1;
            const pct = Math.max(4, Math.round((it.value / max) * 100));
            const inner = (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-medium text-foreground">
                    <span className="me-2 text-xs text-muted-foreground">{i + 1}.</span>
                    {it.label}
                  </p>
                  <span className="shrink-0 text-xs font-semibold text-primary">
                    {it.value.toLocaleString("ar-EG")}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                </div>
              </>
            );
            return (
              <li key={`${it.label}-${i}`} className="rounded-lg p-2 hover:bg-accent">
                {it.to ? (
                  <Link to={it.to as any} params={it.params as any} target="_blank" className="block">
                    {inner}
                  </Link>
                ) : (
                  <div>{inner}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function SoftEmpty({ text, small }: { text: string; small?: boolean }) {
  return (
    <div
      className={cn(
        "grid h-full place-items-center rounded-xl border border-dashed border-border bg-surface-muted/40 text-center text-muted-foreground",
        small ? "min-h-20 px-3 py-4 text-xs" : "min-h-40 p-4 text-sm",
      )}
    >
      {text}
    </div>
  );
}
