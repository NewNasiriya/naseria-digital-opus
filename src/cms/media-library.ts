/**
 * Media Library service — the single source of truth for every uploaded
 * asset. Sits on top of `mediaService` (which handles the raw
 * Supabase Storage + `media` table plumbing) and adds the operations the
 * enterprise-grade library UI needs: listing with filters, usage
 * aggregation, in-place replacement, safe deletion, and folder
 * inventory.
 *
 * UI code MUST call this module — never touch `supabase.storage.*` or
 * the `media` / `media_usages` tables directly.
 */
import { supabase } from "@/integrations/supabase/client";

import { fromPostgrest, toCmsError, CmsError } from "./errors";
import { mediaService } from "./media";
import { validateFile } from "./validation";
import type { Page, UUID } from "./types";

/** Broad content classes surfaced to the UI as tabs / filters. */
export type MediaKind = "image" | "document" | "video" | "audio" | "other";

/** Bucket identifiers used across the app. */
export type MediaBucket = "media" | "documents" | "private-uploads";

export interface MediaItem {
  id: UUID;
  bucket: MediaBucket;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  alt_ar: string | null;
  alt_en: string | null;
  caption_ar: string | null;
  caption_en: string | null;
  category_id: UUID | null;
  tags: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  created_by: UUID | null;
  /** Derived: leading path segment (before the uuid filename). */
  folder: string;
  kind: MediaKind;
  /** Populated by `attachUsageCounts`. */
  usage_count?: number;
}

export interface MediaUsage {
  id: UUID;
  media_id: UUID;
  entity_table: string;
  entity_id: UUID;
  field_name: string;
  created_at: string;
}

export interface MediaListQuery {
  search?: string;
  kind?: MediaKind | "all";
  bucket?: MediaBucket | "all";
  folder?: string | "all";
  archived?: boolean;
  /** When true, list only assets with zero references in `media_usages`. */
  unusedOnly?: boolean;
  tag?: string;
  limit?: number;
  offset?: number;
  orderBy?: "created_at" | "file_name" | "size_bytes";
  orderDir?: "asc" | "desc";
}

/* ---------- helpers ---------- */

export function classifyMime(mime: string): MediaKind {
  if (!mime) return "other";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (
    mime === "application/pdf" ||
    mime.includes("word") ||
    mime.includes("excel") ||
    mime.includes("spreadsheet") ||
    mime.includes("presentation") ||
    mime === "text/plain" ||
    mime === "text/csv"
  ) {
    return "document";
  }
  return "other";
}

export function folderOf(storagePath: string): string {
  const idx = storagePath.lastIndexOf("/");
  if (idx <= 0) return "root";
  return storagePath.slice(0, idx);
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function mapRow(row: any): MediaItem {
  return {
    id: row.id,
    bucket: row.bucket,
    storage_path: row.storage_path,
    file_name: row.file_name,
    mime_type: row.mime_type,
    size_bytes: row.size_bytes,
    width: row.width,
    height: row.height,
    alt_ar: row.alt_ar,
    alt_en: row.alt_en,
    caption_ar: row.caption_ar,
    caption_en: row.caption_en,
    category_id: row.category_id,
    tags: row.tags ?? [],
    is_archived: !!row.is_archived,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
    folder: folderOf(row.storage_path),
    kind: classifyMime(row.mime_type),
  };
}

/* ---------- service ---------- */

export const mediaLibrary = {
  async list(query: MediaListQuery = {}): Promise<Page<MediaItem>> {
    const {
      search,
      kind = "all",
      bucket = "all",
      folder = "all",
      archived = false,
      unusedOnly = false,
      tag,
      limit = 48,
      offset = 0,
      orderBy = "created_at",
      orderDir = "desc",
    } = query;

    try {
      let q = (supabase as any)
        .from("media")
        .select("*", { count: "exact" })
        .eq("is_archived", archived);

      if (bucket !== "all") q = q.eq("bucket", bucket);
      if (tag) q = q.contains("tags", [tag]);
      if (search && search.trim()) {
        const term = `%${search.trim().replace(/[%_]/g, "")}%`;
        q = q.or(
          `file_name.ilike.${term},alt_ar.ilike.${term},alt_en.ilike.${term},caption_ar.ilike.${term},caption_en.ilike.${term}`,
        );
      }
      if (kind !== "all") {
        if (kind === "image") q = q.like("mime_type", "image/%");
        else if (kind === "video") q = q.like("mime_type", "video/%");
        else if (kind === "audio") q = q.like("mime_type", "audio/%");
        else if (kind === "document") {
          q = q.or(
            "mime_type.eq.application/pdf,mime_type.ilike.%word%,mime_type.ilike.%excel%,mime_type.ilike.%spreadsheet%,mime_type.ilike.%presentation%,mime_type.eq.text/plain,mime_type.eq.text/csv",
          );
        }
      }
      if (folder !== "all") {
        // Match either exact folder or nested under it.
        q = q.or(`storage_path.like.${folder}/%,storage_path.like.${folder}%`);
      }

      q = q.order(orderBy, { ascending: orderDir === "asc" });
      q = q.range(offset, offset + limit - 1);

      const { data, error, count } = await q;
      if (error) throw fromPostgrest(error);
      const rows = (data ?? []).map(mapRow);

      const withUsage = await attachUsageCounts(rows);
      const filtered = unusedOnly ? withUsage.filter((r) => (r.usage_count ?? 0) === 0) : withUsage;

      return {
        rows: filtered,
        total: count ?? filtered.length,
        limit,
        offset,
      };
    } catch (err) {
      throw toCmsError(err);
    }
  },

  async listUsages(mediaId: UUID): Promise<MediaUsage[]> {
    try {
      const { data, error } = await (supabase as any)
        .from("media_usages")
        .select("*")
        .eq("media_id", mediaId)
        .order("created_at", { ascending: false });
      if (error) throw fromPostgrest(error);
      return (data ?? []) as MediaUsage[];
    } catch (err) {
      throw toCmsError(err);
    }
  },

  async listFolders(bucket?: MediaBucket): Promise<{ folder: string; count: number }[]> {
    try {
      let q = (supabase as any)
        .from("media")
        .select("storage_path,bucket")
        .eq("is_archived", false)
        .limit(2000);
      if (bucket) q = q.eq("bucket", bucket);
      const { data, error } = await q;
      if (error) throw fromPostgrest(error);
      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        const f = folderOf(row.storage_path);
        counts.set(f, (counts.get(f) ?? 0) + 1);
      }
      return Array.from(counts.entries())
        .map(([folder, count]) => ({ folder, count }))
        .sort((a, b) => a.folder.localeCompare(b.folder));
    } catch (err) {
      throw toCmsError(err);
    }
  },

  async updateMeta(
    id: UUID,
    patch: Partial<Pick<MediaItem, "alt_ar" | "alt_en" | "caption_ar" | "caption_en" | "tags" | "is_archived">>,
  ): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from("media")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw fromPostgrest(error);
    } catch (err) {
      throw toCmsError(err);
    }
  },

  /**
   * Replace the underlying file of a media asset while preserving its id,
   * `storage_path`, and every existing `media_usages` link.
   *
   * MIME must match the original kind (image ↔ image, document ↔ document)
   * to avoid silently breaking consuming modules.
   */
  async replace(id: UUID, file: File): Promise<void> {
    try {
      const { data: existing, error: readErr } = await (supabase as any)
        .from("media")
        .select("id,bucket,storage_path,mime_type,file_name")
        .eq("id", id)
        .single();
      if (readErr) throw fromPostgrest(readErr);
      if (!existing) throw new CmsError("not_found", "الملف غير موجود");

      const oldKind = classifyMime(existing.mime_type);
      const newKind = classifyMime(file.type);
      if (oldKind !== newKind) {
        throw new CmsError(
          "validation",
          "نوع الملف الجديد يجب أن يطابق النوع الأصلي (صورة مقابل صورة، مستند مقابل مستند).",
        );
      }
      // Block script-capable formats (SVG/HTML/JS) regardless of kind match.
      const invalid = validateFile(file);
      if (invalid) throw new CmsError("validation", invalid);


      const { error: upErr } = await supabase.storage
        .from(existing.bucket)
        .upload(existing.storage_path, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });
      if (upErr) throw new CmsError("storage", upErr.message, { cause: upErr });

      const { error: updErr } = await (supabase as any)
        .from("media")
        .update({
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (updErr) throw fromPostgrest(updErr);
    } catch (err) {
      throw toCmsError(err);
    }
  },

  /**
   * Archive an asset. Refuses when usages exist unless `force` is true.
   */
  async archive(id: UUID, force = false): Promise<void> {
    try {
      if (!force) {
        const usages = await this.listUsages(id);
        if (usages.length > 0) {
          throw new CmsError(
            "conflict",
            `لا يمكن أرشفة الملف لأنه مستخدم في ${usages.length} موقع. أزل الاستخدامات أولاً أو استخدم "أرشفة رغم الاستخدام".`,
          );
        }
      }
      await this.updateMeta(id, { is_archived: true });
    } catch (err) {
      throw toCmsError(err);
    }
  },

  async restore(id: UUID): Promise<void> {
    await this.updateMeta(id, { is_archived: false });
  },

  /**
   * Hard-delete: remove from storage, drop the `media` row (usage rows
   * cascade). Refuses when usages exist unless `force` is true.
   */
  async remove(id: UUID, force = false): Promise<void> {
    try {
      const usages = await this.listUsages(id);
      if (!force && usages.length > 0) {
        throw new CmsError(
          "conflict",
          `لا يمكن حذف الملف لأنه مستخدم في ${usages.length} موقع.`,
        );
      }
      const { data: row, error: readErr } = await (supabase as any)
        .from("media")
        .select("bucket,storage_path")
        .eq("id", id)
        .single();
      if (readErr) throw fromPostgrest(readErr);

      if (row) {
        const { error: rmErr } = await supabase.storage.from(row.bucket).remove([row.storage_path]);
        // Ignore missing-object errors so metadata cleanup still runs.
        if (rmErr && !/not.*found/i.test(rmErr.message)) {
          throw new CmsError("storage", rmErr.message, { cause: rmErr });
        }
      }
      const { error: delErr } = await (supabase as any).from("media").delete().eq("id", id);
      if (delErr) throw fromPostgrest(delErr);
    } catch (err) {
      throw toCmsError(err);
    }
  },

  signedUrl: mediaService.signedUrl,
  upload: mediaService.upload,
};

/* ---------- usage aggregation ---------- */

async function attachUsageCounts(items: MediaItem[]): Promise<MediaItem[]> {
  if (items.length === 0) return items;
  const ids = items.map((i) => i.id);
  try {
    const { data, error } = await (supabase as any)
      .from("media_usages")
      .select("media_id")
      .in("media_id", ids);
    if (error) throw fromPostgrest(error);
    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      counts.set(row.media_id, (counts.get(row.media_id) ?? 0) + 1);
    }
    return items.map((it) => ({ ...it, usage_count: counts.get(it.id) ?? 0 }));
  } catch {
    return items.map((it) => ({ ...it, usage_count: 0 }));
  }
}

export const mediaLibraryKeys = {
  all: ["media-library"] as const,
  list: (query: MediaListQuery) => ["media-library", "list", query] as const,
  usages: (id: UUID) => ["media-library", "usages", id] as const,
  folders: (bucket?: MediaBucket) => ["media-library", "folders", bucket ?? "all"] as const,
};
