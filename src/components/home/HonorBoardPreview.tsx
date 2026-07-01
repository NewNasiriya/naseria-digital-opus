import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, ArrowLeft, Star, Trophy, GraduationCap } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { fetchPublishedHonorBoards } from "@/lib/honor";

const PLACEHOLDERS = [
  { icon: Trophy, label: "التفوق الدراسي" },
  { icon: Star, label: "المسابقات العلمية" },
  { icon: Award, label: "الأنشطة والمبادرات" },
];

export function HonorBoardPreview() {
  const { data } = useQuery({
    queryKey: ["home", "honor-boards"],
    queryFn: () => fetchPublishedHonorBoards(),
    staleTime: 5 * 60 * 1000,
  });

  const boards = (data ?? []).slice(0, 3);
  const hasBoards = boards.length > 0;

  return (
    <Section id="honor" tone="default" spacing="default">
      <Container size="wide">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              لوحة الشرف
            </p>
            <h2 className="mt-3 rule-accent inline-block">
              نحتفي بطلابنا المتميزين
            </h2>
            <p className="mt-6 text-base leading-loose text-muted-foreground">
              مساحة رسمية للاحتفاء بإنجازات طلاب المدرسة على المستويين الأكاديمي
              وغير الأكاديمي، تقديرًا لجهودهم وتحفيزًا لزملائهم.
            </p>
            <div className="mt-8">
              <Button asChild variant="outline" size="lg">
                <Link to="/honor">
                  عرض لوحة الشرف
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {hasBoards
              ? boards.map((b) => (
                  <Link
                    key={b.id}
                    to="/honor/grades/$level"
                    params={{ level: String(b.grade_level) }}
                    className="group flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:elevation-md"
                  >
                    <span
                      aria-hidden="true"
                      className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary"
                    >
                      <GraduationCap className="h-6 w-6" />
                    </span>
                    <p className="text-sm font-medium text-foreground">
                      {b.grade_name_ar}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.academic_year}
                    </p>
                  </Link>
                ))
              : PLACEHOLDERS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <div
                      key={p.label}
                      className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center elevation-sm"
                    >
                      <span
                        aria-hidden="true"
                        className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary"
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                      <p className="text-sm font-medium text-foreground">
                        {p.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        بانتظار النشر
                      </p>
                    </div>
                  );
                })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
