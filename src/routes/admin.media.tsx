import { createFileRoute } from "@tanstack/react-router";

import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { MediaLibrary } from "@/components/admin/media/MediaLibrary";

export const Route = createFileRoute("/admin/media")({
  head: () => ({
    meta: [
      { title: "مكتبة الوسائط · لوحة الإدارة" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MediaLibraryPage,
});

function MediaLibraryPage() {
  return (
    <>
      <AdminSectionHeader
        eyebrow="مكتبة الوسائط"
        title="مكتبة الوسائط المركزية"
        description="مصدر وحيد لكل الصور والمستندات المستخدمة في الموقع — رفع، تصنيف، متابعة الاستخدام، واستبدال آمن."
        crumbs={[
          { label: "لوحة التحكم", to: "/admin" },
          { label: "الوسائط" },
        ]}
      />
      <MediaLibrary bucket="media" defaultFolder="temp" uploadAccept="image/*,application/pdf" />
    </>
  );
}
