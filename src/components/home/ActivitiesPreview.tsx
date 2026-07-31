import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Sparkles } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import {
  activityExcerpt,
  fetchActivities,
  formatActivityDate,
} from "@/lib/activities";

export function ActivitiesPreview() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["activities", "home"],
    queryFn: () => fetchActivities({ limit: 3 }),
    staleTime: 60_000,
  });

  // Never replace an empty CMS with invented activity cards. The dedicated
  // page provides the explanatory empty state until administration publishes
  // the first real activity.
  if (!isLoading && (isError || !data || data.length === 0)) return null;

  return (
    <Section
      tone="muted"
      spacing="default"
      className="home-activities-luxury"
    >
      <Container size="wide">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="home-section-eyebrow text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              أنشطة المدرسة
            </p>
            <h2 className="home-section-title mt-3 inline-block">
              حياة مدرسية غنية ومتوازنة
            </h2>
          </div>
          <Link
            to="/activities"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
          >
            كل الأنشطة
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [0, 1, 2].map((key) => (
                <div
                  key={key}
                  className="home-luxury-card h-72 animate-pulse rounded-2xl border border-border bg-card"
                />
              ))
            : data?.map((item) => {
                const excerpt = activityExcerpt(item, 125);
                const date = formatActivityDate(
                  item.event_date ?? item.published_at,
                );
                return (
                  <Link
                    key={item.id}
                    to="/activities"
                    className="home-luxury-card home-activity-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:elevation-md"
                  >
                    {item.cover_url ? (
                      <div className="aspect-[16/10] overflow-hidden bg-surface-muted">
                        <img
                          src={item.cover_url}
                          alt={item.title_ar}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    ) : (
                      <div className="grid aspect-[16/8] place-items-center bg-primary-soft text-primary">
                        <Sparkles className="h-9 w-9" aria-hidden="true" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {item.category?.name_ar && (
                          <span className="font-semibold text-primary">
                            {item.category.name_ar}
                          </span>
                        )}
                        {date && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {date}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-foreground">
                        {item.title_ar}
                      </h3>
                      {excerpt && (
                        <p className="mt-2 text-sm leading-loose text-muted-foreground">
                          {excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
        </div>
      </Container>
    </Section>
  );
}
