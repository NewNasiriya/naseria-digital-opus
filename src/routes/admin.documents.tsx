import { createFileRoute } from "@tanstack/react-router";

import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { MediaLibrary } from "@/components/admin/media/MediaLibrary";

export const Route = createFileRoute("/admin/documents")({
  head: () => ({
    meta: [
      { title: "مركز المستندات · لوحة الإدارة" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  return (
    <>
      <AdminSectionHeader
        eyebrow="مركز المستندات"
        title="إدارة المستندات المدرسية"
        description="ملفات PDF، التعميمات، السياسات، النماذج، والملفات القابلة للتنزيل — يديرها فريق الإدارة من مكان واحد."
        crumbs={[
          { label: "لوحة التحكم", to: "/admin" },
          { label: "المستندات" },
        ]}
      />
      <MediaLibrary
        bucket="documents"
        fixedKind="document"
        defaultFolder="documents"
        uploadAccept="application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        emptyTitle="لا توجد مستندات بعد"
        emptyDescription="ارفع أول مستند PDF ليصبح متاحًا لجميع أقسام النظام."
      />
    </>
  );
}
