import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { buildSeo } from "@/lib/seo";
import { Sparkles, Trophy } from "lucide-react";

import { PageHero } from "@/components/academic/PageHero";
import { EmptyPanel } from "@/components/academic/EmptyPanel";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { cn } from "@/lib/utils";
import {
  fetchAchievementCategories,
  fetchAchievementsList,
} from "@/lib/achievements";

export const Route = createFileRoute("/achievements/")({
  head: () => buildSeo({
    path: "/achievements",
    title: "الإنجازات | مدرسة الناصرية الابتدائية الجديدة",
    description:
      "الإنجازات الرسمية لمدرسة الناصرية الابتدائية الجديدة — مشاريع التطوير، البنية التحتية، والأنشطة التعليمية الموثقة.",
  }),
  component: AchievementsIndex,
  errorComponent: ({ error }) => (
    <div className="grid min-h-[60vh] place-items-center">
      <p className="text-muted-foreground">تعذّر تحميل الإنجازات، حاول لاحقًا.{void console.error(error)}</p>
    </div>
  ),
});

function AchievementsIndex() {
  const [categorySlug, setCategorySlug] = useState<string | undefined>(undefined);

  const { data: categories = [] } = useQuery({
    queryKey: ["achievements", "categories"],
    queryFn: fetchAchievementCategories,
    staleTime: 5 * 60_000,
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["achievements", "list", categorySlug ?? "all"],
    queryFn: () => fetchAchievementsList({ categorySlug }),
    staleTime: 60_000,
  });

  const featured = useMemo(
    () => items.find((i) => i.is_featured || i.is_pinned) ?? items[0] ?? null,
    [items],
  );
  const rest = useMemo(
    () => (featured ? items.filter((i) => i.id !== featured.id) : items),
    [items, featured],
  );

  return (
    <>
      <PageHero
        eyebrow="الإنجازات"
        title="إنجازات المدرسة"
        description="نستعرض هنا الإنجازات والمشاريع الرسمية التي تُنفذها مدرسة الناصرية الابتدائية الجديدة، توثيقًا لجهود إدارة المدرسة في تطوير البنية التحتية وتحسين البيئة التعليمية والارتقاء بالعملية التعليمية."
        crumbs={[{ label: "الإنجازات" }]}
      />

      <Section spacing="default">
        <Container size="wide">
          {categories.length > 1 && (
            <div className="mb-10 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCategorySlug(undefined)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  categorySlug === undefined
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-foreground hover:bg-accent",
                )}
              >
                جميع الإنجازات
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategorySlug(c.slug)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    categorySlug === c.slug
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-foreground hover:bg-accent",
                  )}
                >
                  {c.name_ar}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-8">
              <div className="aspect-[16/9] w-full animate-pulse rounded-2xl border border-border bg-surface-muted" />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] animate-pulse rounded-2xl border border-border bg-surface-muted"
                  />
                ))}
              </div>
            </div>
          ) : items.length === 0 ? (
            <EmptyPanel
              icon={Trophy}
              title="لم تُنشر إنجازات بعد"
              description="ستقوم إدارة المدرسة بنشر أحدث الإنجازات والمشاريع فور اعتمادها رسميًا."
            />
          ) : (
            <>
              {featured && (
                <section aria-labelledby="featured-achievement" className="mb-16">
                  <div className="mb-6 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                    <h2
                      id="featured-achievement"
                      className="text-xs font-semibold uppercase tracking-[0.15em] text-primary"
                    >
                      الإنجاز المميز
                    </h2>
                  </div>
                  <AchievementCard item={featured} variant="featured" priority />
                </section>
              )}

              {rest.length > 0 && (
                <section aria-labelledby="all-achievements">
                  <h2
                    id="all-achievements"
                    className="mb-8 text-xl font-semibold text-foreground sm:text-2xl"
                  >
                    جميع الإنجازات
                  </h2>
                  <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((item) => (
                      <li key={item.id}>
                        <AchievementCard item={item} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </Container>
      </Section>
    </>
  );
}
