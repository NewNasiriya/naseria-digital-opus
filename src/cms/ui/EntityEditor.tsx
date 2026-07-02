/**
 * Reusable editor for any CMS entity.
 *
 * Wires: field rendering, autosave (drafts), unsaved-changes guard,
 * publishing lifecycle (draft/publish/unpublish/archive/restore/duplicate),
 * preview, version history, permission gating.
 *
 * Modules declare only their field schema and identifiers; no module
 * implements its own form runtime.
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import {
  Archive,
  Copy,
  Eye,
  History,
  Loader2,
  RotateCcw,
  Save,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";
import type { Permission } from "@/lib/auth/permissions";

import { useCmsEntity, useCmsMutations } from "../hooks";
import { useAutosave, useUnsavedChangesGuard } from "../autosave";
import { recordSnapshot } from "../versions";
import { messageFor } from "../errors";
import type { Repository } from "../repository";
import type { ContentService } from "../service";
import type { EntityMeta, UUID } from "../types";

import { AutosaveIndicator } from "./AutosaveIndicator";
import { StatusBadge } from "./StatusBadge";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import { FieldRenderer } from "./FieldRenderer";
import type { FieldSection } from "./fields";

export interface EntityEditorConfig<T extends EntityMeta> {
  module: string;
  entityTable: string;
  entityLabel: string; // singular, e.g. "خبر"
  primaryTitleField: keyof T & string;
  sections: FieldSection[];
  requiredPermission: Permission;
  /** Extra defaults applied when creating a new entity. */
  createDefaults?: Partial<T>;
  /** Optional public URL builder for the "preview" button. */
  publicPathFor?: (row: T) => string | null;
  /** Optional field-level validator. Return `{ [name]: "message" }` for errors. */
  validate?: (values: Partial<T>) => Record<string, string> | null;
}

interface Props<T extends EntityMeta> {
  config: EntityEditorConfig<T>;
  repository: Repository<T>;
  service: ContentService<T>;
  id: UUID | undefined; // undefined means "new"
  listHref: string;
}

export function EntityEditor<T extends EntityMeta>({
  config,
  repository,
  service,
  id,
  listHref,
}: Props<T>) {
  const router = useRouter();
  const navigate = useNavigate();
  const { can, profile } = useAuth();
  const canManage = can(config.requiredPermission);
  const canPublish = can("content.publish");
  const canArchive = can("content.archive");
  const canDelete = can("content.delete");

  const entity = useCmsEntity<T>(config.module, repository, id);
  const mutations = useCmsMutations<T>(config.module, service);

  const [values, setValues] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [restoringId, setRestoringId] = useState<UUID | undefined>(id);

  // Load fetched values into form state.
  useEffect(() => {
    if (entity.data) {
      setValues(entity.data as Partial<T>);
    } else if (!id) {
      setValues({ ...(config.createDefaults ?? {}) } as Partial<T>);
    }
  }, [entity.data, id, config.createDefaults]);

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value } as Partial<T>));
    setErrors((prev) => {
      if (!(name in prev)) return prev;
      const { [name]: _drop, ...rest } = prev;
      return rest;
    });
  }, []);

  const runValidation = useCallback((): Record<string, string> => {
    const collected: Record<string, string> = {};
    for (const section of config.sections) {
      for (const f of section.fields) {
        if (f.kind === "readonly") continue;
        if ("required" in f && f.required) {
          const v = values[f.name as keyof T];
          if (v === undefined || v === null || v === "") {
            collected[f.name] = "هذا الحقل مطلوب";
          }
        }
      }
    }
    const extra = config.validate?.(values);
    if (extra) Object.assign(collected, extra);
    return collected;
  }, [config, values]);

  // Autosave draft. Enabled only when editing an existing record, we have
  // manage permission, and status is not "published" (we never mutate a live
  // record via autosave — user must click Publish explicitly).
  const autosaveEnabled =
    !!id && canManage && (values.status ?? "draft") !== "published";

  const persistDraft = useCallback(
    async (v: Partial<T>) => {
      if (!id) return;
      const errs = runValidation();
      if (Object.keys(errs).length > 0) {
        // Skip autosave while invalid; user still sees errors via manual save.
        throw new Error("validation");
      }
      const saved = await service.saveDraft({ ...v, id });
      // Snapshot after successful autosave.
      try {
        await recordSnapshot({
          entityTable: config.entityTable,
          entityId: id,
          data: saved,
          actorId: profile?.id ?? null,
        });
      } catch {
        /* snapshot is best-effort */
      }
    },
    [id, service, runValidation, config.entityTable, profile?.id],
  );

  const autosave = useAutosave<Partial<T>>({
    value: values,
    onSave: persistDraft,
    enabled: autosaveEnabled,
    delay: 1800,
  });

  useUnsavedChangesGuard(autosave.isDirty);

  const handleManualSave = async () => {
    const errs = runValidation();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("راجع الحقول المطلوبة قبل الحفظ.");
      return;
    }
    try {
      const saved = await service.saveDraft({ ...values, id });
      toast.success("تم حفظ المسودة");
      if (!id) {
        setRestoringId(saved.id);
        navigate({
          to: ".",
          search: (prev: Record<string, unknown>) => ({ ...prev, id: saved.id }),
          replace: true,
        });
      }
      try {
        await recordSnapshot({
          entityTable: config.entityTable,
          entityId: saved.id,
          data: saved,
          actorId: profile?.id ?? null,
        });
      } catch {
        /* snapshot is best-effort */
      }
      router.invalidate();
    } catch (e) {
      toast.error(messageFor(e as never));
    }
  };

  const handlePublish = async () => {
    const errs = runValidation();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("لا يمكن النشر — راجع الحقول المطلوبة.");
      return;
    }
    try {
      const saved = await service.saveDraft({ ...values, id });
      const publishId = id ?? saved.id;
      await mutations.publish.mutateAsync(publishId);
      toast.success("تم نشر المحتوى على الموقع.");
      if (!id) {
        setRestoringId(saved.id);
        navigate({
          to: ".",
          search: (prev: Record<string, unknown>) => ({ ...prev, id: saved.id }),
          replace: true,
        });
      }
      router.invalidate();
    } catch (e) {
      toast.error(messageFor(e as never));
    }
  };


  const handleUnpublish = async () => {
    if (!id) return;
    try {
      await mutations.unpublish.mutateAsync(id);
      toast.success("تم إلغاء النشر.");
    } catch (e) {
      toast.error(messageFor(e as never));
    }
  };

  const handleArchive = async () => {
    if (!id) return;
    try {
      await mutations.archive.mutateAsync(id);
      toast.success("تمت الأرشفة.");
    } catch (e) {
      toast.error(messageFor(e as never));
    }
  };

  const handleRestore = async () => {
    if (!id) return;
    try {
      await mutations.restore.mutateAsync(id);
      toast.success("تمت الاستعادة.");
    } catch (e) {
      toast.error(messageFor(e as never));
    }
  };

  const handleDuplicate = async () => {
    if (!id) return;
    try {
      const copy = await mutations.duplicate.mutateAsync(id);
      toast.success("تم إنشاء نسخة جديدة.");
      navigate({
        to: ".",
        search: (prev: Record<string, unknown>) => ({ ...prev, id: copy.id }),
      });
    } catch (e) {
      toast.error(messageFor(e as never));
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await mutations.remove.mutateAsync(id);
      toast.success("تم الحذف.");
      navigate({ to: listHref });
    } catch (e) {
      toast.error(messageFor(e as never));
    }
  };

  const handleRestoreVersion = (snapshot: unknown) => {
    if (!snapshot || typeof snapshot !== "object") return;
    setValues((prev) => ({ ...prev, ...(snapshot as Partial<T>) }));
    setHistoryOpen(false);
    toast.success("تمت استعادة الإصدار. اضغط حفظ للتأكيد.");
  };

  const currentStatus = (values.status ?? "draft") as EntityMeta["status"];
  const record = values as T;
  const publicPath = id && config.publicPathFor ? config.publicPathFor(record) : null;
  const title = (values[config.primaryTitleField] as string | undefined) ?? "";

  if (id && entity.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (id && entity.isError) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
        تعذّر تحميل العنصر: {messageFor(entity.error!)}
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        ليس لديك صلاحية لتحرير محتوى {config.entityLabel}.
      </div>
    );
  }

  return (
    <>
      {/* Editor toolbar */}
      <div className="sticky top-16 z-20 -mx-4 mb-6 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <StatusBadge status={currentStatus} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground" title={title}>
                {title || `${config.entityLabel} جديد`}
              </p>
              <div className="mt-0.5">
                <AutosaveIndicator
                  status={autosave.status}
                  savedAt={autosave.savedAt}
                  isDirty={autosave.isDirty}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {publicPath && currentStatus === "published" && (
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <a href={publicPath} target="_blank" rel="noreferrer">
                  <Eye className="h-3.5 w-3.5" />
                  معاينة
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setHistoryOpen(true)}
              disabled={!id}
            >
              <History className="h-3.5 w-3.5" />
              السجل
            </Button>
            {id && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleDuplicate}
              >
                <Copy className="h-3.5 w-3.5" />
                تكرار
              </Button>
            )}
            {id && canArchive && currentStatus !== "archived" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleArchive}
              >
                <Archive className="h-3.5 w-3.5" />
                أرشفة
              </Button>
            )}
            {id && currentStatus === "archived" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleRestore}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                استعادة
              </Button>
            )}
            {id && canDelete && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleManualSave}
              disabled={mutations.saveDraft.isPending}
            >
              {mutations.saveDraft.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              حفظ مسودة
            </Button>
            {canPublish && currentStatus === "published" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleUnpublish}
              >
                <Undo2 className="h-3.5 w-3.5" />
                إلغاء النشر
              </Button>
            )}
            {canPublish && currentStatus !== "published" && (
              <Button size="sm" className="gap-1.5" onClick={handlePublish}>
                <Send className="h-3.5 w-3.5" />
                نشر مباشرة
              </Button>
            )}

          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6 pb-16">
        {config.sections.map((section) => (
          <section
            key={section.id}
            className="rounded-2xl border border-border bg-card p-5"
          >
            {(section.title || section.description) && (
              <header className="mb-4 border-b border-border pb-3">
                {section.title && (
                  <h2 className="text-base font-semibold text-foreground">
                    {section.title}
                  </h2>
                )}
                {section.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {section.description}
                  </p>
                )}
              </header>
            )}
            <div
              className={
                section.columns === 2
                  ? "grid grid-cols-1 gap-4 md:grid-cols-2"
                  : "space-y-4"
              }
            >
              {section.fields.map((field) => (
                <FieldRenderer
                  key={field.name}
                  field={field}
                  value={values[field.name as keyof T]}
                  values={values as Record<string, unknown>}
                  onChange={handleChange}
                  disabled={!canManage}
                  error={errors[field.name]}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <VersionHistoryPanel
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        module={config.module}
        entityTable={config.entityTable}
        entityId={restoringId ?? id}
        onRestore={handleRestoreVersion}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف {config.entityLabel} نهائيًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. يُفضّل الأرشفة بدلًا من الحذف للاحتفاظ
              بسجل كامل.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

