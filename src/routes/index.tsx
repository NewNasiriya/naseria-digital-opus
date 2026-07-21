import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { fetchHomepageHero } from "@/lib/homepage-hero";

import schoolDay from "@/assets/school-day.png.asset.json";
import schoolNight from "@/assets/school-night.png.asset.json";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Hero } from "@/components/home/Hero";
import { Stats } from "@/components/home/Stats";
import { AcademicTimelineWidget } from "@/components/academic/AcademicTimelineWidget";
import { WelcomePreview } from "@/components/home/WelcomePreview";
import { LatestNews } from "@/components/home/LatestNews";
import { AcademicLifePreview } from "@/components/home/AcademicLifePreview";
import { HonorBoardPreview } from "@/components/home/HonorBoardPreview";
import { AchievementsPreview } from "@/components/home/AchievementsPreview";
import { ActivitiesPreview } from "@/components/home/ActivitiesPreview";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { CallToAction } from "@/components/home/CallToAction";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => {
    const seo = buildSeo({
      path: "/",
      title: "مدرسة الناصرية الابتدائية الجديدة — الموقع الرسمي",
      description:
        "الموقع الرسمي لمدرسة الناصرية الابتدائية الجديدة — الأخبار، الجداول الدراسية، الأنشطة، لوحة الشرف، وإرشادات الطلاب وأولياء الأمور.",
    });
    return {
      meta: seo.meta,
      links: [
        ...seo.links,
        { rel: "preload", as: "image", href: schoolDay.url, fetchpriority: "high" },
        { rel: "preload", as: "image", href: schoolNight.url },
      ],
    };
  },
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <HeroWithCms />
        <AcademicTimelineWidget />
        <Stats />
        <WelcomePreview />
        <LatestNews />
        <AcademicLifePreview />
        <AchievementsPreview />
        <HonorBoardPreview />
        <ActivitiesPreview />
        <GalleryPreview />
        <CallToAction />
      </main>
      <SiteFooter />
    </>
  );
}

function HeroWithCms() {
  const { data } = useQuery({
    queryKey: ["homepage-hero"],
    queryFn: fetchHomepageHero,
    staleTime: 60_000,
  });
  return <Hero intro={data?.subheadline_ar ?? undefined} />;
}

