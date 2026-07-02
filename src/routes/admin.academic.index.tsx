import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, GraduationCap, ClipboardList } from "lucide-react";

import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { supabase } from "@/integrations/supabase/client";
import { GRADES } from "@/lib/academic";
import { formatDate } from "@/cms/ui/modules/academic";
import { StatusBadge } from "@/cms/ui/StatusBadge";
import type { ContentStatus } from "@/cms/types";

interface GradeStats {
  level: number;
  gradeId: string | null;
  publishedResources: number;
  publishedTotal: number;
  lastUpdated: string | null;
  aggregateStatus: ContentStatus;
}

async function fetchGradeStats(): Promise<GradeStats[]> {
  const { data: grades } = await supabase
    .from("grades")
    .select("id,level")
    .order("level");
  if (!grades) return [];

  const stats = await Promise.all(
    grades.map(async (g) => {
      const [tt, notes, res] = await Promise.all([
        supabase
          .from("timetables")
          .select("status,updated_at", { count: "exact" })
          .eq("grade_id", g.id),
        supabase
          .from("academic_notes")
          .select("status,updated_at", { count: "exact" })
          .eq("grade_id", g.id),
        supabase
          .from("academic_resources")
          .select("status,updated_at", { count: "exact" })
          .eq("grade_id", g.id),
      ]);

      const all = [
        ...((tt.data ?? []) as Array<{ status: ContentStatus; updated_at: string }>),
        ...((notes.data ?? []) as Array<{ status: ContentStatus; updated_at: string }>),
        ...((res.data ?? []) as Array<{ status: ContentStatus; updated_at: string }>),
      ];
      const published = all.filter((r) => r.status === "published").length;
      const lastUpdated =
        all
          .map((r) => r.updated_at)
          .filter(Boolean)
          .sort()
          .slice(-1)[0] ?? null;
      const draftCount = all.filter((r) => r.status === "draft").length;
      const aggregateStatus: ContentStatus =
        published > 0 ? "published" : draftCount > 0 ? "draft" : "archived";

      return {
        level: g.level,
        gradeId: g.id,
        publishedResources: published,
        publishedTotal: all.length,
        lastUpdated,
        aggregateStatus,
      };
    }),
  );
  return stats;
}

export const Route = createFileRoute("/admin/academic/")({
  head: () => ({
    meta: [
      { title: "الحياة الأكاديمية · لوحة الإدارة" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AcademicHome,
});

function AcademicHome() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "academic", "grade-stats"],
    queryFn: fetchGradeStats,
    staleTime: 30_000,
  });

  return (
    <>
      <AdminSectionHeader
        eyebrow="الحياة الأكاديمية"
        title="إدارة الصفوف والجداول"
        description="اختر الصف لإدارة الجدول الدراسي، جدول الامتحانات، الملاحظات، والمرفقات."
        crumbs={[
          { label: "لوحة التحكم", to: "/admin" },
          { label: "الحياة الأكاديمية" },
        ]}
        publicHref="/academic"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {GRADES.map((g) => {
          const stat = data?.find((s) => s.level === g.level);
          const published = stat?.publishedResources ?? 0;
          return (
            <Link
              key={g.level}
              to="/admin/academic/$level"
              params={{ level: String(g.level) }}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:elevation-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span
                    aria-hidden="true"
                    className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"
                  >
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  {stat && <StatusBadge status={stat.aggregateStatus} />}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{g.name_ar}</h3>
                <p className="mt-1 text-xs text-muted-foreground">المستوى {g.level}</p>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
                <div>
                  <dt className="text-muted-foreground">المنشور</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">
                    {isLoading ? "…" : `${published}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">آخر تحديث</dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {isLoading ? "…" : formatDate(stat?.lastUpdated ?? null)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 text-primary">
                  <ClipboardList className="h-4 w-4" />
                  إدارة الصف
                </span>
                <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5 group-hover:text-primary" />
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
