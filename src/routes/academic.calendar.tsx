import { createFileRoute } from "@tanstack/react-router";
import { CalendarRange } from "lucide-react";

import { PageHero } from "@/components/academic/PageHero";
import { EmptyPanel } from "@/components/academic/EmptyPanel";
import { AcademicTimelineWidget } from "@/components/academic/AcademicTimelineWidget";
import { TimelineStrip } from "@/components/academic/TimelineStrip";
import { OfficialCalendarViewer } from "@/components/academic/OfficialCalendarViewer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { useTimelineState } from "@/lib/timeline";

export const Route = createFileRoute("/academic/calendar")({
  head: () => ({
    meta: [
      { title: "التقويم الأكاديمي | مدرسة الناصرية الابتدائية الجديدة" },
      {
        name: "description",
        content:
          "التقويم الأكاديمي الرسمي 2026 / 2027 مع خط زمني تفاعلي، عدّاد تنازلي للفعاليات، والوثيقة الرسمية للوزارة.",
      },
      { property: "og:title", content: "التقويم الأكاديمي" },
    ],
    links: [{ rel: "canonical", href: "/academic/calendar" }],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { events, isLoading, isError } = useTimelineState();

  return (
    <>
      <PageHero
        title="التقويم الأكاديمي"
        description="خط زمني تفاعلي لأهم محطات العام الدراسي، مع عدّاد تنازلي مباشر للفعالية القادمة، والوثيقة الرسمية المعتمدة من وزارة التربية والتعليم."
        crumbs={[{ label: "الحياة الأكاديمية", to: "/academic" }, { label: "التقويم الأكاديمي" }]}
      />

      {/* Live countdown widget */}
      <div className="mt-10">
        <AcademicTimelineWidget />
      </div>

      {/* Interactive timeline strip */}
      <Section spacing="default">
        <Container size="wide">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                خط الفعاليات الأكاديمية
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                جميع محطات العام الدراسي مرتبة تصاعديًا. تُبرز البطاقة الحالية الفعالية الجارية.
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 w-64 flex-none animate-pulse rounded-2xl bg-surface-muted" />
              ))}
            </div>
          ) : isError || events.length === 0 ? (
            <EmptyPanel
              title="لم يُنشر خط الفعاليات بعد"
              description="ستُضاف الفعاليات والمواعيد الرسمية عند اعتمادها من إدارة المدرسة."
              icon={CalendarRange}
            />
          ) : (
            <TimelineStrip events={events} />
          )}
        </Container>
      </Section>

      {/* Official ministry document */}
      <Section spacing="default">
        <Container size="wide">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              الوثيقة الرسمية للتقويم الأكاديمي
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              التقويم الرسمي المعتمد للعام الدراسي 2026 / 2027 كما صدر عن وزارة التربية والتعليم.
            </p>
          </div>
          <OfficialCalendarViewer />
        </Container>
      </Section>
    </>
  );
}
