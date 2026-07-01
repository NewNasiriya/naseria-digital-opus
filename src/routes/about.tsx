import { createFileRoute } from "@tanstack/react-router";

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

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "عن المدرسة | مدرسة الناصرية الابتدائية الجديدة" },
      {
        name: "description",
        content:
          "تعرّف على مدرسة الناصرية الابتدائية الجديدة: رسالتنا، رؤيتنا، قيمنا التربوية، وأسباب تميّز التجربة التعليمية لدينا.",
      },
      {
        property: "og:title",
        content: "عن مدرسة الناصرية الابتدائية الجديدة",
      },
      {
        property: "og:description",
        content:
          "بيئة تعليمية آمنة، كادر مؤهّل، وأنشطة متنوعة تحتفي بكل طالب.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <AboutHero />
        <SchoolOverview />
        <PrincipalWelcome />
        <MissionVision />
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
