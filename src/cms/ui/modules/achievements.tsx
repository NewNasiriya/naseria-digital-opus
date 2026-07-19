/**
 * Achievements CMS module — Wave A · A2.
 *
 * Manages `achievements` rows against the shared Wave 1 CMS
 * infrastructure. Every existing column stays intact:
 *   • `cover_image_media_id` (Media Library) is preferred;
 *   • `cover_image_url` (legacy Lovable CDN URL) stays editable as a
 *     fallback and matches `src/lib/achievements.ts` resolution;
 *   • `achievement_media` rows are edited via the inline gallery panel;
 *   • Featured / pinned / homepage / about-timeline flags map 1:1 to the
 *     public reader.
 *
 * No schema is renamed, dropped, or backfilled. Delete is soft (archive)
 * by default; hard delete stays gated on `content.delete` in the shared
 * list view.
 */
import { useEffect, useState } from "react";
import { CalendarDays, Eye, Home, Pin, Star, TimerReset } from "lucide-react";

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

import { AchievementGalleryPanel } from "./AchievementGalleryPanel";

export interface AchievementRow extends EntityMeta {
  title_ar: string;
  title_en: string | null;
  slug: string;
  description_ar: string | null;
  description_en: string | null;
  category_id: string | null;
  academic_year_id: string | null;
  cover_image_media_id: string | null;
  cover_image_url: string | null;
  og_image_id: string | null;
  achieved_on: string | null;
  is_featured: boolean;
  is_pinned: boolean;
  show_on_homepage: boolean;
  show_on_about_timeline: boolean;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  view_count: number;
  category?: { id: string; name_ar: string; slug: string } | null;
  academic_year?: { id: string; name: string } | null;
  cover_media?: {
    bucket: string;
    storage_path: string;
    file_name: string | null;
    mime_type: string | null;
  } | null;
}

const LIST_SELECT = `
  id,title_ar,title_en,slug,status,is_featured,is_pinned,
  show_on_homepage,show_on_about_timeline,
  published_at,achieved_on,view_count,category_id,academic_year_id,
  cover_image_media_id,cover_image_url,og_image_id,
  description_ar,description_en,seo_title,seo_description,
  created_at,updated_at,created_by,updated_by,
  category:achievement_categories!achievements_category_id_fkey(id,name_ar,slug),
  academic_year:academic_years!achievements_academic_year_id_fkey(id,name),
  cover_media:media!achievements_cover_image_media_id_fkey(bucket,storage_path,file_name,mime_type)
`;

/* -------------------------------------------------------------------------- */
/* Repository                                                                 */
/* -------------------------------------------------------------------------- */

const baseRepo = createSupabaseRepository<AchievementRow>("achievements", {
  slugColumn: "slug",
  searchColumns: ["title_ar", "title_en", "description_ar"],
  defaultOrderBy: "updated_at",
  select: LIST_SELECT,
});

/** Whitelist of writable columns on the `achievements` table. */
const WRITABLE_COLUMNS: Array<keyof AchievementRow> = [
  "title_ar",
  "title_en",
  "slug",
  "description_ar",
  "description_en",
  "category_id",
  "academic_year_id",
  "cover_image_media_id",
  "cover_image_url",
  "og_image_id",
  "achieved_on",
  "is_featured",
  "is_pinned",
  "show_on_homepage",
  "show_on_about_timeline",
  "published_at",
  "seo_title",
  "seo_description",
  "status",
  "updated_at",
  "created_by",
  "updated_by",
];

function stripJoins(input: Partial<AchievementRow>): Partial<AchievementRow> {
  const out: Record<string, unknown> = {};
  for (const key of WRITABLE_COLUMNS) {
    if (key in input) out[key as string] = (input as Record<string, unknown>)[key as string];
  }
  return out as Partial<AchievementRow>;
}

const achievementsRepository = {
  ...baseRepo,
  create: (input: Partial<AchievementRow>) => baseRepo.create(stripJoins(input)),
  update: (id: string, patch: Partial<AchievementRow>) =>
    baseRepo.update(id, stripJoins(patch)),
};

/* -------------------------------------------------------------------------- */
/* Cover preview — mirrors src/lib/achievements.ts resolution                 */
/* -------------------------------------------------------------------------- */

function CoverThumb({ row }: { row: AchievementRow }) {
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
    } else if (row.cover_image_url) {
      setUrl(
        mediaPublicUrl({
          bucket: "external",
          storage_path: row.cover_image_url,
        }),
      );
    } else {
      setUrl(null);
    }
    return () => {
      cancelled = true;
    };
  }, [row.cover_media?.storage_path, row.cover_image_url]);

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

const listConfig: EntityListConfig<AchievementRow> = {
  module: "achievements",
  moduleTitle: "الإنجازات",
  entityLabel: "إنجاز",
  primaryTitleField: "title_ar",
  requiredPermission: "achievements.manage",
  supportsBulk: true,
  pageSize: 20,
  searchPlaceholder: "بحث بعنوان الإنجاز…",
  publicPathFor: (row) => (row.slug ? `/achievements/${row.slug}` : null),
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
            subtitle={row.slug ? `/achievements/${row.slug}` : undefined}
          />
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {row.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                <Star className="h-3 w-3" /> مميّز
              </span>
            )}
            {row.is_pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <Pin className="h-3 w-3" /> مثبّت
              </span>
            )}
            {row.show_on_homepage && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                <Home className="h-3 w-3" /> الرئيسية
              </span>
            )}
            {row.show_on_about_timeline && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
                <TimerReset className="h-3 w-3" /> الخط الزمني
              </span>
            )}
          </div>
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
      key: "achieved_on",
      label: "تاريخ الإنجاز",
      className: "w-32",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" /> {formatDate(row.achieved_on)}
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
          "يُستخدم في عنوان صفحة الإنجاز. لا تُغيّر الرابط بعد النشر لتجنب كسر الروابط الخارجية.",
      },
      {
        kind: "textarea",
        name: "description_ar",
        label: "الوصف (عربي)",
        rows: 6,
        dir: "rtl",
        maxLength: 2000,
        helpText: "يظهر في بطاقة الإنجاز وفي أعلى الصفحة العامة.",
      },
      {
        kind: "textarea",
        name: "description_en",
        label: "الوصف (English)",
        rows: 5,
        dir: "ltr",
        maxLength: 2000,
      },
    ],
  },
  {
    id: "cover",
    title: "صورة الغلاف والمعرض",
    description:
      "يمكن اختيار غلاف من مكتبة الوسائط أو الإبقاء على الرابط المباشر الحالي. تُستخدم صورة المكتبة تلقائيًا في حال وُجدت.",
    fields: [
      {
        kind: "media",
        name: "cover_image_media_id",
        label: "صورة الغلاف من مكتبة الوسائط",
        mediaKind: "image",
        folder: "achievements",
      },
      {
        kind: "text",
        name: "cover_image_url",
        label: "رابط الغلاف الحالي (توافق مع المحتوى القديم)",
        dir: "ltr",
        maxLength: 500,
        helpText:
          "يُستخدم فقط في حال عدم اختيار صورة من مكتبة الوسائط. لا تُعدّل هذا الحقل إلا إذا كنت تعلم مصدر الملف.",
      },
      {
        kind: "custom",
        name: "gallery",
        label: "معرض الصور",
        render: ({ values, disabled }) => (
          <AchievementGalleryPanel
            achievementId={(values.id as string | undefined) ?? undefined}
            disabled={disabled}
          />
        ),
      },
    ],
  },
  {
    id: "classification",
    title: "التصنيف والعرض",
    columns: 2,
    fields: [
      {
        kind: "reference",
        name: "category_id",
        label: "التصنيف",
        table: "achievement_categories",
        labelField: "name_ar",
        orderBy: "display_order",
        allowClear: true,
      },
      {
        kind: "reference",
        name: "academic_year_id",
        label: "العام الدراسي",
        table: "academic_years",
        labelField: "name",
        orderBy: "name",
        allowClear: true,
      },
      {
        kind: "date",
        name: "achieved_on",
        label: "تاريخ الإنجاز",
        helpText: "التاريخ الذي وقع فيه الإنجاز على أرض الواقع.",
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
        label: "إنجاز مميّز",
        helpText: "يظهر في مقدّمة قائمة الإنجازات.",
      },
      {
        kind: "boolean",
        name: "is_pinned",
        label: "تثبيت في الأعلى",
        helpText: "يُثبَّت أولًا قبل الإنجازات المميّزة.",
      },
      {
        kind: "boolean",
        name: "show_on_homepage",
        label: "عرض في الصفحة الرئيسية",
        helpText: "يظهر في قسم «أحدث الإنجازات» على الصفحة الرئيسية.",
      },
      {
        kind: "boolean",
        name: "show_on_about_timeline",
        label: "عرض في الخط الزمني (صفحة «عن المدرسة»)",
      },
    ],
  },
  {
    id: "seo",
    title: "تحسين محركات البحث",
    description:
      "يُستخدم عنوان ووصف الإنجاز افتراضيًا إذا تُركت هذه الحقول فارغة.",
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
        folder: "achievements",
        helpText:
          "تُستخدم عند المشاركة على منصات التواصل. في حال تُركت فارغة تُستخدم صورة الغلاف.",
      },
    ],
  },
];

const editorConfig: EntityEditorConfig<AchievementRow> = {
  module: "achievements",
  entityTable: "achievements",
  entityLabel: "إنجاز",
  primaryTitleField: "title_ar",
  requiredPermission: "achievements.manage",
  publicPathFor: (row) => (row.slug ? `/achievements/${row.slug}` : null),
  createDefaults: {
    status: "draft",
    is_featured: false,
    is_pinned: false,
    show_on_homepage: false,
    show_on_about_timeline: false,
    view_count: 0,
  } as Partial<AchievementRow>,
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
    const hasMedia = Boolean(values.cover_image_media_id);
    const hasUrl = Boolean(
      (values.cover_image_url as string | undefined)?.trim(),
    );
    if (!hasMedia && !hasUrl) {
      errors.cover_image_media_id =
        "يجب اختيار صورة غلاف من مكتبة الوسائط أو الإبقاء على الرابط المباشر.";
    }
    return Object.keys(errors).length ? errors : null;
  },
};

registerCmsModule<AchievementRow>({
  id: "achievements",
  repository: achievementsRepository,
  list: listConfig,
  editor: editorConfig,
});

export const ACHIEVEMENTS_MODULE_REGISTERED = true;
