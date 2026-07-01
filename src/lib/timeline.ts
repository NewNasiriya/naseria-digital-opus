/**
 * Smart Academic Timeline Engine.
 *
 * Pure, testable functions + React Query hooks that compute the current
 * academic status from a list of `academic_timeline_events` rows. All
 * runtime behaviour (which event is active, countdown target, status
 * theme) is derived from the data — no hardcoded dates in the UI.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type TimelineTheme =
  | "primary"
  | "warning"
  | "danger"
  | "success"
  | "emerald";

export type AcademicEventType =
  | "year_start"
  | "semester_1"
  | "exams_1"
  | "mid_year_break"
  | "semester_2"
  | "exams_2"
  | "year_end"
  | "summer_break"
  | "custom";

export interface TimelineEvent {
  id: string;
  event_type: AcademicEventType;
  headline_ar: string;
  subtitle_ar: string | null;
  description_ar: string | null;
  icon: string | null;
  theme: TimelineTheme | null;
  cta_text_ar: string | null;
  cta_href: string | null;
  starts_at: string;
  ends_at: string | null;
  countdown_enabled: boolean;
  show_on_homepage: boolean;
  show_popup: boolean;
  priority: number;
  sort_order: number;
  status: "draft" | "published" | "archived";
}

/** Phase of an event relative to "now". */
export type EventPhase = "past" | "current" | "upcoming";

export interface TimelineState {
  /** Ordered events (as provided). */
  events: TimelineEvent[];
  /** Event whose date range covers "now", if any. */
  currentEvent: TimelineEvent | null;
  /** Next upcoming event (starts_at > now), if any. */
  nextEvent: TimelineEvent | null;
  /** The event that drives the homepage widget (current or next). */
  primaryEvent: TimelineEvent | null;
  /** Countdown target date for the primary event, or null. */
  countdownTarget: Date | null;
  /** Whether the primary event is currently running. */
  isRunning: boolean;
}

const CACHE_KEY = ["academic", "timeline", "events"] as const;

async function fetchTimelineEvents(): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from("academic_timeline_events" as never)
    .select(
      "id,event_type,headline_ar,subtitle_ar,description_ar,icon,theme,cta_text_ar,cta_href,starts_at,ends_at,countdown_enabled,show_on_homepage,show_popup,priority,sort_order,status",
    )
    .eq("status", "published")
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as TimelineEvent[];
}

export function useTimelineEvents() {
  return useQuery({
    queryKey: CACHE_KEY,
    queryFn: fetchTimelineEvents,
    staleTime: 60_000,
  });
}

/** Phase of one event relative to a reference instant. */
export function phaseOf(event: TimelineEvent, now: Date): EventPhase {
  const start = new Date(event.starts_at).getTime();
  const end = event.ends_at ? new Date(event.ends_at).getTime() : start;
  const t = now.getTime();
  if (t < start) return "upcoming";
  if (t > end) return "past";
  return "current";
}

/**
 * Derive the current timeline state from a list of events + "now".
 * Pure function — no side effects, no hooks.
 */
export function computeTimelineState(
  events: TimelineEvent[],
  now: Date = new Date(),
): TimelineState {
  const ordered = [...events].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );
  const homepageEvents = ordered.filter((e) => e.show_on_homepage);

  const currentEvent =
    homepageEvents.find((e) => phaseOf(e, now) === "current") ?? null;
  const nextEvent =
    homepageEvents.find((e) => phaseOf(e, now) === "upcoming") ?? null;

  const primaryEvent = currentEvent ?? nextEvent ?? null;
  let countdownTarget: Date | null = null;
  let isRunning = false;

  if (primaryEvent) {
    isRunning = phaseOf(primaryEvent, now) === "current";
    if (primaryEvent.countdown_enabled) {
      if (isRunning && primaryEvent.ends_at) {
        countdownTarget = new Date(primaryEvent.ends_at);
      } else if (!isRunning) {
        countdownTarget = new Date(primaryEvent.starts_at);
      }
    }
  }

  return {
    events: ordered,
    currentEvent,
    nextEvent,
    primaryEvent,
    countdownTarget,
    isRunning,
  };
}

/** Countdown breakdown into d/h/m/s. */
export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  finished: boolean;
}

export function computeCountdown(target: Date, now: Date = new Date()): CountdownParts {
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const finished = totalMs === 0;
  const seconds = Math.floor(totalMs / 1000) % 60;
  const minutes = Math.floor(totalMs / (1000 * 60)) % 60;
  const hours = Math.floor(totalMs / (1000 * 60 * 60)) % 24;
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds, totalMs, finished };
}

/** Live 1-second ticking countdown driven by requestAnimationFrame. */
export function useCountdown(target: Date | null): CountdownParts | null {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!target) return;
    let raf = 0;
    let lastSecond = -1;
    const tick = () => {
      const current = new Date();
      const sec = Math.floor(current.getTime() / 1000);
      if (sec !== lastSecond) {
        lastSecond = sec;
        setNow(current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target?.getTime()]);
  if (!target) return null;
  return computeCountdown(target, now);
}

/**
 * Resolve the "urgency" theme for the widget: warning <7d, danger <3d,
 * otherwise the event's own theme (or "primary").
 */
export function resolveUrgencyTheme(
  event: TimelineEvent,
  countdown: CountdownParts | null,
  isRunning: boolean,
): TimelineTheme {
  if (isRunning) return event.theme ?? "success";
  if (countdown && !countdown.finished) {
    if (countdown.totalMs < 3 * 24 * 60 * 60 * 1000) return "danger";
    if (countdown.totalMs < 7 * 24 * 60 * 60 * 1000) return "warning";
  }
  return event.theme ?? "primary";
}

/** Tailwind class tokens per theme. Reuses existing design system. */
export const THEME_CLASSES: Record<
  TimelineTheme,
  { badge: string; ring: string; accent: string; soft: string; text: string }
> = {
  primary: {
    badge: "bg-primary text-primary-foreground",
    ring: "ring-primary/30",
    accent: "text-primary",
    soft: "bg-primary-soft",
    text: "text-primary",
  },
  success: {
    badge: "bg-emerald-600 text-white",
    ring: "ring-emerald-500/30",
    accent: "text-emerald-700",
    soft: "bg-emerald-50",
    text: "text-emerald-700",
  },
  emerald: {
    badge: "bg-emerald-500 text-white",
    ring: "ring-emerald-500/30",
    accent: "text-emerald-700",
    soft: "bg-emerald-50",
    text: "text-emerald-700",
  },
  warning: {
    badge: "bg-amber-500 text-white",
    ring: "ring-amber-500/30",
    accent: "text-amber-700",
    soft: "bg-amber-50",
    text: "text-amber-700",
  },
  danger: {
    badge: "bg-red-600 text-white",
    ring: "ring-red-500/30",
    accent: "text-red-700",
    soft: "bg-red-50",
    text: "text-red-700",
  },
};

/** Human-readable Arabic date. */
export function formatArabicDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function useTimelineState(): TimelineState & { isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useTimelineEvents();
  // Recompute every minute so phase transitions eventually surface without
  // a page refresh. Countdown-second precision is handled by useCountdown.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  const state = useMemo(
    () => computeTimelineState(data ?? [], new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, tick],
  );
  return { ...state, isLoading, isError };
}

export const EVENT_TYPE_LABEL_AR: Record<AcademicEventType, string> = {
  year_start: "بداية العام",
  semester_1: "الفصل الأول",
  exams_1: "امتحانات الفصل الأول",
  mid_year_break: "إجازة نصف العام",
  semester_2: "الفصل الثاني",
  exams_2: "امتحانات الفصل الثاني",
  year_end: "نهاية العام",
  summer_break: "الإجازة الصيفية",
  custom: "فعالية",
};

export const DEFAULT_EVENT_ICON: Record<AcademicEventType, string> = {
  year_start: "📚",
  semester_1: "🏫",
  exams_1: "✏️",
  mid_year_break: "🌴",
  semester_2: "📖",
  exams_2: "✏️",
  year_end: "🎓",
  summer_break: "🏖️",
  custom: "📌",
};
