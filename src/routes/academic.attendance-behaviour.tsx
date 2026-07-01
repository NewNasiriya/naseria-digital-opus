import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, Download, ShieldCheck } from "lucide-react";

import { PageHero } from "@/components/academic/PageHero";
import { EmptyPanel } from "@/components/academic/EmptyPanel";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/academic/attendance-behaviour")({
  head: () => ({
    meta: [
      { title: "الحضور والسلوك | مدرسة الناصرية الابتدائية الجديدة" },
      {
        name: "description",
        content:
          "سياسات الحضور والانضباط داخل المدرسة، ولوائح السلوك الطلابي المعتمدة من الإدارة.",
      },
      { property: "og:title", content: "الحضور والسلوك" },
    ],
    links: [{ rel: "canonical", href: "/academic/attendance-behaviour" }],
  }),
  component: AttendanceBehaviourPage,
});

interface AttendanceRow {
  content_ar: string | null;
  updated_at: string;
}

interface GuidelineRow {
  id: string;
  title_ar: string;
  body_ar: string | null;
  icon_key: string | null;
  display_order: number;
}

async function fetchAttendance(): Promise<AttendanceRow | null> {
  const { data, error } = await supabase
    .from("attendance_info")
    .select("content_ar,updated_at")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as AttendanceRow | null;
}

async function fetchGuidelines(): Promise<GuidelineRow[]> {
  const { data, error } = await supabase
    .from("behaviour_guidelines")
    .select("id,title_ar,body_ar,icon_key,display_order")
    .eq("status", "published")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as GuidelineRow[];
}

function AttendanceBehaviourPage() {
  const attendance = useQuery({
    queryKey: ["academic", "attendance-info"],
    queryFn: fetchAttendance,
    staleTime: 60_000,
  });
  const guidelines = useQuery({
    queryKey: ["academic", "behaviour-guidelines"],
    queryFn: fetchGuidelines,
    staleTime: 60_000,
  });

  const attContent = attendance.data?.content_ar?.trim();
  const gItems = guidelines.data ?? [];

  return (
    <>
      <PageHero
        title="الحضور والسلوك"
        description="لائحة الحضور والانضباط المعتمدة داخل المدرسة، وتوجيهات السلوك الإيجابي التي تعزّز البيئة التعليمية الآمنة."
        crumbs={[
          { label: "الحياة الأكاديمية", to: "/academic" },
          { label: "الحضور والسلوك" },
        ]}
      />

      <Section spacing="default">
        <Container size="wide">
          {/* Attendance */}
          <section aria-labelledby="attendance" className="scroll-mt-24">
            <div className="mb-6 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"
              >
                <CalendarCheck className="h-5 w-5" />
              </span>
              <h2 id="attendance" className="text-xl font-semibold text-foreground">
                سياسة الحضور
              </h2>
            </div>
            {attendance.isLoading ? (
              <div className="h-32 animate-pulse rounded-2xl bg-surface-muted" />
            ) : !attContent ? (
              <EmptyPanel
                title="لم تُنشر سياسة الحضور بعد"
                description="ستقوم إدارة المدرسة بنشر لائحة الحضور الرسمية قريبًا."
                icon={CalendarCheck}
              />
            ) : (
              <article className="rounded-2xl border border-border bg-card p-6 elevation-sm">
                <p className="whitespace-pre-line text-sm leading-loose text-foreground">
                  {attContent}
                </p>
              </article>
            )}
          </section>

          {/* Behaviour */}
          <section aria-labelledby="behaviour" className="mt-16 scroll-mt-24">
            <div className="mb-6 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"
              >
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h2 id="behaviour" className="text-xl font-semibold text-foreground">
                لائحة السلوك
              </h2>
            </div>
            {guidelines.isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[0, 1].map((i) => (
                  <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-muted" />
                ))}
              </div>
            ) : gItems.length === 0 ? (
              <EmptyPanel
                title="لم تُنشر لائحة السلوك بعد"
                description="ستُضاف بنود لائحة السلوك الرسمية من قِبل الإدارة قريبًا."
                icon={ShieldCheck}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {gItems.map((g) => (
                  <article
                    key={g.id}
                    className="rounded-2xl border border-border bg-card p-6 elevation-sm"
                  >
                    <h3 className="text-base font-semibold text-foreground">{g.title_ar}</h3>
                    {g.body_ar && (
                      <p className="mt-2 whitespace-pre-line text-sm leading-loose text-muted-foreground">
                        {g.body_ar}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Downloads placeholder */}
          <section aria-labelledby="attb-downloads" className="mt-16 scroll-mt-24">
            <div className="mb-6 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"
              >
                <Download className="h-5 w-5" />
              </span>
              <h2 id="attb-downloads" className="text-xl font-semibold text-foreground">
                المستندات الرسمية
              </h2>
            </div>
            <EmptyPanel
              title="لا توجد مستندات للتنزيل حاليًا"
              description="ستوفّر إدارة المدرسة النسخ الرسمية للائحتَي الحضور والسلوك للتنزيل من هذا القسم."
              icon={Download}
            />
          </section>
        </Container>
      </Section>
    </>
  );
}
