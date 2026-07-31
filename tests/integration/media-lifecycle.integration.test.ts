import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const PRODUCTION_PROJECT_REFS = new Set(["tlyehajicuotulmfaewi"]);
const REQUIRED_ACK = "isolated-cms-integrity";

const url = process.env.TEST_SUPABASE_URL ?? "";
const anonKey = process.env.TEST_SUPABASE_ANON_KEY ?? "";
const serviceRoleKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY ?? "";
const acknowledged = process.env.TEST_SUPABASE_SAFETY_ACK === REQUIRED_ACK;
const configured = Boolean(url && anonKey && serviceRoleKey && acknowledged);

function projectRefFromUrl(value: string): string | null {
  try {
    const hostname = new URL(value).hostname;
    return hostname.endsWith(".supabase.co") ? hostname.split(".")[0] : null;
  } catch {
    return null;
  }
}

function assertIsolatedProject(value: string): void {
  const projectRef = projectRefFromUrl(value);
  if (!projectRef) throw new Error("TEST_SUPABASE_URL must be a Supabase project URL");
  if (PRODUCTION_PROJECT_REFS.has(projectRef)) {
    throw new Error(
      `Refusing to run destructive integration tests against production project ${projectRef}`,
    );
  }
  if (!acknowledged) {
    throw new Error(
      `Set TEST_SUPABASE_SAFETY_ACK=${REQUIRED_ACK} only for an isolated disposable test project`,
    );
  }
}

const suite = configured ? describe : describe.skip;

suite("isolated media lifecycle", () => {
  let admin: SupabaseClient;
  let anonymous: SupabaseClient;
  const token = crypto.randomUUID();
  const imagePath = `integration-tests/${token}/table.png`;
  const documentPath = `integration-tests/${token}/table.pdf`;
  let imageMediaId: string | null = null;
  let documentMediaId: string | null = null;
  let timetableId: string | null = null;

  beforeAll(() => {
    assertIsolatedProject(url);
    admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    anonymous = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  afterAll(async () => {
    if (!admin) return;
    // Cleanup is restricted to IDs and a random path created by this suite.
    // Content references are removed before media metadata and objects.
    if (timetableId) {
      await admin.from("timetables").delete().eq("id", timetableId);
    }
    if (imageMediaId) {
      await admin.from("media").delete().eq("id", imageMediaId);
    }
    if (documentMediaId) {
      await admin.from("media").delete().eq("id", documentMediaId);
    }
    await admin.storage.from("media").remove([imagePath]);
    await admin.storage.from("documents").remove([documentPath]);
  });

  test(
    "upload, publish, anonymous read, replace, and reference protection",
    async () => {
      const imageV1 = new Uint8Array([
        137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4,
      ]);
      const imageV2 = new Uint8Array([
        137, 80, 78, 71, 13, 10, 26, 10, 9, 8, 7, 6,
      ]);
      const pdf = new TextEncoder().encode("%PDF-1.4\n% isolated test\n");

      const imageUpload = await admin.storage.from("media").upload(
        imagePath,
        imageV1,
        { contentType: "image/png", upsert: false },
      );
      expect(imageUpload.error).toBeNull();

      const documentUpload = await admin.storage.from("documents").upload(
        documentPath,
        pdf,
        { contentType: "application/pdf", upsert: false },
      );
      expect(documentUpload.error).toBeNull();

      const imageInsert = await admin
        .from("media")
        .insert({
          bucket: "media",
          storage_path: imagePath,
          file_name: "table.png",
          mime_type: "image/png",
          size_bytes: imageV1.byteLength,
          is_archived: false,
        })
        .select("id,bucket,storage_path")
        .single();
      expect(imageInsert.error).toBeNull();
      imageMediaId = imageInsert.data!.id;

      const documentInsert = await admin
        .from("media")
        .insert({
          bucket: "documents",
          storage_path: documentPath,
          file_name: "table.pdf",
          mime_type: "application/pdf",
          size_bytes: pdf.byteLength,
          is_archived: false,
        })
        .select("id,bucket,storage_path")
        .single();
      expect(documentInsert.error).toBeNull();
      documentMediaId = documentInsert.data!.id;

      const timetableInsert = await admin
        .from("timetables")
        .insert({
          kind: "academic",
          title_ar: `اختبار تكامل معزول ${token}`,
          cover_image_media_id: imageMediaId,
          document_media_id: documentMediaId,
          status: "draft",
          display_order: 9999,
        })
        .select("id")
        .single();
      expect(timetableInsert.error).toBeNull();
      timetableId = timetableInsert.data!.id;

      const draftRead = await anonymous
        .from("timetables")
        .select("id")
        .eq("id", timetableId);
      expect(draftRead.error).toBeNull();
      expect(draftRead.data).toHaveLength(0);

      const publish = await admin
        .from("timetables")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", timetableId);
      expect(publish.error).toBeNull();

      const publishedRead = await anonymous
        .from("timetables")
        .select("id,cover_image_media_id,document_media_id")
        .eq("id", timetableId)
        .single();
      expect(publishedRead.error).toBeNull();
      expect(publishedRead.data?.cover_image_media_id).toBe(imageMediaId);
      expect(publishedRead.data?.document_media_id).toBe(documentMediaId);

      const anonymousImage = await anonymous.storage
        .from("media")
        .download(imagePath);
      expect(anonymousImage.error).toBeNull();
      expect(anonymousImage.data?.size).toBeGreaterThan(0);

      const anonymousPdf = await anonymous.storage
        .from("documents")
        .download(documentPath);
      expect(anonymousPdf.error).toBeNull();
      expect(anonymousPdf.data?.size).toBeGreaterThan(0);

      const replacement = await admin.storage.from("media").upload(
        imagePath,
        imageV2,
        { contentType: "image/png", upsert: true },
      );
      expect(replacement.error).toBeNull();

      const preserved = await admin
        .from("media")
        .select("id,storage_path")
        .eq("id", imageMediaId)
        .single();
      expect(preserved.error).toBeNull();
      expect(preserved.data).toEqual({ id: imageMediaId, storage_path: imagePath });

      const archiveAttempt = await admin
        .from("media")
        .update({ is_archived: true })
        .eq("id", imageMediaId);
      expect(archiveAttempt.error).not.toBeNull();

      const deleteAttempt = await admin
        .from("media")
        .delete()
        .eq("id", documentMediaId);
      expect(deleteAttempt.error).not.toBeNull();

      const usageRows = await admin
        .from("media_usages")
        .select("media_id,entity_table,field_name")
        .in("media_id", [imageMediaId, documentMediaId]);
      expect(usageRows.error).toBeNull();
      expect(usageRows.data?.some((row) => row.media_id === imageMediaId)).toBe(true);
      expect(usageRows.data?.some((row) => row.media_id === documentMediaId)).toBe(true);
    },
    30_000,
  );
});
