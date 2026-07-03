import { createFileRoute } from "@tanstack/react-router";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { PageHero } from "@/components/academic/PageHero";
import { LocationMap } from "@/components/contact/LocationMap";
import {
  DirectionsCard,
  EmailCard,
  FuturePhoneCard,
  LocationCard,
  PhoneCard,
  WorkingHoursCard,
} from "@/components/contact/ContactCards";
import { Skeleton } from "@/components/ui/skeleton";
import { useContactInfo, useWorkingHours } from "@/lib/contact";

export const Route = createFileRoute("/contact")({
  head: () => buildSeo({
    path: "/contact",
    title: "تواصل معنا | مدرسة الناصرية الابتدائية الجديدة",
    description:
      "قنوات التواصل الرسمية مع إدارة مدرسة الناصرية الابتدائية الجديدة — العنوان، مواعيد العمل، البريد الإلكتروني، والموقع على الخريطة.",
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data: info, isLoading: infoLoading } = useContactInfo();
  const { data: hours = [], isLoading: hoursLoading } = useWorkingHours();

  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHero
          eyebrow="التواصل"
          title="تواصل مع إدارة المدرسة"
          description="نرحّب باستفساراتكم وملاحظاتكم خلال ساعات العمل الرسمية. فريق الإدارة حريص على التواصل المستمر مع أولياء الأمور والطلاب."
          crumbs={[{ label: "تواصل معنا" }]}
        />

        <Section spacing="default">
          <Container size="wide">
            {infoLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-56 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <LocationCard info={info ?? null} />
                <EmailCard info={info ?? null} />
                {hoursLoading ? (
                  <Skeleton className="h-56 rounded-2xl" />
                ) : (
                  <WorkingHoursCard hours={hours} info={info ?? null} />
                )}
                <DirectionsCard info={info ?? null} />
                <PhoneCard info={info ?? null} />
                <FuturePhoneCard />
              </div>
            )}
          </Container>
        </Section>

        <Section tone="muted" spacing="default">
          <Container size="wide">
            <div className="grid items-stretch gap-8 lg:grid-cols-[1.1fr_1fr]">
              <LocationMap embedUrl={info?.google_maps_embed_url ?? null} />
              <div className="flex flex-col justify-center">
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
                  موقع المدرسة
                </p>
                <h2 className="mt-3 rule-accent inline-block">كيف تصل إلينا</h2>
                <p className="mt-6 text-base leading-loose text-muted-foreground">
                  {info?.address_ar ||
                    "سيتم إضافة عنوان المدرسة بالتفصيل من لوحة إدارة المحتوى."}
                </p>
                {info?.directions_ar && (
                  <p className="mt-3 text-sm leading-loose text-muted-foreground">
                    {info.directions_ar}
                  </p>
                )}
                {info?.plus_code && (
                  <p className="mt-4 inline-flex items-center gap-2 rounded-md bg-surface-muted px-2.5 py-1 font-mono text-xs text-foreground">
                    Plus Code: {info.plus_code}
                  </p>
                )}
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
