import {
  ShieldCheck,
  Users2,
  Sparkles,
  BookMarked,
  HeartHandshake,
  LineChart,
  type LucideIcon,
} from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";

export interface Advantage {
  title: string;
  description: string;
  icon?: keyof typeof ICONS;
}

const ICONS = {
  safety: ShieldCheck,
  teachers: Users2,
  activities: Sparkles,
  academic: BookMarked,
  care: HeartHandshake,
  growth: LineChart,
} satisfies Record<string, LucideIcon>;

const DEFAULTS: Advantage[] = [
  {
    title: "بيئة تعليمية آمنة",
    description: "مرافق مؤمَّنة وإشراف تربوي يضمن راحة أولياء الأمور واطمئنانهم.",
    icon: "safety",
  },
  {
    title: "كادر تعليمي مؤهّل",
    description: "معلمون ومعلمات ذوو خبرة في التربية والتعليم الابتدائي.",
    icon: "teachers",
  },
  {
    title: "أنشطة متنوعة",
    description: "برامج رياضية وفنية وثقافية تُنمّي مواهب كل طالب.",
    icon: "activities",
  },
  {
    title: "مناهج معتمدة",
    description: "التزام كامل بمناهج وزارة التربية والتعليم مع دعم إضافي.",
    icon: "academic",
  },
  {
    title: "متابعة فردية",
    description: "اهتمام بكل طالب أكاديميًا وسلوكيًا وتواصل مستمر مع الأسرة.",
    icon: "care",
  },
  {
    title: "تطوير مستمر",
    description: "خطط تحسين سنوية تعتمد على قياس النتائج وتغذية راجعة حقيقية.",
    icon: "growth",
  },
];

export function WhyChooseUs({ items = DEFAULTS }: { items?: Advantage[] }) {
  return (
    <Section tone="muted" spacing="default">
      <Container size="wide">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            لماذا مدرستنا؟
          </p>
          <h2 className="mt-3 rule-accent inline-block">
            أسباب تجعلنا الاختيار الأفضل
          </h2>
          <p className="mt-5 text-base leading-loose text-muted-foreground">
            ما يميّزنا هو تكامل التعليم مع التربية، والاهتمام بكل تفصيلة تدعم نجاح الطالب.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const Icon = ICONS[it.icon ?? "growth"] ?? LineChart;
            return (
              <article
                key={it.title}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:elevation-md"
              >
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
                  {it.title}
                </h3>
                <p className="mt-2 text-sm leading-loose text-muted-foreground">
                  {it.description}
                </p>
              </article>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
