/**
 * Cross-cutting service contracts.
 *
 * These interfaces let feature code depend on capabilities rather than
 * concrete implementations. The default implementations wired below are
 * production-ready; alternate transports (email, SMS, push, external
 * search) can be plugged in later without changing call sites.
 */
import { supabase } from "@/integrations/supabase/client";

import { fromPostgrest, toCmsError } from "./errors";
import type { UUID } from "./types";

// ---------- Notifications --------------------------------------------------

export type NotificationChannel = "in_app" | "email" | "sms" | "push";

export interface NotificationPayload {
  channel: NotificationChannel;
  subject: string;
  body: string;
  recipients?: string[];              // emails / phone numbers / user ids
  entityTable?: string;
  entityId?: UUID;
  metadata?: Record<string, unknown>;
  scheduledAt?: string;               // ISO
}

export interface NotificationService {
  enqueue(payload: NotificationPayload): Promise<UUID>;
}

/** Default implementation persists to `notifications_outbox` for workers. */
export const notificationService: NotificationService = {
  async enqueue(payload) {
    try {
      const { data, error } = await (supabase as any)
        .from("notifications_outbox")
        .insert({
          channel: payload.channel,
          payload: {
            subject: payload.subject,
            body: payload.body,
            recipients: payload.recipients ?? [],
            entity_table: payload.entityTable,
            entity_id: payload.entityId,
            metadata: payload.metadata ?? {},
          },
          status: "pending",
          scheduled_at: payload.scheduledAt ?? null,
        })
        .select("id")
        .single();
      if (error) throw fromPostgrest(error);
      return data.id as UUID;
    } catch (err) {
      throw toCmsError(err);
    }
  },
};

// ---------- Search ---------------------------------------------------------

export interface SearchQuery {
  term: string;
  modules?: string[];        // physical table names to restrict to
  limit?: number;
}

export interface SearchHit {
  entityTable: string;
  entityId: UUID;
  title: string;
  snippet?: string;
  score?: number;
}

export interface SearchService {
  query(input: SearchQuery): Promise<SearchHit[]>;
}

/**
 * Default search delegates to per-table ILIKE lookups so it works out of
 * the box. Modules can register FTS indexes later without changing the
 * contract.
 */
export const searchService: SearchService = {
  async query({ term, modules = ["news", "achievements", "activities"], limit = 10 }) {
    const hits: SearchHit[] = [];
    for (const table of modules) {
      try {
        const { data } = await (supabase as any)
          .from(table)
          .select("id, title_ar")
          .ilike("title_ar", `%${term}%`)
          .limit(limit);
        for (const row of data ?? []) {
          hits.push({ entityTable: table, entityId: row.id, title: row.title_ar });
        }
      } catch {
        // Ignore per-table failures; other tables still contribute results.
      }
    }
    return hits.slice(0, limit);
  },
};

// ---------- SEO ------------------------------------------------------------

export interface SeoService {
  computeCanonical(path: string): string;
  buildRobots(indexable: boolean): string;
}

export const seoService: SeoService = {
  computeCanonical(path) {
    if (typeof window !== "undefined") {
      const origin = window.location.origin.replace(/\/$/, "");
      return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
    }
    return path;
  },
  buildRobots(indexable) {
    return indexable ? "index, follow" : "noindex, nofollow";
  },
};

// ---------- Publishing -----------------------------------------------------

export interface PublishingHooks {
  onPublish?: (entityTable: string, entityId: UUID) => Promise<void>;
  onUnpublish?: (entityTable: string, entityId: UUID) => Promise<void>;
  onArchive?: (entityTable: string, entityId: UUID) => Promise<void>;
}

/** Registry of side effects to run when content lifecycle changes. */
export const publishingHooks: PublishingHooks = {};
