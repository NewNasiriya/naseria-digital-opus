import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { PageHero } from "@/components/academic/PageHero";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا | مدرسة الناصرية الابتدائية الجديدة" },
      {
        name: "description",
        content:
          "قنوات التواصل الرسمية مع إدارة مدرسة الناصرية الابتدائية الجديدة — العنوان، مواعيد العمل، وأوقات استقبال أولياء الأمور.",
      },
      {
        property: "og:title",
        content: "تواصل معنا | مدرسة الناصرية الابتدائية الجديدة",
      },
      {
        property: "og:description",
        content: "قنوات التواصل الرسمية مع إدارة المدرسة.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

const WORKING_HOURS = [
  { day: "الأحد – الخميس", hours: "7:30 ص – 2:30 م" },
  { day: "الجمعة", hours: "مغلق" },
  { day: "السبت", hours: "مغلق" },
];

function ContactPage() {
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <article className="rounded-2xl border border-border bg-card p-6 elevation-sm">
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"
                >
                  <MapPin className="h-6 w-6" />
                </span>
                <h2 className="mt-5 text-lg font-semibold text-foreground">
                  عنوان المدرسة
                </h2>
                <p className="mt-3 text-sm leading-loose text-muted-foreground">
                  مدرسة الناصرية الابتدائية الجديدة — إدارة تعليمية حكومية،
                  جمهورية مصر العربية.
                </p>
              </article>

              <article className="rounded-2xl border border-border bg-card p-6 elevation-sm">
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"
                >
                  <Clock className="h-6 w-6" />
                </span>
                <h2 className="mt-5 text-lg font-semibold text-foreground">
                  مواعيد العمل
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {WORKING_HOURS.map((w) => (
                    <li
                      key={w.day}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <span className="text-muted-foreground">{w.day}</span>
                      <span className="font-medium text-foreground">
                        {w.hours}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl border border-border bg-card p-6 elevation-sm">
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"
                >
                  <Phone className="h-6 w-6" />
                </span>
                <h2 className="mt-5 text-lg font-semibold text-foreground">
                  قنوات التواصل الرسمية
                </h2>
                <p className="mt-3 text-sm leading-loose text-muted-foreground">
                  ستنشر الإدارة هنا أرقام الهاتف والبريد الإلكتروني الرسمية
                  للمدرسة فور اعتمادها من خلال لوحة التحكم.
                </p>
                <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  قيد الإعداد
                </p>
              </article>
            </div>

            <div className="mt-12 rounded-2xl border border-dashed border-border bg-surface-muted p-8 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                ملاحظات أولياء الأمور
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-loose text-muted-foreground">
                نرحّب باقتراحات أولياء الأمور وملاحظاتهم. يمكنكم الحضور شخصيًا
                خلال ساعات العمل، وسيتم إتاحة نموذج تواصل رقمي هنا فور اعتماده
                من الإدارة.
              </p>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
