import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Download,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  StickyNote,
  Users,
  type LucideIcon,
} from "lucide-react";

import { PageHero } from "@/components/academic/PageHero";
import { TimetableSection } from "@/components/academic/TimetableSection";
import { NotesSection, ResourcesSection } from "@/components/academic/GradeContentSections";
import { EmptyPanel } from "@/components/academic/EmptyPanel";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { supabase } from "@/integrations/supabase/client";
import { getGrade, parseGradeLevel, GRADES } from "@/lib/academic";

export const Route = createFileRoute("/academic/grades/$level")({
  params: {
    parse: (raw: Record<string, string>) => {
      const level = parseGradeLevel(raw.level);
      if (level === null) throw notFound();
      return { level };
    },
    stringify: ({ level }: { level: number }) => ({ level: String(level) }),
  },
  head: ({ params }) => {
    const g = getGrade(params.level);
    const title = g ? `${g.name_ar} | مدرسة الناصرية الابتدائية الجديدة` : "الصف الدراسي";
    const description = g
      ? `المصادر الأكاديمية لـ${g.name_ar}: الجدول الدراسي، جدول الامتحانات، الملاحظات، والملفات القابلة للتنزيل.`
      : "";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="grid min-h-[60vh] place-items-center">
      <p className="text-muted-foreground">الصف المطلوب غير موجود.</p>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="grid min-h-[60vh] place-items-center">
      <p className="text-muted-foreground">تعذّر تحميل الصفحة: {error.message}</p>
    </div>
  ),
  component: GradePage,
});

async function fetchGradeIdByLevel(level: number): Promise<string | null> {
  const { data, error } = await supabase
    .from("grades")
    .select("id")
    .eq("level", level)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

function GradePage() {
  const { level } = Route.useParams();
  const meta = getGrade(level)!;

  const { data: gradeId } = useQuery({
    queryKey: ["academic", "grade-id", level],
    queryFn: () => fetchGradeIdByLevel(level),
    staleTime: 5 * 60_000,
  });

  return (
    <>
      <PageHero
        eyebrow={`المستوى ${level}`}
        title={meta.name_ar}
        description={`صفحة ${meta.name_ar} تضمّ الجدول الدراسي، جدول الامتحانات، الملاحظات الأكاديمية، والمرفقات التي تنشرها إدارة المدرسة.`}
        crumbs={[
          { label: "الحياة الأكاديمية", to: "/academic" },
          { label: meta.name_ar },
        ]}
      />

      <Section spacing="default">
        <Container size="wide">
          <div className="space-y-16">
            <TimetableSection
              gradeId={gradeId}
              kind="academic"
              title="الجدول الدراسي"
              emptyTitle="لم يُنشر الجدول الدراسي بعد"
              emptyDescription="ستقوم إدارة المدرسة برفع الجدول الدراسي لهذا الصف قريبًا."
            />
            <TimetableSection
              gradeId={gradeId}
              kind="exam"
              title="جدول الامتحانات"
              emptyTitle="لم يُنشر جدول الامتحانات بعد"
              emptyDescription="سيظهر هنا جدول الامتحانات الرسمي عند اعتماده من الإدارة."
            />

            <section aria-labelledby="grade-notes" className="scroll-mt-24">
              <div className="mb-6 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"
                >
                  <StickyNote className="h-5 w-5" />
                </span>
                <h2 id="grade-notes" className="text-xl font-semibold text-foreground">
                  الملاحظات الأكاديمية
                </h2>
              </div>
              <EmptyPanel
                title="لا توجد ملاحظات منشورة حالياً"
                description="سيقوم المعلمون والإدارة بنشر التنبيهات والملاحظات الأكاديمية المتعلقة بهذا الصف من خلال لوحة التحكم."
                icon={StickyNote}
              />
            </section>

            <section aria-labelledby="grade-downloads" className="scroll-mt-24">
              <div className="mb-6 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"
                >
                  <Download className="h-5 w-5" />
                </span>
                <h2 id="grade-downloads" className="text-xl font-semibold text-foreground">
                  المرفقات والتنزيلات
                </h2>
              </div>
              <EmptyPanel
                title="لا توجد ملفات للتنزيل بعد"
                description="سيتم توفير المذكرات والمستندات الرسمية للتنزيل من هذا القسم فور نشرها من الإدارة."
                icon={Download}
              />
            </section>
          </div>

          <RelatedResources />

          <GradeNav currentLevel={level} />
        </Container>
      </Section>
    </>
  );
}

interface ResourceLink {
  to: "/academic/calendar" | "/academic/student-guidelines" | "/academic/parent-guidelines" | "/academic/attendance-behaviour";
  label: string;
  description: string;
  icon: LucideIcon;
}

const RELATED_RESOURCES: ResourceLink[] = [
  {
    to: "/academic/calendar",
    label: "التقويم الأكاديمي",
    description: "المواعيد الرسمية للفصول الدراسية والإجازات والامتحانات.",
    icon: CalendarDays,
  },
  {
    to: "/academic/student-guidelines",
    label: "إرشادات الطلاب",
    description: "التوجيهات الرسمية للطلاب داخل الفصل والمدرسة.",
    icon: GraduationCap,
  },
  {
    to: "/academic/parent-guidelines",
    label: "إرشادات أولياء الأمور",
    description: "توجيهات لمتابعة الأبناء وتعزيز التعاون مع المدرسة.",
    icon: HeartHandshake,
  },
  {
    to: "/academic/attendance-behaviour",
    label: "الحضور والسلوك",
    description: "سياسات الحضور والانضباط ومعايير السلوك المدرسي.",
    icon: ShieldCheck,
  },
];

function RelatedResources() {
  return (
    <section
      aria-labelledby="related-resources"
      className="mt-16 rounded-2xl border border-border bg-surface-muted p-6 sm:p-8"
    >
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-primary" aria-hidden="true" />
        <h3 id="related-resources" className="text-sm font-semibold text-foreground">
          مصادر أكاديمية ذات صلة
        </h3>
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {RELATED_RESOURCES.map((r) => {
          const Icon = r.icon;
          return (
            <li key={r.to}>
              <Link
                to={r.to}
                className="group flex h-full items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-border-strong hover:bg-background"
              >
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {r.label}
                    </span>
                    <ArrowLeft
                      className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-1 block text-xs leading-loose text-muted-foreground">
                    {r.description}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function GradeNav({ currentLevel }: { currentLevel: number }) {
  return (
    <nav
      aria-label="التنقل بين الصفوف"
      className="mt-8 rounded-2xl border border-border bg-surface-muted p-6"
    >
      <div className="flex items-center gap-3">
        <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-foreground">صفوف أخرى</h3>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2">
        {GRADES.filter((g) => g.level !== currentLevel).map((g) => (
          <li key={g.level}>
            <Link
              to="/academic/grades/$level"
              params={{ level: String(g.level) }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-border-strong hover:bg-background"
            >
              <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              {g.name_ar}
              <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
