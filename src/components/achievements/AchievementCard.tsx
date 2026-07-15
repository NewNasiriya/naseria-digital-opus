import { Link } from "@tanstack/react-router";
import { CalendarDays, Pin, Sparkles, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  formatAchievementDate,
  type AchievementListItem,
} from "@/lib/achievements";

interface AchievementCardProps {
  item: AchievementListItem;
  variant?: "default" | "featured" | "compact";
  priority?: boolean;
}

export function AchievementCard({
  item,
  variant = "default",
  priority,
}: AchievementCardProps) {
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";
  const cover = item.cover_url;
  const alt = item.title_ar;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:elevation-md",
        isFeatured && "md:flex-row",
      )}
    >
      <Link
        to="/achievements/$slug"
        params={{ slug: item.slug }}
        className="absolute inset-0 z-10"
        aria-label={item.title_ar}
      />

      <div
        className={cn(
          "relative overflow-hidden bg-surface-muted",
          isFeatured
            ? "aspect-[16/10] md:aspect-auto md:w-3/5"
            : isCompact
              ? "aspect-[16/9]"
              : "aspect-[16/10]",
        )}
      >
        {cover ? (
          <img
            src={cover}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-full w-full place-items-center text-muted-foreground/40"
          >
            <Trophy className="h-10 w-10" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="pointer-events-none absolute top-3 right-3 flex flex-wrap gap-1.5">
          {item.is_pinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground elevation-sm">
              <Pin className="h-3 w-3" aria-hidden="true" />
              مثبت
            </span>
          )}
          {item.is_featured && !item.is_pinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-primary elevation-sm">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              إنجاز مميز
            </span>
          )}
        </div>
      </div>

      <div className={cn("flex flex-1 flex-col p-6", isFeatured && "md:p-10")}>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {item.category && (
            <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-1 font-medium text-primary">
              {item.category.name_ar}
            </span>
          )}
          {item.academic_year && (
            <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 font-medium">
              {item.academic_year}
            </span>
          )}
          {item.achieved_on && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {formatAchievementDate(item.achieved_on)}
            </span>
          )}
        </div>

        <h3
          className={cn(
            "mt-3 font-semibold text-foreground",
            isFeatured
              ? "text-2xl leading-snug sm:text-3xl"
              : isCompact
                ? "line-clamp-2 text-base"
                : "line-clamp-2 text-lg",
          )}
        >
          {item.title_ar}
        </h3>

        {item.description_ar && !isCompact && (
          <p
            className={cn(
              "mt-3 leading-loose text-muted-foreground",
              isFeatured ? "line-clamp-4 text-base" : "line-clamp-3 text-sm",
            )}
          >
            {item.description_ar}
          </p>
        )}

        <div className="mt-auto pt-6">
          <span className="relative z-20 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors group-hover:text-primary-hover">
            اقرأ التفاصيل
            <span aria-hidden="true">←</span>
          </span>
        </div>
      </div>
    </article>
  );
}
