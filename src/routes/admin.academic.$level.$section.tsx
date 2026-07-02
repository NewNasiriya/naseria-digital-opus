import { useMemo } from "react";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Plus } from "lucide-react";

import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { Button } from "@/components/ui/button";
import { getGrade } from "@/lib/academic";
import { EntityListView } from "@/cms/ui/EntityListView";
import { EntityEditor } from "@/cms/ui/EntityEditor";
import {
  ACADEMIC_SECTION_META,
  buildAcademicSection,
  fetchGradeIdByLevel,
  type AcademicSection,
} from "@/cms/ui/modules/academic";

const searchSchema = z.object({
  id: z.string().optional().catch(undefined),
  new: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => (v === true || v === "1" || v === "true" ? true : undefined))
    .catch(undefined),
});

const SECTIONS: readonly AcademicSection[] = ["study", "exam", "resources", "notes"];

export const Route = createFileRoute("/admin/academic/$level/$section")({
  params: {
    parse: (raw: Record<string, string>) => {
      const level = Number.parseInt(raw.level, 10);
      if (!Number.isFinite(level) || level < 1 || level > 6) throw notFound();
      const section = raw.section as AcademicSection;
      if (!SECTIONS.includes(section)) throw notFound();
      return { level, section };
    },
    stringify: ({ level, section }: { level: number; section: AcademicSection }) => ({
      level: String(level),
      section,
    }),
  },
  validateSearch: (raw) => searchSchema.parse(raw ?? {}),
  component: SectionRoute,
});

function SectionRoute() {
  const { level, section } = Route.useParams();
  const search = Route.useSearch();
  const grade = getGrade(level)!;
  const meta = ACADEMIC_SECTION_META[section];

  const { data: gradeId, isLoading: gradeLoading } = useQuery({
    queryKey: ["academic", "grade-id", level],
    queryFn: () => fetchGradeIdByLevel(level),
    staleTime: 5 * 60_000,
  });

  const runtime = useMemo(() => {
    if (!gradeId) return null;
    return buildAcademicSection(section, { gradeId, level });
  }, [gradeId, level, section]);

  const listHref = `/admin/academic/${level}/${section}`;
  const newHref = `/admin/academic/${level}/${section}?new=1`;
  const isEditing = Boolean(search.id) || Boolean(search.new);

  if (gradeLoading || !runtime) {
    return (
      <AdminSectionHeader
        eyebrow={grade.name_ar}
        title={meta.title}
        crumbs={[
          { label: "لوحة التحكم", to: "/admin" },
          { label: "الحياة الأكاديمية", to: "/admin/academic" },
          { label: grade.name_ar, to: `/admin/academic/${level}` },
          { label: meta.title },
        ]}
      />
    );
  }

  if (isEditing) {
    return (
      <>
        <AdminSectionHeader
          eyebrow={`${grade.name_ar} · ${meta.title}`}
          title={search.id ? `تحرير ${meta.entity}` : `إضافة ${meta.entity}`}
          crumbs={[
            { label: "لوحة التحكم", to: "/admin" },
            { label: "الحياة الأكاديمية", to: "/admin/academic" },
            { label: grade.name_ar, to: `/admin/academic/${level}` },
            { label: meta.title, to: listHref },
            { label: search.id ? "تحرير" : "جديد" },
          ]}
        />
        <EntityEditor
          config={runtime.editor}
          repository={runtime.repository}
          service={runtime.service}
          id={search.id}
          listHref={listHref}
        />
      </>
    );
  }

  return (
    <>
      <AdminSectionHeader
        eyebrow={grade.name_ar}
        title={meta.title}
        crumbs={[
          { label: "لوحة التحكم", to: "/admin" },
          { label: "الحياة الأكاديمية", to: "/admin/academic" },
          { label: grade.name_ar, to: `/admin/academic/${level}` },
          { label: meta.title },
        ]}
        publicHref={`/academic/grades/${level}`}
        action={
          <Button size="sm" className="gap-1.5" asChild>
            <Link to={newHref}>
              <Plus className="h-4 w-4" />
              إضافة {meta.entity}
            </Link>
          </Button>
        }
      />
      <EntityListView
        config={runtime.list}
        repository={runtime.repository}
        service={runtime.service}
        editHrefFor={(id) => `${listHref}?id=${id}`}
        newHref={newHref}
      />
    </>
  );
}
