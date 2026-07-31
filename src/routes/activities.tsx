import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  BookMarked,
  Bus,
  CalendarDays,
  Medal,
  Palette,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { PageHero } from "@/components/academic/PageHero";
import { Button } from "@/components/ui/button";
import {
  activityExcerpt,
  fetchActivities,
  formatActivityDate,
  type ActivityListItem,
} from "@/lib/activities";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/activities")({
  head: () =>
    buildSeo({
      path: "/activities",
      title: "أنشطة المدرسة | مدرسة الناصرية الابتدائية الجديدة",
      description:
        "الأنشطة والفعاليات الطلابية المنشورة رسميًا من إدارة مدرسة الناصرية الابتدائية الجديدة.",
    }),
  component: ActivitiesPage,
});

const ICONS: Record<string, LucideIcon> = {
  sports: Trophy,
  sport: Trophy,
  cultural: BookMarked,
  culture: BookMarked,
  arts: Palette,
  art: Palette,
  trips: Bus,
  trip: Bus,
  competitions: Medal,
  competition: Medal,
};

function iconFor(item: ActivityListItem): LucideIcon {
  const key = item.category?.key?.toLowerCase() ?? "";
  const iconKey = item.category?.icon_key?.toLowerCase() ?? "";
  return ICONS[key] ?? ICONS[iconKey] ?? Sparkles;
}

function ActivityCard({ item }: { item: ActivityListItem }) {
  const Icon = iconFor(item);
  const excerpt = activityExcerpt(item);
  const date = formatActivityDate(item.event_date ?? item.published_at);
  const secondaryImages = item.gallery
    .filter((photo) => photo.url !== item.cover_url)
    .slice(0, 3);

  return (
    <article className="activity-luxury-card flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card elevation-sm">
      {item.cover_url ? (
        <div className="aspect-[16/10] overflow-hidden bg-surface-muted">
          <img
            src={item.cover_url}
            alt={item.title_ar}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : (
        <div className="grid aspect-[16/8] place-items-center bg-primary-soft text-primary">
          <Icon className="h-10 w-10" aria-hidden="true" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {item.category?.name_ar && (
            <span className="rounded-full bg-primary-soft px-2.5 py-1 font-medium text-primary">
              {item.category.name_ar}
            </span>
          )}
          {date && (
            <time
              dateTime={item.event_date ?? item.published_at ?? undefined}
              className="inline-flex items-center gap-1.5"
            >
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {date}
            </time>
          )}
        </div>

        <h2 className="mt-4 text-xl font-semibold leading-relaxed text-foreground">
          {item.title_ar}
        </h2>
        {excerpt && (
          <p className="mt-3 text-sm leading-loose text-muted-foreground">
            {excerpt}
          </p>
        )}

        {secondaryImages.length > 0 && (
          <ul
            aria-label={`صور إضافية: ${item.title_ar}`}
            className="mt-5 grid grid-cols-3 gap-2"
          >
            {secondaryImages.map((photo) => (
              <li
                key={photo.id}
                className="aspect-square overflow-hidden rounded-lg bg-surface-muted"
              >
                <img
                  src={photo.url}
                  alt={photo.caption_ar ?? item.title_ar}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="جارٍ تحميل الأنشطة">
      {[0, 1, 2].map((key) => (
        <div
          key={key}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="aspect-[16/10] animate-pulse bg-surface-muted" />
          <div className="space-y-3 p-6">
            <div className="h-4 w-24 animate-pulse rounded bg-surface-muted" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-surface-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyActivities() {
  return (
    <div className="activities-notice rounded-2xl border border-dashed border-border bg-surface-muted p-8 text-center">
      <div
        aria-hidden="true"
        className="activities-notice-icon mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary"
      >
        <Sparkles className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-foreground">
        توثيق الأنشطة قيد الإعداد
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-loose text-muted-foreground">
        لم تنشر الإدارة أنشطة موثقة في هذا القسم بعد. ستظهر الأنشطة هنا تلقائيًا
        فور اعتمادها ونشرها من لوحة التحكم.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="outline">
          <Link to="/news">
            آخر أخبار المدرسة
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/achievements">
            إنجازات المدرسة
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ActivitiesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["activities", "public-list"],
    queryFn: () => fetchActivities(),
    staleTime: 60_000,
  });

  return (
    <>
      <SiteHeader />
      <main id="main" className="public-luxury-inner activities-luxury-page">
        <PageHero
          eyebrow="الأنشطة الطلابية"
          title="حياة مدرسية غنية ومتوازنة"
          description="الأنشطة والفعاليات التي اعتمدتها ونشرتها إدارة المدرسة، مرتبة حسب التميز والتاريخ."
          crumbs={[{ label: "الأنشطة" }]}
        />

        <Section spacing="default" className="activities-index-section">
          <Container size="wide">
            {isLoading ? (
              <LoadingGrid />
            ) : isError ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
                <AlertCircle
                  className="mx-auto h-9 w-9 text-destructive"
                  aria-hidden="true"
                />
                <h2 className="mt-4 text-lg font-semibold text-foreground">
                  تعذر تحميل الأنشطة
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  لم يتم تغيير أو إخفاء أي محتوى. يرجى المحاولة مرة أخرى لاحقًا.
                </p>
              </div>
            ) : data && data.length > 0 ? (
              <div className="activities-grid grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {data.map((item) => (
                  <ActivityCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <EmptyActivities />
            )}
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
