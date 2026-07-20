/**
 * Gallery panel embedded in the Activity editor.
 *
 * Manages rows in the `activity_media` junction table. The schema is a
 * strict subset of `achievement_media` (no legacy `image_url`, no alt
 * fields), so this panel only exposes what the underlying table
 * supports — matching the public reader on `/activities` exactly.
 */
import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ImageIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { mediaLibrary } from "@/cms/media-library";
import type { MediaBucket, MediaItem } from "@/cms/media-library";
import { MediaPickerDialog } from "@/cms/ui/MediaPickerDialog";

interface GalleryRow {
  id: string;
  media_id: string;
  caption_ar: string | null;
  caption_en: string | null;
  display_order: number;
  media: {
    bucket: string;
    storage_path: string;
    file_name: string | null;
    mime_type: string | null;
  } | null;
  _url?: string | null;
}

export function ActivityGalleryPanel({
  activityId,
  disabled,
}: {
  activityId?: string;
  disabled?: boolean;
}) {
  const [rows, setRows] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    if (!activityId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("activity_media")
        .select(
          `id, media_id, caption_ar, caption_en, display_order,
           media:media!activity_media_media_id_fkey(bucket,storage_path,file_name,mime_type)`,
        )
        .eq("activity_id", activityId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      const enriched = await Promise.all(
        (data ?? []).map(async (r: GalleryRow) => {
          if (r.media && (r.media.mime_type ?? "").startsWith("image/")) {
            try {
              r._url = await mediaLibrary.signedUrl({
                bucket: r.media.bucket as MediaBucket,
                path: r.media.storage_path,
                expiresInSeconds: 60 * 15,
              });
            } catch {
              r._url = null;
            }
          }
          return r;
        }),
      );
      setRows(enriched);
    } catch {
      toast.error("تعذّر تحميل معرض الصور.");
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!activityId) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-muted p-4 text-xs text-muted-foreground">
        احفظ النشاط كمسودة أولًا حتى تتمكن من إضافة صور المعرض.
      </div>
    );
  }

  const handleAdd = async (item: MediaItem) => {
    const nextOrder =
      rows.length === 0 ? 0 : Math.max(...rows.map((r) => r.display_order ?? 0)) + 1;
    try {
      const { error } = await (supabase as any).from("activity_media").insert({
        activity_id: activityId,
        media_id: item.id,
        display_order: nextOrder,
        caption_ar: item.caption_ar ?? null,
      });
      if (error) throw error;
      toast.success("تمت إضافة الصورة إلى المعرض.");
      await load();
    } catch {
      toast.error("تعذّر إضافة الصورة.");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from("activity_media")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await load();
    } catch {
      toast.error("تعذّر حذف الصورة.");
    }
  };

  const handleMove = async (id: string, dir: -1 | 1) => {
    const idx = rows.findIndex((r) => r.id === id);
    const swap = rows[idx + dir];
    if (!swap) return;
    const current = rows[idx];
    try {
      await Promise.all([
        (supabase as any)
          .from("activity_media")
          .update({ display_order: swap.display_order })
          .eq("id", current.id),
        (supabase as any)
          .from("activity_media")
          .update({ display_order: current.display_order })
          .eq("id", swap.id),
      ]);
      await load();
    } catch {
      toast.error("تعذّر إعادة الترتيب.");
    }
  };

  const patchCaption = async (id: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, caption_ar: value } : r)),
    );
    try {
      await (supabase as any)
        .from("activity_media")
        .update({ caption_ar: value || null })
        .eq("id", id);
    } catch {
      toast.error("تعذّر حفظ التعديل.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          صور المعرض التي تظهر داخل صفحة النشاط.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setPickerOpen(true)}
          disabled={disabled}
        >
          <Plus className="h-4 w-4" /> إضافة صورة
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-muted p-6 text-center text-xs text-muted-foreground">
          لا توجد صور في المعرض بعد.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rows.map((row, idx) => (
            <li
              key={row.id}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3"
            >
              <div className="overflow-hidden rounded-lg border border-border bg-surface-muted">
                <AspectRatio ratio={16 / 10}>
                  {row._url ? (
                    <img
                      src={row._url}
                      alt={row.caption_ar ?? row.media?.file_name ?? ""}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground">
                      <ImageIcon className="h-6 w-6" aria-hidden="true" />
                    </div>
                  )}
                </AspectRatio>
              </div>
              <Input
                value={row.caption_ar ?? ""}
                onChange={(e) => patchCaption(row.id, e.target.value)}
                placeholder="تعليق مختصر (اختياري)…"
                dir="rtl"
                disabled={disabled}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMove(row.id, -1)}
                    disabled={disabled || idx === 0}
                    aria-label="نقل لأعلى"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleMove(row.id, 1)}
                    disabled={disabled || idx === rows.length - 1}
                    aria-label="نقل لأسفل"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => handleRemove(row.id)}
                  disabled={disabled}
                >
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleAdd}
        bucket="media"
        kind="image"
        defaultFolder="activities"
      />
    </div>
  );
}
