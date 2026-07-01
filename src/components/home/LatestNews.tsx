import { useQuery } from "@tanstack/react-query";
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
  featured_image_media_id: string | null;
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
      </div>
      <Button asChild variant="ghost" className="text-primary">
        <a href="#news-all">
          كل الأخبار
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </a>
      </Button>
    </div>
  );
}

function NewsCard({ item }: { item: NewsRow }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:elevation-md">
      <div className="aspect-[16/10] w-full overflow-hidden bg-surface-muted">
        {/* Media integration wires in via CMS media pipeline (Phase 4). */}
        <div
          aria-hidden="true"
          className="grid h-full w-full place-items-center text-muted-foreground/40"
        >
          <Newspaper className="h-10 w-10" />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        {item.published_at && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(item.published_at)}
          </p>
        )}
        <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-foreground">
          {item.title_ar}
        </h3>
        {item.summary_ar && (
          <p className="mt-2 line-clamp-3 text-sm leading-loose text-muted-foreground">
            {item.summary_ar}
          </p>
        )}
        <div className="mt-auto pt-5">
          <a
            href={`#news/${item.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            اقرأ المزيد
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-[16/10] w-full animate-pulse bg-surface-muted" />
      <div className="space-y-3 p-6">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-surface-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-surface-muted" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-surface-muted" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
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
        تابعونا لمعرفة أحدث الفعاليات والمستجدات. ستظهر آخر الأخبار في هذا
        المكان فور نشرها من الإدارة.
      </p>
    </div>
  );
}

async function fetchLatestNews(): Promise<NewsRow[]> {
  const { data, error } = await supabase
    .from("news")
    .select("id,title_ar,slug,summary_ar,published_at,featured_image_media_id")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(3);
  if (error) throw error;
  return (data ?? []) as NewsRow[];
}

export function LatestNews() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["home", "latest-news"],
    queryFn: fetchLatestNews,
    staleTime: 60_000,
  });

  return (
    <Section id="news" tone="default" spacing="default">
      <Container size="wide">
        <SectionHeader />
        <div className="mt-10">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : isError || !data || data.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}
