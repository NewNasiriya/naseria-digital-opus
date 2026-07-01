import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, Newspaper, Pin } from "lucide-react";
import { z } from "zod";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { PageHero } from "@/components/academic/PageHero";
import { EmptyPanel } from "@/components/academic/EmptyPanel";
import { NewsCard } from "@/components/news/NewsCard";
import { CategoriesFilter } from "@/components/news/CategoriesFilter";
import { NewsSearch } from "@/components/news/NewsSearch";
import { NewsPagination } from "@/components/news/NewsPagination";
import {
  fetchCategories,
  fetchNewsList,
  fetchPinned,
} from "@/lib/news";

const PAGE_SIZE = 9;

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export const Route = createFileRoute("/news/")({
  validateSearch: (raw) => searchSchema.parse(raw ?? {}),
  head: () => ({
    meta: [
      { title: "الأخبار والإعلانات | مدرسة الناصرية الابتدائية الجديدة" },
      {
        name: "description",
        content:
          "أحدث أخبار وإعلانات مدرسة الناصرية الابتدائية الجديدة: الفعاليات، القرارات الإدارية، وإنجازات الطلاب.",
      },
      { property: "og:title", content: "الأخبار والإعلانات | مدرسة الناصرية الابتدائية الجديدة" },
      {
        property: "og:description",
        content: "المركز الرسمي للتواصل بين المدرسة وأولياء الأمور والطلاب.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/news" },
    ],
    links: [{ rel: "canonical", href: "/news" }],
  }),
  component: NewsIndexPage,
});

function SectionHeader({
  eyebrow,
  title,
  icon: Icon,
}: {
  eyebrow?: string;
  title: string;
  icon?: typeof Newspaper;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-2 flex items-center gap-2 rule-accent text-2xl">
          {Icon && <Icon className="h-6 w-6 text-primary" aria-hidden="true" />}
          {title}
        </h2>
      </div>
    </div>
  );
}

function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="aspect-[16/10] w-full animate-pulse bg-surface-muted" />
          <div className="space-y-3 p-6">
            <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-surface-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NewsIndexPage() {
  const { category, q, page = 1 } = Route.useSearch();

  const categoriesQ = useQuery({
    queryKey: ["news", "categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
  });

  const pinnedQ = useQuery({
    queryKey: ["news", "pinned"],
    queryFn: () => fetchPinned(3),
    staleTime: 60_000,
    enabled: !category && !q && page === 1,
  });

  const listQ = useQuery({
    queryKey: ["news", "list", { category, q, page }],
    queryFn: () =>
      fetchNewsList({
        categorySlug: category,
        q,
        page,
        pageSize: PAGE_SIZE,
      }),
    staleTime: 60_000,
  });

  const showPinned = !category && !q && page === 1 && (pinnedQ.data?.length ?? 0) > 0;
  const items = listQ.data?.items ?? [];
  const total = listQ.data?.total ?? 0;

  return (
    <>
      <PageHero
        eyebrow="مركز التواصل"
        title="الأخبار والإعلانات"
        description="تابع أحدث أخبار المدرسة، القرارات الإدارية، الإعلانات الرسمية، وإنجازات طلابنا مباشرةً من إدارة المدرسة."
        crumbs={[{ label: "الأخبار والإعلانات" }]}
      />

      {showPinned && (
        <Section tone="muted" spacing="sm">
          <Container size="wide">
            <SectionHeader eyebrow="الأهم" title="أخبار مثبّتة" icon={Pin} />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pinnedQ.data!.map((item, i) => (
                <NewsCard key={item.id} item={item} priority={i === 0} />
              ))}
            </div>
          </Container>
        </Section>
      )}

      <Section tone="default" spacing="default">
        <Container size="wide">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <SectionHeader
                title={
                  category
                    ? categoriesQ.data?.find((c) => c.slug === category)?.name_ar ?? "الأخبار"
                    : q
                      ? `نتائج البحث: ${q}`
                      : "أحدث الأخبار"
                }
                icon={Newspaper}
              />
              <NewsSearch initialValue={q ?? ""} />
            </div>

            {categoriesQ.data && categoriesQ.data.length > 0 && (
              <CategoriesFilter categories={categoriesQ.data} activeSlug={category} />
            )}
          </div>

          <div className="mt-10">
            {listQ.isLoading ? (
              <SkeletonGrid />
            ) : items.length === 0 ? (
              <EmptyPanel
                icon={Newspaper}
                title={
                  q
                    ? "لا توجد نتائج مطابقة"
                    : category
                      ? "لا يوجد محتوى في هذا التصنيف بعد"
                      : "لم يتم نشر أي أخبار بعد"
                }
                description="سيتم عرض الأخبار والإعلانات هنا فور نشرها من إدارة المدرسة."
              />
            ) : (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item, i) => (
                    <NewsCard key={item.id} item={item} priority={i < 3} />
                  ))}
                </div>
                <NewsPagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  categorySlug={category}
                  q={q}
                />
              </>
            )}
          </div>
        </Container>
      </Section>

      <AnnouncementsSection />
    </>
  );
}

function AnnouncementsSection() {
  const q = useQuery({
    queryKey: ["news", "announcements"],
    queryFn: () => fetchNewsList({ onlyAnnouncements: true, pageSize: 3, page: 1 }),
    staleTime: 60_000,
  });
  const items = q.data?.items ?? [];
  if (q.isLoading || items.length === 0) return null;

  return (
    <Section tone="muted" spacing="default">
      <Container size="wide">
        <SectionHeader
          eyebrow="إعلانات رسمية"
          title="إعلانات المدرسة"
          icon={Megaphone}
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} variant="compact" />
          ))}
        </div>
      </Container>
    </Section>
  );
}
