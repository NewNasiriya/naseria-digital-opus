import { Link } from "@tanstack/react-router";
import { Award, ArrowLeft, Star, Trophy } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";

const PLACEHOLDERS = [
  { icon: Trophy, label: "التفوق الدراسي" },
  { icon: Star, label: "المسابقات العلمية" },
  { icon: Award, label: "الأنشطة والمبادرات" },
];

export function HonorBoardPreview() {
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
            {PLACEHOLDERS.map((p) => {
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
