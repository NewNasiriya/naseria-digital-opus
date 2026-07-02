import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { ChevronRight, Plus, Search, Sparkles } from "lucide-react";

import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { ADMIN_MODULE_BY_SLUG } from "@/lib/admin-modules";
import { getCmsUiModule } from "@/cms/ui";
import { EntityListView } from "@/cms/ui/EntityListView";
import { EntityEditor } from "@/cms/ui/EntityEditor";

const searchSchema = z.object({
  id: z.string().optional().catch(undefined),
  new: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => (v === true || v === "1" || v === "true" ? true : undefined))
    .catch(undefined),
});

export const Route = createFileRoute("/admin/$module")({
  validateSearch: (raw) => searchSchema.parse(raw ?? {}),
  head: ({ params }) => {
    const mod = params ? ADMIN_MODULE_BY_SLUG[params.module] : undefined;
    return {
      meta: [
        { title: mod ? `${mod.short} · لوحة الإدارة` : "لوحة الإدارة" },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
  component: ModuleRoute,
  notFoundComponent: () => (
    <EmptyState
      icon={Search}
      title="القسم غير موجود"
      description="لم نتمكن من العثور على القسم المطلوب في لوحة الإدارة."
    />
  ),
});

function ModuleRoute() {
  const { module: slug } = Route.useParams();
  const search = Route.useSearch();
  const mod = ADMIN_MODULE_BY_SLUG[slug];
  if (!mod) throw notFound();

  const ui = getCmsUiModule(mod.id);
  const isEditing = Boolean(search.id) || Boolean(search.new);
  const listHref = `/admin/${slug}`;
  const newHref = `/admin/${slug}?new=1`;

  // If the module has a UI registration, render the shared list or editor.
  if (ui) {
    if (isEditing) {
      return (
        <>
          <AdminSectionHeader
            eyebrow="تحرير المحتوى"
            title={search.id ? `تحرير ${ui.editor.entityLabel}` : `إضافة ${ui.editor.entityLabel}`}
            crumbs={[
              { label: "لوحة التحكم", to: "/admin" },
              { label: mod.short, to: listHref },
              { label: search.id ? "تحرير" : "جديد" },
            ]}
          />
          <EntityEditor
            config={ui.editor}
            repository={ui.repository}
            service={ui.service}
            id={search.id}
            listHref={listHref}
          />
        </>
      );
    }

    return (
      <>
        <AdminSectionHeader
          eyebrow="إدارة القسم"
          title={mod.title}
          description={mod.description}
          crumbs={[
            { label: "لوحة التحكم", to: "/admin" },
            { label: mod.short },
          ]}
          publicHref={mod.publicHref}
          action={
            <Button size="sm" className="gap-1.5" asChild>
              <Link to={newHref}>
                <Plus className="h-4 w-4" />
                إضافة {ui.list.entityLabel}
              </Link>
            </Button>
          }
        />
        <EntityListView
          config={ui.list}
          repository={ui.repository}
          service={ui.service}
          editHrefFor={(id) => `${listHref}?id=${id}`}
          newHref={newHref}
        />
      </>
    );
  }

  // No UI registration yet — show a helpful "coming soon" state that still
  // links to any dedicated route (e.g. /admin/media, /admin/contact) that
  // already exists as a bespoke page.
  const Icon = mod.icon;
  return (
    <>
      <AdminSectionHeader
        eyebrow="إدارة القسم"
        title={mod.title}
        description={mod.description}
        crumbs={[
          { label: "لوحة التحكم", to: "/admin" },
          { label: mod.short },
        ]}
        publicHref={mod.publicHref}
      />
      <EmptyState
        icon={Icon}
        title="قيد التفعيل ضمن الموجات القادمة"
        description="تم إعداد بنية الإدارة الموحّدة (قائمة، محرّر، حفظ تلقائي، سجل إصدارات، نشر) وسيتم توصيل هذا القسم بها في الموجة التالية."
        action={
          mod.publicHref ? (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={mod.publicHref} target="_blank" rel="noreferrer">
                <Sparkles className="h-4 w-4" />
                عرض القسم العام
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : null
        }
      />
    </>
  );
}
