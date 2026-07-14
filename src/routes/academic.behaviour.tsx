import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { PageHero } from "@/components/academic/PageHero";
import { EmptyPanel } from "@/components/academic/EmptyPanel";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/academic/behaviour")({
  head: () => ({
    meta: [
      { title: "القيم السلوكية | مدرسة الناصرية الابتدائية الجديدة" },
      {
        name: "description",
        content:
          "القيم التربوية التي تحرص المدرسة على غرسها في طلابها: الاحترام، المسؤولية، الأمانة، والتعاون.",
      },
      { property: "og:title", content: "القيم السلوكية" },
    ],
    links: [{ rel: "canonical", href: "https://naseria-digital-opus.lovable.app/academic/behaviour" }],
  }),
  component: BehaviourPage,
});

interface Guideline {
  id: string;
  title_ar: string;
  body_ar: string | null;
  display_order: number;
}

async function fetchGuidelines(): Promise<Guideline[]> {
  const { data, error } = await supabase
    .from("behaviour_guidelines")
    .select("id,title_ar,body_ar,display_order")
    .eq("status", "published")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Guideline[];
}

function BehaviourPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["academic", "behaviour-guidelines"],
    queryFn: fetchGuidelines,
    staleTime: 60_000,
  });
  const items = data ?? [];

  return (
    <>
      <PageHero
        title="القيم السلوكية"
        description="تحرص المدرسة على غرس مجموعة من القيم التربوية في طلابها، تُشكّل شخصياتهم وتُهيّئهم ليكونوا مواطنين صالحين ومتعلمين مسؤولين."
        crumbs={[
          { label: "الحياة الأكاديمية", to: "/academic" },
          { label: "القيم السلوكية" },
        ]}
      />
      <Section spacing="default">
        <Container size="wide">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface-muted" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyPanel
              title="لم تُنشر القيم السلوكية بعد"
              description="ستقوم إدارة المدرسة بنشر القيم التربوية الرسمية قريبًا."
              icon={ShieldCheck}
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {items.map((g) => (
                <article
                  key={g.id}
                  className="rounded-2xl border border-border bg-card p-6 elevation-sm transition-shadow hover:elevation-md"
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"
                    >
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <h2 className="text-lg font-semibold text-foreground">{g.title_ar}</h2>
                  </div>
                  {g.body_ar && (
                    <p className="mt-3 whitespace-pre-line text-sm leading-loose text-muted-foreground">
                      {g.body_ar}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
