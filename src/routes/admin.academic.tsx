import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/academic")({
  head: () => ({
    meta: [
      { title: "الحياة الأكاديمية · لوحة الإدارة" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <Outlet />,
});
