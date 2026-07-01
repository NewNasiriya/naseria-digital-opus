import { createFileRoute } from "@tanstack/react-router";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";

export const Route = createFileRoute("/")({
  component: Index,
});

/**
 * Phase 1 placeholder — design system only.
 * The public homepage is built in a later phase per the project plan.
 */
function Index() {
  return (
    <main>
      <Section spacing="default" tone="default">
        <Container size="narrow" className="text-center">
          <p className="text-sm font-medium tracking-wide text-muted-foreground">
            المرحلة الأولى — نظام التصميم
          </p>
          <h1 className="mt-4 rule-accent inline-block">
            مدرسة الناصرية الابتدائية الجديدة
          </h1>
          <p className="mt-6 text-lg leading-loose text-muted-foreground">
            تم إعداد الأساس البصري للمشروع. سيتم بناء صفحات الموقع الرسمية في
            المراحل القادمة وفق دليل نظام التصميم.
          </p>
        </Container>
      </Section>
    </main>
  );
}
