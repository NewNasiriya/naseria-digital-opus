import { Compass, Target } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";

interface MissionVisionProps {
  mission?: string | null;
  vision?: string | null;
}

const DEFAULT_MISSION =
  "ستنشر رسالة المدرسة الرسمية هنا من خلال لوحة الإدارة، وتُعبّر عن الالتزام بجودة التعليم وتنمية شخصية الطالب.";
const DEFAULT_VISION =
  "ستُنشر رؤية المدرسة هنا من خلال لوحة الإدارة، وتعكس تطلعاتنا نحو بيئة تعليمية متميزة.";

export function MissionVision({
  mission,
  vision,
}: MissionVisionProps) {
  const items = [
    {
      key: "mission",
      label: "رسالتنا",
      icon: Target,
      text: mission?.trim() || DEFAULT_MISSION,
      isPlaceholder: !mission?.trim(),
    },
    {
      key: "vision",
      label: "رؤيتنا",
      icon: Compass,
      text: vision?.trim() || DEFAULT_VISION,
      isPlaceholder: !vision?.trim(),
    },
  ];

  return (
    <Section tone="muted" spacing="default">
      <Container size="wide">
        <div className="grid gap-6 lg:grid-cols-2">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <article
                key={it.key}
                className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 elevation-sm sm:p-10"
              >
                <span
                  aria-hidden="true"
                  className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary"
                >
                  <Icon className="h-7 w-7" />
                </span>
                <h3 className="mt-6 text-2xl font-bold text-foreground">
                  {it.label}
                </h3>
                <p
                  className={
                    it.isPlaceholder
                      ? "mt-4 text-base italic leading-loose text-muted-foreground/80"
                      : "mt-4 text-base leading-loose text-muted-foreground"
                  }
                >
                  {it.text}
                </p>
                <span
                  aria-hidden="true"
                  className="absolute -bottom-16 -end-16 h-40 w-40 rounded-full bg-primary-soft/50 blur-3xl"
                />
              </article>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
