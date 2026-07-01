import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { fetchRoles, hasStaffRole } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
    const roles = await fetchRoles(data.user.id);
    if (!hasStaffRole(roles)) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth", search: { forbidden: "1" } });
    }
  },
  head: () => ({
    meta: [
      { title: "لوحة الإدارة · مدرسة الناصرية الابتدائية الجديدة" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
