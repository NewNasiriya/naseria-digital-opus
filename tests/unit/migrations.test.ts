import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const mediaMigrationUrl = new URL(
  "../../supabase/migrations/20260731143500_cms_media_integrity.sql",
  import.meta.url,
);
const newsMigrationUrl = new URL(
  "../../supabase/migrations/20260731144000_complete_existing_news_bodies.sql",
  import.meta.url,
);

async function sql(url: URL): Promise<string> {
  return readFile(url, "utf8");
}

describe("CMS integrity migrations", () => {
  test("media backfill is repeat-safe and installs authoritative guards", async () => {
    const source = await sql(mediaMigrationUrl);
    expect(source).toContain("ON CONFLICT (media_id, entity_table, entity_id, field_name)");
    expect(source).toContain("DO NOTHING");
    expect(source).toContain("media_reference_count");
    expect(source).toContain("trg_prevent_referenced_media_mutation");
    expect(source).toContain("sync_media_usage_reference");
  });

  test("media migration cannot delete user content or storage objects", async () => {
    const source = await sql(mediaMigrationUrl);
    expect(source).not.toMatch(/\bTRUNCATE\b/i);
    expect(source).not.toMatch(/\bDROP\s+TABLE\b/i);
    expect(source).not.toMatch(
      /DELETE\s+FROM\s+(?:public\.)?(?:media|news|activities|achievements|gallery_albums|gallery_items|honor_boards|timetables|academic_notes|academic_resources)\b/i,
    );
    expect(source).not.toMatch(/DELETE\s+FROM\s+storage\.objects\b/i);
    expect(source).toMatch(/DELETE\s+FROM\s+public\.media_usages\b/i);
  });

  test("news migration is guarded and copies only existing editorial text", async () => {
    const source = await sql(newsMigrationUrl);
    expect(source).toContain("body_ar = summary_ar");
    expect(source).toContain("NULLIF(btrim(body_ar), '') IS NULL");
    expect(source).toContain("NULLIF(btrim(summary_ar), '') IS NOT NULL");
    expect(source).toContain("kindergarten-accreditation-appreciation");
    expect(source).toContain("admissions-open-new-students");
    expect(source).toContain("new-academic-year-start");
    expect(source).not.toMatch(/\bDELETE\b/i);
    expect(source).not.toMatch(/\bTRUNCATE\b/i);
  });
});
