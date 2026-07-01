import { useState } from "react";
import { Download, Maximize2, Printer, X } from "lucide-react";

import calendarAsset from "@/assets/academic/calendar-2026-2027.png.asset.json";
import { Button } from "@/components/ui/button";

/**
 * Official Ministry academic calendar viewer.
 * Displays the ministry's published document exactly as issued, with
 * fullscreen, download, and print affordances. Lazy-loaded for Lighthouse.
 */
export function OfficialCalendarViewer() {
  const [fullscreen, setFullscreen] = useState(false);

  const download = () => {
    const a = document.createElement("a");
    a.href = calendarAsset.url;
    a.download = calendarAsset.original_filename || "academic-calendar.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const print = () => {
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) return;
    w.document.write(
      `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>التقويم الأكاديمي 2026 / 2027</title>
       <style>html,body{margin:0;padding:0;background:#fff}img{width:100%;height:auto;display:block}@page{size:auto;margin:12mm}</style>
       </head><body><img src="${calendarAsset.url}" alt="التقويم الأكاديمي 2026 / 2027" onload="setTimeout(()=>window.print(),150)"></body></html>`,
    );
    w.document.close();
  };

  return (
    <figure className="overflow-hidden rounded-3xl border border-border bg-card elevation-sm">
      <figcaption className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted px-5 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            التقويم الأكاديمي الرسمي 2026 / 2027
          </p>
          <p className="text-xs text-muted-foreground">
            وثيقة رسمية معتمدة من وزارة التربية والتعليم.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setFullscreen(true)}>
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
            عرض بملء الشاشة
          </Button>
          <Button size="sm" variant="outline" onClick={print}>
            <Printer className="h-4 w-4" aria-hidden="true" />
            طباعة
          </Button>
          <Button size="sm" onClick={download}>
            <Download className="h-4 w-4" aria-hidden="true" />
            تحميل
          </Button>
        </div>
      </figcaption>
      <div className="bg-white p-4 sm:p-6">
        <img
          src={calendarAsset.url}
          alt="التقويم الأكاديمي الرسمي للعام 2026 / 2027 يوضح مواعيد بدء الدراسة، الامتحانات، الإجازات، والفعاليات."
          loading="lazy"
          decoding="async"
          className="mx-auto block h-auto w-full max-w-3xl rounded-lg"
        />
      </div>

      {fullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="عرض التقويم الأكاديمي بملء الشاشة"
          className="fixed inset-0 z-50 flex flex-col bg-black/90"
          onClick={() => setFullscreen(false)}
        >
          <div className="flex items-center justify-end p-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreen(false);
              }}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              إغلاق
            </Button>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-auto p-4">
            <img
              src={calendarAsset.url}
              alt="التقويم الأكاديمي الرسمي 2026 / 2027"
              className="mx-auto max-h-full w-auto max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </figure>
  );
}
