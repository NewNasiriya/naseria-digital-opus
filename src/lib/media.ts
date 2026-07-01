import { supabase } from "@/integrations/supabase/client";

export interface MediaRef {
  bucket: string | null;
  storage_path: string | null;
  alt_ar?: string | null;
  alt_en?: string | null;
}

/**
 * Resolve a media row to a public URL. Supports Supabase Storage buckets
 * and externally-hosted assets (CDN pointers) via the reserved bucket
 * name `external`, where `storage_path` holds the full URL (absolute or
 * root-relative like `/__l5e/assets-v1/...`).
 */
export function mediaPublicUrl(m: MediaRef | null | undefined): string | null {
  if (!m || !m.storage_path) return null;
  const path = m.storage_path;
  if (m.bucket === "external" || /^(https?:)?\/\//.test(path) || path.startsWith("/")) {
    return path;
  }
  const bucket = m.bucket ?? "media";
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? null;
}
