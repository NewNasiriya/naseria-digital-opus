/**
 * Audit log helper. Writes to `public.audit_log` so future dashboards can
 * show who changed what, when, and in which entity.
 *
 * Any repository/service can attach `recordAudit` as an `onAfterChange`
 * callback — it never blocks the primary mutation.
 */
import { supabase } from "@/integrations/supabase/client";

import type { UUID } from "./types";

export interface AuditEntry {
  /** Physical table name (e.g. "news", "achievements"). */
  entity_table: string;
  entity_id: UUID;
  /** Verb such as "create", "update", "publish", "status:published". */
  action: string;
  actor_id?: UUID | null;
  /** Optional structured diff or contextual metadata. */
  diff?: Record<string, unknown> | null;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await (supabase as any).from("audit_log").insert({
      entity_table: entry.entity_table,
      entity_id: entry.entity_id,
      action: entry.action,
      actor_id: entry.actor_id ?? null,
      diff: entry.diff ?? null,
    });
  } catch {
    // Audit writes are best-effort. Never break the user flow.
  }
}
