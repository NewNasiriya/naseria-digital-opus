import { describe, expect, test } from "bun:test";
import { CmsError } from "../src/cms/errors";
import { createInMemoryRepository } from "../src/cms/repository";
import { resolveHeroIntro } from "../src/lib/homepage-hero-fallback";
import { fetchMediaReferences } from "../src/cms/media-references";
import { assertMediaArchivable } from "../src/cms/media-library";
import type { EntityMeta } from "../src/cms/types";
import { notifyAfterMutation, requireMutationResult } from "../src/cms/mutation-safety";
import {
  NORMAL_CMS_PERMANENT_DELETE_AVAILABLE,
  preserveFallback,
} from "../src/cms/content-preservation";
import { resolveMediaReferencesFromRows, usageCounts } from "../src/cms/media-references";
import { replaceMediaSafely, type MediaReplacementAdapter } from "../src/cms/media-replacement";

const id = (value: string) => value as `${string}-${string}-${string}-${string}-${string}`;

describe("mutation result safety", () => {
  test("zero-row update is failure", () => {
    expect(() => requireMutationResult("update", { data: null, count: 0 })).toThrow(CmsError);
    try {
      requireMutationResult("update", { data: [], count: 0 });
    } catch (error) {
      expect((error as CmsError).kind).toBe("stale");
    }
  });
  test("zero-row delete is failure", () => {
    expect(() => requireMutationResult("delete", { data: [], count: 0 })).toThrow(CmsError);
  });
  test("failed/no-op mutation never emits success", async () => {
    let successes = 0;
    await expect(
      notifyAfterMutation(Promise.reject(new CmsError("stale", "no row")), () => successes++),
    ).rejects.toThrow();
    expect(successes).toBe(0);
  });
});

test("hard-coded fallback remains when backend is absent", () => {
  expect(preserveFallback(undefined, "النص المحفوظ")).toBe("النص المحفوظ");
  expect(resolveHeroIntro(undefined)).toContain("مؤسسة تعليمية حكومية");
  expect(resolveHeroIntro("   ")).toContain("مؤسسة تعليمية حكومية");
  expect(resolveHeroIntro("مقدمة موثّقة")).toBe("مقدمة موثّقة");
});

test("media referenced by any verified relationship is in use", () => {
  const mediaId = id("11111111-1111-1111-1111-111111111111");
  const refs = resolveMediaReferencesFromRows(
    {
      news: [{ id: "news-1", featured_image_media_id: mediaId }],
      gallery_items: [{ id: "gallery-1", media_id: mediaId }],
      content_versions: [{ id: "version-1", snapshot: { cover: mediaId } }],
    },
    new Set([mediaId]),
  );
  expect(usageCounts(refs).get(mediaId)).toBe(3);
});

function replacementAdapter(failVerification = false) {
  const calls: string[] = [];
  let linked = id("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
  const fresh = id("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
  const adapter: MediaReplacementAdapter = {
    validate: () => {
      calls.push("validate");
    },
    uploadAndCreate: async () => {
      calls.push("upload-create");
      return { id: fresh, bucket: "media", path: "new/path", alt: null, width: null, height: null };
    },
    link: async () => {
      calls.push("link");
      if (!failVerification) linked = fresh;
    },
    readLinkedMediaId: async () => {
      calls.push("verify");
      return linked;
    },
    countRemainingReferences: async () => {
      calls.push("count-old-references");
      return 0;
    },
    archive: async () => {
      calls.push("archive-old");
    },
    cleanupNewOrphan: async () => {
      calls.push("cleanup-new");
    },
  };
  return { adapter, calls, old: linked };
}

test("failed replacement preserves old image", async () => {
  const { adapter, calls, old } = replacementAdapter(true);
  await expect(
    replaceMediaSafely(
      adapter,
      {
        entityTable: "news",
        entityId: id("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        fieldName: "featured_image_media_id",
        oldMediaId: old,
      },
      new File(["x"], "x.png"),
    ),
  ).rejects.toThrow();
  expect(calls).not.toContain("archive-old");
  expect(calls).toContain("cleanup-new");
});

test("successful replacement links and verifies before old archive", async () => {
  const { adapter, calls, old } = replacementAdapter();
  await replaceMediaSafely(
    adapter,
    {
      entityTable: "news",
      entityId: id("cccccccc-cccc-cccc-cccc-cccccccccccc"),
      fieldName: "featured_image_media_id",
      oldMediaId: old,
    },
    new File(["x"], "x.png"),
  );
  expect(calls.indexOf("link")).toBeLessThan(calls.lastIndexOf("verify"));
  expect(calls.lastIndexOf("verify")).toBeLessThan(calls.indexOf("archive-old"));
});

test("repository reports stale update and missing delete", async () => {
  const repo = createInMemoryRepository<EntityMeta>([]);
  await expect(repo.update(id("dddddddd-dddd-dddd-dddd-dddddddddddd"), {})).rejects.toMatchObject({
    kind: "stale",
  });
  await expect(repo.remove(id("dddddddd-dddd-dddd-dddd-dddddddddddd"))).rejects.toMatchObject({
    kind: "not_found",
  });
});

test("reference resolution fails closed and archive protection rejects references", async () => {
  const failingClient = {
    from: () => ({
      select: async () => ({
        data: null,
        error: { code: "", message: "network failed", details: "", hint: "" },
      }),
    }),
  };
  await expect(
    fetchMediaReferences(failingClient, [id("11111111-1111-1111-1111-111111111111")]),
  ).rejects.toBeInstanceOf(CmsError);
  expect(() =>
    assertMediaArchivable([
      {
        mediaId: id("11111111-1111-1111-1111-111111111111"),
        table: "gallery_items",
        field: "media_id",
        entityId: "gallery-1",
      },
    ]),
  ).toThrow(CmsError);
});

test("uncertain link verification preserves both media records for reconciliation", async () => {
  const { adapter, calls, old } = replacementAdapter();
  adapter.readLinkedMediaId = async () => {
    calls.push("verify-throws");
    throw new TypeError("network failed");
  };
  await expect(
    replaceMediaSafely(
      adapter,
      {
        entityTable: "news",
        entityId: id("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
        fieldName: "featured_image_media_id",
        oldMediaId: old,
      },
      new File(["x"], "x.png"),
    ),
  ).rejects.toMatchObject({ kind: "reconciliation_required" });
  expect(calls).not.toContain("archive-old");
  expect(calls).not.toContain("cleanup-new");
});

test("shared old media remains active while another reference exists", async () => {
  const { adapter, calls, old } = replacementAdapter();
  adapter.countRemainingReferences = async () => {
    calls.push("shared-reference");
    return 1;
  };
  await replaceMediaSafely(
    adapter,
    {
      entityTable: "news",
      entityId: id("ffffffff-ffff-ffff-ffff-ffffffffffff"),
      fieldName: "featured_image_media_id",
      oldMediaId: old,
    },
    new File(["x"], "x.png"),
  );
  expect(calls).toContain("shared-reference");
  expect(calls).not.toContain("archive-old");
});

test("permanent delete is unavailable in normal CMS", () => {
  expect(NORMAL_CMS_PERMANENT_DELETE_AVAILABLE).toBeFalse();
});
