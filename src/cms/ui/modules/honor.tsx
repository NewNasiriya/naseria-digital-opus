/**
 * Honor Board CMS module — Wave A · A1.
 *
 * Manages `honor_boards` rows against the shared Wave 1 CMS
 * infrastructure. Every existing row (grade × academic year × image) is
 * preserved: `image_url` (legacy Lovable CDN URL) stays editable as a
 * fallback, and `media_id` (Media Library) takes precedence when set —
 * exactly matching the public reader in `src/lib/honor.ts`.
 *
 * No column is renamed, dropped, or backfilled. Publish / draft /
 * archive flow uses the shared content service. Delete is soft
 * (archive) by default; hard delete stays behind the shared
 * `content.delete` permission gate on the list view.
 */
import { useEffect, useState } from "react";
import { CalendarDays, GraduationCap } from "lucide-react";

import { createSupabaseRepository } from "@/cms/repository";
import type { EntityMeta } from "@/cms/types";
import {
  registerCmsModule,
  StatusCell,
  DefaultTitleCell,
} from "@/cms/ui";
import type { EntityListConfig, EntityEditorConfig } from "@/cms/ui";
import type { FieldSection } from "@/cms/ui/fields";
import { mediaLibrary } from "@/cms/media-library";
import { mediaPublicUrl } from "@/lib/media";

export interface HonorBoardRow extends EntityMeta {
  grade_id: string;
  academic_year_id: string;
  title_ar: string | null;
  description_ar: string | null;
  media_id: string | null;
  image_url: string | null;
  display_order: number;
  published_at: string | null;
  grade?: { id: string; level: number; name_ar: string } | null;
  academic_year?: { id: string; name: string } | null;
  media?: {
    bucket: string;
    storage_path: string;
    file_name: string | null;
    mime_type: string | null;
  } | null;
}

const LIST_SELECT = `
  id,grade_id,academic_year_id,title_ar,description_ar,media_id,image_url,
  status,display_order,published_at,
  created_at,updated_at,created_by,updated_by,
  grade:grades!honor_boards_grade_id_fkey(id,level,name_ar),
  academic_year:academic_years!honor_boards_academic_year_id_fkey(id,name),
  media:media!honor_boards_media_id_fkey(bucket,storage_path,file_name,mime_type)
`;

/* -------------------------------------------------------------------------- */
/* Repository                                                                 */
/* -------------------------------------------------------------------------- */

const baseRepo = createSupabaseRepository<HonorBoardRow>("honor_boards", {
  searchColumns: ["title_ar", "description_ar"],
  defaultOrderBy: "display_order",
  defaultOrderDir: "asc",
  select: LIST_SELECT,
});

/** Whitelist of writable columns on `honor_boards`. */
const WRITABLE_COLUMNS: Array<keyof HonorBoardRow> = [
  "grade_id",
  "academic_year_id",
  "title_ar",
  "description_ar",
  "media_id",
  "image_url",
  "status",
  "display_order",
  "published_at",
  "updated_at",
  "created_by",
  "updated_by",
];

function stripJoins(input: Partial<HonorBoardRow>): Partial<HonorBoardRow> {
  const out: Record<string, unknown> = {};
  for (const key of WRITABLE_COLUMNS) {
    if (key in input) out[key as string] = (input as Record<string, unknown>)[key as string];
  }
  return out as Partial<HonorBoardRow>;
}

const honorRepository = {
  ...baseRepo,
  create: (input: Partial<HonorBoardRow>) => baseRepo.create(stripJoins(input)),
  update: (id: string, patch: Partial<HonorBoardRow>) =>
    baseRepo.update(id, stripJoins(patch)),
};

/* -------------------------------------------------------------------------- */
/* List columns                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Resolves the preview URL. Mirrors `src/lib/honor.ts#resolveImage` so
 * the admin thumbnail matches exactly what visitors see.
 */
function CoverThumb({ row }: { row: HonorBoardRow }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const m = row.media;
    if (m && (m.mime_type ?? "").startsWith("image/")) {
      (async () => {
        try {
          const signed = await mediaLibrary.signedUrl({
            bucket: m.bucket as "media",
            path: m.storage_path,
            expiresInSeconds: 60 * 10,
          });
          if (!cancelled) setUrl(signed);
        } catch {
          if (!cancelled) setUrl(null);
        }
      })();
    } else if (row.image_url) {
      // Legacy CDN URL — normalise through the shared media helper so
      // `/__l5e/...` paths are rewritten to `/lovable-assets/...`.
      const normalised = mediaPublicUrl({
        bucket: "external",
        storage_path: row.image_url,
      });
      setUrl(normalised);
    } else {
      setUrl(null);
    }
    return () => {
      cancelled = true;
    };
  }, [row.media?.storage_path, row.image_url]);

  return (
    <div className="h-12 w-16 overflow-hidden rounded-md border border-border bg-surface-muted">
      {url ? (
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">
          —
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

const listConfig: EntityListConfig<HonorBoardRow> = {
  module: "honor",
  moduleTitle: "لوحة الشرف",
  entityLabel: "كشف شرف",
  primaryTitleField: "title_ar",
  requiredPermission: "honor.manage",
  supportsBulk: true,
  allowCreate: false,
  allowDuplicate: false,
  allowHardDelete: false,
  relatedQueryKeys: [["honor"]],
  pageSize: 20,
  searchPlaceholder: "بحث بعنوان الكشف…",
  publicPathFor: (row) =>
    row.grade?.level ? `/honor/grades/${row.grade.level}` : "/honor",
  columns: [
    {
      key: "cover",
      label: "الصورة",
      className: "w-20",
      render: (row) => <CoverThumb row={row} />,
    },
    {
      key: "title",
      label: "العنوان",
      render: (row) => (
        <DefaultTitleCell
          title={row.title_ar ?? row.grade?.name_ar ?? "بدون عنوان"}
          subtitle={
            row.grade?.name_ar
              ? `${row.grade.name_ar} · ${row.academic_year?.name ?? ""}`
              : undefined
          }
        />
      ),
    },
    {
      key: "grade",
      label: "الصف",
      className: "w-40",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <GraduationCap className="h-3.5 w-3.5" />
          {row.grade?.name_ar ?? "—"}
        </span>
      ),
    },
    {
      key: "academic_year",
      label: "العام الدراسي",
      className: "w-32",
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.academic_year?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "الحالة",
      className: "w-28",
      render: (row) => <StatusCell status={row.status} />,
    },
    {
      key: "display_order",
      label: "الترتيب",
      className: "w-20",
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {row.display_order ?? 0}
        </span>
      ),
    },
    {
      key: "published_at",
      label: "تاريخ النشر",
      className: "w-32",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(row.published_at)}
        </span>
      ),
    },
    {
      key: "updated_at",
      label: "آخر تعديل",
      className: "w-32",
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.updated_at)}
        </span>
      ),
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Editor sections                                                            */
/* -------------------------------------------------------------------------- */

const editorSections: FieldSection[] = [
  {
    id: "assignment",
    title: "الصف والعام الدراسي",
    columns: 2,
    fields: [
      {
        kind: "reference",
        name: "grade_id",
        label: "الصف الدراسي",
        table: "grades",
        labelField: "name_ar",
        orderBy: "level",
        required: true,
      },
      {
        kind: "reference",
        name: "academic_year_id",
        label: "العام الدراسي",
        table: "academic_years",
        labelField: "name",
        orderBy: "name",
        required: true,
      },
    ],
  },
  {
    id: "content",
    title: "محتوى الكشف",
    fields: [
      {
        kind: "text",
        name: "title_ar",
        label: "عنوان الكشف",
        dir: "rtl",
        maxLength: 200,
        placeholder: "مثال: كشف بأسماء أوائل الصف الرابع الابتدائي",
        helpText: "إن تُرك فارغًا سيُستخدم اسم الصف تلقائيًا.",
      },
      {
        kind: "textarea",
        name: "description_ar",
        label: "وصف اختياري",
        rows: 3,
        dir: "rtl",
        maxLength: 500,
      },
    ],
  },
  {
    id: "image",
    title: "صورة الكشف",
    description:
      "يمكن اختيار صورة من مكتبة الوسائط (مُفضّل) أو الإبقاء على الرابط المباشر الحالي. تظهر صورة المكتبة تلقائيًا في حال وُجدت.",
    fields: [
      {
        kind: "media",
        name: "media_id",
        label: "الصورة من مكتبة الوسائط",
        mediaKind: "image",
        folder: "honor",
        fallbackUrlField: "image_url",
        fallbackLabel: "صورة الكشف المنشورة حاليًا",
        helpText: "الصيغة الحديثة — تدعم البدائل والوصف والتصنيف.",
      },
      {
        kind: "text",
        name: "image_url",
        label: "رابط الصورة الحالي (توافق مع المحتوى القديم)",
        dir: "ltr",
        maxLength: 500,
        helpText:
          "يُستخدم فقط في حال عدم اختيار صورة من مكتبة الوسائط. لا تُعدّل هذا الحقل إلا إذا كنت تعلم مصدر الملف.",
      },
    ],
  },
  {
    id: "display",
    title: "الترتيب والنشر",
    columns: 2,
    fields: [
      {
        kind: "number",
        name: "display_order",
        label: "ترتيب العرض",
        min: 0,
        max: 999,
        helpText: "الأصغر يظهر أولًا في الصفحة العامة.",
      },
      {
        kind: "date",
        name: "published_at",
        label: "تاريخ النشر",
        helpText: "يُحدَّث تلقائيًا عند الضغط على «نشر».",
      },
    ],
  },
];

const editorConfig: EntityEditorConfig<HonorBoardRow> = {
  module: "honor",
  entityTable: "honor_boards",
  entityLabel: "كشف شرف",
  primaryTitleField: "title_ar",
  requiredPermission: "honor.manage",
  allowDuplicate: false,
  allowHardDelete: false,
  relatedQueryKeys: [["honor"]],
  publicPathFor: (row) =>
    row.grade?.level ? `/honor/grades/${row.grade.level}` : "/honor",
  createDefaults: {
    status: "draft",
    display_order: 0,
  } as Partial<HonorBoardRow>,
  sections: editorSections,
  validate: (values) => {
    const errors: Record<string, string> = {};
    if (!values.grade_id) errors.grade_id = "اختر الصف الدراسي";
    if (!values.academic_year_id)
      errors.academic_year_id = "اختر العام الدراسي";
    const hasMedia = Boolean(values.media_id);
    const hasUrl = Boolean(
      (values.image_url as string | undefined)?.trim(),
    );
    if (!hasMedia && !hasUrl) {
      errors.media_id =
        "يجب اختيار صورة من مكتبة الوسائط أو إبقاء الرابط المباشر.";
    }
    return Object.keys(errors).length ? errors : null;
  },
};

registerCmsModule<HonorBoardRow>({
  id: "honor",
  repository: honorRepository,
  list: listConfig,
  editor: editorConfig,
});

export const HONOR_MODULE_REGISTERED = true;
