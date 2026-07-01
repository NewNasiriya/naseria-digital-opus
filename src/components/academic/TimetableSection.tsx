import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Download, FileText, ImageOff } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { mediaPublicUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { EmptyPanel } from "./EmptyPanel";

interface TimetableRow {
  id: string;
  title_ar: string;
  description_ar: string | null;
  published_at: string | null;
  display_order: number;
  cover: { bucket: string | null; storage_path: string | null; alt_ar: string | null } | null;
  document: { bucket: string | null; storage_path: string | null; file_name: string | null } | null;
}

interface TimetableSectionProps {
  gradeId: string | null | undefined;
  kind: "academic" | "exam";
  title: string;
  emptyTitle: string;
  emptyDescription: string;
}

async function fetchTimetables(gradeId: string, kind: "academic" | "exam"): Promise<TimetableRow[]> {
  const { data, error } = await supabase
    .from("timetables")
    .select(
      "id,title_ar,description_ar,published_at,display_order,cover:cover_image_media_id(bucket,storage_path,alt_ar),document:document_media_id(bucket,storage_path,file_name)",
    )
    .eq("kind", kind)
    .eq("grade_id", gradeId)
    .eq("status", "published")
    .order("display_order", { ascending: true })
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as TimetableRow[];
}

function TimetableCard({ item }: { item: TimetableRow }) {
  const imgUrl = mediaPublicUrl(item.cover);
  const docUrl = mediaPublicUrl(item.document);
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card elevation-sm">
      <div className="aspect-[16/10] w-full overflow-hidden bg-surface-muted">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={item.cover?.alt_ar ?? item.title_ar}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-full w-full place-items-center text-muted-foreground/40"
          >
            <ImageOff className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-foreground">{item.title_ar}</h3>
        {item.description_ar && (
          <p className="mt-2 text-sm leading-loose text-muted-foreground">
            {item.description_ar}
          </p>
        )}
        {docUrl && (
          <div className="mt-5">
            <Button asChild variant="outline" size="sm">
              <a href={docUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" aria-hidden="true" />
                تنزيل الملف
              </a>
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-[16/10] w-full animate-pulse bg-surface-muted" />
      <div className="space-y-3 p-6">
        <div className="h-5 w-2/3 animate-pulse rounded bg-surface-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-surface-muted" />
      </div>
    </div>
  );
}

export function TimetableSection({
  gradeId,
  kind,
  title,
  emptyTitle,
  emptyDescription,
}: TimetableSectionProps) {
  const enabled = !!gradeId;
  const { data, isLoading, isError } = useQuery({
    queryKey: ["academic", "timetables", kind, gradeId],
    queryFn: () => fetchTimetables(gradeId as string, kind),
    enabled,
    staleTime: 60_000,
  });

  const Icon = kind === "exam" ? FileText : CalendarClock;
  const items = data ?? [];

  return (
    <section aria-labelledby={`tt-${kind}`} className="scroll-mt-24">
      <div className="mb-6 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"
        >
          <Icon className="h-5 w-5" />
        </span>
        <h2 id={`tt-${kind}`} className="text-xl font-semibold text-foreground">
          {title}
        </h2>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : isError || items.length === 0 ? (
        <EmptyPanel title={emptyTitle} description={emptyDescription} icon={Icon} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((item) => (
            <TimetableCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
