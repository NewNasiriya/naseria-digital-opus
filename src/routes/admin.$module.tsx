import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { Plus, Search } from "lucide-react";

import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { getCmsUiModule } from "@/cms/ui";
import { EntityEditor } from "@/cms/ui/EntityEditor";
import { EntityListView } from "@/cms/ui/EntityListView";
import { isAdminModuleImplemented } from "@/lib/admin-module-availability";
import { ADMIN_MODULE_BY_SLUG } from "@/lib/admin-modules";
import "@/cms/ui/modules";

const searchSchema = z.object({
  id: z.string().optional().catch(undefined),
  new: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) =>
      value === true || value === "1" || value === "true" ? true : undefined,
    )
    .catch(undefined),
});

export const Route = createFileRoute("/admin/$module")({
  validateSearch: (raw) => searchSchema.parse(raw ?? {}),
  head: ({ params }) => {
    const module = params ? ADMIN_MODULE_BY_SLUG[params.module] : undefined;
    return {
      meta: [
        {
          title:
            module && isAdminModuleImplemented(module)
              ? `${module.short} · لوحة الإدارة`
              : "لوحة الإدارة",
        },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
  component: ModuleRoute,
  notFoundComponent: () => (
    <EmptyState
      icon={Search}
      title="القسم غير متاح"
      description="هذا القسم مخفي حتى يكتمل ربطه واختباره مع الموقع العام."
    />
  ),
});

function ModuleRoute() {
  const { module: slug } = Route.useParams();
  const search = Route.useSearch();
  const module = ADMIN_MODULE_BY_SLUG[slug];
  if (!module || !isAdminModuleImplemented(module)) throw notFound();

  const ui = getCmsUiModule(module.id);
  // Complete bespoke routes are matched before this dynamic route. A module
  // reaching this point without a shared CMS registration is not functional
  // and must not present a misleading placeholder editor.
  if (!ui) throw notFound();

  const wantsEditor = Boolean(search.id) || Boolean(search.new);
  const isEditing =
    Boolean(search.id) ||
    (Boolean(search.new) && ui.list.allowCreate !== false);
  const listHref = `/admin/${slug}`;
  const newHref = `/admin/${slug}?new=1`;

  if (wantsEditor && isEditing) {
    return (
      <>
        <AdminSectionHeader
          eyebrow="تحرير المحتوى"
          title={
            search.id
              ? `تحرير ${ui.editor.entityLabel}`
              : `إضافة ${ui.editor.entityLabel}`
          }
          crumbs={[
            { label: "لوحة التحكم", to: "/admin" },
            { label: module.short, to: listHref },
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
        title={module.title}
        description={module.description}
        crumbs={[
          { label: "لوحة التحكم", to: "/admin" },
          { label: module.short },
        ]}
        publicHref={module.publicHref}
        action={
          ui.list.allowCreate === false ? null : (
            <Button size="sm" className="gap-1.5" asChild>
              <Link to={newHref}>
                <Plus className="h-4 w-4" />
                إضافة {ui.list.entityLabel}
              </Link>
            </Button>
          )
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
