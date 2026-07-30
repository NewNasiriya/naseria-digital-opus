import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck } from "lucide-react";

import { PageHero } from "@/components/academic/PageHero";
import { EmptyPanel } from "@/components/academic/EmptyPanel";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/academic/attendance")({
  head: () => ({
    meta: [
      { title: "الحضور المدرسي | مدرسة الناصرية الابتدائية الجديدة" },
      {
        name: "description",
        content:
          "فلسفة المدرسة في الحضور المنتظم ودوره في دعم التحصيل الأكاديمي والمشاركة الفاعلة داخل الفصل.",
      },
      { property: "og:title", content: "الحضور المدرسي" },
      {
        property: "og:description",
        content: "أهمية الحضور المنتظم في دعم مسيرة الطالب التعليمية.",
      },
    ],
    links: [{ rel: "canonical", href: "https://newnasiriya.com/academic/attendance" }],
  }),
  component: AttendancePage,
});

interface AttendanceRow {
  content_ar: string | null;
}

async function fetchAttendance(): Promise<AttendanceRow | null> {
  const { data, error } = await supabase
    .from("attendance_info")
    .select("content_ar")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as AttendanceRow | null;
}

function AttendancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["academic", "attendance-info"],
    queryFn: fetchAttendance,
    staleTime: 60_000,
  });
  const content = data?.content_ar?.trim();

  return (
    <>
      <PageHero
        title="الحضور المدرسي"
        description="الحضور المنتظم ركيزة أساسية لنجاح الطالب الدراسي، ويُسهم في متابعة الدروس بشكل متسلسل والمشاركة الفاعلة داخل الفصل."
        crumbs={[
          { label: "الحياة الأكاديمية", to: "/academic" },
          { label: "الحضور" },
        ]}
      />
      <Section spacing="default">
        <Container size="wide">
          {isLoading ? (
            <div className="h-40 animate-pulse rounded-2xl bg-surface-muted" />
          ) : !content ? (
            <EmptyPanel
              title="لم يُنشر بيان الحضور بعد"
              description="ستقوم إدارة المدرسة بنشر بيان الحضور الرسمي قريبًا."
              icon={CalendarCheck}
            />
          ) : (
            <article className="rounded-2xl border border-border bg-card p-8 elevation-sm">
              <p className="whitespace-pre-line text-base leading-loose text-foreground">
                {content}
              </p>
            </article>
          )}
        </Container>
      </Section>
    </>
  );
}
