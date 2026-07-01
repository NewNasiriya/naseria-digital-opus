import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  UploadCloud,
  X,
  ImageIcon,
  FileText,
  Layers,
  Archive,
  FolderOpen,
  Ban,
} from "lucide-react";

import {
  mediaLibrary,
  mediaLibraryKeys,
  formatBytes,
  type MediaBucket,
  type MediaItem,
  type MediaKind,
  type MediaListQuery,
} from "@/cms/media-library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/admin/EmptyState";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaThumb } from "./MediaThumb";
import { MediaUploader } from "./MediaUploader";
import { MediaDetailsSheet } from "./MediaDetailsSheet";

interface Props {
  /** Restrict to a bucket (e.g. `documents` for the Document Center). */
  bucket?: MediaBucket;
  /** Restrict to a media kind. */
  fixedKind?: MediaKind;
  /** Default upload folder. */
  defaultFolder?: string;
  uploadAccept?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

const KIND_FILTERS: { id: MediaKind | "all"; label: string; icon: any }[] = [
  { id: "all", label: "الكل", icon: Layers },
  { id: "image", label: "صور", icon: ImageIcon },
  { id: "document", label: "مستندات", icon: FileText },
];

const KNOWN_FOLDERS = [
  "homepage",
  "about",
  "news",
  "achievements",
  "honor",
  "academic",
  "gallery",
  "activities",
  "contact",
  "documents",
  "brand",
  "temp",
];

export function MediaLibrary({
  bucket,
  fixedKind,
  defaultFolder,
  uploadAccept,
  emptyTitle = "لا توجد ملفات بعد",
  emptyDescription = "ابدأ برفع أول ملف — سيصبح متاحًا لجميع أقسام النظام.",
}: Props) {
  const { can } = useAuth();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<MediaKind | "all">(fixedKind ?? "all");
  const [folder, setFolder] = useState<string>(defaultFolder ?? "all");
  const [archived, setArchived] = useState(false);
  const [unusedOnly, setUnusedOnly] = useState(false);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const query = useMemo<MediaListQuery>(
    () => ({
      search: search.trim() || undefined,
      kind: fixedKind ?? kind,
      bucket: bucket ?? "all",
      folder,
      archived,
      unusedOnly,
      limit: 60,
      offset: 0,
    }),
    [search, kind, folder, archived, unusedOnly, bucket, fixedKind],
  );

  const list = useQuery({
    queryKey: mediaLibraryKeys.list(query),
    queryFn: () => mediaLibrary.list(query),
    placeholderData: (prev) => prev,
  });

  const foldersQuery = useQuery({
    queryKey: mediaLibraryKeys.folders(bucket),
    queryFn: () => mediaLibrary.listFolders(bucket),
  });

  const folderOptions = useMemo(() => {
    const set = new Set<string>(KNOWN_FOLDERS);
    for (const f of foldersQuery.data ?? []) set.add(f.folder);
    return Array.from(set).sort();
  }, [foldersQuery.data]);

  const total = list.data?.total ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Sidebar: folders */}
      <aside className="hidden lg:block">
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between px-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">المجلدات</h3>
          </div>
          <ul className="space-y-0.5">
            <li>
              <button
                onClick={() => setFolder("all")}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors",
                  folder === "all" ? "bg-primary/10 text-primary" : "hover:bg-surface-muted",
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  جميع الملفات
                </span>
                <Badge variant="secondary" className="text-[10px]">{foldersQuery.data?.reduce((s, f) => s + f.count, 0) ?? 0}</Badge>
              </button>
            </li>
            {folderOptions.map((f) => {
              const count = foldersQuery.data?.find((x) => x.folder === f)?.count ?? 0;
              return (
                <li key={f}>
                  <button
                    onClick={() => setFolder(f)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors",
                      folder === f ? "bg-primary/10 text-primary" : "hover:bg-surface-muted",
                    )}
                  >
                    <span className="inline-flex items-center gap-2 truncate">
                      <FolderOpen className="h-4 w-4 shrink-0" />
                      <span className="truncate">{f}</span>
                    </span>
                    {count > 0 && <Badge variant="secondary" className="text-[10px]">{count}</Badge>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم، النص البديل، أو الوسوم…"
              aria-label="بحث الوسائط"
              className="h-10 pe-10 ps-3 text-sm"
            />
          </div>
          {!fixedKind && (
            <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
              {KIND_FILTERS.map((k) => {
                const Icon = k.icon;
                const active = kind === k.id;
                return (
                  <button
                    key={k.id}
                    onClick={() => setKind(k.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {k.label}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Button
              variant={unusedOnly ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setUnusedOnly((v) => !v)}
              aria-pressed={unusedOnly}
            >
              <Ban className="h-4 w-4" />
              غير مستخدمة
            </Button>
            <Button
              variant={archived ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setArchived((v) => !v)}
              aria-pressed={archived}
            >
              <Archive className="h-4 w-4" />
              الأرشيف
            </Button>
            {can("media.upload") && (
              <Button size="sm" className="gap-2" onClick={() => setUploadOpen(true)}>
                <UploadCloud className="h-4 w-4" />
                رفع
              </Button>
            )}
          </div>
        </div>

        {/* Active filters */}
        {(search || folder !== "all" || unusedOnly || archived || (!fixedKind && kind !== "all")) && (
          <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">الفلاتر:</span>
            {folder !== "all" && (
              <Chip label={`مجلد: ${folder}`} onRemove={() => setFolder("all")} />
            )}
            {!fixedKind && kind !== "all" && (
              <Chip label={`النوع: ${KIND_FILTERS.find((k) => k.id === kind)?.label}`} onRemove={() => setKind("all")} />
            )}
            {unusedOnly && <Chip label="غير مستخدمة" onRemove={() => setUnusedOnly(false)} />}
            {archived && <Chip label="الأرشيف" onRemove={() => setArchived(false)} />}
            {search && <Chip label={`بحث: ${search}`} onRemove={() => setSearch("")} />}
            <span className="ms-auto text-muted-foreground">{total} عنصر</span>
          </div>
        )}

        {/* Grid */}
        {list.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        ) : list.isError ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            تعذر تحميل الوسائط. حاول مجددًا.
          </div>
        ) : list.data && list.data.rows.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {list.data.rows.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setSelected(item)}
                  className="group block w-full overflow-hidden rounded-xl border border-border bg-card text-start transition-shadow hover:elevation-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`فتح تفاصيل ${item.file_name}`}
                >
                  <MediaThumb item={item} />
                  <div className="space-y-1 p-2.5">
                    <p className="truncate text-xs font-semibold text-foreground" title={item.file_name}>
                      {item.file_name}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{formatBytes(item.size_bytes)}</span>
                      {item.width && item.height ? <span>{item.width}×{item.height}</span> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge variant="secondary" className="text-[10px]">{item.folder}</Badge>
                      {(item.usage_count ?? 0) > 0 ? (
                        <Badge className="bg-success/15 text-success hover:bg-success/20 text-[10px]">
                          مستخدم × {item.usage_count}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">غير مستخدم</Badge>
                      )}
                      {item.is_archived && <Badge variant="outline" className="text-[10px]">مؤرشف</Badge>}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={UploadCloud}
            title={emptyTitle}
            description={emptyDescription}
            action={
              can("media.upload") ? (
                <Button size="sm" className="gap-2" onClick={() => setUploadOpen(true)}>
                  <UploadCloud className="h-4 w-4" />
                  رفع ملفات
                </Button>
              ) : null
            }
          />
        )}
      </div>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="text-start">
            <DialogTitle>رفع ملفات جديدة</DialogTitle>
          </DialogHeader>
          <MediaUploader
            bucket={bucket ?? "media"}
            folder={folder !== "all" ? folder : defaultFolder}
            accept={uploadAccept}
            onDone={() => list.refetch()}
          />
        </DialogContent>
      </Dialog>

      <MediaDetailsSheet
        item={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2 py-0.5">
      {label}
      <button
        onClick={onRemove}
        aria-label={`إزالة الفلتر ${label}`}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
