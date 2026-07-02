/**
 * Full search results page.
 *
 * Provides a persistent URL for a search query with filters by content
 * type and featured-only toggle. Uses the shared `runSearch` engine so
 * results stay consistent with the command palette.
 */
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Filter, Loader2, Search, Star, X } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { cn } from "@/lib/utils";
import {
  GROUP_LABELS,
  POPULAR_SEARCHES,
  groupHits,
  pushRecentSearch,
  runSearch,
  type SearchGroup,
} from "@/lib/search";

const GROUPS: SearchGroup[] = [
  "pages",
  "news",
  "achievements",
  "gallery",
  "activities",
  "honor",
  "academic",
  "faq",
  "media",
];

const schema = z.object({
  q: z.string().optional().default(""),
  g: z.array(z.enum(GROUPS as [SearchGroup, ...SearchGroup[]])).optional().default([]),
  featured: z.coerce.boolean().optional().default(false),
});

export const Route = createFileRoute("/search")({
  validateSearch: (raw) => schema.parse(raw ?? {}),
  head: ({ match }) => ({
    meta: [
      { title: match.search.q ? `نتائج البحث عن «${match.search.q}»` : "البحث في الموقع" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, g, featured } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [term, setTerm] = useState(q);
  const [debounced, setDebounced] = useState(q);

  useEffect(() => setTerm(q), [q]);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(id);
  }, [term]);

  useEffect(() => {
    // Sync typed term into the URL so results are shareable.
    if (debounced === q) return;
    navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        q: debounced || undefined,
      }),
      replace: true,
    });
  }, [debounced, q, navigate]);

  useEffect(() => {
    if (q.trim().length >= 2) pushRecentSearch(q.trim());
  }, [q]);

  const { data: hits = [], isFetching } = useQuery({
    queryKey: ["search-page", debounced, g, featured],
    queryFn: () =>
      runSearch(debounced, {
        groups: g.length ? (g as SearchGroup[]) : undefined,
        featuredOnly: featured,
      }),
    enabled: debounced.length >= 2,
    staleTime: 15_000,
  });

  const grouped = useMemo(() => groupHits(hits), [hits]);
  const totalCount = hits.length;

  const toggleGroup = (grp: SearchGroup) => {
    navigate({
      search: (prev: Record<string, unknown>) => {
        const current = new Set((prev.g as SearchGroup[] | undefined) ?? []);
        if (current.has(grp)) current.delete(grp);
        else current.add(grp);
        return { ...prev, g: current.size ? Array.from(current) : undefined };
      },
      replace: true,
    });
  };

  const toggleFeatured = () => {
    navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        featured: !prev.featured || undefined,
      }),
      replace: true,
    });
  };

  const clearAll = () => {
    setTerm("");
    navigate({ search: {} as any, replace: true });
  };

  return (
    <>
      <Section spacing="compact" tone="muted">
        <Container size="wide">
          <div className="mx-auto max-w-3xl">
            <label htmlFor="search-page-input" className="sr-only">
              ابحث في الموقع
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-4 my-auto h-5 w-5 text-muted-foreground"
              />
              <input
                id="search-page-input"
                type="search"
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث في الأخبار، الإنجازات، المعرض، والصفحات…"
                className="w-full rounded-full border border-border bg-card py-3.5 pr-12 pl-24 text-base text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {term && (
                <button
                  type="button"
                  onClick={clearAll}
                  aria-label="مسح البحث"
                  className="absolute inset-y-0 left-4 my-auto rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              {debounced.length >= 2
                ? `${totalCount} نتيجة لـ «${debounced}»`
                : "اكتب كلمتين على الأقل للبدء."}
            </p>
          </div>
        </Container>
      </Section>

      <Section spacing="default">
        <Container size="wide">
          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            <aside className="space-y-6">
              <div>
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" aria-hidden="true" /> نوع المحتوى
                </p>
                <ul className="space-y-1.5">
                  {GROUPS.map((grp) => {
                    const on = g.includes(grp);
                    return (
                      <li key={grp}>
                        <button
                          type="button"
                          onClick={() => toggleGroup(grp)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-md border border-transparent px-3 py-2 text-sm transition-colors",
                            on
                              ? "border-primary/40 bg-primary-soft text-primary"
                              : "text-foreground hover:bg-accent",
                          )}
                          aria-pressed={on}
                        >
                          <span>{GROUP_LABELS[grp]}</span>
                          <span className="text-xs text-muted-foreground">
                            {grouped.find((x) => x.group === grp)?.items.length ?? 0}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <button
                  type="button"
                  onClick={toggleFeatured}
                  aria-pressed={featured}
                  className={cn(
                    "inline-flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    featured
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border text-foreground hover:bg-accent",
                  )}
                >
                  <Star className="h-4 w-4" aria-hidden="true" />
                  المميّز فقط
                </button>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  اقتراحات
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTerm(s)}
                      className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary hover:brightness-95"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <div>
              {debounced.length < 2 ? (
                <EmptyPrompt />
              ) : isFetching && hits.length === 0 ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-16 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  جاري البحث…
                </div>
              ) : hits.length === 0 ? (
                <NoResults term={debounced} />
              ) : (
                <div className="space-y-10">
                  {grouped.map(({ group, items }) => (
                    <section key={group} aria-labelledby={`group-${group}`}>
                      <div className="mb-4 flex items-baseline justify-between">
                        <h2
                          id={`group-${group}`}
                          className="text-lg font-semibold text-foreground"
                        >
                          {GROUP_LABELS[group]}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                          {items.length} نتيجة
                        </span>
                      </div>
                      <ul className="grid gap-3 md:grid-cols-2">
                        {items.map((h) => (
                          <li key={h.id}>
                            <Link
                              to={h.to as any}
                              params={h.params as any}
                              className="group flex h-full gap-3 rounded-xl border border-border bg-card p-3 elevation-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:elevation-md"
                            >
                              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                                {h.image ? (
                                  <img
                                    src={h.image}
                                    alt=""
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="grid h-full w-full place-items-center text-muted-foreground/60">
                                    <Search className="h-5 w-5" aria-hidden="true" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                                  {h.title}
                                </p>
                                {h.excerpt && (
                                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                    {h.excerpt}
                                  </p>
                                )}
                                <p className="mt-2 truncate text-[11px] text-muted-foreground/80">
                                  {h.breadcrumb}
                                  {h.updatedAt && ` · ${new Date(h.updatedAt).toLocaleDateString("ar-EG")}`}
                                </p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function EmptyPrompt() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
        <Search className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="mt-3 text-base font-semibold text-foreground">
        ابدأ رحلة البحث
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        اكتب كلمة أو عبارة لاستكشاف كل المحتوى المنشور على الموقع.
      </p>
    </div>
  );
}

function NoResults({ term }: { term: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
        <Search className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="mt-3 text-base font-semibold text-foreground">
        لا توجد نتائج لـ «{term}»
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        جرّب كلمات أخرى، أو تصفّح الأخبار والإنجازات مباشرة.
      </p>
    </div>
  );
}
