import { useEffect, useState } from "react";

import { mediaLibrary, type MediaItem, type MediaBucket } from "@/cms/media-library";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, FileType, Film, Music, Image as ImageIcon } from "lucide-react";

/**
 * Thumbnail component for a MediaItem. Images render via signed URL; other
 * kinds render an icon representative of their mime.
 */
export function MediaThumb({ item, className }: { item: MediaItem; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(item.kind === "image");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (item.kind !== "image") return;
    setLoading(true);
    mediaLibrary
      .signedUrl({ bucket: item.bucket as MediaBucket, path: item.storage_path, expiresInSeconds: 60 * 30 })
      .then((u) => {
        if (cancelled) return;
        setUrl(u);
        setLoading(false);
        if (!u) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [item.id, item.bucket, item.storage_path, item.kind]);

  if (item.kind === "image") {
    return (
      <div className={cn("relative overflow-hidden bg-surface-muted", className)}>
        <AspectRatio ratio={4 / 3}>
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : url && !failed ? (
            <img
              src={url}
              alt={item.alt_ar ?? item.file_name}
              loading="lazy"
              className="h-full w-full object-cover"
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <ImageIcon className="h-8 w-8" aria-hidden="true" />
            </div>
          )}
        </AspectRatio>
      </div>
    );
  }

  const Icon =
    item.kind === "document"
      ? item.mime_type === "application/pdf"
        ? FileText
        : FileType
      : item.kind === "video"
        ? Film
        : item.kind === "audio"
          ? Music
          : FileType;

  return (
    <div className={cn("relative overflow-hidden bg-surface-muted", className)}>
      <AspectRatio ratio={4 / 3}>
        <div className="grid h-full w-full place-items-center text-muted-foreground">
          <Icon className="h-10 w-10" aria-hidden="true" />
        </div>
      </AspectRatio>
    </div>
  );
}
