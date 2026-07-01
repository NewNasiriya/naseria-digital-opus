import { Link } from "@tanstack/react-router";
import { ArrowLeft, GraduationCap } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { GRADES } from "@/lib/academic";

interface GradeSelectorProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  tone?: "default" | "muted";
}

export function GradeSelector({
  eyebrow = "الصفوف الدراسية",
  title = "اختر الصف الدراسي",
  description = "لكل صف صفحة مخصّصة تحتوي على الجدول الدراسي، جداول الامتحانات، الملاحظات الأكاديمية، والمرفقات القابلة للتنزيل.",
  tone = "default",
}: GradeSelectorProps) {
  return (
    <Section id="grades" tone={tone} spacing="default">
      <Container size="wide">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            {eyebrow}
          </p>
          <h2 className="mt-3 rule-accent inline-block">{title}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-loose text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GRADES.map((g) => (
            <Link
              key={g.level}
              to="/academic/grades/$level"
              params={{ level: String(g.level) }}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:elevation-md"
            >
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 bg-gradient-to-bl ${g.accent} opacity-0 transition-opacity group-hover:opacity-100`}
              />
              <div className="relative flex items-center justify-between">
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  <GraduationCap className="h-6 w-6" />
                </span>
                <span
                  aria-hidden="true"
                  className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-muted-foreground"
                >
                  المستوى {g.level}
                </span>
              </div>
              <h3 className="relative mt-6 text-lg font-semibold text-foreground">
                {g.name_ar}
              </h3>
              <p className="relative mt-1 text-xs font-medium tracking-wide text-muted-foreground">
                {g.name_en}
              </p>
              <span className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                استعراض الصف
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
