import { describe, expect, test } from "bun:test";

import { mapActivityRow } from "../../src/lib/activities";

describe("public activities mapping", () => {
  test("maps CMS media through the centralized resolver and orders gallery", () => {
    const item = mapActivityRow({
      id: "activity-1",
      slug: "science-day",
      title_ar: "يوم العلوم",
      summary_ar: "نشاط علمي",
      body_ar: "تفاصيل النشاط",
      event_date: "2026-07-20",
      published_at: "2026-07-21T10:00:00Z",
      is_featured: true,
      category: {
        id: "category-1",
        key: "cultural",
        name_ar: "ثقافي",
        icon_key: "book",
      },
      cover: {
        bucket: "media",
        storage_path: "activities/science-cover.jpg",
      },
      gallery: [
        {
          id: "photo-2",
          caption_ar: "الثانية",
          display_order: 2,
          media: {
            bucket: "media",
            storage_path: "activities/science-2.jpg",
          },
        },
        {
          id: "photo-1",
          caption_ar: "الأولى",
          display_order: 1,
          media: {
            bucket: "media",
            storage_path: "activities/science-1.jpg",
          },
        },
      ],
    });

    expect(item.cover_url).toContain("/media-url?");
    expect(item.gallery.map((photo) => photo.id)).toEqual(["photo-1", "photo-2"]);
    expect(item.gallery[0].url).toContain("bucket=media");
    expect(item.is_featured).toBe(true);
  });

  test("uses the first valid gallery image when no cover exists", () => {
    const item = mapActivityRow({
      id: "activity-2",
      slug: "art-day",
      title_ar: "يوم الفن",
      summary_ar: null,
      body_ar: null,
      event_date: null,
      published_at: null,
      is_featured: false,
      category: null,
      cover: null,
      gallery: [
        {
          id: "photo-1",
          caption_ar: null,
          display_order: 0,
          media: {
            bucket: "external",
            storage_path: "/lovable-assets/art.jpg",
          },
        },
      ],
    });

    expect(item.cover_url).toBe("/lovable-assets/art.jpg");
  });
});
