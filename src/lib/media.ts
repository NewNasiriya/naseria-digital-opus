import { supabase } from "@/integrations/supabase/client";

export interface MediaRef {
  bucket: string | null;
  storage_path: string | null;
  alt_ar?: string | null;
  alt_en?: string | null;
}

const PUBLIC_STORAGE_BUCKETS = new Set(["media", "documents"]);

/** Normalize legacy Lovable asset pointers for custom production domains. */
export function normalizeMediaPath(path: string): string {
  if (path.startsWith("/__l5e/assets-v1/")) {
    return path.replace("/__l5e/assets-v1/", "/lovable-assets/");
  }
  return path;
}

/** External and application-hosted assets never need Supabase signing. */
export function isExternalMediaRef(m: MediaRef | null | undefined): boolean {
  if (!m?.storage_path) return false;
  const path = normalizeMediaPath(m.storage_path);
  return (
    m.bucket === "external" ||
    /^(https?:)?\/\//.test(path) ||
    path.startsWith("/")
  );
}

/**
 * Resolve a media row to a URL that is safe to render immediately.
 *
 * External/root-relative assets are returned unchanged. Objects in the
 * private `media` and `documents` buckets are routed through the same-origin
 * `/media-url` endpoint, which verifies that the object belongs to published
 * content before issuing a short-lived Supabase signed URL. This keeps every
 * existing synchronous public consumer working while centralising signing in
 * one audited server route.
 *
 * `private-uploads` is intentionally never exposed by this resolver.
 */
export function mediaPublicUrl(m: MediaRef | null | undefined): string | null {
  if (!m?.storage_path) return null;
  const path = normalizeMediaPath(m.storage_path);

  if (isExternalMediaRef({ ...m, storage_path: path })) return path;

  const bucket = m.bucket ?? "media";
  if (!PUBLIC_STORAGE_BUCKETS.has(bucket)) return null;

  const params = new URLSearchParams({ bucket, path });
  return `/media-url?${params.toString()}`;
}

/**
 * Resolve a media row directly to a signed URL when the current Supabase
 * session is allowed to read it (for example, public published content or an
 * authenticated CMS editor). External assets bypass signing. If direct
 * signing is unavailable, public buckets fall back to the verified server
 * resolver rather than an unusable private-bucket public URL.
 */
export async function mediaSignedUrl(
  m: MediaRef | null | undefined,
  expiresInSeconds = 60 * 60,
): Promise<string | null> {
  if (!m?.storage_path) return null;
  if (isExternalMediaRef(m)) return mediaPublicUrl(m);

  const bucket = m.bucket ?? "media";
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(m.storage_path, expiresInSeconds);

  if (!error && data?.signedUrl) return data.signedUrl;
  return mediaPublicUrl(m);
}
