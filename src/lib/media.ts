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
  let path = m.storage_path;
  // Legacy CDN prefix `/__l5e/assets-v1/` is only routed on Lovable-hosted
  // subdomains. On custom production domains those URLs 404. The equivalent
  // path served from the app's `public/lovable-assets/` mirror is
  // `/lovable-assets/`. Normalize both at read time so historic CMS rows
  // keep working even if the underlying data has not yet been migrated.
  if (path.startsWith("/__l5e/assets-v1/")) {
    path = path.replace("/__l5e/assets-v1/", "/lovable-assets/");
  }
  if (m.bucket === "external" || /^(https?:)?\/\//.test(path) || path.startsWith("/")) {
    return path;
  }
  const bucket = m.bucket ?? "media";
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? null;
}
