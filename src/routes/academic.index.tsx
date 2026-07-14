import { createFileRoute } from "@tanstack/react-router";

import { PageHero } from "@/components/academic/PageHero";
import { GradeSelector } from "@/components/academic/GradeSelector";
import { AcademicResources } from "@/components/academic/AcademicResources";

export const Route = createFileRoute("/academic/")({
  head: () => ({
    meta: [
      { title: "الحياة الأكاديمية | مدرسة الناصرية الابتدائية الجديدة" },
      {
        name: "description",
        content:
          "بوابة الحياة الأكاديمية للمدرسة: الجداول الدراسية، جداول الامتحانات، التقويم الأكاديمي، وإرشادات الطلاب وأولياء الأمور.",
      },
      { property: "og:title", content: "الحياة الأكاديمية | مدرسة الناصرية الابتدائية الجديدة" },
      {
        property: "og:description",
        content:
          "كل المصادر الأكاديمية للمدرسة في مكان واحد، منظّمة لكل صف دراسي.",
      },
    ],
    links: [{ rel: "canonical", href: "https://naseria-digital-opus.lovable.app/academic" }],
  }),
  component: AcademicIndex,
});

function AcademicIndex() {
  return (
    <>
      <PageHero
        title="الحياة الأكاديمية"
        description="بوابتك المتكاملة للاطلاع على الجداول الدراسية، جداول الامتحانات، التقويم الأكاديمي، والإرشادات الرسمية للطلاب وأولياء الأمور. كل صف دراسي له صفحته المخصّصة."
        crumbs={[{ label: "الحياة الأكاديمية" }]}
      />
      <GradeSelector />
      <AcademicResources />
    </>
  );
}
