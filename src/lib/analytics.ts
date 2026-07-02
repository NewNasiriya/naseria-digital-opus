/**
 * Analytics ingestion (client side).
 *
 * Privacy-first: records only aggregated operational signals — page path,
 * referrer domain, coarse device family, search term, or opened entity.
 * No IP address, user id, session id, or personal data is stored.
 *
 * All inserts go through the anonymous "log" policies on
 * `analytics_page_views`, `analytics_content_views`, and
 * `analytics_search_queries`. Errors are silently swallowed so tracking
 * never affects the user experience.
 */
import { supabase } from "@/integrations/supabase/client";

const DEDUPE_TTL = 5 * 60_000; // 5 minutes
const recent = new Map<string, number>();

function dedupe(key: string): boolean {
  const now = Date.now();
  const last = recent.get(key);
  if (last && now - last < DEDUPE_TTL) return true;
  recent.set(key, now);
  // Keep the map bounded
  if (recent.size > 500) {
    const cutoff = now - DEDUPE_TTL;
    for (const [k, v] of recent) if (v < cutoff) recent.delete(k);
  }
  return false;
}

function deviceFamily(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|android|iphone/.test(ua)) return "mobile";
  return "desktop";
}

function referrerDomain(): string | null {
  if (typeof document === "undefined") return null;
  const r = document.referrer;
  if (!r) return null;
  try {
    const u = new URL(r);
    if (typeof window !== "undefined" && u.hostname === window.location.hostname) {
      return null;
    }
    return u.hostname;
  } catch {
    return null;
  }
}

function isAdminPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/") || path.startsWith("/auth");
}

export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  if (!path || isAdminPath(path)) return;
  const key = `pv:${path}`;
  if (dedupe(key)) return;
  void supabase
    .from("analytics_page_views")
    .insert({
      path,
      referrer_domain: referrerDomain(),
      device: deviceFamily(),
    })
    .then(() => undefined, () => undefined);
}

export function trackContentView(
  entityTable: string,
  entityId: string,
  slug?: string | null,
): void {
  if (typeof window === "undefined") return;
  if (!entityTable || !entityId) return;
  const key = `cv:${entityTable}:${entityId}`;
  if (dedupe(key)) return;
  void supabase
    .from("analytics_content_views")
    .insert({ entity_table: entityTable, entity_id: entityId, slug: slug ?? null })
    .then(() => undefined, () => undefined);
}

export function trackSearch(term: string, resultCount: number): void {
  if (typeof window === "undefined") return;
  const clean = term.trim();
  if (clean.length < 2) return;
  const normalized = clean.toLowerCase();
  const key = `sq:${normalized}:${resultCount}`;
  if (dedupe(key)) return;
  void supabase
    .from("analytics_search_queries")
    .insert({ term: clean.slice(0, 120), normalized_term: normalized.slice(0, 120), result_count: resultCount })
    .then(() => undefined, () => undefined);
}
