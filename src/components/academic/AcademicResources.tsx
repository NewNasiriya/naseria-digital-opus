import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarRange,
  GraduationCap,
  Users,
  ShieldCheck,
  CalendarCheck,
  Shield,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";

interface ResourceCard {
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
}

const CARDS: ResourceCard[] = [
  {
    title: "التقويم الأكاديمي",
    description: "المواعيد الرسمية، الفعاليات، والإجازات خلال العام الدراسي.",
    to: "/academic/calendar",
    icon: CalendarRange,
  },
  {
    title: "إرشادات الطلاب",
    description: "قواعد وتوجيهات تُعين الطالب على الالتزام والتميز.",
    to: "/academic/student-guidelines",
    icon: GraduationCap,
  },
  {
    title: "إرشادات أولياء الأمور",
    description: "دليل ولي الأمر لمتابعة تعليم أبنائه والتواصل مع المدرسة.",
    to: "/academic/parent-guidelines",
    icon: Users,
  },
  {
    title: "الحضور المدرسي",
    description: "أهمية الحضور المنتظم ودوره في دعم التحصيل الأكاديمي.",
    to: "/academic/attendance",
    icon: CalendarCheck,
  },
  {
    title: "القيم السلوكية",
    description: "القيم التربوية التي تحرص المدرسة على غرسها في طلابها.",
    to: "/academic/behaviour",
    icon: ShieldCheck,
  },
  {
    title: "السياسات المدرسية",
    description: "الإطار الرسمي المنظِّم للعمل التربوي والتعليمي في المدرسة.",
    to: "/academic/policies",
    icon: Shield,
  },
  {
    title: "الأسئلة الشائعة",
    description: "إجابات الأسئلة الأكثر تكرارًا من الطلاب وأولياء الأمور.",
    to: "/academic/faq",
    icon: HelpCircle,
  },
];

export function AcademicResources() {
  return (
    <Section tone="muted" spacing="default">
      <Container size="wide">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            مصادر أكاديمية
          </p>
          <h2 className="mt-3 rule-accent inline-block">دليل شامل للطالب وولي الأمر</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.to}
                to={c.to}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:elevation-md"
              >
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-foreground">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm leading-loose text-muted-foreground">
                  {c.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  الاطلاع
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
