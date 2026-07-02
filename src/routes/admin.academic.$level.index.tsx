import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  FolderOpen,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { supabase } from "@/integrations/supabase/client";
import { getGrade } from "@/lib/academic";
import {
  ACADEMIC_SECTION_META,
  formatDate,
  type AcademicSection,
} from "@/cms/ui/modules/academic";
import { StatusBadge } from "@/cms/ui/StatusBadge";
import type { ContentStatus } from "@/cms/types";

const SECTION_ICONS: Record<AcademicSection, LucideIcon> = {
  study: BookOpen,
  exam: ClipboardList,
  resources: FolderOpen,
  notes: Megaphone,
};

interface SectionStat {
  publishedCount: number;
  totalCount: number;
  lastUpdated: string | null;
  aggregateStatus: ContentStatus;
}

async function fetchSectionStats(level: number): Promise<Record<AcademicSection, SectionStat>> {
  const { data: grade } = await supabase
    .from("grades")
    .select("id")
    .eq("level", level)
    .maybeSingle();
  const gradeId = grade?.id;
  const empty: SectionStat = {
    publishedCount: 0,
    totalCount: 0,
    lastUpdated: null,
    aggregateStatus: "archived",
  };
  if (!gradeId) {
    return { study: empty, exam: empty, resources: empty, notes: empty };
  }

  const [study, exam, resources, notes] = await Promise.all([
    supabase
      .from("timetables")
      .select("status,updated_at")
      .eq("grade_id", gradeId)
      .eq("kind", "academic"),
    supabase
      .from("timetables")
      .select("status,updated_at")
      .eq("grade_id", gradeId)
      .eq("kind", "exam"),
    supabase
      .from("academic_resources")
      .select("status,updated_at")
      .eq("grade_id", gradeId),
    supabase
      .from("academic_notes")
      .select("status,updated_at")
      .eq("grade_id", gradeId),
  ]);

  const toStat = (rows: Array<{ status: ContentStatus; updated_at: string }> | null): SectionStat => {
    const list = rows ?? [];
    const published = list.filter((r) => r.status === "published").length;
    const drafts = list.filter((r) => r.status === "draft").length;
    const lastUpdated =
      list
        .map((r) => r.updated_at)
        .filter(Boolean)
        .sort()
        .slice(-1)[0] ?? null;
    return {
      publishedCount: published,
      totalCount: list.length,
      lastUpdated,
      aggregateStatus:
        published > 0 ? "published" : drafts > 0 ? "draft" : "archived",
    };
  };

  return {
    study: toStat(study.data as never),
    exam: toStat(exam.data as never),
    resources: toStat(resources.data as never),
    notes: toStat(notes.data as never),
  };
}

export const Route = createFileRoute("/admin/academic/$level/")({
  component: GradeWorkspace,
});

function GradeWorkspace() {
  const { level } = Route.useParams();
  const grade = getGrade(level);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "academic", "section-stats", level],
    queryFn: () => fetchSectionStats(level),
    staleTime: 15_000,
  });

  const sections: AcademicSection[] = ["study", "exam", "notes", "resources"];

  return (
    <>
      <AdminSectionHeader
        eyebrow={`المستوى ${level}`}
        title={grade?.name_ar ?? "الصف"}
        description="أدر جداول ومحتوى هذا الصف بضغطتين. كل قسم يعمل باستقلال ويظهر مباشرة على الموقع بعد النشر."
        crumbs={[
          { label: "لوحة التحكم", to: "/admin" },
          { label: "الحياة الأكاديمية", to: "/admin/academic" },
          { label: grade?.name_ar ?? "الصف" },
        ]}
        publicHref={`/academic/grades/${level}`}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => {
          const meta = ACADEMIC_SECTION_META[s];
          const Icon = SECTION_ICONS[s];
          const stat = data?.[s];
          return (
            <Link
              key={s}
              to="/admin/academic/$level/$section"
              params={{ level: String(level), section: s }}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:elevation-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span
                    aria-hidden="true"
                    className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {stat && <StatusBadge status={stat.aggregateStatus} />}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{meta.title}</h3>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
                <div>
                  <dt className="text-muted-foreground">منشور</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">
                    {isLoading ? "…" : stat?.publishedCount ?? 0}
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
                  فتح القسم
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
