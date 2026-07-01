import { supabase } from "@/integrations/supabase/client";

export interface MediaRef {
  bucket: string | null;
  storage_path: string | null;
  alt_ar?: string | null;
  alt_en?: string | null;
}

/**
 * Resolve a Supabase Storage media row to a public URL.
 * Returns null when the record or its path is missing.
 */
export function mediaPublicUrl(m: MediaRef | null | undefined): string | null {
  if (!m || !m.storage_path) return null;
  const bucket = m.bucket ?? "media";
  const { data } = supabase.storage.from(bucket).getPublicUrl(m.storage_path);
  return data?.publicUrl ?? null;
}
