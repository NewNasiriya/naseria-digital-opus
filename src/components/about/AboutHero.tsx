import { ArrowLeft, Phone } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import entranceAsset from "@/assets/school-entrance.jpg.asset.json";

interface AboutHeroProps {
  eyebrow?: string;
  heading?: string;
  message?: string | null;
}

const DEFAULT_HEADING = "مرحبًا بكم في مدرستنا";
const DEFAULT_MESSAGE =
  "من عند بوابة المدرسة تبدأ رحلة تعليمية متكاملة نصنعها معًا. نحرص على أن يجد كل طالب بيئة آمنة، ومعلمًا مُلهمًا، وفرصًا حقيقية للنمو الأكاديمي والإنساني.";

export function AboutHero({
  eyebrow = "عن المدرسة",
  heading = DEFAULT_HEADING,
  message = DEFAULT_MESSAGE,
}: AboutHeroProps) {
  return (
    <Section tone="default" spacing="default" className="pt-10 sm:pt-16">
      <Container size="wide">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-4 rule-accent inline-block text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
              {heading}
            </h1>
            <p className="mt-8 max-w-xl text-base leading-loose text-muted-foreground sm:text-lg">
              {message?.trim() || DEFAULT_MESSAGE}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <a href="#contact">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  تواصل مع الإدارة
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#principal">
                  كلمة مدير المدرسة
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <figure className="relative">
              <span
                aria-hidden="true"
                className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-primary-soft via-transparent to-transparent blur-xl"
              />
              <div className="relative overflow-hidden rounded-3xl border border-border bg-surface-muted elevation-md">
                <img
                  src={entranceAsset.url}
                  alt="بوابة مدرسة الناصرية الابتدائية الجديدة"
                  className="aspect-[4/3] h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-4 -start-4 hidden h-24 w-24 rounded-2xl border border-border bg-card elevation-sm sm:block"
              />
            </figure>
          </div>
        </div>
      </Container>
    </Section>
  );
}
