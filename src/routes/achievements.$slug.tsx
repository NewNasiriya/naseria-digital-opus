import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Facebook,
  Link2,
  Pin,
  Printer,
  Share2,
  Sparkles,
  Twitter,
} from "lucide-react";

import { PageHero } from "@/components/academic/PageHero";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { AchievementGallery } from "@/components/achievements/AchievementGallery";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import {
  fetchAchievementBySlug,
  fetchAchievementsList,
  fetchAdjacentAchievements,
  formatAchievementDate,
} from "@/lib/achievements";

export const Route = createFileRoute("/achievements/$slug")({
  head: ({ params }) => {
    const path = `/achievements/${params.slug}`;
    return {
      meta: [
        { title: "إنجاز | مدرسة الناصرية الابتدائية الجديدة" },
        { property: "og:type", content: "article" },
        { property: "og:url", content: path },
      ],
      links: [{ rel: "canonical", href: path }],
    };
  },
  notFoundComponent: () => (
    <div className="grid min-h-[60vh] place-items-center">
      <p className="text-muted-foreground">الإنجاز المطلوب غير موجود.</p>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="grid min-h-[60vh] place-items-center">
      <p className="text-muted-foreground">تعذّر تحميل الإنجاز: {error.message}</p>
    </div>
  ),
  component: AchievementDetailPage,
});

function AchievementDetailPage() {
  const { slug } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["achievement", slug],
    queryFn: () => fetchAchievementBySlug(slug),
    staleTime: 60_000,
  });

  const { data: adjacent } = useQuery({
    queryKey: ["achievement", "adjacent", data?.published_at ?? null],
    queryFn: () => fetchAdjacentAchievements(data?.published_at ?? null),
    enabled: !!data?.published_at,
    staleTime: 60_000,
  });

  const { data: related = [] } = useQuery({
    queryKey: ["achievement", "related", data?.category?.slug ?? "any", slug],
    queryFn: () =>
      fetchAchievementsList({
        categorySlug: data?.category?.slug,
        excludeSlug: slug,
        limit: 3,
      }),
    enabled: !!data,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!data) return;
    const title =
      data.seo_title ??
      `${data.title_ar} | مدرسة الناصرية الابتدائية الجديدة`;
    if (typeof document !== "undefined") document.title = title;
  }, [data]);

  if (error) throw error;

  if (isLoading || !data) {
    return (
      <>
        <PageHero
          eyebrow="الإنجازات"
          title="جارٍ تحميل الإنجاز..."
          crumbs={[{ label: "الإنجازات", to: "/achievements" }, { label: "..." }]}
        />
        <Section>
          <Container size="wide">
            <div className="aspect-[16/9] w-full animate-pulse rounded-2xl border border-border bg-surface-muted" />
          </Container>
        </Section>
      </>
    );
  }

  const cover = data.cover_url;
  const description = data.seo_description ?? (data.description_ar ?? "").slice(0, 160);

  const highlights = [
    { label: "التصنيف", value: data.category?.name_ar ?? "—" },
    { label: "العام الدراسي", value: data.academic_year ?? "—" },
    {
      label: "تاريخ التنفيذ",
      value: data.achieved_on ? formatAchievementDate(data.achieved_on) : "—",
    },
    { label: "الحالة", value: "منشور رسميًا" },
  ];

  const paragraphs = (data.description_ar ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: data.title_ar,
            description,
            inLanguage: "ar",
            datePublished: data.published_at ?? undefined,
            image: cover ? [cover] : undefined,
            publisher: {
              "@type": "EducationalOrganization",
              name: "مدرسة الناصرية الابتدائية الجديدة",
            },
            about: data.category?.name_ar,
          }),
        }}
      />
      {/* Extra dynamic meta tags */}
      <MetaTags
        title={data.seo_title ?? `${data.title_ar} | مدرسة الناصرية الابتدائية الجديدة`}
        description={description}
        image={cover}
      />

      <PageHero
        eyebrow={data.category?.name_ar ?? "الإنجازات"}
        title={data.title_ar}
        description={(data.description_ar ?? "").split(/\n\s*\n/)[0]?.slice(0, 220) ?? undefined}
        crumbs={[
          { label: "الإنجازات", to: "/achievements" },
          { label: data.title_ar },
        ]}
      />

      {/* Hero image */}
      {cover && (
        <Section spacing="sm">
          <Container size="wide">
            <figure className="relative overflow-hidden rounded-3xl border border-border bg-surface-muted elevation-md">
              <img
                src={cover}
                alt={data.title_ar}
                loading="eager"
                decoding="async"
                className="aspect-[16/9] w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  {data.is_pinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground elevation-sm">
                      <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                      مثبت
                    </span>
                  )}
                  {data.is_featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-background/95 px-3 py-1 text-xs font-semibold text-primary elevation-sm">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      إنجاز مميز
                    </span>
                  )}
                  {data.academic_year && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground elevation-sm">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      العام الدراسي {data.academic_year}
                    </span>
                  )}
                </div>
              </figcaption>
            </figure>
          </Container>
        </Section>
      )}

      {/* Content + sidebar */}
      <Section spacing="default">
        <Container size="wide">
          <div className="grid gap-10 lg:grid-cols-3">
            <article className="lg:col-span-2">
              <div className="prose prose-neutral max-w-none prose-headings:text-foreground prose-p:leading-loose prose-p:text-foreground/90">
                <h2 className="text-2xl font-semibold text-foreground">
                  عن الإنجاز
                </h2>
                {paragraphs.length > 0 ? (
                  paragraphs.map((p, i) => (
                    <p key={i} className="mt-4 text-base leading-loose text-foreground/90">
                      {p}
                    </p>
                  ))
                ) : (
                  <p className="mt-4 text-muted-foreground">
                    ستقوم إدارة المدرسة بإضافة تفاصيل الإنجاز قريبًا.
                  </p>
                )}
              </div>

              {/* Highlights */}
              <div className="mt-10 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-surface-muted p-6 sm:grid-cols-4">
                {highlights.map((h) => (
                  <div key={h.label}>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {h.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {h.value}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 elevation-sm">
                <h3 className="text-sm font-semibold text-foreground">
                  الإشراف على المشروع
                </h3>
                <ul className="mt-4 space-y-4 text-sm">
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <p className="text-xs text-muted-foreground">مديرة المدرسة</p>
                      <p className="font-medium text-foreground">
                        الأستاذة / شيرين البيلي
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <p className="text-xs text-muted-foreground">وكيلة المدرسة</p>
                      <p className="font-medium text-foreground">
                        الأستاذة / حنان الزيات
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <ShareBar title={data.title_ar} />
            </aside>
          </div>
        </Container>
      </Section>

      {/* Gallery */}
      {data.gallery.length > 0 && (
        <Section spacing="default" tone="muted">
          <Container size="wide">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                  التوثيق الرسمي
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                  معرض صور المشروع
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-loose text-muted-foreground">
                  صور رسمية توثّق مراحل التنفيذ. اضغط على أي صورة لعرضها بالحجم الكامل مع
                  إمكانية التكبير والتنقل بلوحة المفاتيح.
                </p>
              </div>
              <p className="hidden text-xs text-muted-foreground sm:block">
                {data.gallery.length} صورة
              </p>
            </div>
            <AchievementGallery items={data.gallery} title={data.title_ar} />
          </Container>
        </Section>
      )}

      {/* Adjacent navigation */}
      <Section spacing="sm">
        <Container size="wide">
          <nav
            aria-label="التنقل بين الإنجازات"
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface-muted p-6"
          >
            <div className="flex flex-wrap gap-2">
              {adjacent?.prev ? (
                <Button asChild variant="outline" size="sm">
                  <Link to="/achievements/$slug" params={{ slug: adjacent.prev.slug }}>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    <span className="max-w-[16rem] truncate">
                      {adjacent.prev.title_ar}
                    </span>
                  </Link>
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">لا يوجد إنجاز سابق</span>
              )}
              {adjacent?.next ? (
                <Button asChild variant="outline" size="sm">
                  <Link to="/achievements/$slug" params={{ slug: adjacent.next.slug }}>
                    <span className="max-w-[16rem] truncate">
                      {adjacent.next.title_ar}
                    </span>
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">لا يوجد إنجاز تالٍ</span>
              )}
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/achievements">
                العودة إلى الإنجازات
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </nav>
        </Container>
      </Section>

      {/* Related */}
      {related.length > 0 && (
        <Section spacing="default">
          <Container size="wide">
            <h2 className="mb-8 text-xl font-semibold text-foreground sm:text-2xl">
              إنجازات ذات صلة
            </h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <AchievementCard item={item} />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}

function MetaTags({
  title,
  description,
  image,
}: {
  title: string;
  description: string;
  image: string | null;
}) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const setMeta = (attr: "name" | "property", key: string, value: string) => {
      if (!value) return;
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };
    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    if (image) {
      setMeta("property", "og:image", image);
      setMeta("name", "twitter:image", image);
    }
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
  }, [title, description, image]);
  return null;
}

function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined" ? window.location.href : "";

  const share = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    copy();
  };

  const copy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const print = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 elevation-sm">
      <h3 className="text-sm font-semibold text-foreground">مشاركة و طباعة</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        شارك هذا الإنجاز أو احفظه للرجوع إليه.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={share}>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          مشاركة
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          <Link2 className="h-4 w-4" aria-hidden="true" />
          {copied ? "تم النسخ" : "نسخ الرابط"}
        </Button>
        <Button asChild variant="outline" size="sm">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="مشاركة عبر فيسبوك"
          >
            <Facebook className="h-4 w-4" aria-hidden="true" />
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a
            href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="مشاركة عبر X"
          >
            <Twitter className="h-4 w-4" aria-hidden="true" />
          </a>
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={print}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          طباعة
        </Button>
      </div>
    </div>
  );
}

