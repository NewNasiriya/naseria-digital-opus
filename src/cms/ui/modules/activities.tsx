/**
 * Activities CMS module — Wave A · A3.
 *
 * Manages `activities` rows against the shared Wave 1 CMS infrastructure.
 * Schema mapping is preserved 1:1 with the database:
 *   • `cover_image_media_id` — Media Library reference (no legacy URL
 *     column exists on this table);
 *   • `activity_media` rows are edited via the inline gallery panel;
 *   • `event_date`, `is_featured`, `scheduled_at`, `og_image_id`,
 *     SEO fields, and view counters map directly.
 *
 * No schema is renamed, dropped, or backfilled. The public
 * `/activities` route is intentionally left untouched by this wave —
 * only the admin surface is added. Delete is soft (archive) by default;
 * hard delete stays gated on `content.delete` in the shared list view.
 */
import { useEffect, useState } from "react";
import { CalendarDays, Eye, Star } from "lucide-react";

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

import { ActivityGalleryPanel } from "./ActivityGalleryPanel";

export interface ActivityRow extends EntityMeta {
  title_ar: string;
  title_en: string | null;
  slug: string;
  summary_ar: string | null;
  summary_en: string | null;
  body_ar: string | null;
  body_en: string | null;
  category_id: string | null;
  cover_image_media_id: string | null;
  og_image_id: string | null;
  event_date: string | null;
  scheduled_at: string | null;
  is_featured: boolean;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  view_count: number;
  category?: { id: string; name_ar: string; key: string } | null;
  cover_media?: {
    bucket: string;
    storage_path: string;
    file_name: string | null;
    mime_type: string | null;
  } | null;
}

const LIST_SELECT = `
  id,title_ar,title_en,slug,status,is_featured,
  event_date,scheduled_at,published_at,view_count,
  category_id,cover_image_media_id,og_image_id,
  summary_ar,summary_en,body_ar,body_en,
  seo_title,seo_description,
  created_at,updated_at,created_by,updated_by,
  category:activity_categories!activities_category_id_fkey(id,name_ar,key),
  cover_media:media!activities_cover_image_media_id_fkey(bucket,storage_path,file_name,mime_type)
`;

/* -------------------------------------------------------------------------- */
/* Repository                                                                 */
/* -------------------------------------------------------------------------- */

const baseRepo = createSupabaseRepository<ActivityRow>("activities", {
  slugColumn: "slug",
  searchColumns: ["title_ar", "title_en", "summary_ar"],
  defaultOrderBy: "updated_at",
  select: LIST_SELECT,
});

/** Whitelist of writable columns on the `activities` table. */
const WRITABLE_COLUMNS: Array<keyof ActivityRow> = [
  "title_ar",
  "title_en",
  "slug",
  "summary_ar",
  "summary_en",
  "body_ar",
  "body_en",
  "category_id",
  "cover_image_media_id",
  "og_image_id",
  "event_date",
  "scheduled_at",
  "is_featured",
  "published_at",
  "seo_title",
  "seo_description",
  "status",
  "updated_at",
  "created_by",
  "updated_by",
];

function stripJoins(input: Partial<ActivityRow>): Partial<ActivityRow> {
  const out: Record<string, unknown> = {};
  for (const key of WRITABLE_COLUMNS) {
    if (key in input) out[key as string] = (input as Record<string, unknown>)[key as string];
  }
  return out as Partial<ActivityRow>;
}

const activitiesRepository = {
  ...baseRepo,
  create: (input: Partial<ActivityRow>) => baseRepo.create(stripJoins(input)),
  update: (id: string, patch: Partial<ActivityRow>) =>
    baseRepo.update(id, stripJoins(patch)),
};

/* -------------------------------------------------------------------------- */
/* Cover preview                                                              */
/* -------------------------------------------------------------------------- */

function CoverThumb({ row }: { row: ActivityRow }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const m = row.cover_media;
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
    } else {
      setUrl(null);
    }
    return () => {
      cancelled = true;
    };
  }, [row.cover_media?.storage_path]);

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

/* -------------------------------------------------------------------------- */
/* List configuration                                                         */
/* -------------------------------------------------------------------------- */

const listConfig: EntityListConfig<ActivityRow> = {
  module: "activities",
  moduleTitle: "الأنشطة",
  entityLabel: "نشاط",
  primaryTitleField: "title_ar",
  requiredPermission: "activities.manage",
  supportsBulk: true,
  pageSize: 20,
  searchPlaceholder: "بحث بعنوان النشاط…",
  publicPathFor: (row) => (row.slug ? `/activities/${row.slug}` : "/activities"),
  columns: [
    {
      key: "cover",
      label: "الغلاف",
      className: "w-20",
      render: (row) => <CoverThumb row={row} />,
    },
    {
      key: "title",
      label: "العنوان",
      render: (row) => (
        <div className="min-w-0">
          <DefaultTitleCell
            title={row.title_ar}
            subtitle={row.slug ? `/activities/${row.slug}` : undefined}
          />
          {row.is_featured && (
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                <Star className="h-3 w-3" /> مميّز
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "category",
      label: "التصنيف",
      className: "w-40",
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.category?.name_ar ?? "—"}
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
      key: "event_date",
      label: "تاريخ النشاط",
      className: "w-32",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" /> {formatDate(row.event_date)}
        </span>
      ),
    },
    {
      key: "published_at",
      label: "تاريخ النشر",
      className: "w-32",
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.published_at)}
        </span>
      ),
    },
    {
      key: "views",
      label: "المشاهدات",
      className: "w-24",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          {(row.view_count ?? 0).toLocaleString("ar-EG")}
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
    id: "content",
    title: "المحتوى الأساسي",
    fields: [
      {
        kind: "text",
        name: "title_ar",
        label: "العنوان (عربي)",
        required: true,
        dir: "rtl",
        maxLength: 200,
      },
      {
        kind: "text",
        name: "title_en",
        label: "العنوان (English)",
        dir: "ltr",
        maxLength: 200,
      },
      {
        kind: "slug",
        name: "slug",
        label: "الرابط الدائم (Slug)",
        sourceField: "title_ar",
        helpText:
          "يُستخدم في عنوان صفحة النشاط. لا تُغيّر الرابط بعد النشر لتجنب كسر الروابط الخارجية.",
      },
      {
        kind: "textarea",
        name: "summary_ar",
        label: "الملخّص (عربي)",
        rows: 3,
        dir: "rtl",
        maxLength: 400,
        helpText: "يظهر في بطاقة النشاط وقوائم العرض.",
      },
      {
        kind: "textarea",
        name: "summary_en",
        label: "الملخّص (English)",
        rows: 3,
        dir: "ltr",
        maxLength: 400,
      },
      {
        kind: "textarea",
        name: "body_ar",
        label: "المحتوى الكامل (عربي)",
        rows: 10,
        dir: "rtl",
        maxLength: 8000,
      },
      {
        kind: "textarea",
        name: "body_en",
        label: "المحتوى الكامل (English)",
        rows: 8,
        dir: "ltr",
        maxLength: 8000,
      },
    ],
  },
  {
    id: "cover",
    title: "صورة الغلاف والمعرض",
    description:
      "تُستخدم صورة الغلاف داخل بطاقة النشاط وفي أعلى صفحته العامة.",
    fields: [
      {
        kind: "media",
        name: "cover_image_media_id",
        label: "صورة الغلاف",
        mediaKind: "image",
        folder: "activities",
      },
      {
        kind: "custom",
        name: "gallery",
        label: "معرض الصور",
        render: ({ values, disabled }) => (
          <ActivityGalleryPanel
            activityId={(values.id as string | undefined) ?? undefined}
            disabled={disabled}
          />
        ),
      },
    ],
  },
  {
    id: "classification",
    title: "التصنيف والجدولة",
    columns: 2,
    fields: [
      {
        kind: "reference",
        name: "category_id",
        label: "التصنيف",
        table: "activity_categories",
        labelField: "name_ar",
        orderBy: "display_order",
        allowClear: true,
      },
      {
        kind: "date",
        name: "event_date",
        label: "تاريخ النشاط",
        helpText: "التاريخ الذي يُنفَّذ فيه النشاط على أرض الواقع.",
      },
      {
        kind: "date",
        name: "scheduled_at",
        label: "موعد الجدولة",
        helpText: "يُستخدم لجدولة النشر التلقائي (اختياري).",
      },
      {
        kind: "date",
        name: "published_at",
        label: "تاريخ النشر",
        helpText: "يُحدَّث تلقائيًا عند الضغط على «نشر». يمكن تعديله يدويًا.",
      },
      {
        kind: "boolean",
        name: "is_featured",
        label: "نشاط مميّز",
        helpText: "يظهر في مقدّمة قائمة الأنشطة.",
      },
    ],
  },
  {
    id: "seo",
    title: "تحسين محركات البحث",
    description:
      "يُستخدم عنوان وملخّص النشاط افتراضيًا إذا تُركت هذه الحقول فارغة.",
    fields: [
      {
        kind: "text",
        name: "seo_title",
        label: "عنوان SEO",
        dir: "auto",
        maxLength: 70,
        helpText: "يُفضّل ألا يزيد عن 60 حرفًا.",
      },
      {
        kind: "textarea",
        name: "seo_description",
        label: "وصف SEO",
        rows: 3,
        dir: "auto",
        maxLength: 200,
        helpText: "يظهر في نتائج البحث. يُفضّل ألا يزيد عن 160 حرفًا.",
      },
      {
        kind: "media",
        name: "og_image_id",
        label: "صورة Open Graph",
        mediaKind: "image",
        folder: "activities",
        helpText:
          "تُستخدم عند المشاركة على منصات التواصل. في حال تُركت فارغة تُستخدم صورة الغلاف.",
      },
    ],
  },
];

const editorConfig: EntityEditorConfig<ActivityRow> = {
  module: "activities",
  entityTable: "activities",
  entityLabel: "نشاط",
  primaryTitleField: "title_ar",
  requiredPermission: "activities.manage",
  publicPathFor: (row) => (row.slug ? `/activities/${row.slug}` : "/activities"),
  createDefaults: {
    status: "draft",
    is_featured: false,
    view_count: 0,
  } as Partial<ActivityRow>,
  sections: editorSections,
  validate: (values) => {
    const errors: Record<string, string> = {};
    const title = (values.title_ar as string | undefined)?.trim() ?? "";
    const slug = (values.slug as string | undefined)?.trim() ?? "";
    if (!title) errors.title_ar = "العنوان بالعربية مطلوب";
    if (!slug)
      errors.slug =
        "الرابط الدائم مطلوب — اضغط «توليد» لإنشائه من العنوان";
    else if (!/^[a-z0-9\-]+$/i.test(slug))
      errors.slug =
        "الرابط يجب أن يتكوّن من حروف لاتينية وأرقام وشرطات فقط";
    return Object.keys(errors).length ? errors : null;
  },
};

registerCmsModule<ActivityRow>({
  id: "activities",
  repository: activitiesRepository,
  list: listConfig,
  editor: editorConfig,
});

export const ACTIVITIES_MODULE_REGISTERED = true;
