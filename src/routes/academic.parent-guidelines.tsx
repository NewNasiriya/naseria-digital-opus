import { createFileRoute } from "@tanstack/react-router";

import { PageHero } from "@/components/academic/PageHero";
import { GuidelinesList } from "@/components/academic/GuidelinesList";

export const Route = createFileRoute("/academic/parent-guidelines")({
  head: () => ({
    meta: [
      { title: "إرشادات أولياء الأمور | مدرسة الناصرية الابتدائية الجديدة" },
      {
        name: "description",
        content:
          "دليل ولي الأمر لمتابعة تعليم أبنائه، التواصل مع المدرسة، ودعم المسيرة التعليمية.",
      },
      { property: "og:title", content: "إرشادات أولياء الأمور" },
    ],
    links: [{ rel: "canonical", href: "https://naseria-digital-opus.lovable.app/academic/parent-guidelines" }],
  }),
  component: ParentGuidelinesPage,
});

function ParentGuidelinesPage() {
  return (
    <>
      <PageHero
        title="إرشادات أولياء الأمور"
        description="توجيهات ونصائح تساعد ولي الأمر على متابعة أبنائه أكاديميًا وسلوكيًا، ودعم دور المدرسة في تعليمهم وتربيتهم."
        crumbs={[
          { label: "الحياة الأكاديمية", to: "/academic" },
          { label: "إرشادات أولياء الأمور" },
        ]}
      />
      <GuidelinesList
        audience="parent"
        emptyTitle="لم تُنشر إرشادات أولياء الأمور بعد"
        emptyDescription="ستقوم إدارة المدرسة بنشر التوجيهات الخاصة بأولياء الأمور قريبًا."
      />
    </>
  );
}
