import { Link } from "@tanstack/react-router";
import { CalendarDays, ArrowLeft, Sparkles } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_EVENT_ICON,
  EVENT_TYPE_LABEL_AR,
  THEME_CLASSES,
  formatArabicDate,
  resolveUrgencyTheme,
  useCountdown,
  useTimelineState,
} from "@/lib/timeline";

/**
 * Homepage widget — sits directly under the Hero.
 * Automatically renders the correct message + countdown for the current
 * academic phase. Zero hardcoded content: everything reads from the CMS.
 */
export function AcademicTimelineWidget() {
  const { primaryEvent, countdownTarget, isRunning, isLoading } = useTimelineState();
  const countdown = useCountdown(countdownTarget);

  if (isLoading) {
    return (
      <section aria-label="التقويم الأكاديمي" className="bg-surface-muted py-6">
        <Container size="wide">
          <div className="h-32 animate-pulse rounded-2xl bg-card" />
        </Container>
      </section>
    );
  }

  if (!primaryEvent) return null;

  const theme = resolveUrgencyTheme(primaryEvent, countdown, isRunning);
  const styles = THEME_CLASSES[theme];
  const icon = primaryEvent.icon || DEFAULT_EVENT_ICON[primaryEvent.event_type];
  const kicker = isRunning
    ? primaryEvent.subtitle_ar || "جارٍ الآن"
    : countdown && !countdown.finished
      ? "يتبقى على البدء"
      : primaryEvent.subtitle_ar || "قريبًا";

  return (
    <section
      aria-labelledby="timeline-widget-heading"
      className="relative isolate -mt-6 sm:-mt-10"
    >
      <Container size="wide">
        <div
          className={`relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-lg ring-1 ${styles.ring} sm:p-8`}
        >
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 opacity-60 ${styles.soft}`}
            style={{
              maskImage:
                "radial-gradient(circle at 90% 0%, black, transparent 65%)",
              WebkitMaskImage:
                "radial-gradient(circle at 90% 0%, black, transparent 65%)",
            }}
          />
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles.badge}`}
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  {EVENT_TYPE_LABEL_AR[primaryEvent.event_type]}
                </span>
                <span className="text-xs text-muted-foreground">{kicker}</span>
              </div>
              <h2
                id="timeline-widget-heading"
                className="mt-3 flex items-center gap-3 text-xl font-semibold text-foreground sm:text-2xl"
              >
                <span aria-hidden="true" className="text-3xl leading-none">
                  {icon}
                </span>
                <span className="[text-wrap:balance]">
                  {primaryEvent.headline_ar}
                </span>
              </h2>
              {primaryEvent.description_ar && (
                <p className="mt-2 max-w-2xl text-sm leading-loose text-muted-foreground">
                  {primaryEvent.description_ar}
                </p>
              )}
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {formatArabicDate(primaryEvent.starts_at)}
                {primaryEvent.ends_at && (
                  <>
                    <span aria-hidden="true">—</span>
                    {formatArabicDate(primaryEvent.ends_at)}
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-4 md:items-end">
              {countdown && !countdown.finished && (
                <CountdownDisplay
                  parts={countdown}
                  themeClasses={styles.badge}
                />
              )}
              <div className="flex flex-wrap justify-end gap-2">
                {primaryEvent.cta_text_ar && primaryEvent.cta_href && (
                  <Button asChild size="sm">
                    <a href={primaryEvent.cta_href}>{primaryEvent.cta_text_ar}</a>
                  </Button>
                )}
                <Button asChild size="sm" variant="outline">
                  <Link to="/academic/calendar">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    التقويم الأكاديمي
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

interface CountdownDisplayProps {
  parts: { days: number; hours: number; minutes: number; seconds: number };
  themeClasses: string;
  size?: "sm" | "md" | "lg";
}

/** Reusable 4-cell countdown block (d/h/m/s). */
export function CountdownDisplay({
  parts,
  themeClasses,
  size = "md",
}: CountdownDisplayProps) {
  const cells = [
    { label: "يوم", value: parts.days },
    { label: "ساعة", value: parts.hours },
    { label: "دقيقة", value: parts.minutes },
    { label: "ثانية", value: parts.seconds },
  ];
  const num =
    size === "lg"
      ? "text-3xl sm:text-4xl"
      : size === "sm"
        ? "text-lg"
        : "text-2xl sm:text-3xl";
  const cellPad = size === "lg" ? "px-4 py-3" : "px-3 py-2";

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      className="flex items-stretch gap-2"
    >
      {cells.map((c) => (
        <div
          key={c.label}
          className={`flex min-w-[64px] flex-col items-center justify-center rounded-xl border border-border bg-card text-center tabular-nums ${cellPad}`}
        >
          <span
            className={`font-bold leading-none text-foreground ${num}`}
            dir="ltr"
          >
            {String(c.value).padStart(2, "0")}
          </span>
          <span className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
            {c.label}
          </span>
        </div>
      ))}
      <span className={`sr-only ${themeClasses}`}>عدّاد تنازلي</span>
    </div>
  );
}
