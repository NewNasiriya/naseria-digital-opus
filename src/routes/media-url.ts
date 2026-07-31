import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_BUCKETS = new Set(["media", "documents"]);
const SIGNED_URL_TTL_SECONDS = 15 * 60;

function errorResponse(status: number, message: string): Response {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function validStoragePath(path: string): boolean {
  return (
    path.length > 0 &&
    path.length <= 1024 &&
    !path.startsWith("/") &&
    !path.includes("..") &&
    !path.includes("\\")
  );
}

export const Route = createFileRoute("/media-url")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const bucket = url.searchParams.get("bucket") ?? "";
        const path = url.searchParams.get("path") ?? "";

        if (!ALLOWED_BUCKETS.has(bucket) || !validStoragePath(path)) {
          return errorResponse(400, "Invalid media reference");
        }

        try {
          // Server-only dynamic import: the service-role key never enters the
          // client bundle. It is used solely after an explicit public-reference
          // check and never exposes private-uploads.
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          const { data: media, error: mediaError } = await (supabaseAdmin as any)
            .from("media")
            .select("id,bucket,storage_path,is_archived")
            .eq("bucket", bucket)
            .eq("storage_path", path)
            .eq("is_archived", false)
            .maybeSingle();

          if (mediaError || !media) return errorResponse(404, "Media not found");

          const { data: visible, error: visibilityError } = await (
            supabaseAdmin as any
          ).rpc("is_media_publicly_visible", { _media_id: media.id });

          if (visibilityError || visible !== true) {
            return errorResponse(404, "Media not found");
          }

          const { data: signed, error: signedError } = await supabaseAdmin.storage
            .from(bucket)
            .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

          if (signedError || !signed?.signedUrl) {
            return errorResponse(404, "Media not found");
          }

          return new Response(null, {
            status: 302,
            headers: {
              Location: signed.signedUrl,
              "Cache-Control": "public, max-age=300, stale-while-revalidate=300",
              "Referrer-Policy": "same-origin",
              "X-Content-Type-Options": "nosniff",
            },
          });
        } catch {
          return errorResponse(500, "Unable to resolve media");
        }
      },
    },
  },
});
