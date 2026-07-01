import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock, Pin, Star, Newspaper } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  coverImageUrl,
  formatArabicDate,
  type NewsListItem,
} from "@/lib/news";

interface NewsCardProps {
  item: NewsListItem;
  variant?: "default" | "featured" | "compact";
  priority?: boolean;
}

export function NewsCard({ item, variant = "default", priority }: NewsCardProps) {
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";
  const cover = coverImageUrl(item);
  const alt =
    item.featured_media?.alt_ar ??
    item.featured_media?.alt_en ??
    item.title_ar;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:elevation-md",
        isFeatured && "md:flex-row",
      )}
    >
      <Link
        to="/news/$slug"
        params={{ slug: item.slug }}
        className="absolute inset-0 z-10"
        aria-label={item.title_ar}
      />

      <div
        className={cn(
          "relative overflow-hidden bg-surface-muted",
          isFeatured
            ? "aspect-[16/10] md:aspect-auto md:w-1/2"
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
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid h-full w-full place-items-center text-muted-foreground/40"
          >
            <Newspaper className="h-10 w-10" />
          </div>
        )}
        <div className="pointer-events-none absolute top-3 right-3 flex flex-wrap gap-1.5">
          {item.is_pinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground elevation-sm">
              <Pin className="h-3 w-3" aria-hidden="true" />
              مثبت
            </span>
          )}
          {item.is_featured && !item.is_pinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-primary elevation-sm">
              <Star className="h-3 w-3" aria-hidden="true" />
              مميز
            </span>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col p-6",
          isFeatured && "md:p-8",
        )}
      >
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {item.category && (
            <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-1 font-medium text-primary">
              {item.category.name_ar}
            </span>
          )}
          {item.published_at && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {formatArabicDate(item.published_at)}
            </span>
          )}
          {item.reading_minutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {item.reading_minutes} د قراءة
            </span>
          )}
        </div>

        <h3
          className={cn(
            "mt-3 font-semibold text-foreground",
            isFeatured
              ? "text-2xl leading-snug"
              : isCompact
                ? "line-clamp-2 text-base"
                : "line-clamp-2 text-lg",
          )}
        >
          {item.title_ar}
        </h3>

        {item.summary_ar && !isCompact && (
          <p className="mt-2 line-clamp-3 text-sm leading-loose text-muted-foreground">
            {item.summary_ar}
          </p>
        )}

        <div className="mt-auto pt-5">
          <span className="relative z-20 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors group-hover:text-primary-hover">
            اقرأ المزيد
            <span aria-hidden="true">←</span>
          </span>
        </div>
      </div>
    </article>
  );
}
