import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, UploadCloud, X } from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { MediaThumb } from "@/components/admin/media/MediaThumb";
import { MediaUploader } from "@/components/admin/media/MediaUploader";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: MediaItem) => void;
  bucket?: MediaBucket;
  kind?: MediaKind;
  defaultFolder?: string;
  title?: string;
  description?: string;
}

/**
 * Reusable media picker built on top of the existing media library service.
 * Every module reuses this dialog instead of duplicating upload+select UIs.
 */
export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  bucket,
  kind,
  defaultFolder,
  title = "اختيار من مكتبة الوسائط",
  description = "اختر عنصرًا موجودًا أو ارفع ملفًا جديدًا. الملفات المرفوعة تُصبح متاحة لباقي الأقسام تلقائيًا.",
}: MediaPickerDialogProps) {
  const { can } = useAuth();
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<MediaItem | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  const query = useMemo<MediaListQuery>(
    () => ({
      search: search.trim() || undefined,
      kind: kind ?? "all",
      bucket: bucket ?? "all",
      folder: defaultFolder ?? "all",
      limit: 60,
      offset: 0,
    }),
    [search, kind, bucket, defaultFolder],
  );

  const list = useQuery({
    queryKey: mediaLibraryKeys.list(query),
    queryFn: () => mediaLibrary.list(query),
    enabled: open,
    placeholderData: (prev) => prev,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="text-start">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو النص البديل…"
              aria-label="بحث في الوسائط"
              className="h-10 pe-10 ps-3 text-sm"
            />
          </div>
          {can("media.upload") && (
            <Button
              variant={showUploader ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setShowUploader((v) => !v)}
            >
              <UploadCloud className="h-4 w-4" />
              {showUploader ? "إخفاء الرفع" : "رفع جديد"}
            </Button>
          )}
        </div>

        {showUploader && can("media.upload") && (
          <div className="mb-4 rounded-xl border border-border bg-surface-muted/40 p-3">
            <MediaUploader
              bucket={bucket ?? "media"}
              folder={defaultFolder}
              onDone={() => {
                setShowUploader(false);
                list.refetch();
              }}
            />
          </div>
        )}

        <div className="max-h-[55vh] min-h-[240px] overflow-y-auto rounded-xl border border-border bg-background p-3">
          {list.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
              ))}
            </div>
          ) : list.data && list.data.rows.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {list.data.rows.map((item) => {
                const active = pending?.id === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setPending(item)}
                      onDoubleClick={() => {
                        onSelect(item);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "block w-full overflow-hidden rounded-lg border-2 text-start transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        active
                          ? "border-primary elevation-md"
                          : "border-border hover:border-primary/40",
                      )}
                      aria-pressed={active}
                    >
                      <MediaThumb item={item} />
                      <div className="space-y-1 p-2">
                        <p className="truncate text-xs font-semibold" title={item.file_name}>
                          {item.file_name}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{formatBytes(item.size_bytes)}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {item.folder}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={UploadCloud}
              title="لا توجد وسائط مطابقة"
              description="جرّب تغيير البحث أو رفع ملف جديد."
            />
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="me-1 h-4 w-4" />
            إلغاء
          </Button>
          <Button
            disabled={!pending}
            onClick={() => {
              if (pending) {
                onSelect(pending);
                onOpenChange(false);
              }
            }}
          >
            استخدام العنصر
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
