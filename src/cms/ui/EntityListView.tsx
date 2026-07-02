/**
 * Reusable list view for any CMS module.
 *
 * Handles: search, status filter, sort, pagination, bulk publish/unpublish/
 * archive/delete, per-row actions (edit/duplicate/preview/delete), and
 * permission gating.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Archive,
  ChevronsDown,
  ChevronsUp,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { EmptyState } from "@/components/admin/EmptyState";
import { useAuth } from "@/lib/auth";
import type { Permission } from "@/lib/auth/permissions";

import { useCmsList, useCmsMutations } from "../hooks";
import { messageFor } from "../errors";
import type { Repository } from "../repository";
import type { ContentService } from "../service";
import type { ContentStatus, EntityMeta, ListQuery, UUID } from "../types";

import { StatusBadge } from "./StatusBadge";

export interface ListColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface EntityListConfig<T extends EntityMeta> {
  module: string;
  moduleTitle: string;
  entityLabel: string; // singular, e.g. "خبر"
  primaryTitleField: keyof T & string;
  columns: ListColumn<T>[];
  searchPlaceholder?: string;
  supportsBulk?: boolean;
  requiredPermission: Permission;
  publicPathFor?: (row: T) => string | null;
  pageSize?: number;
}

interface Props<T extends EntityMeta> {
  config: EntityListConfig<T>;
  repository: Repository<T>;
  service: ContentService<T>;
  editHrefFor: (id: UUID) => string;
  newHref: string;
}

const STATUS_OPTIONS: { value: ContentStatus | "all"; label: string }[] = [
  { value: "all", label: "كل الحالات" },
  { value: "published", label: "المنشور" },
  { value: "draft", label: "المسودات" },
  { value: "archived", label: "المؤرشف" },
];

export function EntityListView<T extends EntityMeta>({
  config,
  repository,
  service,
  editHrefFor,
  newHref,
}: Props<T>) {
  const { can } = useAuth();
  const canManage = can(config.requiredPermission);
  const canPublish = can("content.publish");
  const canArchive = can("content.archive");
  const canDelete = can("content.delete");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ContentStatus | "all">("all");
  const [orderBy, setOrderBy] = useState<string>("updated_at");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<UUID>>(new Set());
  const [confirm, setConfirm] = useState<
    | { kind: "delete-row"; id: UUID; title: string }
    | { kind: "bulk-delete"; ids: UUID[] }
    | null
  >(null);

  const pageSize = config.pageSize ?? 20;

  const query = useMemo<ListQuery>(
    () => ({
      search: search.trim() || undefined,
      status,
      orderBy,
      orderDir,
      limit: pageSize,
      offset: page * pageSize,
    }),
    [search, status, orderBy, orderDir, page, pageSize],
  );

  const list = useCmsList<T>(config.module, repository, query);
  const mutations = useCmsMutations<T>(config.module, service);

  const rows = list.data?.rows ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r.id)));
    }
  };

  const toggleRow = (id: UUID) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBulk = async (
    action: "publish" | "unpublish" | "archive" | "restore" | "delete",
  ) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const fn = {
      publish: mutations.publish.mutateAsync,
      unpublish: mutations.unpublish.mutateAsync,
      archive: mutations.archive.mutateAsync,
      restore: mutations.restore.mutateAsync,
      delete: mutations.remove.mutateAsync,
    }[action];
    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      try {
        await fn(id);
        ok++;
      } catch (err) {
        fail++;
        toast.error(messageFor(err as never));
      }
    }
    setSelected(new Set());
    toast.success(`تم تنفيذ العملية على ${ok} عنصر${fail ? ` (فشل ${fail})` : ""}.`);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={config.searchPlaceholder ?? `بحث في ${config.moduleTitle}…`}
            aria-label="بحث"
            className="h-10 ps-3 pe-10 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as ContentStatus | "all");
              setPage(0);
            }}
          >
            <SelectTrigger className="h-10 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={`${orderBy}:${orderDir}`}
            onValueChange={(v) => {
              const [f, d] = v.split(":");
              setOrderBy(f);
              setOrderDir(d as "asc" | "desc");
            }}
          >
            <SelectTrigger className="h-10 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at:desc">الأحدث تعديلًا</SelectItem>
              <SelectItem value="updated_at:asc">الأقدم تعديلًا</SelectItem>
              <SelectItem value="created_at:desc">الأحدث إنشاءً</SelectItem>
              <SelectItem value="created_at:asc">الأقدم إنشاءً</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk bar */}
      {config.supportsBulk !== false && selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
          <p className="text-sm text-foreground">
            تم اختيار <strong>{selected.size}</strong> عنصر
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {canPublish && (
              <>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => runBulk("publish")}>
                  <Send className="h-3.5 w-3.5" /> نشر
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => runBulk("unpublish")}>
                  <Undo2 className="h-3.5 w-3.5" /> إلغاء النشر
                </Button>
              </>
            )}
            {canArchive && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => runBulk("archive")}>
                <Archive className="h-3.5 w-3.5" /> أرشفة
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => runBulk("restore")}>
              <RotateCcw className="h-3.5 w-3.5" /> استعادة
            </Button>
            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setConfirm({ kind: "bulk-delete", ids: Array.from(selected) })}
              >
                <Trash2 className="h-3.5 w-3.5" /> حذف
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              مسح الاختيار
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {list.isLoading ? (
          <div className="p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="mb-2 h-12 w-full" />
            ))}
          </div>
        ) : list.isError ? (
          <div className="p-6 text-sm text-destructive">
            تعذّر تحميل البيانات: {messageFor(list.error!)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Plus}
            title={`لا يوجد ${config.entityLabel} حاليًا`}
            description="ابدأ بإنشاء أول عنصر لعرضه على الموقع."
            action={
              canManage ? (
                <Button size="sm" className="gap-1.5" asChild>
                  <Link to={newHref}>
                    <Plus className="h-4 w-4" />
                    إضافة {config.entityLabel}
                  </Link>
                </Button>
              ) : null
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {config.supportsBulk !== false && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={toggleAll}
                      aria-label="تحديد الكل"
                    />
                  </TableHead>
                )}
                {config.columns.map((c) => (
                  <TableHead key={c.key} className={c.className}>
                    {c.label}
                  </TableHead>
                ))}
                <TableHead className="w-10 text-end">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const publicPath = config.publicPathFor?.(row) ?? null;
                const title = (row as Record<string, unknown>)[config.primaryTitleField] as string;
                return (
                  <TableRow key={row.id}>
                    {config.supportsBulk !== false && (
                      <TableCell className="w-10">
                        <Checkbox
                          checked={selected.has(row.id)}
                          onCheckedChange={() => toggleRow(row.id)}
                          aria-label={`تحديد ${title}`}
                        />
                      </TableCell>
                    )}
                    {config.columns.map((c) => (
                      <TableCell key={c.key} className={c.className}>
                        {c.render(row)}
                      </TableCell>
                    ))}
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">إجراءات</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={editHrefFor(row.id)}>
                              <Pencil className="me-2 h-3.5 w-3.5" /> تحرير
                            </Link>
                          </DropdownMenuItem>
                          {publicPath && (
                            <DropdownMenuItem asChild>
                              <a href={publicPath} target="_blank" rel="noreferrer">
                                <Eye className="me-2 h-3.5 w-3.5" /> معاينة
                              </a>
                            </DropdownMenuItem>
                          )}
                          {canPublish && row.status !== "published" && (
                            <DropdownMenuItem
                              onSelect={async () => {
                                try {
                                  await mutations.publish.mutateAsync(row.id);
                                  toast.success("تم النشر");
                                } catch (e) {
                                  toast.error(messageFor(e as never));
                                }
                              }}
                            >
                              <Send className="me-2 h-3.5 w-3.5" /> نشر
                            </DropdownMenuItem>
                          )}
                          {canPublish && row.status === "published" && (
                            <DropdownMenuItem
                              onSelect={async () => {
                                try {
                                  await mutations.unpublish.mutateAsync(row.id);
                                  toast.success("تم إلغاء النشر");
                                } catch (e) {
                                  toast.error(messageFor(e as never));
                                }
                              }}
                            >
                              <Undo2 className="me-2 h-3.5 w-3.5" /> إلغاء النشر
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onSelect={async () => {
                              try {
                                await mutations.duplicate.mutateAsync(row.id);
                                toast.success("تم إنشاء نسخة");
                              } catch (e) {
                                toast.error(messageFor(e as never));
                              }
                            }}
                          >
                            <Copy className="me-2 h-3.5 w-3.5" /> تكرار
                          </DropdownMenuItem>
                          {canArchive && row.status !== "archived" && (
                            <DropdownMenuItem
                              onSelect={async () => {
                                try {
                                  await mutations.archive.mutateAsync(row.id);
                                  toast.success("تمت الأرشفة");
                                } catch (e) {
                                  toast.error(messageFor(e as never));
                                }
                              }}
                            >
                              <Archive className="me-2 h-3.5 w-3.5" /> أرشفة
                            </DropdownMenuItem>
                          )}
                          {row.status === "archived" && (
                            <DropdownMenuItem
                              onSelect={async () => {
                                try {
                                  await mutations.restore.mutateAsync(row.id);
                                  toast.success("تمت الاستعادة");
                                } catch (e) {
                                  toast.error(messageFor(e as never));
                                }
                              }}
                            >
                              <RotateCcw className="me-2 h-3.5 w-3.5" /> استعادة
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={() =>
                                  setConfirm({ kind: "delete-row", id: row.id, title })
                                }
                              >
                                <Trash2 className="me-2 h-3.5 w-3.5" /> حذف نهائي
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {rows.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>
            صفحة {page + 1} من {totalPages} · {total} عنصر
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="gap-1"
            >
              <ChevronsUp className="h-3.5 w-3.5 rotate-90" />
              السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="gap-1"
            >
              التالي
              <ChevronsDown className="h-3.5 w-3.5 rotate-90" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "bulk-delete"
                ? `حذف ${confirm.ids.length} عنصر نهائيًا؟`
                : "حذف العنصر نهائيًا؟"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. يفضّل الأرشفة بدلًا من الحذف للاحتفاظ بسجل
              كامل.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!confirm) return;
                try {
                  if (confirm.kind === "delete-row") {
                    await mutations.remove.mutateAsync(confirm.id);
                    toast.success("تم الحذف");
                  } else {
                    for (const id of confirm.ids) {
                      await mutations.remove.mutateAsync(id);
                    }
                    setSelected(new Set());
                    toast.success(`تم حذف ${confirm.ids.length} عنصر`);
                  }
                } catch (e) {
                  toast.error(messageFor(e as never));
                }
                setConfirm(null);
              }}
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function DefaultTitleCell({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-foreground" title={title}>
        {title}
      </p>
      {subtitle && (
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

export function StatusCell({ status }: { status: ContentStatus }) {
  return <StatusBadge status={status} />;
}
