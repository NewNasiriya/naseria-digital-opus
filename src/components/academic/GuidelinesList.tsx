import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ListChecks } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { supabase } from "@/integrations/supabase/client";
import { EmptyPanel } from "./EmptyPanel";

interface InstructionItem {
  id: string;
  body_ar: string;
  display_order: number;
  icon_key: string | null;
}

interface InstructionList {
  id: string;
  title_ar: string;
  description_ar: string | null;
  display_order: number;
  instruction_items: InstructionItem[];
}

async function fetchLists(audience: "student" | "parent"): Promise<InstructionList[]> {
  const { data, error } = await supabase
    .from("instruction_lists")
    .select(
      "id,title_ar,description_ar,display_order,instruction_items(id,body_ar,display_order,icon_key)",
    )
    .eq("audience", audience)
    .eq("status", "published")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as InstructionList[];
}

interface GuidelinesListProps {
  audience: "student" | "parent";
  emptyTitle: string;
  emptyDescription: string;
}

function ListCard({ list }: { list: InstructionList }) {
  const items = [...(list.instruction_items ?? [])].sort(
    (a, b) => a.display_order - b.display_order,
  );
  return (
    <article className="rounded-2xl border border-border bg-card p-6 elevation-sm">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"
        >
          <ListChecks className="h-5 w-5" />
        </span>
        <h3 className="text-lg font-semibold text-foreground">{list.title_ar}</h3>
      </div>
      {list.description_ar && (
        <p className="mt-3 text-sm leading-loose text-muted-foreground">
          {list.description_ar}
        </p>
      )}
      {items.length > 0 && (
        <ul className="mt-5 space-y-3">
          {items.map((it) => (
            <li key={it.id} className="flex items-start gap-3">
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-primary"
              />
              <span className="text-sm leading-loose text-foreground">
                {it.body_ar}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function Skeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="h-5 w-1/2 animate-pulse rounded bg-surface-muted" />
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-surface-muted" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-surface-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-surface-muted" />
      </div>
    </div>
  );
}

export function GuidelinesList({
  audience,
  emptyTitle,
  emptyDescription,
}: GuidelinesListProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["academic", "instructions", audience],
    queryFn: () => fetchLists(audience),
    staleTime: 60_000,
  });

  const lists = data ?? [];

  return (
    <Section spacing="default">
      <Container size="wide">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton />
            <Skeleton />
          </div>
        ) : isError || lists.length === 0 ? (
          <EmptyPanel title={emptyTitle} description={emptyDescription} icon={ListChecks} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {lists.map((l) => (
              <ListCard key={l.id} list={l} />
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
