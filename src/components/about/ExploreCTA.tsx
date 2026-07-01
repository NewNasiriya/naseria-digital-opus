import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Newspaper,
  Sparkles,
  Trophy,
  Award,
  Phone,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";

interface Explore {
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
}

const ITEMS: Explore[] = [
  {
    title: "الحياة الأكاديمية",
    description: "الجداول، الامتحانات، والتقويم الأكاديمي.",
    to: "/academic",
    icon: BookOpen,
  },
  {
    title: "الإنجازات",
    description: "مشاريع التطوير والبنية التحتية للمدرسة.",
    to: "/achievements",
    icon: Trophy,
  },
  {
    title: "أخبار المدرسة",
    description: "آخر المستجدات والفعاليات الرسمية.",
    to: "/news",
    icon: Newspaper,
  },
  {
    title: "الأنشطة",
    description: "الرياضة والفنون والثقافة والرحلات.",
    to: "/activities",
    icon: Sparkles,
  },
  {
    title: "لوحة الشرف",
    description: "طلاب متميزون نفتخر بهم.",
    to: "/honor",
    icon: Award,
  },
  {
    title: "تواصل معنا",
    description: "قنوات التواصل الرسمية مع الإدارة.",
    to: "/contact",
    icon: Phone,
  },
];

export function ExploreCTA() {
  return (
    <Section tone="muted" spacing="default">
      <Container size="wide">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            اكتشف المزيد
          </p>
          <h2 className="mt-3 rule-accent inline-block">تابع رحلتك في موقعنا</h2>
          <p className="mt-5 text-base leading-loose text-muted-foreground">
            انتقل إلى الأقسام الأخرى للتعرف على تفاصيل الحياة المدرسية بشكل كامل.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((it) => {
            const Icon = it.icon;
            return (
              <Link
                key={it.title}
                to={it.to}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:elevation-md"
              >
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {it.title}
                </h3>
                <p className="mt-2 text-sm leading-loose text-muted-foreground">
                  {it.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  الانتقال
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
