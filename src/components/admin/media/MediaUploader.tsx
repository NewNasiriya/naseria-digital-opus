import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud, X, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

import { mediaLibrary, type MediaBucket, classifyMime } from "@/cms/media-library";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export type QueuedUpload = {
  id: string;
  file: File;
  status: "queued" | "uploading" | "done" | "error" | "cancelled";
  progress: number;
  error?: string;
};

interface Props {
  bucket: MediaBucket;
  folder?: string;
  accept?: string; // e.g. "image/*,application/pdf"
  maxBytes?: number;
  onDone?: () => void;
}

export function MediaUploader({ bucket, folder, accept, maxBytes = 25 * 1024 * 1024, onDone }: Props) {
  const [queue, setQueue] = useState<QueuedUpload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<Map<string, boolean>>(new Map());

  const enqueue = useCallback((files: FileList | File[]) => {
    const items: QueuedUpload[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "queued",
      progress: 0,
    }));
    setQueue((prev) => [...prev, ...items]);
  }, []);

  const runUpload = useCallback(
    async (item: QueuedUpload) => {
      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "uploading", progress: 15 } : q)));
      try {
        // Progress is coarse — Supabase JS client doesn't emit granular progress today.
        const tick = setInterval(() => {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id && q.status === "uploading" && q.progress < 85 ? { ...q, progress: q.progress + 10 } : q,
            ),
          );
        }, 400);
        try {
          if (abortRef.current.get(item.id)) throw new Error("cancelled");
          const acceptList = accept
            ? accept
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s && !s.startsWith("."))
            : undefined;
          await mediaLibrary.upload(item.file, {
            bucket,
            folder,
            maxBytes,
            accept: acceptList,
          });
        } finally {
          clearInterval(tick);
        }
        if (abortRef.current.get(item.id)) {
          setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "cancelled" } : q)));
          return;
        }
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "done", progress: 100 } : q)));
        onDone?.();
      } catch (err) {
        const message = err instanceof Error ? err.message : "فشل الرفع";
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "error", error: message } : q)));
      }
    },
    [bucket, folder, maxBytes, onDone],
  );

  useEffect(() => {
    const pending = queue.find((q) => q.status === "queued");
    if (pending) runUpload(pending);
  }, [queue, runUpload]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) enqueue(e.dataTransfer.files);
  };

  const cancel = (id: string) => {
    abortRef.current.set(id, true);
    setQueue((prev) => prev.map((q) => (q.id === id && q.status === "queued" ? { ...q, status: "cancelled" } : q)));
  };

  const retry = (id: string) => {
    abortRef.current.delete(id);
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status: "queued", progress: 0, error: undefined } : q)));
  };

  const remove = (id: string) => {
    abortRef.current.delete(id);
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const clearDone = () => {
    setQueue((prev) => prev.filter((q) => q.status !== "done"));
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="منطقة رفع الملفات — اسحب وأفلت أو اضغط للاختيار"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "grid cursor-pointer place-items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          "border-border bg-surface-muted/40 text-muted-foreground",
          dragOver && "border-primary bg-primary/5 text-primary",
        )}
      >
        <UploadCloud className="h-10 w-10" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">اسحب الملفات هنا أو اضغط للاختيار</p>
          <p className="text-xs">
            {accept ? `الأنواع المدعومة: ${accept}` : "صور، PDF، وملفات المكتب"} — حتى {Math.round(maxBytes / (1024 * 1024))} م.ب لكل ملف
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          hidden
          onChange={(e) => e.target.files && enqueue(e.target.files)}
        />
      </div>

      {queue.length > 0 && (
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2 text-xs">
            <span className="font-semibold text-foreground">قائمة الرفع ({queue.length})</span>
            <Button variant="ghost" size="sm" onClick={clearDone} className="h-7 text-xs">
              مسح المكتمل
            </Button>
          </div>
          <ul className="max-h-64 divide-y divide-border overflow-auto">
            {queue.map((q) => {
              const kind = classifyMime(q.file.type);
              return (
                <li key={q.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{q.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {kind} · {Math.round(q.file.size / 1024)} KB
                      {q.error && <span className="text-destructive"> · {q.error}</span>}
                    </p>
                    {(q.status === "uploading" || q.status === "queued") && (
                      <Progress value={q.progress} className="mt-1 h-1" />
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {q.status === "done" && <CheckCircle2 className="h-4 w-4 text-success" aria-label="مكتمل" />}
                    {q.status === "error" && (
                      <>
                        <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => retry(q.id)}>
                          <RefreshCw className="h-3 w-3" />
                          إعادة
                        </Button>
                      </>
                    )}
                    {(q.status === "queued" || q.status === "uploading") && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => cancel(q.id)}>
                        إلغاء
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      aria-label="إزالة من القائمة"
                      onClick={() => remove(q.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
