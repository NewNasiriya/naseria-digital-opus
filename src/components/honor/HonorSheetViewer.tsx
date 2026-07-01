import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Maximize2, Minus, Plus, Printer, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface HonorSheetViewerProps {
  imageUrl: string;
  alt: string;
  downloadFileName?: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const STEP = 0.25;

/**
 * Honor Board sheet viewer.
 * - In-page view with zoom controls.
 * - Fullscreen dialog viewer.
 * - Keyboard: +/-/0 to zoom, Esc to close.
 * - Download & Print buttons.
 */
export function HonorSheetViewer({
  imageUrl,
  alt,
  downloadFileName = "honor-board.png",
}: HonorSheetViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(MAX_ZOOM, +(z + STEP).toFixed(2))), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(MIN_ZOOM, +(z - STEP).toFixed(2))), []);
  const zoomReset = useCallback(() => setZoom(1), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!fullscreen) return;
      if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomIn(); }
      else if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomOut(); }
      else if (e.key === "0") { e.preventDefault(); zoomReset(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, zoomIn, zoomOut, zoomReset]);

  const handlePrint = () => {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    w.document.write(`<!doctype html><html dir="rtl"><head><title>${alt}</title><style>
      html,body{margin:0;padding:0;background:#fff;}
      img{display:block;width:100%;height:auto;}
      @media print{@page{margin:8mm;}}
    </style></head><body><img src="${imageUrl}" alt="${alt}" onload="setTimeout(()=>{window.print();window.close();},250)"/></body></html>`);
    w.document.close();
  };

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={zoomOut} disabled={zoom <= MIN_ZOOM} aria-label="تصغير">
        <Minus className="h-4 w-4" aria-hidden="true" />
      </Button>
      <span className="min-w-[3.5rem] rounded-md border border-border bg-surface px-3 py-1 text-center text-sm font-medium text-foreground" aria-live="polite">
        {Math.round(zoom * 100)}%
      </span>
      <Button type="button" variant="outline" size="sm" onClick={zoomIn} disabled={zoom >= MAX_ZOOM} aria-label="تكبير">
        <Plus className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={zoomReset} aria-label="إعادة الضبط">
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card elevation-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted p-4">
          {controls}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFullscreen(true)}
              aria-label="عرض بملء الشاشة"
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
              ملء الشاشة
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              طباعة
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={imageUrl} download={downloadFileName} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4" aria-hidden="true" />
                تنزيل
              </a>
            </Button>
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative max-h-[85vh] overflow-auto bg-surface-muted p-4"
        >
          <div className="mx-auto w-fit">
            <img
              src={imageUrl}
              alt={alt}
              loading="lazy"
              decoding="async"
              draggable={false}
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
              className="mx-auto block max-w-full rounded-md bg-white shadow-sm transition-transform duration-200 ease-out"
            />
          </div>
        </div>
      </div>

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[100vw] h-[100dvh] p-0 gap-0 border-0 rounded-none bg-background/98 backdrop-blur sm:max-w-[100vw]">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-background/95 p-3 pe-14 backdrop-blur">
            {controls}
          </div>
          <div className="flex-1 overflow-auto p-4">
            <div className="mx-auto w-fit">
              <img
                src={imageUrl}
                alt={alt}
                draggable={false}
                style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
                className="mx-auto block max-w-full rounded-md bg-white shadow-sm transition-transform duration-200 ease-out"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
