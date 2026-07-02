import { createFileRoute } from "@tanstack/react-router";

import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { AppearancePanel } from "@/components/theme/AppearancePanel";
import { ADMIN_MODULE_BY_SLUG } from "@/lib/admin-modules";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات · لوحة الإدارة" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const mod = ADMIN_MODULE_BY_SLUG.settings;

  return (
    <>
      <AdminSectionHeader
        eyebrow="إدارة القسم"
        title={mod?.title ?? "إعدادات الموقع"}
        description={
          mod?.description ??
          "إعدادات عامة للموقع بما في ذلك مظهر الواجهة والتفضيلات."
        }
        crumbs={[
          { label: "لوحة التحكم", to: "/admin" },
          { label: mod?.short ?? "الإعدادات" },
        ]}
      />

      <div className="space-y-6">
        <AppearancePanel />
      </div>
    </>
  );
}
