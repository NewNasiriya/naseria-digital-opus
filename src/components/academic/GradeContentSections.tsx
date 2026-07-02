import { useQuery } from "@tanstack/react-query";
import { Download, FileText, StickyNote, ImageOff } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { mediaPublicUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { EmptyPanel } from "./EmptyPanel";

interface ResourceRow {
  id: string;
  title_ar: string;
  description_ar: string | null;
  display_order: number;
  media: {
    bucket: string | null;
    storage_path: string | null;
    file_name: string | null;
    mime_type: string | null;
  } | null;
}

interface NoteRow {
  id: string;
  title_ar: string;
  body_ar: string | null;
  published_at: string | null;
  display_order: number;
  attachment: {
    bucket: string | null;
    storage_path: string | null;
    file_name: string | null;
    mime_type: string | null;
  } | null;
}

async function fetchResources(gradeId: string): Promise<ResourceRow[]> {
  const { data, error } = await supabase
    .from("academic_resources")
    .select(
      "id,title_ar,description_ar,display_order,media:media_id(bucket,storage_path,file_name,mime_type)",
    )
    .eq("grade_id", gradeId)
    .eq("status", "published")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as ResourceRow[];
}

async function fetchNotes(gradeId: string): Promise<NoteRow[]> {
  const { data, error } = await supabase
    .from("academic_notes")
    .select(
      "id,title_ar,body_ar,published_at,display_order,attachment:attachment_media_id(bucket,storage_path,file_name,mime_type)",
    )
    .eq("grade_id", gradeId)
    .eq("status", "published")
    .order("display_order", { ascending: true })
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as NoteRow[];
}

export function NotesSection({ gradeId }: { gradeId: string | null | undefined }) {
  const { data, isLoading } = useQuery({
    queryKey: ["academic", "notes", gradeId],
    queryFn: () => (gradeId ? fetchNotes(gradeId) : Promise.resolve([])),
    enabled: Boolean(gradeId),
    staleTime: 30_000,
  });

  if (isLoading || !data || data.length === 0) {
    return (
      <EmptyPanel
        title="لا توجد ملاحظات منشورة حالياً"
        description="سيقوم المعلمون والإدارة بنشر التنبيهات والملاحظات الأكاديمية المتعلقة بهذا الصف من خلال لوحة التحكم."
        icon={StickyNote}
      />
    );
  }

  return (
    <ul className="grid gap-4">
      {data.map((n) => {
        const url = mediaPublicUrl(n.attachment);
        return (
          <li
            key={n.id}
            className="rounded-2xl border border-border bg-card p-5 elevation-sm"
          >
            <h3 className="text-base font-semibold text-foreground">{n.title_ar}</h3>
            {n.body_ar && (
              <p className="mt-2 whitespace-pre-line text-sm leading-loose text-muted-foreground">
                {n.body_ar}
              </p>
            )}
            {url && (
              <div className="mt-4">
                <Button asChild variant="outline" size="sm">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" aria-hidden="true" />
                    تنزيل المرفق
                  </a>
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ResourcesSection({ gradeId }: { gradeId: string | null | undefined }) {
  const { data, isLoading } = useQuery({
    queryKey: ["academic", "resources", gradeId],
    queryFn: () => (gradeId ? fetchResources(gradeId) : Promise.resolve([])),
    enabled: Boolean(gradeId),
    staleTime: 30_000,
  });

  if (isLoading || !data || data.length === 0) {
    return (
      <EmptyPanel
        title="لا توجد ملفات للتنزيل بعد"
        description="سيتم توفير المذكرات والمستندات الرسمية للتنزيل من هذا القسم فور نشرها من الإدارة."
        icon={Download}
      />
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {data.map((r) => {
        const url = mediaPublicUrl(r.media);
        const isImage = (r.media?.mime_type ?? "").startsWith("image/");
        return (
          <li key={r.id}>
            <a
              href={url ?? "#"}
              target={url ? "_blank" : undefined}
              rel={url ? "noopener noreferrer" : undefined}
              className="group flex h-full items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-border-strong hover:bg-background"
            >
              <span
                aria-hidden="true"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"
              >
                {isImage ? (
                  url ? (
                    <ImageOff className="hidden" />
                  ) : (
                    <ImageOff className="h-5 w-5" />
                  )
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {r.title_ar}
                </span>
                {r.description_ar && (
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {r.description_ar}
                  </span>
                )}
                {r.media?.file_name && (
                  <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Download className="h-3 w-3" />
                    {r.media.file_name}
                  </span>
                )}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
