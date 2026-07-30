import { fromPostgrest, toCmsError } from "./errors";
import type { UUID } from "./types";

export interface MediaReference {
  mediaId: UUID;
  table: string;
  field: string;
  entityId: string;
}

export interface MediaRelationship {
  table: string;
  mediaFields: readonly string[];
  idField?: string;
}

/** Verified against the generated production schema; path-only JSON is scanned separately. */
export const MEDIA_RELATIONSHIPS: readonly MediaRelationship[] = [
  { table: "news", mediaFields: ["featured_image_media_id", "og_image_id"] },
  { table: "news_media", mediaFields: ["media_id"] },
  { table: "achievements", mediaFields: ["cover_image_media_id", "og_image_id"] },
  { table: "achievement_media", mediaFields: ["media_id"] },
  { table: "activities", mediaFields: ["cover_image_media_id", "og_image_id"] },
  { table: "activity_media", mediaFields: ["media_id"] },
  { table: "gallery_albums", mediaFields: ["cover_media_id"] },
  { table: "gallery_items", mediaFields: ["media_id"] },
  { table: "honor_boards", mediaFields: ["media_id"] },
  { table: "honor_entry_media", mediaFields: ["media_id"] },
  { table: "academic_resources", mediaFields: ["media_id"] },
  { table: "academic_notes", mediaFields: ["attachment_media_id"] },
  { table: "homepage_hero", mediaFields: ["hero_image_media_id"], idField: "id" },
  { table: "school_info", mediaFields: ["principal_photo_media_id"], idField: "id" },
  {
    table: "site_settings",
    mediaFields: ["logo_media_id", "favicon_media_id", "default_og_image_id"],
    idField: "id",
  },
  { table: "timetables", mediaFields: ["cover_image_media_id", "document_media_id"] },
  { table: "profiles", mediaFields: ["avatar_media_id"] },
  { table: "media_usages", mediaFields: ["media_id"] },
] as const;

export function resolveMediaReferencesFromRows(
  rowsByTable: Record<string, readonly Record<string, unknown>[]>,
  mediaIds?: ReadonlySet<string>,
): MediaReference[] {
  const refs: MediaReference[] = [];
  for (const relation of MEDIA_RELATIONSHIPS) {
    for (const row of rowsByTable[relation.table] ?? []) {
      for (const field of relation.mediaFields) {
        const mediaId = row[field];
        if (typeof mediaId === "string" && (!mediaIds || mediaIds.has(mediaId))) {
          refs.push({
            mediaId,
            table: relation.table,
            field,
            entityId: String(row[relation.idField ?? "id"] ?? "unknown"),
          });
        }
      }
    }
  }
  // content_versions/homepage_sections may contain historical or structured JSON references.
  for (const table of ["content_versions", "homepage_sections"] as const) {
    for (const row of rowsByTable[table] ?? []) {
      const serialized = JSON.stringify(row);
      for (const mediaId of mediaIds ?? []) {
        if (serialized.includes(mediaId))
          refs.push({
            mediaId: mediaId as UUID,
            table,
            field: "json_content",
            entityId: String(row.id ?? "unknown"),
          });
      }
    }
  }
  return refs;
}

/** Read-only production resolver: selects only ids and verified media FK columns. */
interface ReadOnlyMediaClient {
  from(table: string): {
    select(fields: string): Promise<{
      data: Record<string, unknown>[] | null;
      error: Parameters<typeof fromPostgrest>[0];
    }>;
  };
}

export async function fetchMediaReferences(
  client: ReadOnlyMediaClient,
  mediaIds: UUID[],
): Promise<MediaReference[]> {
  const rowsByTable: Record<string, Record<string, unknown>[]> = {};
  try {
    for (const relation of MEDIA_RELATIONSHIPS) {
      const fields = [relation.idField ?? "id", ...relation.mediaFields];
      const { data, error } = await client.from(relation.table).select(fields.join(","));
      if (error) throw fromPostgrest(error);
      rowsByTable[relation.table] = data ?? [];
    }
    for (const table of ["content_versions", "homepage_sections"]) {
      const { data, error } = await client.from(table).select("*");
      if (error) throw fromPostgrest(error);
      rowsByTable[table] = data ?? [];
    }
    return resolveMediaReferencesFromRows(rowsByTable, new Set(mediaIds));
  } catch (error) {
    throw toCmsError(error);
  }
}

export function usageCounts(references: readonly MediaReference[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const ref of references) counts.set(ref.mediaId, (counts.get(ref.mediaId) ?? 0) + 1);
  return counts;
}
