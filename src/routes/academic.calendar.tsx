import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CalendarRange } from "lucide-react";

import { PageHero } from "@/components/academic/PageHero";
import { EmptyPanel } from "@/components/academic/EmptyPanel";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/academic/calendar")({
  head: () => ({
    meta: [
      { title: "التقويم الأكاديمي | مدرسة الناصرية الابتدائية الجديدة" },
      {
        name: "description",
        content:
          "التقويم الأكاديمي الرسمي للمدرسة يعرض الفعاليات، الاختبارات، والإجازات خلال العام الدراسي.",
      },
      { property: "og:title", content: "التقويم الأكاديمي" },
    ],
    links: [{ rel: "canonical", href: "/academic/calendar" }],
  }),
  component: CalendarPage,
});

interface EventRow {
  id: string;
  title_ar: string;
  description_ar: string | null;
  starts_on: string;
  ends_on: string | null;
  category: string | null;
  color: string | null;
}

async function fetchEvents(): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("academic_calendar_events")
    .select("id,title_ar,description_ar,starts_on,ends_on,category,color")
    .eq("status", "published")
    .order("starts_on", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function EventItem({ event }: { event: EventRow }) {
  return (
    <li className="relative rounded-2xl border border-border bg-card p-6 elevation-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">{event.title_ar}</h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(event.starts_on)}
            {event.ends_on && event.ends_on !== event.starts_on && (
              <> — {formatDate(event.ends_on)}</>
            )}
          </p>
          {event.description_ar && (
            <p className="mt-3 text-sm leading-loose text-muted-foreground">
              {event.description_ar}
            </p>
          )}
        </div>
        {event.category && (
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
            {event.category}
          </span>
        )}
      </div>
    </li>
  );
}

function CalendarPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["academic", "calendar"],
    queryFn: fetchEvents,
    staleTime: 60_000,
  });

  const events = data ?? [];

  return (
    <>
      <PageHero
        title="التقويم الأكاديمي"
        description="نظرة عامة على الفعاليات، الاختبارات، والإجازات الرسمية خلال العام الدراسي كما تعتمدها إدارة المدرسة."
        crumbs={[{ label: "الحياة الأكاديمية", to: "/academic" }, { label: "التقويم الأكاديمي" }]}
      />

      <Section spacing="default">
        <Container size="wide">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-muted" />
              ))}
            </div>
          ) : isError || events.length === 0 ? (
            <EmptyPanel
              title="لم يُنشر التقويم الأكاديمي بعد"
              description="ستُضاف الفعاليات والمواعيد الرسمية عند اعتمادها من إدارة المدرسة."
              icon={CalendarRange}
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {events.map((e) => (
                <EventItem key={e.id} event={e} />
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}
