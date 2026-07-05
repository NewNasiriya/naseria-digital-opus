import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, HelpCircle, Search } from "lucide-react";

import { PageHero } from "@/components/academic/PageHero";
import { EmptyPanel } from "@/components/academic/EmptyPanel";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/academic/faq")({
  head: () => ({
    meta: [
      { title: "الأسئلة الشائعة | مدرسة الناصرية الابتدائية الجديدة" },
      {
        name: "description",
        content:
          "إجابات على أكثر الأسئلة تكرارًا من الطلاب وأولياء الأمور حول المدرسة والدراسة والخدمات.",
      },
      { property: "og:title", content: "الأسئلة الشائعة" },
    ],
    links: [{ rel: "canonical", href: "https://newnasiriya.com/academic/faq" }],
  }),
  component: FaqPage,
});

interface FaqCategory {
  id: string;
  title_ar: string;
  slug: string;
  display_order: number;
}
interface FaqItem {
  id: string;
  category_id: string | null;
  question_ar: string;
  answer_ar: string | null;
  display_order: number;
}

async function fetchFaq(): Promise<{ categories: FaqCategory[]; items: FaqItem[] }> {
  const [c, i] = await Promise.all([
    supabase
      .from("faq_categories" as never)
      .select("id,title_ar,slug,display_order")
      .eq("status", "published")
      .order("display_order", { ascending: true }),
    supabase
      .from("faq_items" as never)
      .select("id,category_id,question_ar,answer_ar,display_order")
      .eq("status", "published")
      .order("display_order", { ascending: true }),
  ]);
  if (c.error) throw c.error;
  if (i.error) throw i.error;
  return {
    categories: (c.data ?? []) as unknown as FaqCategory[],
    items: (i.data ?? []) as unknown as FaqItem[],
  };
}

function FaqPage() {
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["academic", "faq"],
    queryFn: fetchFaq,
    staleTime: 60_000,
  });

  const categories = data?.categories ?? [];
  const items = data?.items ?? [];

  const filtered = useMemo(() => {
    let out = items;
    if (activeCat !== "all") out = out.filter((it) => it.category_id === activeCat);
    const needle = q.trim();
    if (needle) {
      out = out.filter((it) =>
        [it.question_ar, it.answer_ar]
          .filter(Boolean)
          .some((v) => (v as string).includes(needle)),
      );
    }
    return out;
  }, [items, activeCat, q]);

  const jsonLd = useMemo(() => {
    if (items.length === 0) return null;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((it) => ({
        "@type": "Question",
        name: it.question_ar,
        acceptedAnswer: {
          "@type": "Answer",
          text: it.answer_ar || "",
        },
      })),
    };
  }, [items]);

  return (
    <>
      <PageHero
        title="الأسئلة الشائعة"
        description="مجموعة من الأسئلة الأكثر تكرارًا وإجاباتها الرسمية، لمساعدة الطلاب وأولياء الأمور على الحصول على المعلومات بسرعة."
        crumbs={[
          { label: "الحياة الأكاديمية", to: "/academic" },
          { label: "الأسئلة الشائعة" },
        ]}
      />

      <Section spacing="default">
        <Container size="wide">
          {jsonLd && (
            <script
              type="application/ld+json"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
          )}

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-muted-foreground"
              />
              <Input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث في الأسئلة…"
                aria-label="ابحث في الأسئلة الشائعة"
                className="h-11 pe-10 ps-3 text-sm"
              />
            </div>
          </div>

          {categories.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCat("all")}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  activeCat === "all"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                جميع الأسئلة
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCat(c.id)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    activeCat === c.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c.title_ar}
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-muted" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyPanel
              title={q ? "لا نتائج مطابقة" : "لم تُنشر أسئلة بعد"}
              description={
                q
                  ? "جرّب استخدام كلمات مفتاحية أخرى."
                  : "ستقوم إدارة المدرسة بإضافة الأسئلة والإجابات الرسمية قريبًا."
              }
              icon={HelpCircle}
            />
          ) : (
            <ul className="space-y-3">
              {filtered.map((it) => {
                const isOpen = !!open[it.id];
                return (
                  <li
                    key={it.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card elevation-sm"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-${it.id}`}
                      onClick={() =>
                        setOpen((prev) => ({ ...prev, [it.id]: !prev[it.id] }))
                      }
                      className="flex w-full items-center justify-between gap-4 p-5 text-start hover:bg-accent/40"
                    >
                      <span className="text-base font-semibold text-foreground">
                        {it.question_ar}
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className={cn(
                          "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                          isOpen && "rotate-180 text-primary",
                        )}
                      />
                    </button>
                    {isOpen && it.answer_ar && (
                      <div
                        id={`faq-${it.id}`}
                        className="border-t border-border px-5 py-4"
                      >
                        <p className="whitespace-pre-line text-sm leading-loose text-muted-foreground">
                          {it.answer_ar}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}
