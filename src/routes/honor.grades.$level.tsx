import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Award } from "lucide-react";

import { PageHero } from "@/components/academic/PageHero";
import { EmptyPanel } from "@/components/academic/EmptyPanel";
import { HonorSheetViewer } from "@/components/honor/HonorSheetViewer";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GRADES, getGrade, parseGradeLevel } from "@/lib/academic";
import { fetchHonorBoardByGrade } from "@/lib/honor";

export const Route = createFileRoute("/honor/grades/$level")({
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
    const title = g
      ? `لوحة شرف ${g.name_ar} | مدرسة الناصرية الابتدائية الجديدة`
      : "لوحة الشرف";
    const description = g
      ? `كشف بأسماء أوائل ${g.name_ar} — لوحة الشرف الرسمية لمدرسة الناصرية الابتدائية الجديدة.`
      : "";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `https://naseria-digital-opus.lovable.app/honor/grades/${params.level}` },
      ],
      links: [{ rel: "canonical", href: `https://naseria-digital-opus.lovable.app/honor/grades/${params.level}` }],
    };
  },
  notFoundComponent: () => (
    <div className="grid min-h-[60vh] place-items-center">
      <p className="text-muted-foreground">الصف المطلوب غير موجود.</p>
    </div>
  ),
  errorComponent: () => (
    <div className="grid min-h-[60vh] place-items-center">
      <p className="text-muted-foreground">تعذّر تحميل الصفحة، حاول لاحقًا.</p>
    </div>
  ),
  component: HonorGradePage,
});

function HonorGradePage() {
  const { level } = Route.useParams();
  const meta = getGrade(level)!;

  const { data, isLoading } = useQuery({
    queryKey: ["honor", "board", "grade", level],
    queryFn: () => fetchHonorBoardByGrade(level),
    staleTime: 60_000,
  });

  const prev = GRADES.find((g) => g.level === level - 1);
  const next = GRADES.find((g) => g.level === level + 1);

  return (
    <>
      <PageHero
        eyebrow="لوحة الشرف"
        title={`لوحة شرف ${meta.name_ar}`}
        description={
          data?.academic_year
            ? `كشف بأسماء الأوائل للعام الدراسي ${data.academic_year}.`
            : "كشف بأسماء الأوائل — معتمد رسميًا من إدارة المدرسة."
        }
        crumbs={[
          { label: "لوحة الشرف", to: "/honor" },
          { label: meta.name_ar },
        ]}
      />

      <Section spacing="default">
        <Container size="wide">
          {isLoading ? (
            <div className="aspect-[3/4] w-full animate-pulse rounded-2xl border border-border bg-surface-muted" />
          ) : !data ? (
            <EmptyPanel
              icon={Award}
              title="لم تُنشر لوحة شرف هذا الصف بعد"
              description="سيتم نشر كشف الأوائل الرسمي لهذا الصف فور اعتماده من إدارة المدرسة."
            />
          ) : (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                    العام الدراسي {data.academic_year}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">
                    {data.title_ar ?? `كشف بأسماء أوائل ${meta.name_ar}`}
                  </h2>
                </div>
              </div>

              <HonorSheetViewer
                imageUrl={data.image_url}
                alt={`${data.title_ar ?? meta.name_ar} — ${data.academic_year}`}
                downloadFileName={`honor-board-grade-${level}-${data.academic_year.replace(/\s|\//g, "-")}.png`}
              />

              {data.description_ar && (
                <p className="max-w-3xl text-sm leading-loose text-muted-foreground">
                  {data.description_ar}
                </p>
              )}
            </div>
          )}

          <nav
            aria-label="التنقل بين لوحات الشرف"
            className="mt-16 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface-muted p-6"
          >
            <div className="flex gap-2">
              {prev && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/honor/grades/$level" params={{ level: String(prev.level) }}>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    {prev.name_ar}
                  </Link>
                </Button>
              )}
              {next && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/honor/grades/$level" params={{ level: String(next.level) }}>
                    {next.name_ar}
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              )}
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/honor">
                العودة إلى لوحة الشرف
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </nav>
        </Container>
      </Section>
    </>
  );
}
