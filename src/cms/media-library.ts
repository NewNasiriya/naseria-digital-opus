/**
 * Media Library service — the single source of truth for every uploaded
 * asset. UI code MUST call this module rather than touching Storage or the
 * media tables directly.
 */
import { supabase } from "@/integrations/supabase/client";

import { fromPostgrest, toCmsError, CmsError } from "./errors";
import { mediaService } from "./media";
import { validateFile } from "./validation";
import type { Page, UUID } from "./types";

export type MediaKind = "image" | "document" | "video" | "audio" | "other";
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
  folder: string;
  kind: MediaKind;
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
  unusedOnly?: boolean;
  tag?: string;
  limit?: number;
  offset?: number;
  orderBy?: "created_at" | "file_name" | "size_bytes";
  orderDir?: "asc" | "desc";
}

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
    i += 1;
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
        q = q.or(`storage_path.like.${folder}/%,storage_path.like.${folder}%`);
      }

      q = q.order(orderBy, { ascending: orderDir === "asc" });
      q = q.range(offset, offset + limit - 1);

      const { data, error, count } = await q;
      if (error) throw fromPostgrest(error);
      const rows = (data ?? []).map(mapRow);
      const withUsage = await attachUsageCounts(rows);
      const filtered = unusedOnly
        ? withUsage.filter((row) => (row.usage_count ?? 0) === 0)
        : withUsage;

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

  /** Authoritative database reference count, independent of media_usages. */
  async referenceCount(mediaId: UUID): Promise<number> {
    try {
      const { data, error } = await (supabase as any).rpc(
        "media_reference_count",
        { _media_id: mediaId },
      );
      if (error) throw fromPostgrest(error);
      const count = Number(data ?? 0);
      return Number.isFinite(count) ? count : 0;
    } catch (err) {
      throw toCmsError(err);
    }
  },

  async listFolders(
    bucket?: MediaBucket,
  ): Promise<{ folder: string; count: number }[]> {
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
        const folder = folderOf(row.storage_path);
        counts.set(folder, (counts.get(folder) ?? 0) + 1);
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
    patch: Partial<
      Pick<
        MediaItem,
        | "alt_ar"
        | "alt_en"
        | "caption_ar"
        | "caption_en"
        | "tags"
        | "is_archived"
      >
    >,
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

  /** Replace a Storage object in place while preserving media id and path. */
  async replace(id: UUID, file: File): Promise<void> {
    try {
      const { data: existing, error: readErr } = await (supabase as any)
        .from("media")
        .select("id,bucket,storage_path,mime_type,file_name")
        .eq("id", id)
        .single();
      if (readErr) throw fromPostgrest(readErr);
      if (!existing) throw new CmsError("not_found", "الملف غير موجود");
      if (
        existing.bucket === "external" ||
        existing.storage_path.startsWith("/") ||
        /^(https?:)?\/\//.test(existing.storage_path)
      ) {
        throw new CmsError(
          "validation",
          "الملفات الخارجية لا يمكن استبدالها عبر التخزين. ارفع ملفًا جديدًا ثم اربطه بالمحتوى.",
        );
      }

      const oldKind = classifyMime(existing.mime_type);
      const newKind = classifyMime(file.type);
      if (oldKind !== newKind) {
        throw new CmsError(
          "validation",
          "نوع الملف الجديد يجب أن يطابق النوع الأصلي (صورة مقابل صورة، مستند مقابل مستند).",
        );
      }
      const invalid = validateFile(file);
      if (invalid) throw new CmsError("validation", invalid);

      const { error: upErr } = await supabase.storage
        .from(existing.bucket)
        .upload(existing.storage_path, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });
      if (upErr) {
        throw new CmsError("storage", upErr.message, { cause: upErr });
      }

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
   * Archive is never allowed while an authoritative content reference exists.
   * `force` can only bypass stale derived media_usages rows, not direct FKs.
   */
  async archive(id: UUID, force = false): Promise<void> {
    try {
      const references = await this.referenceCount(id);
      if (references > 0) {
        throw new CmsError(
          "conflict",
          `لا يمكن أرشفة الملف لأنه مرتبط فعليًا بـ ${references} سجل محتوى. استبدل أو أزل الارتباط أولًا.`,
        );
      }

      if (!force) {
        const usages = await this.listUsages(id);
        if (usages.length > 0) {
          throw new CmsError(
            "conflict",
            `لا يمكن أرشفة الملف لأن سجل الاستخدام يحتوي على ${usages.length} مرجع. راجع الاستخدامات أولًا.`,
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
   * Hard delete first removes the metadata row. The database trigger performs
   * an atomic authoritative reference check; therefore a blocked delete can
   * never remove the underlying Storage object. Storage cleanup happens only
   * after the database has accepted the deletion. A cleanup failure can leave
   * an orphaned object, but can never break live content.
   */
  async remove(id: UUID, force = false): Promise<void> {
    try {
      const references = await this.referenceCount(id);
      if (references > 0) {
        throw new CmsError(
          "conflict",
          `لا يمكن حذف الملف لأنه مرتبط فعليًا بـ ${references} سجل محتوى.`,
        );
      }

      const usages = await this.listUsages(id);
      if (!force && usages.length > 0) {
        throw new CmsError(
          "conflict",
          `لا يمكن حذف الملف لأن سجل الاستخدام يحتوي على ${usages.length} مرجع.`,
        );
      }

      const { data: deleted, error: deleteError } = await (supabase as any)
        .from("media")
        .delete()
        .eq("id", id)
        .select("bucket,storage_path")
        .single();
      if (deleteError) throw fromPostgrest(deleteError);

      if (
        deleted &&
        deleted.bucket !== "external" &&
        !deleted.storage_path.startsWith("/") &&
        !/^(https?:)?\/\//.test(deleted.storage_path)
      ) {
        const { error: storageError } = await supabase.storage
          .from(deleted.bucket)
          .remove([deleted.storage_path]);
        if (storageError && !/not.*found/i.test(storageError.message)) {
          throw new CmsError(
            "storage",
            "تم حذف سجل الوسائط بأمان، لكن تعذر تنظيف الملف غير المرتبط من التخزين. راجع التخزين يدويًا.",
            { cause: storageError },
          );
        }
      }
    } catch (err) {
      throw toCmsError(err);
    }
  },

  signedUrl: mediaService.signedUrl,
  upload: mediaService.upload,
};

async function attachUsageCounts(items: MediaItem[]): Promise<MediaItem[]> {
  if (items.length === 0) return items;
  const ids = items.map((item) => item.id);
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
    return items.map((item) => ({
      ...item,
      usage_count: counts.get(item.id) ?? 0,
    }));
  } catch {
    return items.map((item) => ({ ...item, usage_count: 0 }));
  }
}

export const mediaLibraryKeys = {
  all: ["media-library"] as const,
  list: (query: MediaListQuery) =>
    ["media-library", "list", query] as const,
  usages: (id: UUID) => ["media-library", "usages", id] as const,
  folders: (bucket?: MediaBucket) =>
    ["media-library", "folders", bucket ?? "all"] as const,
};
