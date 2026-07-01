import { createFileRoute, notFound } from "@tanstack/react-router";
import { Filter, ListFilter, Plus, Search } from "lucide-react";

import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_MODULE_BY_SLUG } from "@/lib/admin-modules";

export const Route = createFileRoute("/admin/$module")({
  head: ({ params }) => {
    const mod = params ? ADMIN_MODULE_BY_SLUG[params.module] : undefined;
    return {
      meta: [
        {
          title: mod ? `${mod.short} · لوحة الإدارة` : "لوحة الإدارة",
        },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
  component: ModuleLanding,
  notFoundComponent: () => (
    <EmptyState
      icon={Search}
      title="القسم غير موجود"
      description="لم نتمكن من العثور على القسم المطلوب في لوحة الإدارة."
    />
  ),
});

function ModuleLanding() {
  const { module: slug } = Route.useParams();
  const mod = ADMIN_MODULE_BY_SLUG[slug];
  if (!mod) throw notFound();
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
        action={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {mod.primaryAction}
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder={`بحث داخل ${mod.short}…`}
            aria-label={`بحث داخل ${mod.short}`}
            className="h-10 ps-3 pe-10 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            تصفية
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <ListFilter className="h-4 w-4" />
            الترتيب
          </Button>
        </div>
      </div>

      <EmptyState
        icon={Icon}
        title="لا يوجد محتوى هنا بعد"
        description="ستظهر هنا قائمة العناصر مع خيارات التحرير والنشر. ابدأ بإنشاء أول عنصر في هذا القسم."
        action={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            {mod.primaryAction}
          </Button>
        }
      />
    </>
  );
}
