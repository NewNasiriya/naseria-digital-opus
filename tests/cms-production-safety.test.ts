import { describe, expect, test } from "bun:test";
import { CmsError } from "../src/cms/errors";
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
  expect(preserveFallback("نص موثّق", "النص المحفوظ")).toBe("نص موثّق");
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

test("permanent delete is unavailable in normal CMS", () => {
  expect(NORMAL_CMS_PERMANENT_DELETE_AVAILABLE).toBeFalse();
});
