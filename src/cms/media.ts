/**
 * Media service — thin façade over Supabase Storage + the `media` and
 * `media_usages` tables.
 *
 * Rules:
 *   1. Every uploaded file is registered as a row in `public.media` so it
 *      can be reused across modules by id (never duplicated).
 *   2. Links between entities and media go through `public.media_usages`
 *      to make replacement safe and audit-friendly. The unique
 *      (media_id, entity_table, entity_id, field_name) constraint keeps
 *      relationships deterministic.
 *   3. UI components must always call `mediaService.*` and never touch
 *      `supabase.storage.*` or the tables directly.
 */
import { supabase } from "@/integrations/supabase/client";

import { CmsError, fromPostgrest, toCmsError } from "./errors";
import { validateFile, type FileValidationOptions } from "./validation";
import type { MediaRef, UUID } from "./types";

export interface UploadOptions extends FileValidationOptions {
  bucket: "media" | "documents" | "private-uploads";
  folder?: string;         // path prefix inside the bucket
  altAr?: string;
  altEn?: string;
  captionAr?: string;
  captionEn?: string;
  categoryId?: UUID;
  tags?: string[];
}

export interface AttachOptions {
  mediaId: UUID;
  entityTable: string;     // physical table name, e.g. "news"
  entityId: UUID;
  fieldName: string;       // e.g. "cover", "gallery", "hero_image"
}

export interface SignedUrlOptions {
  bucket: string;
  path: string;
  expiresInSeconds?: number;
  download?: boolean;
}

function extensionOf(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1) : "";
}

export const mediaService = {
  async upload(file: File, opts: UploadOptions): Promise<MediaRef> {
    const invalid = validateFile(file, opts);
    if (invalid) throw new CmsError("validation", invalid);

    const ext = extensionOf(file.name);
    const storagePath = `${opts.folder ? `${opts.folder}/` : ""}${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(opts.bucket)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
      if (uploadError) throw new CmsError("storage", uploadError.message, { cause: uploadError });

      const { data, error } = await (supabase as any)
        .from("media")
        .insert({
          bucket: opts.bucket,
          storage_path: storagePath,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          alt_ar: opts.altAr ?? null,
          alt_en: opts.altEn ?? null,
          caption_ar: opts.captionAr ?? null,
          caption_en: opts.captionEn ?? null,
          category_id: opts.categoryId ?? null,
          tags: opts.tags ?? [],
        })
        .select("id, bucket, storage_path, alt_ar, width, height")
        .single();
      if (error) throw fromPostgrest(error);

      return {
        id: data.id as UUID,
        bucket: data.bucket,
        path: data.storage_path,
        alt: data.alt_ar,
        width: data.width,
        height: data.height,
      };
    } catch (err) {
      throw toCmsError(err);
    }
  },

  async attach(opts: AttachOptions): Promise<void> {
    try {
      const { error } = await (supabase as any).from("media_usages").upsert(
        {
          media_id: opts.mediaId,
          entity_table: opts.entityTable,
          entity_id: opts.entityId,
          field_name: opts.fieldName,
        },
        { onConflict: "media_id,entity_table,entity_id,field_name", ignoreDuplicates: true },
      );
      if (error) throw fromPostgrest(error);
    } catch (err) {
      throw toCmsError(err);
    }
  },

  async detach(opts: AttachOptions): Promise<void> {
    try {
      const { error } = await (supabase as any)
        .from("media_usages")
        .delete()
        .eq("media_id", opts.mediaId)
        .eq("entity_table", opts.entityTable)
        .eq("entity_id", opts.entityId)
        .eq("field_name", opts.fieldName);
      if (error) throw fromPostgrest(error);
    } catch (err) {
      throw toCmsError(err);
    }
  },

  /**
   * All buckets in this project are private; use signed URLs for previews
   * and downloads. Falls back to null if the object is not accessible.
   */
  async signedUrl({ bucket, path, expiresInSeconds = 60 * 60, download = false }: SignedUrlOptions): Promise<string | null> {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds, { download });
    if (error) return null;
    return data?.signedUrl ?? null;
  },
};
