import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  EyeOff,
  Images,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { mediaPublicUrl } from "@/lib/media";
import { CATEGORY_LABEL_AR, categoryLabel } from "@/lib/gallery";

export const Route = createFileRoute("/admin/gallery")({
  head: () => ({
    meta: [
      { title: "إدارة معرض الصور · لوحة الإدارة" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminGalleryPage,
});

interface AlbumRow {
  id: string;
  slug: string;
  title_ar: string;
  description_ar: string | null;
  category: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  display_order: number;
  cover_media_id: string | null;
  cover: {
    bucket: string | null;
    storage_path: string | null;
    alt_ar: string | null;
  } | null;
  photo_count: { count: number }[] | null;
}

interface PhotoRow {
  id: string;
  media_id: string;
  caption_ar: string | null;
  display_order: number;
  media: {
    bucket: string | null;
    storage_path: string | null;
    alt_ar: string | null;
    file_name: string | null;
  } | null;
}

interface MediaRow {
  id: string;
  bucket: string;
  storage_path: string;
  file_name: string;
  alt_ar: string | null;
  mime_type: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "مسودة",
  published: "منشور",
  archived: "مؤرشف",
};

const CATEGORY_OPTIONS = Object.keys(CATEGORY_LABEL_AR);

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function fetchAllAlbums(): Promise<AlbumRow[]> {
  const { data, error } = await supabase
    .from("gallery_albums")
    .select(
      "id,slug,title_ar,description_ar,category,status,published_at,display_order,cover_media_id,cover:cover_media_id(bucket,storage_path,alt_ar),photo_count:gallery_items(count)"
    )
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AlbumRow[];
}

async function fetchAlbumPhotos(albumId: string): Promise<PhotoRow[]> {
  const { data, error } = await supabase
    .from("gallery_items")
    .select(
      "id,media_id,caption_ar,display_order,media:media_id(bucket,storage_path,alt_ar,file_name)"
    )
    .eq("album_id", albumId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as PhotoRow[];
}

async function fetchImageMedia(): Promise<MediaRow[]> {
  const { data, error } = await supabase
    .from("media")
    .select("id,bucket,storage_path,file_name,alt_ar,mime_type")
    .eq("is_archived", false)
    .like("mime_type", "image/%")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as MediaRow[];
}

interface AlbumFormValues {
  title_ar: string;
  slug: string;
  description_ar: string;
  category: string;
  status: "draft" | "published" | "archived";
}

const emptyForm: AlbumFormValues = {
  title_ar: "",
  slug: "",
  description_ar: "",
  category: "events",
  status: "draft",
};

function AlbumFormDialog({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: (AlbumFormValues & { id?: string }) | null;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<AlbumFormValues>(initial ?? emptyForm);
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(initial?.id);

  const save = async () => {
    if (!values.title_ar.trim()) {
      toast.error("العنوان مطلوب");
      return;
    }
    const slug = values.slug.trim() || slugify(values.title_ar);
    if (!slug) {
      toast.error("المعرّف (slug) مطلوب");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title_ar: values.title_ar.trim(),
        slug,
        description_ar: values.description_ar.trim() || null,
        category: values.category || null,
        status: values.status,
        published_at:
          values.status === "published" ? new Date().toISOString() : null,
      };
      if (isEdit && initial?.id) {
        const { error } = await supabase
          .from("gallery_albums")
          .update(payload)
          .eq("id", initial.id);
        if (error) throw error;
        toast.success("تم حفظ الألبوم");
      } else {
        const { error } = await supabase.from("gallery_albums").insert(payload);
        if (error) throw error;
        toast.success("تم إنشاء الألبوم");
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل الألبوم" : "إضافة ألبوم"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="album-title">العنوان</Label>
            <Input
              id="album-title"
              value={values.title_ar}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  title_ar: e.target.value,
                  slug: v.slug || slugify(e.target.value),
                }))
              }
              placeholder="مثال: احتفال يوم اليتيم"
            />
          </div>
          <div>
            <Label htmlFor="album-slug">المعرّف (Slug)</Label>
            <Input
              id="album-slug"
              value={values.slug}
              onChange={(e) =>
                setValues((v) => ({ ...v, slug: slugify(e.target.value) }))
              }
              placeholder="event-slug"
              dir="ltr"
            />
          </div>
          <div>
            <Label htmlFor="album-desc">الوصف</Label>
            <Textarea
              id="album-desc"
              value={values.description_ar}
              onChange={(e) =>
                setValues((v) => ({ ...v, description_ar: e.target.value }))
              }
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>التصنيف</Label>
              <Select
                value={values.category}
                onValueChange={(v) => setValues((s) => ({ ...s, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {categoryLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الحالة</Label>
              <Select
                value={values.status}
                onValueChange={(v) =>
                  setValues((s) => ({
                    ...s,
                    status: v as AlbumFormValues["status"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="published">منشور</SelectItem>
                  <SelectItem value="archived">مؤرشف</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "جارٍ الحفظ…" : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhotosSheet({
  album,
  onClose,
}: {
  album: AlbumRow | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const open = Boolean(album);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const photosQ = useQuery({
    queryKey: ["admin", "album-photos", album?.id],
    queryFn: () => fetchAlbumPhotos(album!.id),
    enabled: open,
  });

  const mediaQ = useQuery({
    queryKey: ["admin", "media-images"],
    queryFn: fetchImageMedia,
    enabled: pickerOpen,
  });

  const attachedIds = useMemo(
    () => new Set((photosQ.data ?? []).map((p) => p.media_id)),
    [photosQ.data]
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "album-photos", album?.id] });
    qc.invalidateQueries({ queryKey: ["admin", "gallery-albums"] });
    qc.invalidateQueries({ queryKey: ["gallery"] });
    qc.invalidateQueries({ queryKey: ["home", "gallery-preview"] });
  };

  const attach = useMutation({
    mutationFn: async (mediaId: string) => {
      const nextOrder = (photosQ.data ?? []).length;
      const { error } = await supabase.from("gallery_items").insert({
        album_id: album!.id,
        media_id: mediaId,
        display_order: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const detach = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("gallery_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const swapOrder = useMutation({
    mutationFn: async ({ a, b }: { a: PhotoRow; b: PhotoRow }) => {
      const { error } = await supabase.from("gallery_items").upsert([
        { id: a.id, album_id: album!.id, media_id: a.media_id, display_order: b.display_order },
        { id: b.id, album_id: album!.id, media_id: b.media_id, display_order: a.display_order },
      ]);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const photos = photosQ.data ?? [];
  const filteredMedia = (mediaQ.data ?? []).filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      m.file_name.toLowerCase().includes(q) ||
      (m.alt_ar ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <Sheet open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <SheetContent side="left" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            صور الألبوم — {album?.title_ar}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {photos.length} صورة مرتبطة
          </p>
          <Button size="sm" onClick={() => setPickerOpen((v) => !v)} className="gap-2">
            {pickerOpen ? <X className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {pickerOpen ? "إغلاق الاختيار" : "إضافة من الوسائط"}
          </Button>
        </div>

        {pickerOpen && (
          <div className="mt-4 rounded-xl border border-border bg-surface p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن ملف…"
                aria-label="بحث في الوسائط"
                className="h-9 ps-3 pe-10 text-sm"
              />
            </div>
            <div className="mt-3 grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
              {mediaQ.isLoading ? (
                <div className="col-span-full text-center text-xs text-muted-foreground">
                  جارٍ التحميل…
                </div>
              ) : (
                filteredMedia.map((m) => {
                  const url = mediaPublicUrl({ bucket: m.bucket, storage_path: m.storage_path });
                  const isAttached = attachedIds.has(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={isAttached || attach.isPending}
                      onClick={() => attach.mutate(m.id)}
                      className={
                        "group relative aspect-square overflow-hidden rounded-md border transition-all " +
                        (isAttached
                          ? "border-primary opacity-50"
                          : "border-border hover:border-primary")
                      }
                      title={m.file_name}
                    >
                      {url ? (
                        <img src={url} alt={m.alt_ar ?? m.file_name} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-surface-muted text-muted-foreground/40">
                          <Images className="h-6 w-6" />
                        </div>
                      )}
                      {isAttached && (
                        <span className="absolute inset-0 grid place-items-center bg-black/50 text-xs font-semibold text-white">
                          مضاف
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-2">
          {photosQ.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : photos.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              لا توجد صور في هذا الألبوم بعد.
            </p>
          ) : (
            photos.map((p, i) => {
              const url = p.media ? mediaPublicUrl(p.media) : null;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-2"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                    {url ? (
                      <img
                        src={url}
                        alt={p.media?.alt_ar ?? ""}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground" dir="ltr">
                      {p.media?.file_name ?? p.media_id}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.media?.alt_ar ?? ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="نقل للأعلى"
                      disabled={i === 0 || swapOrder.isPending}
                      onClick={() => swapOrder.mutate({ a: p, b: photos[i - 1] })}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="نقل للأسفل"
                      disabled={i === photos.length - 1 || swapOrder.isPending}
                      onClick={() => swapOrder.mutate({ a: p, b: photos[i + 1] })}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="إزالة"
                      onClick={() => detach.mutate(p.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AdminGalleryPage() {
  const qc = useQueryClient();
  const albumsQ = useQuery({
    queryKey: ["admin", "gallery-albums"],
    queryFn: fetchAllAlbums,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<(AlbumFormValues & { id?: string }) | null>(null);
  const [photosAlbum, setPhotosAlbum] = useState<AlbumRow | null>(null);
  const [search, setSearch] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "gallery-albums"] });
    qc.invalidateQueries({ queryKey: ["gallery"] });
    qc.invalidateQueries({ queryKey: ["home", "gallery-preview"] });
  };

  const togglePublish = async (a: AlbumRow) => {
    const nextStatus = a.status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("gallery_albums")
      .update({
        status: nextStatus,
        published_at: nextStatus === "published" ? new Date().toISOString() : null,
      })
      .eq("id", a.id);
    if (error) toast.error(error.message);
    else {
      toast.success(nextStatus === "published" ? "تم نشر الألبوم" : "أُلغي النشر");
      invalidate();
    }
  };

  const remove = async (a: AlbumRow) => {
    if (!confirm(`حذف الألبوم "${a.title_ar}"؟ (لن يتم حذف الصور من مكتبة الوسائط)`)) return;
    const { error } = await supabase.from("gallery_albums").delete().eq("id", a.id);
    if (error) toast.error(error.message);
    else {
      toast.success("تم حذف الألبوم");
      invalidate();
    }
  };

  const albums = (albumsQ.data ?? []).filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      a.title_ar.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q) ||
      (a.description_ar ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <AdminSectionHeader
        eyebrow="إدارة القسم"
        title="إدارة معرض الصور"
        description="أنشئ ألبومات، اربطها بصور موجودة في مكتبة الوسائط، ونشرها للجمهور."
        crumbs={[{ label: "لوحة التحكم", to: "/admin" }, { label: "المعرض" }]}
        publicHref="/gallery"
        action={
          <Button
            size="sm"
            className="gap-2"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            إضافة ألبوم
          </Button>
        }
      />

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الألبومات…"
            aria-label="بحث"
            className="h-10 ps-3 pe-10 text-sm"
          />
        </div>
      </div>

      {albumsQ.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : albums.length === 0 ? (
        <EmptyState
          icon={Images}
          title="لا توجد ألبومات بعد"
          description="ابدأ بإنشاء أول ألبوم واربطه بصور من مكتبة الوسائط."
          action={
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              إضافة ألبوم
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start">الألبوم</th>
                <th className="px-4 py-3 text-start">التصنيف</th>
                <th className="px-4 py-3 text-start">الصور</th>
                <th className="px-4 py-3 text-start">الحالة</th>
                <th className="px-4 py-3 text-end">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {albums.map((a) => {
                const coverUrl = mediaPublicUrl(a.cover);
                const count = a.photo_count?.[0]?.count ?? 0;
                return (
                  <tr key={a.id} className="hover:bg-surface-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {a.title_ar}
                          </p>
                          <p className="truncate text-xs text-muted-foreground" dir="ltr">
                            /gallery/{a.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {categoryLabel(a.category)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{count}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium " +
                          (a.status === "published"
                            ? "bg-primary-soft text-primary"
                            : a.status === "archived"
                              ? "bg-surface-muted text-muted-foreground"
                              : "bg-warning-soft text-warning-foreground")
                        }
                      >
                        {STATUS_LABEL[a.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setPhotosAlbum(a)}
                        >
                          <Images className="h-4 w-4" />
                          الصور
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="فتح على الموقع"
                          asChild
                        >
                          <a
                            href={`/gallery/${a.slug}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={
                            a.status === "published" ? "إلغاء النشر" : "نشر"
                          }
                          onClick={() => togglePublish(a)}
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="تعديل"
                          onClick={() => {
                            setEditing({
                              id: a.id,
                              title_ar: a.title_ar,
                              slug: a.slug,
                              description_ar: a.description_ar ?? "",
                              category: a.category ?? "events",
                              status: a.status,
                            });
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="حذف"
                          onClick={() => remove(a)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AlbumFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={invalidate}
      />

      <PhotosSheet album={photosAlbum} onClose={() => setPhotosAlbum(null)} />
    </>
  );
}
