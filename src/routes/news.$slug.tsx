import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Newspaper,
  Pin,
  Star,
} from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { PageHero } from "@/components/academic/PageHero";
import { NewsCard } from "@/components/news/NewsCard";
import { ArticleShare } from "@/components/news/ArticleShare";
import { ReadingProgress } from "@/components/news/ReadingProgress";
import {
  coverImageUrl,
  fetchAdjacentNews,
  fetchNewsBySlug,
  fetchRelatedNews,
  formatArabicDate,
  readingMinutes,
  type NewsDetail,
} from "@/lib/news";
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
  const canonical = `${SITE_URL}/news/${item.slug}`;
  const minutes = readingMinutes(item);
  // Only surface "last updated" when it lands on a different calendar day
  // than publication, otherwise it is noise for the reader.
  const updated = meaningfulUpdatedAt(item);
  const standfirst = excerptFor(item, 240);


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
      <ReadingProgress />

      <Section spacing="default">
        <Container size="wide">
          <article className="mx-auto max-w-[46rem]">
            {/* Breadcrumbs */}
            <nav aria-label="مسار التنقل" className="text-xs text-muted-foreground">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link to="/" className="transition-colors hover:text-primary">
                    الرئيسية
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link to="/news" className="transition-colors hover:text-primary">
                    الأخبار
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="max-w-[18rem] truncate text-foreground/70" aria-current="page">
                  {item.title_ar}
                </li>
              </ol>
            </nav>

            {/* Editorial header */}
            <header className="mt-6">
              <div className="flex flex-wrap items-center gap-2">
                {item.category && (
                  <Link
                    to="/news"
                    search={{ category: item.category.slug }}
                    className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                  >
                    {item.category.name_ar}
                  </Link>
                )}
                {item.is_pinned && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    <Pin className="h-3 w-3" aria-hidden="true" />
                    مثبت
                  </span>
                )}
                {item.is_featured && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    <Star className="h-3 w-3" aria-hidden="true" />
                    مميز
                  </span>
                )}
              </div>

              <h1 className="mt-5 text-balance text-[2rem] font-semibold leading-[1.4] tracking-tight text-foreground sm:text-[2.6rem] sm:leading-[1.3]">
                {item.title_ar}
              </h1>

              {item.title_en && (
                <p className="mt-2 text-base text-muted-foreground/80" dir="ltr">
                  {item.title_en}
                </p>
              )}

              {standfirst && (
                <p className="mt-6 text-lg leading-[2] text-muted-foreground sm:text-xl">
                  {standfirst}
                </p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border py-3.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80">
                  <Newspaper className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  إدارة المدرسة
                </span>
                {item.published_at && (
                  <time
                    dateTime={item.published_at}
                    className="inline-flex items-center gap-1.5"
                  >
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatArabicDate(item.published_at)}
                  </time>
                )}
                {minutes !== null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {minutes} دقائق قراءة
                  </span>
                )}
                {updated && (
                  <span className="inline-flex items-center gap-1.5">
                    آخر تحديث: {formatArabicDate(updated)}
                  </span>
                )}
              </div>
            </header>

            <ArticleBody body={item.body_ar} />


            <ArticleShare title={item.title_ar} url={canonical} />

            <PrevNextNav
              prev={adjQ.data?.prev ?? null}
              next={adjQ.data?.next ?? null}
            />
          </article>
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
