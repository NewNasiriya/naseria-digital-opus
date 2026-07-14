import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Facebook,
  HeartHandshake,
  Link2,
  Pin,
  Printer,
  Quote,
  Share2,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Twitter,
} from "lucide-react";

import { PageHero } from "@/components/academic/PageHero";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { trackContentView } from "@/lib/analytics";
import { AchievementGallery } from "@/components/achievements/AchievementGallery";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import {
  fetchAchievementBySlug,
  fetchAchievementsList,
  fetchAdjacentAchievements,
  formatAchievementDate,
  type AchievementDetail,
  type AchievementStoryHighlight,
} from "@/lib/achievements";

import { SITE_URL, SITE_NAME_AR, SITE_DEFAULT_OG_IMAGE } from "@/lib/seo";

const achievementQueryOptions = (slug: string) => ({
  queryKey: ["achievement", slug] as const,
  queryFn: () => fetchAchievementBySlug(slug),
  staleTime: 60_000,
});

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export const Route = createFileRoute("/achievements/$slug")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(achievementQueryOptions(params.slug)),
  head: ({ params, loaderData }) => {
    const url = `${SITE_URL}/achievements/${params.slug}`;
    const item = loaderData;
    const rawTitle = item?.seo_title ?? item?.title_ar;
    const title = rawTitle
      ? truncate(`${rawTitle} | ${SITE_NAME_AR}`, 60)
      : `إنجاز | ${SITE_NAME_AR}`;
    const description = truncate(
      item?.seo_description ??
        item?.description_ar ??
        `أحد إنجازات ${SITE_NAME_AR} الرسمية.`,
      160,
    );
    const image = item?.cover_url
      ? (item.cover_url.startsWith("http") ? item.cover_url : `${SITE_URL}${item.cover_url}`)
      : SITE_DEFAULT_OG_IMAGE;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { property: "og:image:alt", content: item?.title_ar ?? title },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
        ...(item?.published_at
          ? [{ property: "article:published_time", content: item.published_at }]
          : []),
        ...(item?.category?.name_ar
          ? [{ property: "article:section", content: item.category.name_ar }]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: () => (
    <div className="grid min-h-[60vh] place-items-center">
      <p className="text-muted-foreground">الإنجاز المطلوب غير موجود.</p>
    </div>
  ),
  errorComponent: () => (
    <div className="grid min-h-[60vh] place-items-center">
      <p className="text-muted-foreground">تعذّر تحميل الإنجاز، حاول لاحقًا.</p>
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
    trackContentView("achievements", data.id, data.slug);
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
  const isKindergartenStory = data.story?.layout === "kindergarten-welcome";

  return (
    <>
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


      <PageHero
        eyebrow={data.category?.name_ar ?? "الإنجازات"}
        title={data.title_ar}
        description={(data.description_ar ?? "").split(/\n\s*\n/)[0]?.slice(0, 220) ?? undefined}
        crumbs={[
          { label: "الإنجازات", to: "/achievements" },
          { label: data.title_ar },
        ]}
      />

      {isKindergartenStory ? (
        <KindergartenAchievementBody data={data} />
      ) : (
        <DefaultAchievementBody data={data} />
      )}

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
                    <span className="max-w-[9rem] truncate sm:max-w-[16rem]">{adjacent.prev.title_ar}</span>
                  </Link>
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">لا يوجد إنجاز سابق</span>
              )}
              {adjacent?.next ? (
                <Button asChild variant="outline" size="sm">
                  <Link to="/achievements/$slug" params={{ slug: adjacent.next.slug }}>
                    <span className="max-w-[9rem] truncate sm:max-w-[16rem]">{adjacent.next.title_ar}</span>
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

function DefaultAchievementBody({ data }: { data: AchievementDetail }) {
  const cover = data.cover_url;
  const highlights = [
    { label: "التصنيف", value: data.category?.name_ar ?? "—" },
    { label: "العام الدراسي", value: data.academic_year ?? "—" },
    {
      label: "تاريخ التنفيذ",
      value: data.achieved_on ? formatAchievementDate(data.achieved_on) : "—",
    },
    { label: "الحالة", value: "منشور رسميًا" },
  ];

  const paragraphs = splitParagraphs(data.description_ar);

  return (
    <>
      {cover && <HeroCover data={data} />}

      <Section spacing="default">
        <Container size="wide">
          <div className="grid gap-10 lg:grid-cols-3">
            <article className="lg:col-span-2">
              <div className="prose prose-neutral max-w-none prose-headings:text-foreground prose-p:leading-loose prose-p:text-foreground/90">
                <h2 className="text-2xl font-semibold text-foreground">عن الإنجاز</h2>
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

              <div className="mt-10 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-surface-muted p-6 sm:grid-cols-4">
                {highlights.map((h) => (
                  <div key={h.label}>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {h.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{h.value}</p>
                  </div>
                ))}
              </div>
            </article>

            <aside className="space-y-6">
              <LegacySupervisionCard />
              <ShareBar title={data.title_ar} />
            </aside>
          </div>
        </Container>
      </Section>

      {data.gallery.length > 0 && (
        <Section spacing="default" tone="muted">
          <Container size="wide">
            <GallerySectionHeader count={data.gallery.length} />
            <AchievementGallery items={data.gallery} title={data.title_ar} />
          </Container>
        </Section>
      )}
    </>
  );
}

function KindergartenAchievementBody({ data }: { data: AchievementDetail }) {
  const story = data.story;
  const welcomeParagraphs = splitParagraphs(story?.welcome_body_ar ?? data.description_ar);
  const messageParagraphs = splitParagraphs(story?.official_message_ar);
  const closingParagraphs = splitParagraphs(story?.closing_body_ar);
  const narrativeFacts = [
    { label: "التصنيف", value: data.category?.name_ar ?? "—" },
    { label: "العام الدراسي", value: data.academic_year ?? "—" },
    {
      label: "تاريخ النشر",
      value: data.published_at ? formatAchievementDate(data.published_at) : "—",
    },
  ];

  return (
    <>
      {data.cover_url && <HeroCover data={data} />}

      <Section spacing="default">
        <Container size="wide">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 elevation-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                حكاية الاستعداد
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">
                {story?.welcome_title_ar ?? "بداية مهيأة بمحبة وعناية"}
              </h2>
              <div className="mt-5 space-y-4">
                {welcomeParagraphs.map((paragraph, index) => (
                  <p key={index} className="text-base leading-loose text-foreground/90">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-border bg-surface-muted p-6 elevation-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                  ملامح الإنجاز
                </p>
                <dl className="mt-4 space-y-4">
                  {narrativeFacts.map((item) => (
                    <div key={item.label} className="border-b border-border/70 pb-4 last:border-b-0 last:pb-0">
                      <dt className="text-xs text-muted-foreground">{item.label}</dt>
                      <dd className="mt-1 text-sm font-semibold text-foreground">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <ShareBar title={data.title_ar} />
            </aside>
          </div>
        </Container>
      </Section>

      {data.gallery.length > 0 && (
        <Section spacing="default" tone="muted">
          <Container size="wide">
            <GallerySectionHeader count={data.gallery.length} />
            <AchievementGallery items={data.gallery} title={data.title_ar} />
          </Container>
        </Section>
      )}

      {story?.highlights?.length ? (
        <Section spacing="default">
          <Container size="wide">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                ملامح الجاهزية
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
                أبرز ما ركزت عليه التجهيزات
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {story.highlights.map((item, index) => (
                <HighlightCard key={`${item.title_ar}-${index}`} item={item} index={index} />
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {(messageParagraphs.length > 0 || story?.supervision_name_ar) && (
        <Section spacing="default">
          <Container size="wide">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 elevation-sm">
                <div className="flex items-center gap-2 text-primary">
                  <Quote className="h-5 w-5" aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-[0.15em]">
                    {story?.official_message_title_ar ?? "الرسالة الرسمية"}
                  </p>
                </div>
                <div className="mt-5 space-y-4">
                  {messageParagraphs.map((paragraph, index) => (
                    <p key={index} className="text-base leading-loose text-foreground/90">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              <aside className="rounded-2xl border border-border bg-surface-muted p-6 elevation-sm">
                <h3 className="text-sm font-semibold text-foreground">{story?.supervision_label_ar ?? "تحت الإشراف"}</h3>
                <p className="mt-3 text-lg font-semibold text-foreground">
                  {story?.supervision_name_ar ?? "—"}
                </p>
                <div className="mt-6 rounded-xl border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">الحالة</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">منشور رسميًا وقابل للإدارة من خلال لوحة التحكم</p>
                </div>
              </aside>
            </div>
          </Container>
        </Section>
      )}

      {closingParagraphs.length > 0 && (
        <Section spacing="default">
          <Container size="wide">
            <div className="rounded-2xl border border-border bg-surface-muted p-6 sm:p-8 elevation-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                ختام دافئ
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">
                {story?.closing_title_ar ?? "في انتظار أطفالنا بكل حب"}
              </h2>
              <div className="mt-5 space-y-4">
                {closingParagraphs.map((paragraph, index) => (
                  <p key={index} className="text-base leading-loose text-foreground/90">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}

function HeroCover({ data }: { data: AchievementDetail }) {
  if (!data.cover_url) return null;

  return (
    <Section spacing="sm">
      <Container size="wide">
        <figure className="relative overflow-hidden rounded-3xl border border-border bg-surface-muted elevation-md">
          <img
            src={data.cover_url}
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
  );
}

function GallerySectionHeader({ count }: { count: number }) {
  return (
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
      <p className="hidden text-xs text-muted-foreground sm:block">{count} صورة</p>
    </div>
  );
}

function LegacySupervisionCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 elevation-sm">
      <h3 className="text-sm font-semibold text-foreground">الإشراف على المشروع</h3>
      <ul className="mt-4 space-y-4 text-sm">
        <li className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-muted-foreground">مديرة المدرسة</p>
            <p className="font-medium text-foreground">الأستاذة / شيرين البيلي</p>
          </div>
        </li>
        <li className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-muted-foreground">وكيلة المدرسة</p>
            <p className="font-medium text-foreground">الأستاذة / حنان الزيات</p>
          </div>
        </li>
      </ul>
    </div>
  );
}

function HighlightCard({
  item,
  index,
}: {
  item: AchievementStoryHighlight;
  index: number;
}) {
  const icons = [HeartHandshake, BookOpen, SunMedium, ShieldCheck, Sparkles];
  const Icon = icons[index % icons.length];

  return (
    <article className="rounded-2xl border border-border bg-card p-5 elevation-sm">
      <div className="inline-flex rounded-full bg-primary-soft p-2 text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{item.title_ar}</h3>
      <p className="mt-3 text-sm leading-loose text-muted-foreground">{item.body_ar}</p>
    </article>
  );
}

function splitParagraphs(value: string | null | undefined) {
  return (value ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}




function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";

  const share = async () => {
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (data: { title: string; url: string }) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (data: { title: string; url: string }) => Promise<void> }).share({ title, url });
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
      <p className="mt-1 text-xs text-muted-foreground">شارك هذا الإنجاز أو احفظه للرجوع إليه.</p>
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
