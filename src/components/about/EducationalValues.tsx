import {
  Heart,
  ShieldCheck,
  BadgeCheck,
  Handshake,
  Sparkles,
  BookOpenCheck,
  type LucideIcon,
} from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";

export interface EducationalValue {
  title: string;
  description?: string | null;
  icon?: keyof typeof ICONS;
}

const ICONS = {
  respect: Heart,
  responsibility: ShieldCheck,
  honesty: BadgeCheck,
  cooperation: Handshake,
  excellence: Sparkles,
  learning: BookOpenCheck,
} satisfies Record<string, LucideIcon>;

const DEFAULTS: EducationalValue[] = [
  { title: "الاحترام", description: "احترام الذات والآخرين والبيئة المدرسية.", icon: "respect" },
  { title: "المسؤولية", description: "الالتزام بالواجبات والوعي بالحقوق.", icon: "responsibility" },
  { title: "الأمانة", description: "الصدق في القول والعمل داخل الفصل وخارجه.", icon: "honesty" },
  { title: "التعاون", description: "العمل بروح الفريق وخدمة المجتمع المدرسي.", icon: "cooperation" },
  { title: "التميز", description: "السعي الدائم للأفضل أكاديميًا وسلوكيًا.", icon: "excellence" },
  { title: "حب التعلّم", description: "الفضول المعرفي والتعلّم مدى الحياة.", icon: "learning" },
];

export function EducationalValues({
  items = DEFAULTS,
}: {
  items?: EducationalValue[];
}) {
  return (
    <Section tone="default" spacing="default">
      <Container size="wide">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            هويتنا التربوية
          </p>
          <h2 className="mt-3 rule-accent inline-block">القيم التربوية</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-loose text-muted-foreground">
            قيم نُرسّخها في يوميات المدرسة لبناء شخصية متوازنة تعتز بذاتها وتنتمي لمجتمعها.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((v) => {
            const Icon = ICONS[v.icon ?? "excellence"] ?? Sparkles;
            return (
              <div
                key={v.title}
                className="group rounded-2xl border border-border bg-card p-6 elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:elevation-md"
              >
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {v.title}
                </h3>
                {v.description && (
                  <p className="mt-2 text-sm leading-loose text-muted-foreground">
                    {v.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
