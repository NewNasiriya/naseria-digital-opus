import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import type { AutosaveStatus } from "@/cms/autosave";

interface Props {
  status: AutosaveStatus;
  savedAt: Date | null;
  isDirty: boolean;
}

function relativeTime(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 5) return "الآن";
  if (s < 60) return `قبل ${s} ثانية`;
  const m = Math.floor(s / 60);
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.floor(m / 60);
  return `قبل ${h} ساعة`;
}

export function AutosaveIndicator({ status, savedAt, isDirty }: Props) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        جارِ الحفظ…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
        <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
        تعذّر الحفظ التلقائي
      </span>
    );
  }
  if (isDirty) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
        تغييرات غير محفوظة
      </span>
    );
  }
  if (status === "saved" && savedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-success">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        محفوظ · {relativeTime(savedAt)}
      </span>
    );
  }
  return null;
}
