/**
 * Academic CMS module — Wave 3.
 *
 * Builds scoped repositories, services, list configurations and editor
 * configurations for the four grade-scoped sections:
 *   • Study Timetable   (timetables, kind = 'academic')
 *   • Exam Timetable    (timetables, kind = 'exam')
 *   • Additional Resources (academic_resources)
 *   • Academic Notes    (academic_notes)
 *
 * Everything reuses Wave 1 infrastructure (EntityListView, EntityEditor,
 * MediaPickerDialog, autosave, versions, RBAC) so the runtime stays
 * completely shared.
 */
import { supabase } from "@/integrations/supabase/client";
import { createSupabaseRepository, type Repository } from "@/cms/repository";
import { createContentService, type ContentService } from "@/cms/service";
import type { EntityMeta, ListQuery, UUID } from "@/cms/types";
import type { EntityListConfig, EntityEditorConfig } from "@/cms/ui";
import { StatusCell, DefaultTitleCell } from "@/cms/ui";
import type { FieldSection } from "@/cms/ui/fields";

/* -------------------------------------------------------------------------- */
/* Scope helpers                                                              */
/* -------------------------------------------------------------------------- */

export type AcademicSection = "study" | "exam" | "resources" | "notes";

export const ACADEMIC_SECTION_META: Record<
  AcademicSection,
  { title: string; entity: string; permission: "academic.manage"; publicAnchor?: string }
> = {
  study: { title: "الجدول الدراسي", entity: "جدول دراسي", permission: "academic.manage" },
  exam: { title: "جدول الامتحانات", entity: "جدول امتحانات", permission: "academic.manage" },
  resources: { title: "المرفقات والتنزيلات", entity: "مرفق", permission: "academic.manage" },
  notes: { title: "الملاحظات الأكاديمية", entity: "ملاحظة", permission: "academic.manage" },
};

interface Scope {
  gradeId: UUID;
  level: number;
  kind?: "academic" | "exam";
}

/** Wraps a repository so every list is filtered by scope, and every create
 *  automatically inherits the scope columns. */
function scopeRepository<T extends EntityMeta>(
  base: Repository<T>,
  scopeCols: Record<string, string | number>,
): Repository<T> {
  return {
    list(query: ListQuery = {}) {
      return base.list({
        ...query,
        filters: { ...(query.filters ?? {}), ...scopeCols },
      });
    },
    getById: (id) => base.getById(id),
    getBySlug: base.getBySlug ? (s) => base.getBySlug!(s) : undefined,
    create: (input) => base.create({ ...(scopeCols as object), ...input } as Partial<T>),
    update: (id, patch) => base.update(id, patch),
    remove: (id) => base.remove(id),
  };
}

/** Whitelist writable columns to strip joined selects before write. */
function stripJoins<T>(input: Partial<T>, cols: readonly string[]): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const key of cols) {
    if (key in (input as object)) out[key] = (input as Record<string, unknown>)[key];
  }
  return out as Partial<T>;
}

/* -------------------------------------------------------------------------- */
/* Timetables (study + exam)                                                  */
/* -------------------------------------------------------------------------- */

export interface TimetableRow extends EntityMeta {
  kind: "academic" | "exam";
  title_ar: string;
  title_en: string | null;
  description_ar: string | null;
  grade_id: string | null;
  cover_image_media_id: string | null;
  document_media_id: string | null;
  display_order: number;
}

const TIMETABLE_COLS = [
  "kind",
  "title_ar",
  "title_en",
  "description_ar",
  "grade_id",
  "cover_image_media_id",
  "document_media_id",
  "display_order",
  "status",
  "published_at",
  "updated_at",
  "created_by",
  "updated_by",
] as const;

const timetableBase = createSupabaseRepository<TimetableRow>("timetables", {
  slugColumn: undefined,
  searchColumns: ["title_ar", "title_en", "description_ar"],
  defaultOrderBy: "updated_at",
  select: "*",
});

function timetableRepository(scope: Scope): Repository<TimetableRow> {
  const kind = scope.kind ?? "academic";
  const scoped = scopeRepository(timetableBase, { grade_id: scope.gradeId, kind });
  return {
    ...scoped,
    create: (input) =>
      timetableBase.create(
        stripJoins({ ...input, grade_id: scope.gradeId, kind }, TIMETABLE_COLS as unknown as readonly string[]),
      ),
    update: (id, patch) =>
      timetableBase.update(id, stripJoins(patch, TIMETABLE_COLS as unknown as readonly string[])),
  };
}

/**
 * Wraps the standard content service so publishing a timetable automatically
 * unpublishes any other published sibling for the same grade+kind — the
 * business rule "only one published per grade/kind" without losing history.
 */
function timetableService(
  repo: Repository<TimetableRow>,
  scope: Scope,
): ContentService<TimetableRow> {
  const base = createContentService(repo);
  const kind = scope.kind ?? "academic";
  return {
    ...base,
    async publish(id) {
      const now = new Date().toISOString();
      // Unpublish existing published siblings.
      const { error } = await (supabase as any)
        .from("timetables")
        .update({ status: "draft", updated_at: now })
        .eq("grade_id", scope.gradeId)
        .eq("kind", kind)
        .eq("status", "published")
        .neq("id", id);
      if (error) throw error;
      return base.publish(id);
    },
  };
}

function timetableListConfig(scope: Scope, section: "study" | "exam"): EntityListConfig<TimetableRow> {
  const meta = ACADEMIC_SECTION_META[section];
  return {
    module: `academic-${section}-${scope.level}`,
    moduleTitle: meta.title,
    entityLabel: meta.entity,
    primaryTitleField: "title_ar",
    requiredPermission: "academic.manage",
    supportsBulk: true,
    pageSize: 20,
    columns: [
      {
        key: "title",
        label: "العنوان",
        render: (r) => (
          <DefaultTitleCell
            title={r.title_ar}
            subtitle={r.description_ar ?? undefined}
          />
        ),
      },
      {
        key: "status",
        label: "الحالة",
        render: (r) => <StatusCell status={r.status} />,
        className: "w-32",
      },
      {
        key: "updated",
        label: "آخر تحديث",
        render: (r) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(r.updated_at)}
          </span>
        ),
        className: "w-32",
      },
    ],
    publicPathFor: () => `/academic/grades/${scope.level}`,
  };
}

function timetableEditorConfig(scope: Scope, section: "study" | "exam"): EntityEditorConfig<TimetableRow> {
  const meta = ACADEMIC_SECTION_META[section];
  const kind = section === "study" ? "academic" : "exam";
  const sections: FieldSection[] = [
    {
      id: "content",
      title: "المحتوى",
      columns: 2,
      fields: [
        { kind: "text", name: "title_ar", label: "العنوان بالعربية", required: true, dir: "rtl" },
        { kind: "text", name: "title_en", label: "العنوان بالإنجليزية", dir: "ltr" },
        {
          kind: "textarea",
          name: "description_ar",
          label: "وصف مختصر",
          rows: 3,
          dir: "rtl",
          helpText: "يظهر أسفل عنوان الجدول على الصفحة العامة.",
        },
      ],
    },
    {
      id: "media",
      title: "الملفات",
      columns: 2,
      fields: [
        {
          kind: "media",
          name: "cover_image_media_id",
          label: "صورة الجدول",
          bucket: "media",
          mediaKind: "image",
          helpText: "الصورة التي تظهر للطلاب وأولياء الأمور على الصفحة.",
        },
        {
          kind: "media",
          name: "document_media_id",
          label: "ملف الجدول للتنزيل (اختياري)",
          bucket: "documents",
          helpText: "نسخة PDF أو Word للتنزيل.",
        },
      ],
    },
    {
      id: "ordering",
      title: "الترتيب",
      fields: [
        { kind: "number", name: "display_order", label: "ترتيب العرض", min: 0, step: 1 },
      ],
    },
  ];

  return {
    module: `academic-${section}-${scope.level}`,
    entityTable: "timetables",
    entityLabel: meta.entity,
    primaryTitleField: "title_ar",
    requiredPermission: "academic.manage",
    createDefaults: {
      kind,
      grade_id: scope.gradeId,
      display_order: 0,
      status: "draft",
    } as Partial<TimetableRow>,
    sections,
    publicPathFor: () => `/academic/grades/${scope.level}`,
    validate: (v) => {
      const errs: Record<string, string> = {};
      if (!v.cover_image_media_id && !v.document_media_id) {
        errs.cover_image_media_id = "أضف صورة الجدول أو ملف تنزيل.";
      }
      return Object.keys(errs).length ? errs : null;
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Academic Resources                                                         */
/* -------------------------------------------------------------------------- */

export interface AcademicResourceRow extends EntityMeta {
  grade_id: string;
  title_ar: string;
  description_ar: string | null;
  media_id: string | null;
  display_order: number;
}

const RESOURCE_COLS = [
  "grade_id",
  "title_ar",
  "description_ar",
  "media_id",
  "display_order",
  "status",
  "published_at",
  "updated_at",
  "created_by",
  "updated_by",
] as const;

const resourceBase = createSupabaseRepository<AcademicResourceRow>("academic_resources", {
  slugColumn: undefined,
  searchColumns: ["title_ar", "description_ar"],
  defaultOrderBy: "display_order",
  defaultOrderDir: "asc",
  select: "*",
});

function resourceRepository(scope: Scope): Repository<AcademicResourceRow> {
  const scoped = scopeRepository(resourceBase, { grade_id: scope.gradeId });
  return {
    ...scoped,
    create: (input) =>
      resourceBase.create(
        stripJoins(
          { ...input, grade_id: scope.gradeId },
          RESOURCE_COLS as unknown as readonly string[],
        ),
      ),
    update: (id, patch) =>
      resourceBase.update(id, stripJoins(patch, RESOURCE_COLS as unknown as readonly string[])),
  };
}

function resourceListConfig(scope: Scope): EntityListConfig<AcademicResourceRow> {
  return {
    module: `academic-resources-${scope.level}`,
    moduleTitle: ACADEMIC_SECTION_META.resources.title,
    entityLabel: ACADEMIC_SECTION_META.resources.entity,
    primaryTitleField: "title_ar",
    requiredPermission: "academic.manage",
    supportsBulk: true,
    columns: [
      {
        key: "title",
        label: "العنوان",
        render: (r) => (
          <DefaultTitleCell title={r.title_ar} subtitle={r.description_ar ?? undefined} />
        ),
      },
      { key: "status", label: "الحالة", render: (r) => <StatusCell status={r.status} />, className: "w-32" },
      {
        key: "order",
        label: "الترتيب",
        render: (r) => <span className="text-xs text-muted-foreground">{r.display_order}</span>,
        className: "w-20",
      },
      {
        key: "updated",
        label: "آخر تحديث",
        render: (r) => (
          <span className="text-xs text-muted-foreground">{formatDate(r.updated_at)}</span>
        ),
        className: "w-32",
      },
    ],
    publicPathFor: () => `/academic/grades/${scope.level}`,
  };
}

function resourceEditorConfig(scope: Scope): EntityEditorConfig<AcademicResourceRow> {
  return {
    module: `academic-resources-${scope.level}`,
    entityTable: "academic_resources",
    entityLabel: ACADEMIC_SECTION_META.resources.entity,
    primaryTitleField: "title_ar",
    requiredPermission: "academic.manage",
    createDefaults: {
      grade_id: scope.gradeId,
      display_order: 0,
      status: "draft",
    } as Partial<AcademicResourceRow>,
    sections: [
      {
        id: "content",
        title: "المرفق",
        columns: 1,
        fields: [
          { kind: "text", name: "title_ar", label: "عنوان الملف", required: true, dir: "rtl" },
          {
            kind: "textarea",
            name: "description_ar",
            label: "وصف مختصر",
            rows: 2,
            dir: "rtl",
          },
          {
            kind: "media",
            name: "media_id",
            label: "الملف",
            bucket: "documents",
            helpText: "اختر ملفًا من مكتبة الوسائط (PDF، Word، Excel، ZIP، صور، إلخ).",
          },
          { kind: "number", name: "display_order", label: "ترتيب العرض", min: 0, step: 1 },
        ],
      },
    ],
    publicPathFor: () => `/academic/grades/${scope.level}`,
    validate: (v) => {
      if (!v.media_id) return { media_id: "اختر الملف من مكتبة الوسائط." };
      return null;
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Academic Notes                                                             */
/* -------------------------------------------------------------------------- */

export interface AcademicNoteRow extends EntityMeta {
  grade_id: string;
  title_ar: string;
  body_ar: string | null;
  attachment_media_id: string | null;
  display_order: number;
}

const NOTE_COLS = [
  "grade_id",
  "title_ar",
  "body_ar",
  "attachment_media_id",
  "display_order",
  "status",
  "published_at",
  "updated_at",
  "created_by",
  "updated_by",
] as const;

const noteBase = createSupabaseRepository<AcademicNoteRow>("academic_notes", {
  slugColumn: undefined,
  searchColumns: ["title_ar", "body_ar"],
  defaultOrderBy: "updated_at",
  select: "*",
});

function noteRepository(scope: Scope): Repository<AcademicNoteRow> {
  const scoped = scopeRepository(noteBase, { grade_id: scope.gradeId });
  return {
    ...scoped,
    create: (input) =>
      noteBase.create(
        stripJoins({ ...input, grade_id: scope.gradeId }, NOTE_COLS as unknown as readonly string[]),
      ),
    update: (id, patch) =>
      noteBase.update(id, stripJoins(patch, NOTE_COLS as unknown as readonly string[])),
  };
}

function noteListConfig(scope: Scope): EntityListConfig<AcademicNoteRow> {
  return {
    module: `academic-notes-${scope.level}`,
    moduleTitle: ACADEMIC_SECTION_META.notes.title,
    entityLabel: ACADEMIC_SECTION_META.notes.entity,
    primaryTitleField: "title_ar",
    requiredPermission: "academic.manage",
    supportsBulk: true,
    columns: [
      {
        key: "title",
        label: "العنوان",
        render: (r) => (
          <DefaultTitleCell
            title={r.title_ar}
            subtitle={r.body_ar ? r.body_ar.slice(0, 90) : undefined}
          />
        ),
      },
      { key: "status", label: "الحالة", render: (r) => <StatusCell status={r.status} />, className: "w-32" },
      {
        key: "updated",
        label: "آخر تحديث",
        render: (r) => (
          <span className="text-xs text-muted-foreground">{formatDate(r.updated_at)}</span>
        ),
        className: "w-32",
      },
    ],
    publicPathFor: () => `/academic/grades/${scope.level}`,
  };
}

function noteEditorConfig(scope: Scope): EntityEditorConfig<AcademicNoteRow> {
  return {
    module: `academic-notes-${scope.level}`,
    entityTable: "academic_notes",
    entityLabel: ACADEMIC_SECTION_META.notes.entity,
    primaryTitleField: "title_ar",
    requiredPermission: "academic.manage",
    createDefaults: {
      grade_id: scope.gradeId,
      display_order: 0,
      status: "draft",
    } as Partial<AcademicNoteRow>,
    sections: [
      {
        id: "content",
        title: "الملاحظة",
        columns: 1,
        fields: [
          { kind: "text", name: "title_ar", label: "عنوان الملاحظة", required: true, dir: "rtl" },
          {
            kind: "textarea",
            name: "body_ar",
            label: "نص الملاحظة",
            rows: 8,
            dir: "rtl",
            required: true,
          },
          {
            kind: "media",
            name: "attachment_media_id",
            label: "مرفق (اختياري)",
            bucket: "documents",
            helpText: "أضف ملفًا لتنزيله ضمن الملاحظة إن لزم.",
          },
          { kind: "number", name: "display_order", label: "ترتيب العرض", min: 0, step: 1 },
        ],
      },
    ],
    publicPathFor: () => `/academic/grades/${scope.level}`,
  };
}

/* -------------------------------------------------------------------------- */
/* Public factory                                                             */
/* -------------------------------------------------------------------------- */

export interface AcademicSectionRuntime {
  section: AcademicSection;
  list: EntityListConfig<EntityMeta>;
  editor: EntityEditorConfig<EntityMeta>;
  repository: Repository<EntityMeta>;
  service: ContentService<EntityMeta>;
}

export function buildAcademicSection(
  section: AcademicSection,
  scope: Scope,
): AcademicSectionRuntime {
  if (section === "study" || section === "exam") {
    const s: Scope = { ...scope, kind: section === "study" ? "academic" : "exam" };
    const repo = timetableRepository(s);
    return {
      section,
      list: timetableListConfig(s, section) as unknown as EntityListConfig<EntityMeta>,
      editor: timetableEditorConfig(s, section) as unknown as EntityEditorConfig<EntityMeta>,
      repository: repo as unknown as Repository<EntityMeta>,
      service: timetableService(repo, s) as unknown as ContentService<EntityMeta>,
    };
  }
  if (section === "resources") {
    const repo = resourceRepository(scope);
    return {
      section,
      list: resourceListConfig(scope) as unknown as EntityListConfig<EntityMeta>,
      editor: resourceEditorConfig(scope) as unknown as EntityEditorConfig<EntityMeta>,
      repository: repo as unknown as Repository<EntityMeta>,
      service: createContentService(repo) as unknown as ContentService<EntityMeta>,
    };
  }
  const repo = noteRepository(scope);
  return {
    section,
    list: noteListConfig(scope) as unknown as EntityListConfig<EntityMeta>,
    editor: noteEditorConfig(scope) as unknown as EntityEditorConfig<EntityMeta>,
    repository: repo as unknown as Repository<EntityMeta>,
    service: createContentService(repo) as unknown as ContentService<EntityMeta>,
  };
}

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

export function formatDate(iso: string | null | undefined): string {
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

/** Fetch a grade id by level, cached via TanStack Query. */
export async function fetchGradeIdByLevel(level: number): Promise<UUID | null> {
  const { data, error } = await supabase
    .from("grades")
    .select("id")
    .eq("level", level)
    .maybeSingle();
  if (error) throw error;
  return (data?.id as UUID) ?? null;
}
