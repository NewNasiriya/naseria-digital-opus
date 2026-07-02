import { createFileRoute } from "@tanstack/react-router";

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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "مدرسة الناصرية الابتدائية الجديدة" },
      {
        name: "description",
        content:
          "الموقع الرسمي لمدرسة الناصرية الابتدائية الجديدة — الأخبار، الجداول الدراسية، الأنشطة، لوحة الشرف، وإرشادات الطلاب وأولياء الأمور.",
      },
      {
        property: "og:title",
        content: "مدرسة الناصرية الابتدائية الجديدة",
      },
      {
        property: "og:description",
        content:
          "الموقع الرسمي لمدرسة الناصرية الابتدائية الجديدة — تعليم متميز في بيئة حكومية آمنة ومحفزة.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [
      { rel: "canonical", href: "/" },
      { rel: "preload", as: "image", href: schoolDay.url, fetchpriority: "high" },
      { rel: "preload", as: "image", href: schoolNight.url },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
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
