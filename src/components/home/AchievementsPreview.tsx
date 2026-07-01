import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Trophy } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import { fetchAchievementsList } from "@/lib/achievements";

function SectionHeader() {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          إنجازات المدرسة
        </p>
        <h2 className="mt-3 rule-accent inline-block">
          أحدث المشاريع والتطويرات
        </h2>
      </div>
      <Button asChild variant="ghost" className="text-primary">
        <Link to="/achievements">
          كل الإنجازات
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-[16/10] w-full animate-pulse bg-surface-muted" />
      <div className="space-y-3 p-6">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-surface-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-surface-muted" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
      <div
        aria-hidden="true"
        className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary"
      >
        <Trophy className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">
        سيتم نشر إنجازات المدرسة قريبًا
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-loose text-muted-foreground">
        تتابع إدارة المدرسة توثيق مشاريع التطوير والبنية التحتية. سيظهر أحدثها
        هنا فور اعتماده رسميًا.
      </p>
      <div className="mt-6">
        <Button asChild variant="outline" size="sm">
          <Link to="/about">
            تعرّف على المدرسة
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function AchievementsPreview() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["home", "latest-achievements"],
    queryFn: () => fetchAchievementsList({ limit: 3 }),
    staleTime: 60_000,
  });

  return (
    <Section tone="default" spacing="default">
      <Container size="wide">
        <SectionHeader />
        <div className="mt-10">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : isError || !data || data.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.map((item) => (
                <li key={item.id}>
                  <AchievementCard item={item} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </Section>
  );
}
