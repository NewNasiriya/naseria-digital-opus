/**
 * Content version snapshots.
 *
 * Backed by `public.content_versions`. Every service can call
 * `recordSnapshot` after a successful mutation to keep an immutable audit
 * of the entity's history; `listVersions` and `getVersion` power future
 * restore/preview flows.
 */
import { supabase } from "@/integrations/supabase/client";

import { fromPostgrest, toCmsError } from "./errors";
import type { UUID, VersionSnapshot } from "./types";

export async function recordSnapshot<T>(params: {
  entityTable: string;
  entityId: UUID;
  data: T;
  actorId?: UUID | null;
}): Promise<void> {
  try {
    const { data: nextVersion, error: verErr } = await (supabase as any)
      .from("content_versions")
      .select("version")
      .eq("entity_table", params.entityTable)
      .eq("entity_id", params.entityId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (verErr) throw fromPostgrest(verErr);
    const version = (nextVersion?.version ?? 0) + 1;

    const { error } = await (supabase as any).from("content_versions").insert({
      entity_table: params.entityTable,
      entity_id: params.entityId,
      version,
      snapshot: params.data as unknown,
      created_by: params.actorId ?? null,
    });
    if (error) throw fromPostgrest(error);
  } catch (err) {
    throw toCmsError(err);
  }
}

export async function listVersions<T>(entityTable: string, entityId: UUID): Promise<VersionSnapshot<T>[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("content_versions")
      .select("id, entity_table, entity_id, version, snapshot, created_at, created_by")
      .eq("entity_table", entityTable)
      .eq("entity_id", entityId)
      .order("version", { ascending: false });
    if (error) throw fromPostgrest(error);
    return (data ?? []).map((row: any) => ({
      id: row.id,
      entity_table: row.entity_table,
      entity_id: row.entity_id,
      version: row.version,
      data: row.snapshot as T,
      created_at: row.created_at,
      created_by: row.created_by,
    }));
  } catch (err) {
    throw toCmsError(err);
  }
}

export async function getVersion<T>(id: UUID): Promise<VersionSnapshot<T> | null> {
  try {
    const { data, error } = await (supabase as any)
      .from("content_versions")
      .select("id, entity_table, entity_id, version, snapshot, created_at, created_by")
      .eq("id", id)
      .maybeSingle();
    if (error) throw fromPostgrest(error);
    if (!data) return null;
    return {
      id: data.id,
      entity_table: data.entity_table,
      entity_id: data.entity_id,
      version: data.version,
      data: data.snapshot as T,
      created_at: data.created_at,
      created_by: data.created_by,
    };
  } catch (err) {
    throw toCmsError(err);
  }
}
