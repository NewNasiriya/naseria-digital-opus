import { createFileRoute } from "@tanstack/react-router";

import { PageHero } from "@/components/academic/PageHero";
import { GuidelinesList } from "@/components/academic/GuidelinesList";

export const Route = createFileRoute("/academic/student-guidelines")({
  head: () => ({
    meta: [
      { title: "إرشادات الطلاب | مدرسة الناصرية الابتدائية الجديدة" },
      {
        name: "description",
        content:
          "قواعد وتوجيهات رسمية تُعين الطالب على الالتزام والانضباط والتميّز داخل المدرسة.",
      },
      { property: "og:title", content: "إرشادات الطلاب" },
    ],
    links: [{ rel: "canonical", href: "https://newnasiriya.com/academic/student-guidelines" }],
  }),
  component: StudentGuidelinesPage,
});

function StudentGuidelinesPage() {
  return (
    <>
      <PageHero
        title="إرشادات الطلاب"
        description="مجموعة من التوجيهات الرسمية التي تساعد الطالب على الاستفادة القصوى من رحلته الدراسية، وتنمية سلوكه الإيجابي داخل المدرسة."
        crumbs={[{ label: "الحياة الأكاديمية", to: "/academic" }, { label: "إرشادات الطلاب" }]}
      />
      <GuidelinesList
        audience="student"
        emptyTitle="لم تُنشر إرشادات الطلاب بعد"
        emptyDescription="ستقوم إدارة المدرسة بنشر إرشادات وتوجيهات الطلاب قريبًا من خلال لوحة التحكم."
      />
    </>
  );
}
