/**
 * Realtime channel factory.
 *
 * Wraps Supabase Realtime so UI code subscribes to typed CMS events
 * ("news.published", "honor.updated", …) without dealing with channel
 * bookkeeping or Postgres change payload shapes. Every subscription
 * returns an `unsubscribe` cleanup safe to call from React `useEffect`.
 */
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type CmsRealtimeEvent =
  | "news.published"
  | "news.updated"
  | "achievements.published"
  | "achievements.updated"
  | "honor.updated"
  | "timetables.updated"
  | "gallery.updated"
  | "activities.updated"
  | "homepage.updated";

interface WatchOptions<Row extends { [key: string]: any }> {
  table: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  filter?: string; // PostgREST-style filter, e.g. "status=eq.published"
  onChange: (payload: RealtimePostgresChangesPayload<Row>) => void;
}

/** Subscribe to `postgres_changes` on a public table. Returns unsubscribe. */
export function watchTable<Row extends { [key: string]: any }>(
  opts: WatchOptions<Row>,
): () => void {
  const channelName = `cms:${opts.table}:${opts.event ?? "*"}:${opts.filter ?? "all"}`;
  const channel: RealtimeChannel = (supabase.channel(channelName) as any)
    .on(
      "postgres_changes",
      {
        event: opts.event ?? "*",
        schema: "public",
        table: opts.table,
        ...(opts.filter ? { filter: opts.filter } : {}),
      },
      (payload: RealtimePostgresChangesPayload<Row>) => opts.onChange(payload),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** Small in-memory bus for cross-component CMS events (client-only). */
type Listener<T> = (payload: T) => void;
const listeners = new Map<CmsRealtimeEvent, Set<Listener<unknown>>>();

export const cmsBus = {
  on<T>(event: CmsRealtimeEvent, listener: Listener<T>): () => void {
    const set = (listeners.get(event) ?? new Set()) as Set<Listener<unknown>>;
    set.add(listener as Listener<unknown>);
    listeners.set(event, set);
    return () => set.delete(listener as Listener<unknown>);
  },
  emit<T>(event: CmsRealtimeEvent, payload: T): void {
    listeners.get(event)?.forEach((fn) => fn(payload));
  },
};
