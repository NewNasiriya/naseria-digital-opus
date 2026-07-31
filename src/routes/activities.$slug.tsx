import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, ImageOff } from "lucide-react";

import { PageHero } from "@/components/academic/PageHero";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { fetchActivityBySlug, formatActivityDate } from "@/lib/activities";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/activities/$slug")({
  head: () =>
    buildSeo({
      path: "/activities",
      title: "تفاصيل النشاط | مدرسة الناصرية الابتدائية الجديدة",
      description: "تفاصيل نشاط منشور رسميًا من إدارة المدرسة.",
    }),
  component: ActivityDetailPage,
});

function ActivityBody({ body }: { body: string | null }) {
  const paragraphs = (body ?? "")
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;
  return (
    <div className="mt-8 space-y-5">
      {paragraphs.map((paragraph, index) => (
        <p
          key={`${index}:${paragraph.slice(0, 24)}`}
          className="whitespace-pre-line text-[17px] leading-[2.05] text-foreground/90"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function ActivityDetailPage() {
  const { slug } = Route.useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["activities", "detail", slug],
    queryFn: () => fetchActivityBySlug(slug),
    staleTime: 60_000,
  });

  return (
    <>
      <SiteHeader />
      <main id="main" className="public-luxury-inner activities-luxury-page">
        {isLoading ? (
          <Section spacing="default">
            <Container size="wide">
              <div className="h-80 animate-pulse rounded-3xl bg-surface-muted" />
            </Container>
          </Section>
        ) : isError || !data ? (
          <Section spacing="default">
            <Container size="narrow">
              <div className="rounded-2xl border border-border bg-card p-10 text-center">
                <h1 className="text-2xl font-semibold text-foreground">
                  النشاط غير متاح
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  قد يكون النشاط غير منشور أو تم تغيير رابطه.
                </p>
                <Link
                  to="/activities"
                  className="mt-6 inline-flex items-center gap-2 font-medium text-primary"
                >
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  العودة إلى الأنشطة
                </Link>
              </div>
            </Container>
          </Section>
        ) : (
          <>
            <PageHero
              eyebrow={data.category?.name_ar ?? "الأنشطة الطلابية"}
              title={data.title_ar}
              description={data.summary_ar ?? undefined}
              crumbs={[
                { label: "الأنشطة", to: "/activities" },
                { label: data.title_ar },
              ]}
            />

            <Section spacing="default">
              <Container size="wide">
                <article className="mx-auto max-w-4xl">
                  {data.cover_url ? (
                    <div className="overflow-hidden rounded-3xl border border-border bg-surface-muted elevation-md">
                      <img
                        src={data.cover_url}
                        alt={data.title_ar}
                        className="max-h-[70vh] w-full object-cover"
                        loading="eager"
                        decoding="async"
                      />
                    </div>
                  ) : (
                    <div className="grid aspect-[16/7] place-items-center rounded-3xl border border-border bg-surface-muted text-muted-foreground/50">
                      <ImageOff className="h-12 w-12" aria-hidden="true" />
                    </div>
                  )}

                  {(data.event_date || data.published_at) && (
                    <p className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      {formatActivityDate(data.event_date ?? data.published_at)}
                    </p>
                  )}

                  <ActivityBody body={data.body_ar} />

                  {data.gallery.length > 0 && (
                    <section aria-labelledby="activity-gallery" className="mt-12">
                      <h2
                        id="activity-gallery"
                        className="text-2xl font-semibold text-foreground"
                      >
                        صور النشاط
                      </h2>
                      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {data.gallery.map((photo) => (
                          <li
                            key={photo.id}
                            className="overflow-hidden rounded-2xl border border-border bg-surface-muted"
                          >
                            <img
                              src={photo.url}
                              alt={photo.caption_ar ?? data.title_ar}
                              className="aspect-[4/3] h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </article>
              </Container>
            </Section>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
