import { Check, Clock } from "lucide-react";

import {
  DEFAULT_EVENT_ICON,
  EVENT_TYPE_LABEL_AR,
  THEME_CLASSES,
  formatArabicDate,
  phaseOf,
  type TimelineEvent,
} from "@/lib/timeline";

interface TimelineStripProps {
  events: TimelineEvent[];
  now?: Date;
}

/**
 * Horizontal, scrollable timeline of every published academic event.
 * Highlights the current event and marks completed / upcoming milestones.
 */
export function TimelineStrip({ events, now = new Date() }: TimelineStripProps) {
  if (events.length === 0) return null;
  return (
    <div className="relative">
      <ol
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:gap-6"
        aria-label="خط زمني للفعاليات الأكاديمية"
      >
        {events.map((e) => {
          const phase = phaseOf(e, now);
          const styles = THEME_CLASSES[e.theme ?? "primary"];
          const isCurrent = phase === "current";
          const isPast = phase === "past";
          const icon = e.icon || DEFAULT_EVENT_ICON[e.event_type];
          return (
            <li
              key={e.id}
              className={`relative w-64 flex-none snap-start rounded-2xl border p-5 elevation-sm transition ${
                isCurrent
                  ? `border-transparent ring-2 ${styles.ring} bg-card`
                  : isPast
                    ? "border-border bg-surface-muted opacity-70"
                    : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span aria-hidden="true" className="text-2xl leading-none">
                  {icon}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isCurrent
                      ? styles.badge
                      : isPast
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary-soft text-primary"
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"
                      />
                      جارٍ الآن
                    </>
                  ) : isPast ? (
                    <>
                      <Check className="h-3 w-3" aria-hidden="true" />
                      منتهي
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      قادم
                    </>
                  )}
                </span>
              </div>
              <p className="mt-3 text-xs font-medium text-muted-foreground">
                {EVENT_TYPE_LABEL_AR[e.event_type]}
              </p>
              <h3 className="mt-1 text-sm font-semibold leading-snug text-foreground">
                {e.headline_ar}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatArabicDate(e.starts_at)}
                {e.ends_at && (
                  <>
                    <span aria-hidden="true"> — </span>
                    {formatArabicDate(e.ends_at)}
                  </>
                )}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
