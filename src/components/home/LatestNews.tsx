import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Newspaper } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface NewsRow {
  id: string;
  title_ar: string;
  slug: string;
  summary_ar: string | null;
  published_at: string | null;
  is_pinned: boolean;
  is_featured: boolean;
  category: { name_ar: string | null; slug: string | null } | null;
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function SectionHeader() {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          آخر المستجدات
        </p>
        <h2 className="mt-3 rule-accent inline-block">أخبار المدرسة</h2>
        <p className="mt-3 max-w-xl text-sm leading-loose text-muted-foreground">
          نشرة رسمية بأحدث بيانات وقرارات إدارة المدرسة.
        </p>
      </div>
      <Button asChild variant="ghost" className="text-primary">
        <Link to="/news">
          كل الأخبار
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}

function EditionMeta() {
  const today = new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-y border-border/70 py-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
      <span className="font-semibold text-foreground/80">النشرة الرسمية</span>
      <span className="hidden sm:block">إدارة مدرسة الناصرية الابتدائية الجديدة</span>
      <span dir="rtl">{today}</span>
    </div>
  );
}

function CategoryTag({ label }: { label: string | null | undefined }) {
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
      <span aria-hidden="true" className="inline-block h-1 w-1 rounded-full bg-primary" />
      {label}
    </span>
  );
}

function DateLine({ iso }: { iso: string | null }) {
  if (!iso) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
      <time dateTime={iso}>{formatDate(iso)}</time>
    </p>
  );
}

function LeadStory({ item }: { item: NewsRow }) {
  return (
    <article className="group relative flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-8 elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:elevation-md sm:p-10">
      <span
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-1.5 rounded-r-2xl bg-primary"
      />
      <div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-primary-foreground">
            الخبر الرئيسي
          </span>
          <CategoryTag label={item.category?.name_ar} />
        </div>
        <h3 className="mt-6 font-display text-2xl font-bold leading-snug text-foreground sm:text-3xl">
          <Link
            to="/news/$slug"
            params={{ slug: item.slug }}
            className="transition-colors hover:text-primary"
          >
            {item.title_ar}
          </Link>
        </h3>
        {item.summary_ar && (
          <p className="mt-4 line-clamp-4 text-[15px] leading-loose text-muted-foreground">
            {item.summary_ar}
          </p>
        )}
      </div>
      <div className="mt-8 flex items-center justify-between border-t border-border/70 pt-4">
        <DateLine iso={item.published_at} />
        <Link
          to="/news/$slug"
          params={{ slug: item.slug }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          قراءة الخبر
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function BriefItem({ item, index }: { item: NewsRow; index: number }) {
  return (
    <article className="group relative flex gap-5 border-b border-border/70 pb-6 last:border-b-0 last:pb-0">
      <span
        aria-hidden="true"
        className="mt-1 select-none font-display text-2xl font-bold tabular-nums text-primary/40"
      >
        {String(index).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <CategoryTag label={item.category?.name_ar} />
          <DateLine iso={item.published_at} />
        </div>
        <h3 className="mt-2 text-base font-semibold leading-snug text-foreground">
          <Link
            to="/news/$slug"
            params={{ slug: item.slug }}
            className="transition-colors hover:text-primary"
          >
            {item.title_ar}
          </Link>
        </h3>
        {item.summary_ar && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {item.summary_ar}
          </p>
        )}
      </div>
    </article>
  );
}

function SkeletonRow() {
  return (
    <div className="flex gap-5 border-b border-border/70 pb-6 last:border-b-0">
      <div className="h-6 w-6 animate-pulse rounded bg-surface-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-surface-muted" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-surface-muted" />
      </div>
    </div>
  );
}

function LoadingLayout() {
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="h-72 animate-pulse rounded-2xl border border-border bg-surface-muted" />
      </div>
      <div className="space-y-6 lg:col-span-2">
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
      <div
        aria-hidden="true"
        className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary"
      >
        <Newspaper className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">
        سيتم نشر أخبار المدرسة قريبًا
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-loose text-muted-foreground">
        تابعونا لمعرفة أحدث الفعاليات والمستجدات الرسمية للمدرسة.
      </p>
    </div>
  );
}

async function fetchLatestNews(): Promise<NewsRow[]> {
  const { data, error } = await supabase
    .from("news")
    .select(
      "id,title_ar,slug,summary_ar,published_at,is_pinned,is_featured,category:news_categories!news_category_id_fkey(name_ar,slug)"
    )
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return (data ?? []) as unknown as NewsRow[];
}

export function LatestNews() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["home", "latest-news"],
    queryFn: fetchLatestNews,
    staleTime: 60_000,
  });

  const items = data ?? [];
  const lead = items[0];
  const briefs = items.slice(1, 5);

  return (
    <Section id="news" tone="default" spacing="default">
      <Container size="wide">
        <SectionHeader />
        <EditionMeta />
        {isLoading ? (
          <LoadingLayout />
        ) : isError || !lead ? (
          <EmptyState />
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <LeadStory item={lead} />
            </div>
            {briefs.length > 0 && (
              <div className="lg:col-span-2">
                <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  موجز الأخبار
                </p>
                <div className="space-y-6">
                  {briefs.map((item, i) => (
                    <BriefItem key={item.id} item={item} index={i + 1} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Container>
    </Section>
  );
}
