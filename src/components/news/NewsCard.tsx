import { Link } from "@tanstack/react-router";
import { Clock, Pin, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  excerptFor,
  formatArabicDate,
  meaningfulUpdatedAt,
  readingMinutes,
  readingTimeLabel,
  relativeArabicDate,
  type NewsListItem,
} from "@/lib/news";

interface NewsCardProps {
  item: NewsListItem;
  /**
   * `row` renders a hairline-separated editorial index entry (default),
   * `card` a bordered text card for pinned / announcement grids,
   * `compact` a dense variant for sidebars and related lists.
   */
  variant?: "row" | "card" | "compact";
}

/** Small dot separator used between metadata items. */
function Dot() {
  return (
    <span aria-hidden="true" className="text-border">
      ·
    </span>
  );
}

function Meta({ item, compact }: { item: NewsListItem; compact?: boolean }) {
  const minutes = readingMinutes(item);
  const updated = meaningfulUpdatedAt(item);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      {item.category && (
        <span className="font-semibold uppercase tracking-[0.12em] text-primary">
          {item.category.name_ar}
        </span>
      )}
      {item.published_at && (
        <>
          {item.category && <Dot />}
          <time dateTime={item.published_at} title={formatArabicDate(item.published_at)}>
            {relativeArabicDate(item.published_at)}
          </time>
        </>
      )}
      {minutes !== null && (
        <>
          <Dot />
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {readingTimeLabel(minutes)}
          </span>
        </>
      )}
      {!compact && updated && (
        <>
          <Dot />
          <span>حُدّث في {formatArabicDate(updated)}</span>
        </>
      )}
      {!compact && (
        <>
          <Dot />
          <span>إدارة المدرسة</span>
        </>
      )}
    </div>
  );
}

function Flags({ item }: { item: NewsListItem }) {
  if (!item.is_pinned && !item.is_featured) return null;
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
      {item.is_pinned && (
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          <Pin className="h-3 w-3" aria-hidden="true" />
          مثبت
        </span>
      )}
      {item.is_featured && !item.is_pinned && (
        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
          <Star className="h-3 w-3" aria-hidden="true" />
          مميز
        </span>
      )}
    </div>
  );
}

export function NewsCard({ item, variant = "row" }: NewsCardProps) {
  const excerpt = excerptFor(item, variant === "compact" ? 110 : 190);

  return (
    <article
      className={cn(
        "news-index-item group relative",
        variant === "row" && "news-index-item-row py-7 first:pt-0",
        variant === "card" &&
          "news-index-card flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-colors duration-300 hover:border-primary/40",
        variant === "compact" &&
          "news-index-compact flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors duration-300 hover:border-primary/40",
      )}
    >
      <Link
        to="/news/$slug"
        params={{ slug: item.slug }}
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={item.title_ar}
      />

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <Meta item={item} compact={variant === "compact"} />
        </div>
        <Flags item={item} />
      </div>

      <h3
        className={cn(
          "mt-3 font-semibold tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary",
          variant === "row"
            ? "text-xl leading-[1.5] sm:text-[1.4rem]"
            : variant === "card"
              ? "line-clamp-3 text-lg leading-[1.55]"
              : "line-clamp-2 text-base leading-[1.6]",
        )}
      >
        {item.title_ar}
      </h3>

      {item.title_en && variant === "row" && (
        <p className="mt-1.5 text-sm text-muted-foreground/80" dir="ltr">
          {item.title_en}
        </p>
      )}

      {excerpt && (
        <p
          className={cn(
            "mt-2.5 text-muted-foreground",
            variant === "row"
              ? "max-w-[60ch] text-[15px] leading-[1.95]"
              : "line-clamp-3 text-sm leading-[1.9]",
          )}
        >
          {excerpt}
        </p>
      )}

      <span
        className={cn(
          "mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-primary",
          variant === "row" && "pt-3",
        )}
      >
        اقرأ الخبر
        <span
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:-translate-x-1"
        >
          ←
        </span>
      </span>
    </article>
  );
}
