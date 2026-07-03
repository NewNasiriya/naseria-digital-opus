import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Award } from "lucide-react";

import { PageHero } from "@/components/academic/PageHero";
import { EmptyPanel } from "@/components/academic/EmptyPanel";
import { HonorCard } from "@/components/honor/HonorCard";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { fetchPublishedHonorBoards } from "@/lib/honor";

export const Route = createFileRoute("/honor/")({
  head: () => buildSeo({
    path: "/honor",
    title: "لوحة الشرف | مدرسة الناصرية الابتدائية الجديدة",
    description:
      "لوحة الشرف الرسمية لمدرسة الناصرية الابتدائية الجديدة — تكريم الطلاب المتفوقين لكل صف دراسي على مستوى العام الأكاديمي.",
  }),
  component: HonorIndex,
  errorComponent: ({ error }) => (
    <div className="grid min-h-[60vh] place-items-center">
      <p className="text-muted-foreground">تعذّر تحميل لوحة الشرف: {error.message}</p>
    </div>
  ),
});

function HonorIndex() {
  const { data, isLoading } = useQuery({
    queryKey: ["honor", "boards", "published"],
    queryFn: () => fetchPublishedHonorBoards(),
    staleTime: 60_000,
  });

  const boards = data ?? [];

  return (
    <>
      <PageHero
        eyebrow="لوحة الشرف"
        title="نُكرِّم أوائل طلابنا"
        description="تحتفي مدرسة الناصرية الابتدائية الجديدة بتفوق أبنائها الطلاب من خلال لوحة شرف رسمية تُوثِّق أسماء الأوائل في كل صف دراسي، تقديرًا لجهودهم واعترافًا بتميّزهم."
        crumbs={[{ label: "لوحة الشرف" }]}
      />

      <Section spacing="default">
        <Container size="wide">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                كشوف الأوائل حسب الصف الدراسي
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-loose text-muted-foreground">
                اختر الصف الدراسي لعرض كشف الأوائل الرسمي بجودة عالية، مع إمكانية التكبير
                والتنزيل والطباعة.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-2xl border border-border bg-surface-muted"
                />
              ))}
            </div>
          ) : boards.length === 0 ? (
            <EmptyPanel
              icon={Award}
              title="لم تُنشر لوحة الشرف بعد"
              description="ستقوم إدارة المدرسة بنشر كشوف الأوائل الرسمية للعام الدراسي الحالي فور اعتمادها."
            />
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {boards.map((b) => (
                <li key={b.id}>
                  <HonorCard board={b} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}
