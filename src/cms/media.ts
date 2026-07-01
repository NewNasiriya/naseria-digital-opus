/**
 * Media service — thin façade over Supabase Storage + the `media` table.
 *
 * Rules:
 *   1. Every uploaded file is registered as a row in `public.media` so it
 *      can be reused across modules by id (never duplicated).
 *   2. Links between modules and media go through `public.media_usages`
 *      to make replacement safe and audit-friendly.
 *   3. UI components should always call `mediaService.*` — never touch
 *      `supabase.storage.*` directly.
 */
import { supabase } from "@/integrations/supabase/client";

import { CmsError, fromPostgrest, toCmsError } from "./errors";
import { validateFile, type FileValidationOptions } from "./validation";
import type { MediaRef, UUID } from "./types";

export interface UploadOptions extends FileValidationOptions {
  bucket: string;
  folder?: string;         // path prefix inside the bucket
  alt?: string;
  registerAs?: string;     // optional friendly name for the media row
}

export interface AttachOptions {
  mediaId: UUID;
  module: string;          // e.g. "news"
  entityId: UUID;
  role?: string;           // e.g. "cover", "gallery"
}

async function safePublicUrl(bucket: string, path: string): Promise<string | null> {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export const mediaService = {
  async upload(file: File, opts: UploadOptions): Promise<MediaRef> {
    const invalid = validateFile(file, opts);
    if (invalid) throw new CmsError("validation", invalid);

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
    const key = `${opts.folder ? `${opts.folder}/` : ""}${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(opts.bucket)
        .upload(key, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (uploadError) throw new CmsError("storage", uploadError.message, { cause: uploadError });

      const url = await safePublicUrl(opts.bucket, key);
      const { data, error } = await ((supabase as any).from("media") as any)
        .insert({
          bucket: opts.bucket,
          path: key,
          url,
          mime_type: file.type,
          size_bytes: file.size,
          alt_ar: opts.alt ?? null,
          title_ar: opts.registerAs ?? file.name,
        })
        .select("id, bucket, path, alt_ar, width, height")
        .single();
      if (error) throw fromPostgrest(error);

      return {
        id: data.id as UUID,
        bucket: data.bucket,
        path: data.path,
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
      const { error } = await ((supabase as any).from("media_usages") as any).insert({
        media_id: opts.mediaId,
        module: opts.module,
        entity_id: opts.entityId,
        role: opts.role ?? null,
      });
      if (error) throw fromPostgrest(error);
    } catch (err) {
      throw toCmsError(err);
    }
  },

  async detach(mediaId: UUID, module: string, entityId: UUID): Promise<void> {
    try {
      const { error } = await ((supabase as any).from("media_usages") as any)
        .delete()
        .eq("media_id", mediaId)
        .eq("module", module)
        .eq("entity_id", entityId);
      if (error) throw fromPostgrest(error);
    } catch (err) {
      throw toCmsError(err);
    }
  },

  publicUrl: safePublicUrl,
};
