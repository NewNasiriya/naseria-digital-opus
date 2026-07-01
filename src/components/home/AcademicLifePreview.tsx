import {
  BookOpen,
  ClipboardList,
  CalendarRange,
  GraduationCap,
  Users,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";

interface AcademicCard {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const CARDS: AcademicCard[] = [
  {
    title: "الجدول الدراسي",
    description: "الجدول الأسبوعي لكل مرحلة وفصل دراسي.",
    href: "#academic-timetable",
    icon: BookOpen,
  },
  {
    title: "جداول الامتحانات",
    description: "مواعيد الاختبارات الشهرية والفصلية.",
    href: "#exam-timetable",
    icon: ClipboardList,
  },
  {
    title: "التقويم الأكاديمي",
    description: "الفعاليات والإجازات الرسمية خلال العام.",
    href: "#academic-calendar",
    icon: CalendarRange,
  },
  {
    title: "إرشادات الطلاب",
    description: "قواعد وتوجيهات تُعين الطالب على التميز.",
    href: "#student-instructions",
    icon: GraduationCap,
  },
  {
    title: "إرشادات أولياء الأمور",
    description: "دليل ولي الأمر للتواصل مع المدرسة ومتابعة أبنائه.",
    href: "#parent-instructions",
    icon: Users,
  },
];

export function AcademicLifePreview() {
  return (
    <Section id="academic" tone="muted" spacing="default">
      <Container size="wide">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            الحياة الأكاديمية
          </p>
          <h2 className="mt-3 rule-accent inline-block">
            كل ما يحتاجه الطالب وولي الأمر
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-loose text-muted-foreground">
            مصادر منظّمة ومتكاملة لتسهيل الوصول إلى الجداول، الامتحانات،
            والإرشادات الرسمية.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <a
                key={c.title}
                href={c.href}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:elevation-md"
              >
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm leading-loose text-muted-foreground">
                  {c.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  الاطلاع
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </span>
              </a>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
