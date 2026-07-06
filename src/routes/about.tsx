import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AboutHero } from "@/components/about/AboutHero";
import { SchoolOverview } from "@/components/about/SchoolOverview";
import { PrincipalWelcome } from "@/components/about/PrincipalWelcome";
import { MissionVision } from "@/components/about/MissionVision";
import { EducationalValues } from "@/components/about/EducationalValues";
import { WhyChooseUs } from "@/components/about/WhyChooseUs";
import { Stats } from "@/components/home/Stats";
import { LocationPreview } from "@/components/about/LocationPreview";
import { ExploreCTA } from "@/components/about/ExploreCTA";
import { buildSeo } from "@/lib/seo";
import { fetchAboutContent } from "@/lib/about";

export const Route = createFileRoute("/about")({
  head: () => buildSeo({
    path: "/about",
    title: "عن المدرسة | مدرسة الناصرية الابتدائية الجديدة",
    description:
      "تعرّف على مدرسة الناصرية الابتدائية الجديدة: رسالتنا، رؤيتنا، قيمنا التربوية، وأسباب تميّز التجربة التعليمية لدينا.",
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data } = useQuery({
    queryKey: ["about", "school_info"],
    queryFn: fetchAboutContent,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <>
      <SiteHeader />
      <main id="main">
        <AboutHero />
        <SchoolOverview data={data?.overview} />
        <PrincipalWelcome data={data?.principal} />
        <MissionVision mission={data?.mission} vision={data?.vision} />
        <EducationalValues />
        <WhyChooseUs />
        <Stats />
        <LocationPreview />
        <ExploreCTA />
      </main>
      <SiteFooter />
    </>
  );
}
