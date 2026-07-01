/**
 * Audit log helper. Writes to `public.audit_log` so future dashboards can
 * show who changed what, when, and in which module.
 *
 * Any repository/service can attach `recordAudit` as an `onAfterChange`
 * callback — it never blocks the primary mutation.
 */
import { supabase } from "@/integrations/supabase/client";

import type { UUID } from "./types";

export interface AuditEntry {
  module: string;
  entity_id: UUID;
  action: string;
  actor_id?: UUID | null;
  metadata?: Record<string, unknown> | null;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await (supabase.from("audit_log") as any).insert({
      module: entry.module,
      entity_id: entry.entity_id,
      action: entry.action,
      actor_id: entry.actor_id ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch {
    // Audit writes are best-effort. Never break the user flow.
  }
}
