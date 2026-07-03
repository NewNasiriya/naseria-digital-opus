import { Link, createFileRoute } from "@tanstack/react-router";
import { buildSeo } from "@/lib/seo";
import {
  ArrowLeft,
  BookMarked,
  Bus,
  Medal,
  Palette,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { PageHero } from "@/components/academic/PageHero";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/activities")({
  head: () => buildSeo({
    path: "/activities",
    title: "أنشطة المدرسة | مدرسة الناصرية الابتدائية الجديدة",
    description:
      "نظرة عامة على الأنشطة الطلابية في مدرسة الناصرية الابتدائية الجديدة: الرياضة، الفنون، الثقافة، الرحلات، والمسابقات.",
  }),
  component: ActivitiesPage,
});

interface ActivityCard {
  title: string;
  description: string;
  icon: LucideIcon;
}

const ACTIVITIES: ActivityCard[] = [
  {
    title: "الأنشطة الرياضية",
    description:
      "تدريبات وبطولات منتظمة لتنمية اللياقة البدنية وروح الفريق.",
    icon: Trophy,
  },
  {
    title: "الأنشطة الثقافية",
    description: "برامج تُثري ثقافة الطالب وتنمي مهارات القراءة والنقاش.",
    icon: BookMarked,
  },
  {
    title: "الأنشطة الفنية",
    description: "ورش الرسم والحرف اليدوية لاكتشاف المواهب وصقلها.",
    icon: Palette,
  },
  {
    title: "الرحلات المدرسية",
    description: "رحلات تعليمية وترفيهية مُنظّمة تعزز التعلّم خارج الفصل.",
    icon: Bus,
  },
  {
    title: "المسابقات",
    description: "مسابقات علمية وأدبية داخلية وخارجية تشجّع على التميز.",
    icon: Medal,
  },
];

function ActivitiesPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHero
          eyebrow="الأنشطة الطلابية"
          title="حياة مدرسية غنية ومتوازنة"
          description="تحرص المدرسة على تنظيم أنشطة متنوعة تُنمّي مواهب الطلاب وتُعزّز شخصياتهم. سيتم توثيق أنشطة كل عام دراسي ونشرها هنا فور اعتمادها من الإدارة."
          crumbs={[{ label: "الأنشطة" }]}
        />

        <Section spacing="default">
          <Container size="wide">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {ACTIVITIES.map((a) => {
                const Icon = a.icon;
                return (
                  <article
                    key={a.title}
                    className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 elevation-sm"
                  >
                    <span
                      aria-hidden="true"
                      className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <h2 className="mt-5 text-lg font-semibold text-foreground">
                      {a.title}
                    </h2>
                    <p className="mt-2 text-sm leading-loose text-muted-foreground">
                      {a.description}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="mt-14 rounded-2xl border border-dashed border-border bg-surface-muted p-8 text-center">
              <div
                aria-hidden="true"
                className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary"
              >
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">
                توثيق الأنشطة قيد الإعداد
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-loose text-muted-foreground">
                يعمل فريق المدرسة على توثيق الأنشطة الطلابية بالصور والتقارير
                الرسمية. حتى ذلك الحين، يمكنكم متابعة أحدث فعاليات المدرسة في
                قسم الأخبار، وإنجازات التطوير في قسم الإنجازات.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button asChild variant="outline">
                  <Link to="/news">
                    آخر أخبار المدرسة
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/achievements">
                    إنجازات المدرسة
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
