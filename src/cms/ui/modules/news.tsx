/**
 * News CMS module — Wave 2.
 *
 * Registers the news editor + list against the shared Wave 1 CMS
 * infrastructure. Every field is backed by the existing `news` schema;
 * gallery rows are managed against the `news_media` junction table via
 * the inline gallery panel.
 */
import { useEffect, useState } from "react";
import { CalendarDays, Eye, Loader2, Pin, Star } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { createSupabaseRepository } from "@/cms/repository";
import type { EntityMeta } from "@/cms/types";
import { registerCmsModule, StatusCell, DefaultTitleCell } from "@/cms/ui";
import type { EntityListConfig, EntityEditorConfig } from "@/cms/ui";
import type { FieldSection } from "@/cms/ui/fields";
import { mediaLibrary } from "@/cms/media-library";
import { NewsGalleryPanel } from "./NewsGalleryPanel";

export interface NewsRow extends EntityMeta {
  title_ar: string;
  title_en: string | null;
  slug: string;
  summary_ar: string | null;
  summary_en: string | null;
  body_ar: string | null;
  body_en: string | null;
  category_id: string | null;
  featured_image_media_id: string | null;
  og_image_id: string | null;
  is_featured: boolean;
  is_pinned: boolean;
  published_at: string | null;
  scheduled_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  reading_minutes: number | null;
  view_count: number;
  author_id: string | null;
  category?: { id: string; name_ar: string; slug: string } | null;
  featured_media?: {
    bucket: string;
    storage_path: string;
    file_name: string | null;
    mime_type: string | null;
  } | null;
}

const LIST_SELECT = `
  id,title_ar,title_en,slug,status,is_featured,is_pinned,
  published_at,scheduled_at,view_count,category_id,
  featured_image_media_id,og_image_id,seo_title,seo_description,
  summary_ar,summary_en,body_ar,body_en,reading_minutes,author_id,
  created_at,updated_at,created_by,updated_by,
  category:news_categories!news_category_id_fkey(id,name_ar,slug),
  featured_media:media!news_featured_image_media_id_fkey(bucket,storage_path,file_name,mime_type)
`;

/* -------------------------------------------------------------------------- */
/* Repository with joined select for list + editor rows                       */
/* -------------------------------------------------------------------------- */

const baseRepo = createSupabaseRepository<NewsRow>("news", {
  slugColumn: "slug",
  searchColumns: ["title_ar", "title_en", "summary_ar"],
  defaultOrderBy: "updated_at",
  select: LIST_SELECT,
});

/** Whitelist of writable columns on the `news` table. */
const WRITABLE_COLUMNS: Array<keyof NewsRow> = [
  "title_ar",
  "title_en",
  "slug",
  "summary_ar",
  "summary_en",
  "body_ar",
  "body_en",
  "category_id",
  "featured_image_media_id",
  "og_image_id",
  "is_featured",
  "is_pinned",
  "published_at",
  "scheduled_at",
  "seo_title",
  "seo_description",
  "reading_minutes",
  "status",
  "author_id",
];

function stripJoins(input: Partial<NewsRow>): Partial<NewsRow> {
  const out: Record<string, unknown> = {};
  for (const key of WRITABLE_COLUMNS) {
    if (key in input) out[key as string] = input[key];
  }
  return out as Partial<NewsRow>;
}

const newsRepository = {
  ...baseRepo,
  create: (input: Partial<NewsRow>) => baseRepo.create(stripJoins(input)),
  update: (id: string, patch: Partial<NewsRow>) =>
    baseRepo.update(id, stripJoins(patch)),
};

/* -------------------------------------------------------------------------- */
/* List columns                                                               */
/* -------------------------------------------------------------------------- */

function CoverThumb({ row }: { row: NewsRow }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const m = row.featured_media;
    if (!m || !(m.mime_type ?? "").startsWith("image/")) {
      setUrl(null);
      return;
    }
    (async () => {
      try {
        const signed = await mediaLibrary.signedUrl({
          bucket: m.bucket as "media",
          path: m.storage_path,
          expiresInSeconds: 60 * 10,
        });
        if (!cancelled) setUrl(signed);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [row.featured_media?.storage_path]);

  return (
    <div className="h-12 w-16 overflow-hidden rounded-md border border-border bg-surface-muted">
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
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

const listConfig: EntityListConfig<NewsRow> = {
  module: "news",
  moduleTitle: "الأخبار",
  entityLabel: "خبر",
  primaryTitleField: "title_ar",
  requiredPermission: "news.manage",
  supportsBulk: true,
  pageSize: 20,
  searchPlaceholder: "بحث بعنوان الخبر…",
  publicPathFor: (row) => (row.slug ? `/news/${row.slug}` : null),
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
            subtitle={row.slug ? `/news/${row.slug}` : undefined}
          />
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {row.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                <Star className="h-3 w-3" /> مميّز
              </span>
            )}
            {row.is_pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <Pin className="h-3 w-3" /> الصفحة الرئيسية
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
      key: "status",
      label: "الحالة",
      className: "w-28",
      render: (row) => <StatusCell status={row.status} />,
    },
    {
      key: "published_at",
      label: "تاريخ النشر",
      className: "w-32",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" /> {formatDate(row.published_at)}
        </span>
      ),
    },
    {
      key: "updated_at",
      label: "آخر تعديل",
      className: "w-32",
      render: (row) => (
        <span className="text-xs text-muted-foreground">{formatDate(row.updated_at)}</span>
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
        helpText: "يُستخدم في عنوان URL. اضغط «توليد» لإنشائه من العنوان.",
      },
      {
        kind: "textarea",
        name: "summary_ar",
        label: "الملخص (عربي)",
        rows: 3,
        dir: "rtl",
        maxLength: 500,
        helpText: "يظهر في قوائم الأخبار وفي بطاقات المشاركة.",
      },
      {
        kind: "textarea",
        name: "summary_en",
        label: "الملخص (English)",
        rows: 3,
        dir: "ltr",
        maxLength: 500,
      },
      {
        kind: "textarea",
        name: "body_ar",
        label: "المحتوى الكامل (عربي)",
        rows: 14,
        dir: "rtl",
        helpText: "يدعم الفقرات والأسطر الجديدة.",
      },
      {
        kind: "textarea",
        name: "body_en",
        label: "المحتوى الكامل (English)",
        rows: 10,
        dir: "ltr",
      },
    ],
  },
  {
    id: "cover",
    title: "الصور والوسائط",
    fields: [
      {
        kind: "media",
        name: "featured_image_media_id",
        label: "صورة الغلاف",
        mediaKind: "image",
        folder: "news",
        helpText: "الصورة الرئيسية للخبر في الصفحات العامة وبطاقات المشاركة.",
      },
      {
        kind: "custom",
        name: "gallery",
        label: "معرض الصور",
        render: ({ values, disabled }) => (
          <NewsGalleryPanel
            newsId={(values.id as string | undefined) ?? undefined}
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
        table: "news_categories",
        labelField: "name_ar",
        orderBy: "display_order",
        allowClear: true,
      },
      {
        kind: "date",
        name: "published_at",
        label: "تاريخ النشر",
        helpText: "يُحدَّث تلقائيًا عند النشر. يمكن تعديله لأرشفة تواريخ سابقة.",
      },
      {
        kind: "boolean",
        name: "is_featured",
        label: "خبر مميّز",
        helpText: "يظهر في قسم «مميز» على الصفحات العامة.",
      },
      {
        kind: "boolean",
        name: "is_pinned",
        label: "عرض على الصفحة الرئيسية",
        helpText: "يُثبَّت في قسم آخر الأخبار على الصفحة الرئيسية.",
      },
      {
        kind: "number",
        name: "reading_minutes",
        label: "زمن القراءة (دقيقة)",
        min: 1,
        max: 60,
      },
    ],
  },
  {
    id: "seo",
    title: "تحسين محركات البحث",
    description:
      "يُستخدم عنوان ووصف الخبر افتراضيًا إذا تُركت هذه الحقول فارغة.",
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
        folder: "news",
        helpText: "تُستخدم عند المشاركة على منصات التواصل. في حال تُركت فارغة تُستخدم صورة الغلاف.",
      },
    ],
  },
];

const editorConfig: EntityEditorConfig<NewsRow> = {
  module: "news",
  entityTable: "news",
  entityLabel: "خبر",
  primaryTitleField: "title_ar",
  requiredPermission: "news.manage",
  publicPathFor: (row) => (row.slug ? `/news/${row.slug}` : null),
  createDefaults: {
    status: "draft",
    is_featured: false,
    is_pinned: false,
    view_count: 0,
  } as Partial<NewsRow>,
  sections: editorSections,
  validate: (values) => {
    const errors: Record<string, string> = {};
    const title = (values.title_ar as string | undefined)?.trim() ?? "";
    const slug = (values.slug as string | undefined)?.trim() ?? "";
    if (!title) errors.title_ar = "العنوان بالعربية مطلوب";
    if (!slug) errors.slug = "الرابط الدائم مطلوب — اضغط «توليد» لإنشائه من العنوان";
    else if (!/^[a-z0-9\-]+$/i.test(slug))
      errors.slug = "الرابط يجب أن يتكوّن من حروف لاتينية وأرقام وشرطات فقط";
    return Object.keys(errors).length ? errors : null;
  },
};

registerCmsModule<NewsRow>({
  id: "news",
  repository: newsRepository,
  list: listConfig,
  editor: editorConfig,
});

// Re-export a helper so callers importing this file get side-effect registration.
export const NEWS_MODULE_REGISTERED = true;
