import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Copy,
  Download,
  ExternalLink,
  Link as LinkIcon,
  RefreshCw,
  Trash2,
  Archive,
  ArchiveRestore,
  Save,
} from "lucide-react";

import { mediaLibrary, mediaLibraryKeys, formatBytes, type MediaBucket, type MediaItem } from "@/cms/media-library";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { MediaThumb } from "./MediaThumb";

interface Props {
  item: MediaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MediaDetailsSheet({ item, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { can } = useAuth();
  const [altAr, setAltAr] = useState("");
  const [altEn, setAltEn] = useState("");
  const [captionAr, setCaptionAr] = useState("");
  const [tags, setTags] = useState("");
  const [signed, setSigned] = useState<string | null>(null);

  useEffect(() => {
    if (!item) return;
    setAltAr(item.alt_ar ?? "");
    setAltEn(item.alt_en ?? "");
    setCaptionAr(item.caption_ar ?? "");
    setTags((item.tags ?? []).join(", "));
    mediaLibrary
      .signedUrl({ bucket: item.bucket as MediaBucket, path: item.storage_path })
      .then((u) => setSigned(u));
  }, [item?.id]);

  const usagesQuery = useQuery({
    queryKey: item ? mediaLibraryKeys.usages(item.id) : ["media-library", "usages", "none"],
    queryFn: () => mediaLibrary.listUsages(item!.id),
    enabled: !!item && open,
  });

  const saveMeta = useMutation({
    mutationFn: async () => {
      if (!item) return;
      await mediaLibrary.updateMeta(item.id, {
        alt_ar: altAr || null,
        alt_en: altEn || null,
        caption_ar: captionAr || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
    },
    onSuccess: () => {
      toast.success("تم حفظ البيانات الوصفية");
      qc.invalidateQueries({ queryKey: mediaLibraryKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const replaceFile = useMutation({
    mutationFn: async (file: File) => {
      if (!item) return;
      await mediaLibrary.replace(item.id, file);
    },
    onSuccess: () => {
      toast.success("تم استبدال الملف — جميع الاستخدامات محدثة تلقائيًا");
      qc.invalidateQueries({ queryKey: mediaLibraryKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: async () => {
      if (!item) return;
      await mediaLibrary.archive(item.id, false);
    },
    onSuccess: () => {
      toast.success("تمت الأرشفة");
      qc.invalidateQueries({ queryKey: mediaLibraryKeys.all });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const restore = useMutation({
    mutationFn: async () => {
      if (!item) return;
      await mediaLibrary.restore(item.id);
    },
    onSuccess: () => {
      toast.success("تمت الاستعادة");
      qc.invalidateQueries({ queryKey: mediaLibraryKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!item) return;
      await mediaLibrary.remove(item.id, false);
    },
    onSuccess: () => {
      toast.success("تم الحذف نهائيًا");
      qc.invalidateQueries({ queryKey: mediaLibraryKeys.all });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-lg">
        {item && (
          <>
            <SheetHeader className="text-start">
              <SheetTitle className="truncate text-base">{item.file_name}</SheetTitle>
              <SheetDescription className="text-xs">
                {item.mime_type} · {formatBytes(item.size_bytes)}
                {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-6">
              <MediaThumb item={item} className="rounded-xl border border-border" />

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    if (!signed) return;
                    navigator.clipboard.writeText(signed).then(() => toast.success("تم نسخ الرابط"));
                  }}
                  disabled={!signed}
                >
                  <Copy className="h-4 w-4" />
                  نسخ الرابط
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => signed && window.open(signed, "_blank", "noopener")}
                  disabled={!signed}
                >
                  <ExternalLink className="h-4 w-4" />
                  فتح
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={async () => {
                    const url = await mediaLibrary.signedUrl({
                      bucket: item.bucket as MediaBucket,
                      path: item.storage_path,
                      download: true,
                    });
                    if (url) window.open(url, "_blank", "noopener");
                  }}
                >
                  <Download className="h-4 w-4" />
                  تنزيل
                </Button>
                {can("media.replace") && (
                  <label className="inline-flex">
                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) replaceFile.mutate(f);
                        e.target.value = "";
                      }}
                    />
                    <Button size="sm" variant="outline" className="gap-2" asChild>
                      <span>
                        <RefreshCw className="h-4 w-4" />
                        استبدال
                      </span>
                    </Button>
                  </label>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">البيانات الوصفية</h3>
                <div className="space-y-2">
                  <Label htmlFor="md-alt-ar" className="text-xs">النص البديل (عربي)</Label>
                  <Input id="md-alt-ar" value={altAr} onChange={(e) => setAltAr(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="md-alt-en" className="text-xs">النص البديل (إنجليزي)</Label>
                  <Input id="md-alt-en" value={altEn} onChange={(e) => setAltEn(e.target.value)} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="md-cap" className="text-xs">وصف مختصر</Label>
                  <Textarea id="md-cap" rows={2} value={captionAr} onChange={(e) => setCaptionAr(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="md-tags" className="text-xs">الوسوم (مفصولة بفواصل)</Label>
                  <Input id="md-tags" value={tags} onChange={(e) => setTags(e.target.value)} />
                </div>
                <Button size="sm" className="gap-2" onClick={() => saveMeta.mutate()} disabled={saveMeta.isPending}>
                  <Save className="h-4 w-4" />
                  حفظ البيانات
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  الاستخدامات ({usagesQuery.data?.length ?? 0})
                </h3>
                {usagesQuery.isLoading ? (
                  <p className="text-xs text-muted-foreground">جاري التحميل…</p>
                ) : usagesQuery.data && usagesQuery.data.length > 0 ? (
                  <ul className="space-y-1.5 text-xs">
                    {usagesQuery.data.map((u) => (
                      <li key={u.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted/40 px-3 py-2">
                        <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        <span className="font-mono text-[11px] text-muted-foreground">{u.entity_table}</span>
                        <Badge variant="secondary" className="text-[10px]">{u.field_name}</Badge>
                        <span className="truncate text-muted-foreground" title={u.entity_id}>#{u.entity_id.slice(0, 8)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">هذا الملف غير مستخدم في أي مكان.</p>
                )}
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                {!item.is_archived ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => archive.mutate()}
                    disabled={archive.isPending}
                  >
                    <Archive className="h-4 w-4" />
                    أرشفة
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => restore.mutate()}
                    disabled={restore.isPending}
                  >
                    <ArchiveRestore className="h-4 w-4" />
                    استعادة
                  </Button>
                )}
                {can("media.delete") && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-2"
                    onClick={() => {
                      if (confirm("سيتم حذف الملف نهائيًا. هل أنت متأكد؟")) remove.mutate();
                    }}
                    disabled={remove.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف نهائي
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
