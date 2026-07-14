import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Search, Shield } from "lucide-react";

import { PageHero } from "@/components/academic/PageHero";
import { EmptyPanel } from "@/components/academic/EmptyPanel";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/academic/policies")({
  head: () => ({
    meta: [
      { title: "السياسات المدرسية | مدرسة الناصرية الابتدائية الجديدة" },
      {
        name: "description",
        content:
          "السياسات الرسمية المعتمدة من إدارة المدرسة والمتاحة للاطلاع من قِبل الطلاب وأولياء الأمور.",
      },
      { property: "og:title", content: "السياسات المدرسية" },
    ],
    links: [{ rel: "canonical", href: "https://naseria-digital-opus.lovable.app/academic/policies" }],
  }),
  component: PoliciesPage,
});

interface Attachment {
  label?: string;
  url: string;
}

interface Policy {
  id: string;
  title_ar: string;
  summary_ar: string | null;
  content_ar: string | null;
  category_ar: string | null;
  effective_date: string | null;
  attachments: Attachment[] | null;
  display_order: number;
}

async function fetchPolicies(): Promise<Policy[]> {
  const { data, error } = await supabase
    .from("school_policies" as never)
    .select(
      "id,title_ar,summary_ar,content_ar,category_ar,effective_date,attachments,display_order",
    )
    .eq("status", "published")
    .eq("visibility", "public")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Policy[];
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function PoliciesPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["academic", "school-policies"],
    queryFn: fetchPolicies,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    const items = data ?? [];
    const needle = q.trim();
    if (!needle) return items;
    return items.filter((p) =>
      [p.title_ar, p.summary_ar, p.content_ar, p.category_ar]
        .filter(Boolean)
        .some((v) => (v as string).includes(needle)),
    );
  }, [data, q]);

  return (
    <>
      <PageHero
        title="السياسات المدرسية"
        description="السياسات الرسمية المعتمدة من إدارة المدرسة، وتُشكّل الإطار المنظِّم للعمل التربوي والتعليمي داخل المدرسة."
        crumbs={[
          { label: "الحياة الأكاديمية", to: "/academic" },
          { label: "السياسات المدرسية" },
        ]}
      />
      <Section spacing="default">
        <Container size="wide">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-muted-foreground"
              />
              <Input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث في السياسات…"
                aria-label="ابحث في السياسات المدرسية"
                className="h-11 pe-10 ps-3 text-sm"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-muted" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyPanel
              title={q ? "لا نتائج مطابقة" : "لم تُنشر سياسات رسمية بعد"}
              description={
                q
                  ? "جرّب استخدام كلمات مفتاحية أخرى."
                  : "ستقوم إدارة المدرسة بنشر السياسات الرسمية عبر لوحة التحكم قريبًا."
              }
              icon={Shield}
            />
          ) : (
            <div className="grid gap-5">
              {filtered.map((p) => {
                const dt = formatDate(p.effective_date);
                const atts = Array.isArray(p.attachments) ? p.attachments : [];
                return (
                  <article
                    key={p.id}
                    className="rounded-2xl border border-border bg-card p-6 elevation-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        {p.category_ar && (
                          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                            {p.category_ar}
                          </p>
                        )}
                        <h2 className="mt-1 text-lg font-semibold text-foreground">
                          {p.title_ar}
                        </h2>
                      </div>
                      {dt && (
                        <span className="rounded-full bg-surface-muted px-3 py-1 text-xs text-muted-foreground">
                          اعتُمدت في {dt}
                        </span>
                      )}
                    </div>
                    {p.summary_ar && (
                      <p className="mt-3 text-sm leading-loose text-muted-foreground">
                        {p.summary_ar}
                      </p>
                    )}
                    {p.content_ar && (
                      <p className="mt-4 whitespace-pre-line text-sm leading-loose text-foreground">
                        {p.content_ar}
                      </p>
                    )}
                    {atts.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {atts.map((a, i) => (
                          <a
                            key={i}
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:border-border-strong hover:bg-accent"
                          >
                            <Download className="h-4 w-4" aria-hidden="true" />
                            {a.label || "تنزيل المستند"}
                          </a>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          <section aria-labelledby="pol-downloads" className="mt-14">
            <div className="mb-4 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"
              >
                <FileText className="h-5 w-5" />
              </span>
              <h2 id="pol-downloads" className="text-lg font-semibold text-foreground">
                نُسخ رسمية للتنزيل
              </h2>
            </div>
            <p className="text-sm leading-loose text-muted-foreground">
              ستُتاح النسخ الرسمية للسياسات المدرسية للتنزيل من هذا القسم فور اعتمادها ورفعها عبر لوحة التحكم.
            </p>
          </section>
        </Container>
      </Section>
    </>
  );
}
