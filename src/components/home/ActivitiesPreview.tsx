import { Link } from "@tanstack/react-router";
import {
  Trophy,
  BookMarked,
  Palette,
  Bus,
  Medal,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";

interface ActivityCard {
  title: string;
  description: string;
  icon: LucideIcon;
}

const ACTIVITIES: ActivityCard[] = [
  {
    title: "الأنشطة الرياضية",
    description: "تنمية اللياقة وروح الفريق من خلال بطولات وتدريبات منتظمة.",
    icon: Trophy,
  },
  {
    title: "الأنشطة الثقافية",
    description: "برامج تُثري ثقافة الطالب وتنمي مهارات القراءة والنقاش.",
    icon: BookMarked,
  },
  {
    title: "الأنشطة الفنية",
    description: "ورش الرسم والحرف اليدوية لاكتشاف المواهب وصقلها.",
    icon: Palette,
  },
  {
    title: "الرحلات المدرسية",
    description: "رحلات تعليمية وترفيهية مُنظّمة تعزز التعلّم خارج الفصل.",
    icon: Bus,
  },
  {
    title: "المسابقات",
    description: "مسابقات علمية وأدبية داخلية وخارجية تشجّع على التميز.",
    icon: Medal,
  },
];

export function ActivitiesPreview() {
  return (
    <Section tone="muted" spacing="default">
      <Container size="wide">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              أنشطة المدرسة
            </p>
            <h2 className="mt-3 rule-accent inline-block">
              حياة مدرسية غنية ومتوازنة
            </h2>
          </div>
          <Link
            to="/activities"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
          >
            كل الأنشطة
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIVITIES.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.title}
                to="/activities"
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:elevation-md"
              >
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {a.title}
                </h3>
                <p className="mt-2 text-sm leading-loose text-muted-foreground">
                  {a.description}
                </p>
              </Link>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
