import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Facebook,
  Link2,
  Newspaper,
  Pin,
  Share2,
  Star,
  Twitter,
} from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { PageHero } from "@/components/academic/PageHero";
import { NewsCard } from "@/components/news/NewsCard";
import {
  coverImageUrl,
  fetchAdjacentNews,
  fetchNewsBySlug,
  fetchRelatedNews,
  formatArabicDate,
  type NewsDetail,
} from "@/lib/news";
import { mediaPublicUrl } from "@/lib/media";
import { trackContentView } from "@/lib/analytics";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SITE_URL, SITE_NAME_AR } from "@/lib/seo";
import {
  buildArticleSchema,
  buildBreadcrumbListSchema,
  schemaScript,
} from "@/lib/schemas";

export const Route = createFileRoute("/news/$slug")({
  loader: async ({ params }) => {
    const item = await fetchNewsBySlug(params.slug);
    if (!item) throw notFound();
    return { item };
  },
  head: ({ loaderData }) => {
    const item = loaderData?.item as NewsDetail | undefined;
    if (!item) return {};
    const title =
      item.seo_title ?? `${item.title_ar} | مدرسة الناصرية الابتدائية الجديدة`;
    const desc = item.seo_description ?? item.summary_ar ?? undefined;
    const image = coverImageUrl(item);
    const canonical = `${SITE_URL}/news/${item.slug}`;
    const absImage = image
      ? (/^https?:\/\//i.test(image) ? image : `${SITE_URL}${image}`)
      : undefined;

    const article = buildArticleSchema({
      headline_ar: item.title_ar,
      headline_en: item.title_en ?? undefined,
      description: desc ?? SITE_NAME_AR,
      image_url: absImage,
      date_published: item.published_at ?? new Date().toISOString(),
      date_modified: item.published_at ?? undefined,
      publisher_name: SITE_NAME_AR,
      url: canonical,
      language: "ar",
    });

    const breadcrumbs = buildBreadcrumbListSchema({
      items: [
        { label: "الرئيسية", url: `${SITE_URL}/` },
        { label: "الأخبار", url: `${SITE_URL}/news` },
        { label: item.title_ar, url: canonical },
      ],
    });

    return {
      meta: [
        { title },
        ...(desc ? [{ name: "description", content: desc }] : []),
        { property: "og:title", content: item.title_ar },
        ...(desc ? [{ property: "og:description", content: desc }] : []),
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        ...(absImage ? [{ property: "og:image", content: absImage }] : []),
        ...(absImage ? [{ name: "twitter:image", content: absImage }] : []),
        { name: "twitter:card", content: absImage ? "summary_large_image" : "summary" },
        ...(item.published_at
          ? [{ property: "article:published_time", content: item.published_at }]
          : []),
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [schemaScript(article), schemaScript(breadcrumbs)],
    };
  },
  errorComponent: () => (
    <>
      <PageHero title="تعذر تحميل الخبر" description="حدث خطأ أثناء تحميل الخبر، حاول لاحقًا." />
      <Section>
        <Container size="wide">
          <Button asChild variant="outline">
            <Link to="/news">
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              العودة إلى الأخبار
            </Link>
          </Button>
        </Container>
      </Section>
    </>
  ),
  notFoundComponent: () => (
    <>
      <PageHero
        title="الخبر غير متوفر"
        description="ربما تم إزالة هذا الخبر أو أن الرابط غير صحيح."
        crumbs={[{ label: "الأخبار", to: "/news" }, { label: "غير موجود" }]}
      />
      <Section>
        <Container size="wide">
          <Button asChild>
            <Link to="/news">
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              العودة إلى الأخبار
            </Link>
          </Button>
        </Container>
      </Section>
    </>
  ),
  component: NewsDetailPage,
});

function NewsDetailPage() {
  const { item } = Route.useLoaderData() as { item: NewsDetail };
  const cover = coverImageUrl(item);

  const relatedQ = useQuery({
    queryKey: ["news", "related", item.category?.id ?? null, item.id],
    queryFn: () => fetchRelatedNews(item.category?.id ?? null, item.id, 3),
    staleTime: 60_000,
  });

  const adjQ = useQuery({
    queryKey: ["news", "adjacent", item.published_at],
    queryFn: () => fetchAdjacentNews(item.published_at),
    staleTime: 60_000,
  });

  useEffect(() => {
    trackContentView("news", item.id, item.slug);
  }, [item.id, item.slug]);

  const paragraphs = (item.body_ar ?? "").split(/\n{2,}/).filter(Boolean);

  return (
    <>
      <PageHero
        eyebrow={item.category?.name_ar ?? "خبر"}
        title={item.title_ar}
        description={item.summary_ar ?? undefined}
        crumbs={[
          { label: "الأخبار", to: "/news" },
          { label: item.title_ar },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {item.published_at && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {formatArabicDate(item.published_at)}
              </span>
            )}
            {item.reading_minutes && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {item.reading_minutes} د قراءة
              </span>
            )}
            {item.is_pinned && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                مثبت
              </span>
            )}
            {item.is_featured && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-primary">
                <Star className="h-3.5 w-3.5" aria-hidden="true" />
                خبر مميز
              </span>
            )}
          </div>
        }
      />

      <Section spacing="default">
        <Container size="wide">
          <div className="mx-auto max-w-4xl">
            {cover && (
              <figure className="mb-10 overflow-hidden rounded-2xl border border-border bg-surface-muted elevation-sm">
                <img
                  src={cover}
                  alt={item.featured_media?.alt_ar ?? item.title_ar}
                  loading="eager"
                  decoding="async"
                  className="aspect-[16/9] w-full object-cover"
                />
              </figure>
            )}

            {paragraphs.length > 0 ? (
              <article className="prose-news space-y-6 text-base leading-loose text-foreground">
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-[17px] leading-[2] text-foreground/90">
                    {p}
                  </p>
                ))}
              </article>
            ) : (
              <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-muted-foreground">
                سيتم إضافة تفاصيل هذا الخبر قريبًا.
              </p>
            )}

            {item.gallery.length > 0 && (
              <section aria-labelledby="gallery-title" className="mt-12">
                <h2
                  id="gallery-title"
                  className="mb-5 text-lg font-semibold text-foreground"
                >
                  معرض الصور
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {item.gallery.map((g) => {
                    const url = mediaPublicUrl(g.media);
                    if (!url) return null;
                    return (
                      <figure
                        key={g.id}
                        className="overflow-hidden rounded-xl border border-border bg-surface-muted"
                      >
                        <img
                          src={url}
                          alt={g.media.alt_ar ?? g.caption_ar ?? item.title_ar}
                          loading="lazy"
                          decoding="async"
                          className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                        />
                        {g.caption_ar && (
                          <figcaption className="p-3 text-xs text-muted-foreground">
                            {g.caption_ar}
                          </figcaption>
                        )}
                      </figure>
                    );
                  })}
                </div>
              </section>
            )}

            <ShareBar title={item.title_ar} />

            <PrevNextNav
              prev={adjQ.data?.prev ?? null}
              next={adjQ.data?.next ?? null}
            />
          </div>
        </Container>
      </Section>

      {(relatedQ.data?.length ?? 0) > 0 && (
        <Section tone="muted" spacing="default">
          <Container size="wide">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
                  اقرأ أيضًا
                </p>
                <h2 className="mt-2 rule-accent text-2xl">أخبار ذات صلة</h2>
              </div>
              <Button asChild variant="ghost" className="text-primary">
                <Link to="/news">
                  كل الأخبار
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedQ.data!.map((n) => (
                <NewsCard key={n.id} item={n} />
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}

function ShareBar({ title }: { title: string }) {
  return (
    <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Share2 className="h-4 w-4 text-primary" aria-hidden="true" />
        شارك هذا الخبر
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="نسخ الرابط"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          onClick={() => {
            if (typeof window !== "undefined") {
              void navigator.clipboard?.writeText(window.location.href);
            }
          }}
        >
          <Link2 className="h-4 w-4" aria-hidden="true" />
        </button>
        <span
          role="button"
          aria-label={`مشاركة "${title}" على فيسبوك (قريبًا)`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground opacity-60"
        >
          <Facebook className="h-4 w-4" aria-hidden="true" />
        </span>
        <span
          role="button"
          aria-label={`مشاركة "${title}" على تويتر (قريبًا)`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground opacity-60"
        >
          <Twitter className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function PrevNextNav({
  prev,
  next,
}: {
  prev: { slug: string; title_ar: string } | null;
  next: { slug: string; title_ar: string } | null;
}) {
  return (
    <nav
      aria-label="التنقل بين الأخبار"
      className="mt-8 grid gap-3 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          to="/news/$slug"
          params={{ slug: prev.slug }}
          className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
        >
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            الخبر السابق
          </span>
          <span className="mt-2 line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
            {prev.title_ar}
          </span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      {next ? (
        <Link
          to="/news/$slug"
          params={{ slug: next.slug }}
          className="group flex flex-col rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 sm:text-right"
        >
          <span className="inline-flex items-center justify-end gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            الخبر التالي
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="mt-2 line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
            {next.title_ar}
          </span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      <div className="sm:col-span-2 flex justify-center pt-2">
        <Button asChild variant="ghost" className="text-primary">
          <Link to="/news">
            <Newspaper className="h-4 w-4" aria-hidden="true" />
            العودة إلى كل الأخبار
          </Link>
        </Button>
      </div>
    </nav>
  );
}
