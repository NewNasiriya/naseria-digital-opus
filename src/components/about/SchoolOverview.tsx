import {
  Building2,
  Globe,
  Landmark,
  BookOpen,
  GraduationCap,
  Clock,
  type LucideIcon,
} from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";

export interface SchoolOverviewData {
  name_ar?: string | null;
  name_en?: string | null;
  administration?: string | null;
  type?: string | null;
  stage?: string | null;
  working_hours?: string | null;
}

interface Field {
  label: string;
  value: string | null | undefined;
  icon: LucideIcon;
}

const PLACEHOLDER = "سيتم تحديثه من لوحة الإدارة";

export function SchoolOverview({ data = {} }: { data?: SchoolOverviewData }) {
  const fields: Field[] = [
    { label: "اسم المدرسة", value: data.name_ar, icon: Building2 },
    { label: "الاسم بالإنجليزية", value: data.name_en, icon: Globe },
    { label: "الإدارة التعليمية", value: data.administration, icon: Landmark },
    { label: "نوع المدرسة", value: data.type, icon: BookOpen },
    { label: "المرحلة التعليمية", value: data.stage, icon: GraduationCap },
    { label: "ساعات العمل الرسمية", value: data.working_hours, icon: Clock },
  ];

  return (
    <Section tone="muted" spacing="default">
      <Container size="wide">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            بطاقة تعريف
          </p>
          <h2 className="mt-3 rule-accent inline-block">نظرة عامة على المدرسة</h2>
          <p className="mt-5 text-base leading-loose text-muted-foreground">
            المعلومات الرسمية للمدرسة كما هي مسجّلة لدى الإدارة التعليمية.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => {
            const Icon = f.icon;
            const empty = !f.value?.trim();
            return (
              <div
                key={f.label}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 elevation-sm"
              >
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {f.label}
                  </p>
                  <p
                    className={
                      empty
                        ? "mt-1.5 text-sm italic text-muted-foreground/70"
                        : "mt-1.5 text-base font-semibold text-foreground"
                    }
                  >
                    {empty ? PLACEHOLDER : f.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
