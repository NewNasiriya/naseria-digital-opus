import { useQuery } from "@tanstack/react-query";
import { History, RotateCcw } from "lucide-react";

import { cmsKeys } from "@/cms/keys";
import { listVersions } from "@/cms/versions";
import type { UUID } from "@/cms/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/admin/EmptyState";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: string;
  entityTable: string;
  entityId: UUID | undefined;
  onRestore?: (snapshot: unknown) => void;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function VersionHistoryPanel({
  open,
  onOpenChange,
  module,
  entityTable,
  entityId,
  onRestore,
}: Props) {
  const versions = useQuery({
    queryKey: cmsKeys.versions(module, entityId ?? "new"),
    queryFn: () => listVersions(entityTable, entityId as UUID),
    enabled: Boolean(entityId) && open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md">
        <SheetHeader className="text-start">
          <SheetTitle className="inline-flex items-center gap-2">
            <History className="h-4 w-4" aria-hidden="true" />
            سجل الإصدارات
          </SheetTitle>
          <SheetDescription>
            لقطات محفوظة تلقائيًا لكل تعديل رئيسي. يمكنك استعادة أي إصدار سابق دون فقد
            العمل الحالي.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {!entityId ? (
            <EmptyState
              icon={History}
              title="لم يُحفظ العنصر بعد"
              description="سجل الإصدارات يظهر بعد الحفظ الأول."
            />
          ) : versions.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (versions.data ?? []).length === 0 ? (
            <EmptyState
              icon={History}
              title="لا توجد إصدارات سابقة"
              description="سيتم إنشاء لقطة تلقائيًا مع كل تحديث."
            />
          ) : (
            <ul className="space-y-2">
              {versions.data!.map((v) => (
                <li
                  key={v.id}
                  className="rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        الإصدار {v.version}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(v.created_at)}
                      </p>
                    </div>
                    {onRestore && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => onRestore(v.data)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        استعادة
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
