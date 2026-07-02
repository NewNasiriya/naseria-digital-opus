/**
 * Global search command palette.
 *
 * Opens from the header or via ⌘/Ctrl+K and `/`. Debounces the query,
 * runs it through the unified `runSearch` engine, groups results and
 * supports full keyboard navigation.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  FileQuestion,
  FolderOpen,
  Globe,
  GraduationCap,
  ImageIcon,
  Loader2,
  Newspaper,
  Search,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  GROUP_LABELS,
  POPULAR_SEARCHES,
  clearRecentSearches,
  getRecentSearches,
  groupHits,
  pushRecentSearch,
  runSearch,
  type SearchGroup,
  type SearchHit,
} from "@/lib/search";

const GROUP_ICON: Record<SearchGroup, typeof Search> = {
  pages: Globe,
  news: Newspaper,
  achievements: Trophy,
  gallery: ImageIcon,
  activities: Sparkles,
  honor: GraduationCap,
  academic: Calendar,
  media: FolderOpen,
  faq: FileQuestion,
};

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setRecent(getRecentSearches());
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setTerm("");
      setDebounced("");
    }
  }, [open]);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term.trim()), 220);
    return () => clearTimeout(id);
  }, [term]);

  const { data: hits = [], isFetching } = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => runSearch(debounced),
    enabled: debounced.length >= 2,
    staleTime: 15_000,
  });

  const grouped = useMemo(() => groupHits(hits), [hits]);
  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  useEffect(() => {
    setActiveIndex(0);
  }, [debounced]);

  const go = useCallback(
    (hit: SearchHit) => {
      pushRecentSearch(debounced || hit.title);
      onOpenChange(false);
      navigate({ to: hit.to as any, params: hit.params as any });
    },
    [debounced, navigate, onOpenChange],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(flat.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const target = flat[activeIndex];
      if (target) {
        e.preventDefault();
        go(target);
      } else if (debounced.length >= 2) {
        e.preventDefault();
        onOpenChange(false);
        navigate({ to: "/search", search: { q: debounced } as any });
      }
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  // Scroll active into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="البحث في الموقع"
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/70 p-4 backdrop-blur-sm sm:p-10"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div
        className="mt-4 w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card elevation-lg sm:mt-16"
        dir="rtl"
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="ابحث في الأخبار، الإنجازات، المعرض، والصفحات…"
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            aria-label="ابحث في الموقع"
            aria-controls="search-results"
            aria-activedescendant={flat[activeIndex] ? `hit-${flat[activeIndex].id}` : undefined}
          />
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={listRef}
          id="search-results"
          role="listbox"
          className="max-h-[60vh] overflow-y-auto p-2"
        >
          {debounced.length < 2 ? (
            <div className="space-y-4 p-3">
              {recent.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <p className="text-xs font-semibold text-muted-foreground">
                      عمليات بحث سابقة
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        clearRecentSearches();
                        setRecent([]);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      مسح
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTerm(r)}
                        className="rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground hover:border-primary hover:text-primary"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-2 px-1 text-xs font-semibold text-muted-foreground">
                  اقتراحات شائعة
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTerm(r)}
                      className="rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-primary hover:brightness-95"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <p className="px-1 pt-2 text-xs text-muted-foreground">
                نصيحة: استخدم أسهم لوحة المفاتيح للتنقل و <kbd className="rounded border border-border px-1">Enter</kbd> للفتح.
              </p>
            </div>
          ) : hits.length === 0 && !isFetching ? (
            <EmptyResults term={debounced} onPick={setTerm} />
          ) : (
            <ResultsList
              grouped={grouped}
              flat={flat}
              activeIndex={activeIndex}
              onHover={setActiveIndex}
              onSelect={go}
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border bg-surface-muted/60 px-4 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />
              <ArrowLeft className="h-3 w-3" />
              تنقّل
            </span>
            <span>
              <kbd className="rounded border border-border px-1">Enter</kbd> فتح
            </span>
            <span>
              <kbd className="rounded border border-border px-1">Esc</kbd> إغلاق
            </span>
          </div>
          {debounced.length >= 2 && (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                navigate({ to: "/search", search: { q: debounced } as any });
              }}
              className="font-medium text-primary hover:underline"
            >
              عرض كل نتائج «{debounced}»
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultsList({
  grouped,
  flat,
  activeIndex,
  onHover,
  onSelect,
}: {
  grouped: Array<{ group: SearchGroup; items: SearchHit[] }>;
  flat: SearchHit[];
  activeIndex: number;
  onHover: (i: number) => void;
  onSelect: (h: SearchHit) => void;
}) {
  let cursor = 0;
  return (
    <div className="space-y-4">
      {grouped.map(({ group, items }) => {
        const Icon = GROUP_ICON[group];
        return (
          <div key={group}>
            <div className="flex items-center gap-2 px-2 pb-1.5 pt-1">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <p className="text-xs font-semibold text-muted-foreground">
                {GROUP_LABELS[group]}
              </p>
              <span className="text-xs text-muted-foreground">({items.length})</span>
            </div>
            <ul>
              {items.map((h) => {
                const idx = cursor;
                cursor += 1;
                const active = idx === activeIndex;
                return (
                  <li key={h.id}>
                    <button
                      id={`hit-${h.id}`}
                      role="option"
                      aria-selected={active}
                      data-idx={idx}
                      type="button"
                      onMouseEnter={() => onHover(idx)}
                      onClick={() => onSelect(h)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-right transition-colors",
                        active
                          ? "bg-primary-soft text-foreground"
                          : "hover:bg-accent",
                      )}
                    >
                      <div className="mt-0.5 h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                        {h.image ? (
                          <img
                            src={h.image}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-muted-foreground/60">
                            <Search className="h-4 w-4" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {h.title}
                          {h.pinned && (
                            <span className="ms-2 rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                              مثبّت
                            </span>
                          )}
                          {h.featured && !h.pinned && (
                            <span className="ms-2 rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-primary">
                              مميّز
                            </span>
                          )}
                        </p>
                        {h.excerpt && (
                          <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                            {h.excerpt}
                          </p>
                        )}
                        <p className="mt-1 truncate text-[11px] text-muted-foreground/80">
                          {h.breadcrumb}
                          {h.updatedAt && ` · ${new Date(h.updatedAt).toLocaleDateString("ar-EG")}`}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      {flat.length === 0 && null}
    </div>
  );
}

function EmptyResults({ term, onPick }: { term: string; onPick: (t: string) => void }) {
  return (
    <div className="px-4 py-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
        <Search className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">
        لم نجد نتائج لـ «{term}»
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        جرّب بحثًا مختلفًا أو استعرض الاقتراحات الشائعة أدناه.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {POPULAR_SEARCHES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onPick(r)}
            className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary hover:brightness-95"
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
