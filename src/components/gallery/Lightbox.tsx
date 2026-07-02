import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { mediaPublicUrl } from "@/lib/media";
import type { AlbumPhoto } from "@/lib/gallery";

interface LightboxProps {
  photos: AlbumPhoto[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export function Lightbox({ photos, index, onClose, onIndexChange }: LightboxProps) {
  const total = photos.length;
  const photo = photos[index];

  const next = useCallback(
    () => onIndexChange((index + 1) % total),
    [index, total, onIndexChange]
  );
  const prev = useCallback(
    () => onIndexChange((index - 1 + total) % total),
    [index, total, onIndexChange]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") next();
      else if (e.key === "ArrowRight") prev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [next, prev, onClose]);

  if (!photo || !photo.media) return null;
  const url = mediaPublicUrl(photo.media);
  const alt = photo.caption_ar ?? photo.media.alt_ar ?? "صورة من الألبوم";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="عارض الصور"
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-4 text-white/90">
        <span className="text-sm font-medium tabular-nums">
          {index + 1} / {total}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="إغلاق"
          className="text-white hover:bg-white/10 hover:text-white min-h-11 min-w-11"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
        {url && (
          <img
            src={url}
            alt={alt}
            className="max-h-full max-w-full select-none object-contain animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {total > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label="السابق"
              className="absolute end-3 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white min-h-11 min-w-11"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="التالي"
              className="absolute start-3 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 hover:text-white min-h-11 min-w-11"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {photo.caption_ar && (
        <div
          className="px-6 pb-6 pt-2 text-center text-sm text-white/80"
          onClick={(e) => e.stopPropagation()}
        >
          {photo.caption_ar}
        </div>
      )}
    </div>
  );
}
