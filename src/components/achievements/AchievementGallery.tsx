import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { AchievementGalleryItem } from "@/lib/achievements";

interface AchievementGalleryProps {
  items: AchievementGalleryItem[];
  title: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const STEP = 0.5;
const SWIPE_THRESHOLD = 50;

/**
 * Premium image gallery with lightbox:
 * - Responsive masonry-style grid
 * - Fullscreen lightbox with keyboard (←/→ nav, +/-/0 zoom, Esc close)
 * - Touch swipe navigation on mobile
 * - Lazy loading, async decoding
 */
export function AchievementGallery({ items, title }: AchievementGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const touchStartX = useRef<number | null>(null);

  const open = openIndex !== null;
  const total = items.length;
  const current = openIndex !== null ? items[openIndex] : null;

  const close = useCallback(() => {
    setOpenIndex(null);
    setZoom(1);
  }, []);

  const goPrev = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i - 1 + total) % total));
    setZoom(1);
  }, [total]);

  const goNext = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : (i + 1) % total));
    setZoom(1);
  }, [total]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") goNext(); // RTL: left arrow = next
      else if (e.key === "ArrowRight") goPrev();
      else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoom((z) => Math.min(MAX_ZOOM, +(z + STEP).toFixed(2)));
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setZoom((z) => Math.max(MIN_ZOOM, +(z - STEP).toFixed(2)));
      } else if (e.key === "0") {
        e.preventDefault();
        setZoom(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, goPrev, goNext]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      // RTL: swipe left → next (visual next-in-flow)
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  if (items.length === 0) return null;

  return (
    <>
      <ul
        role="list"
        aria-label={`معرض صور: ${title}`}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {items.map((item, idx) => {
          const alt = item.alt_ar ?? item.caption_ar ?? `${title} — صورة ${idx + 1}`;
          const isTall = idx % 5 === 0;
          return (
            <li key={item.id} className={cn(isTall && "sm:row-span-2")}>
              <button
                type="button"
                onClick={() => {
                  setOpenIndex(idx);
                  setZoom(1);
                }}
                className={cn(
                  "group relative block h-full w-full overflow-hidden rounded-2xl border border-border bg-surface-muted text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isTall ? "aspect-[4/5] sm:aspect-[3/4]" : "aspect-[4/3]",
                )}
                aria-label={`فتح الصورة: ${alt}`}
              >
                <img
                  src={item.url}
                  alt={alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                />
                {item.caption_ar && (
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="line-clamp-2 text-sm font-medium leading-relaxed text-white drop-shadow">
                      {item.caption_ar}
                    </p>
                  </div>
                )}
                <div className="absolute top-3 end-3 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-[11px] font-semibold text-foreground opacity-0 elevation-sm transition-opacity group-hover:opacity-100">
                  <Maximize2 className="h-3 w-3" aria-hidden="true" />
                  تكبير
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog open={open} onOpenChange={(v) => !v && close()}>
        <DialogContent
          className="max-w-[100vw] h-[100dvh] p-0 gap-0 border-0 rounded-none bg-background/98 backdrop-blur sm:max-w-[100vw]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {current && (
            <div
              className="relative flex h-full w-full flex-col"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div className="flex items-center justify-between gap-3 border-b border-border bg-background/95 p-3 pe-14 backdrop-blur">
                <div className="min-w-0 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {openIndex! + 1} / {total}
                  </span>
                  {current.caption_ar && (
                    <span className="ms-3 hidden truncate text-foreground sm:inline">
                      {current.caption_ar}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - STEP).toFixed(2)))}
                    disabled={zoom <= MIN_ZOOM}
                    aria-label="تصغير"
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <span
                    className="min-w-[3.25rem] rounded-md border border-border bg-surface px-2 py-1 text-center text-xs font-medium text-foreground"
                    aria-live="polite"
                  >
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + STEP).toFixed(2)))}
                    disabled={zoom >= MAX_ZOOM}
                    aria-label="تكبير"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(1)}
                    aria-label="إعادة الضبط"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={current.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="تنزيل الصورة"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={close}
                    aria-label="إغلاق"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div className="relative flex-1 overflow-auto bg-black/95">
                <div className="mx-auto flex min-h-full w-fit items-center justify-center p-4">
                  <img
                    src={current.url}
                    alt={current.alt_ar ?? current.caption_ar ?? title}
                    draggable={false}
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: "center center",
                    }}
                    className="max-h-[85dvh] w-auto max-w-full rounded-md bg-black object-contain transition-transform duration-200 ease-out"
                  />
                </div>

                {total > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      aria-label="الصورة السابقة"
                      className="absolute top-1/2 end-3 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground elevation-sm backdrop-blur transition hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ChevronRight className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      aria-label="الصورة التالية"
                      className="absolute top-1/2 start-3 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground elevation-sm backdrop-blur transition hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>

              {current.caption_ar && (
                <div className="border-t border-border bg-background/95 p-4 text-center text-sm text-muted-foreground backdrop-blur sm:hidden">
                  {current.caption_ar}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
