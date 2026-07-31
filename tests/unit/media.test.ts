import { describe, expect, test } from "bun:test";

import {
  isExternalMediaRef,
  mediaPublicUrl,
  normalizeMediaPath,
} from "../../src/lib/media";

describe("media URL resolver", () => {
  test("keeps absolute external assets unchanged", () => {
    expect(
      mediaPublicUrl({
        bucket: "external",
        storage_path: "https://cdn.example.com/image.jpg",
      }),
    ).toBe("https://cdn.example.com/image.jpg");
  });

  test("normalizes legacy Lovable paths", () => {
    expect(
      normalizeMediaPath("/__l5e/assets-v1/project/photo.png"),
    ).toBe("/lovable-assets/project/photo.png");
    expect(
      mediaPublicUrl({
        bucket: "external",
        storage_path: "/__l5e/assets-v1/project/photo.png",
      }),
    ).toBe("/lovable-assets/project/photo.png");
  });

  test("routes private images through the verified signed redirect", () => {
    const resolved = mediaPublicUrl({
      bucket: "media",
      storage_path: "honor/grade-3.jpg",
    });
    const url = new URL(resolved!, "https://school.test");
    expect(url.pathname).toBe("/media-url");
    expect(url.searchParams.get("bucket")).toBe("media");
    expect(url.searchParams.get("path")).toBe("honor/grade-3.jpg");
  });

  test("routes private documents through the same resolver", () => {
    const resolved = mediaPublicUrl({
      bucket: "documents",
      storage_path: "timetables/grade-1.pdf",
    });
    const url = new URL(resolved!, "https://school.test");
    expect(url.searchParams.get("bucket")).toBe("documents");
    expect(url.searchParams.get("path")).toBe("timetables/grade-1.pdf");
  });

  test("never exposes private-uploads", () => {
    expect(
      mediaPublicUrl({
        bucket: "private-uploads",
        storage_path: "pending/confidential.pdf",
      }),
    ).toBeNull();
  });

  test("detects root-relative and absolute external references", () => {
    expect(
      isExternalMediaRef({ bucket: "external", storage_path: "/image.jpg" }),
    ).toBe(true);
    expect(
      isExternalMediaRef({ bucket: "media", storage_path: "folder/image.jpg" }),
    ).toBe(false);
  });
});
