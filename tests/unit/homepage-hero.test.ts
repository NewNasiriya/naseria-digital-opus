import { describe, expect, test } from "bun:test";

import { normalizeHeroAction } from "../../src/lib/homepage-hero";

const base = {
  id: "action-1",
  label_ar: "فتح الصفحة",
  variant: "primary",
  display_order: 1,
  is_visible: true,
};

describe("homepage hero actions", () => {
  test("accepts a real internal route", () => {
    expect(
      normalizeHeroAction({ ...base, href: "/academic/calendar?term=1#events" }),
    ).toEqual({
      id: "action-1",
      label_ar: "فتح الصفحة",
      href: "/academic/calendar?term=1#events",
      variant: "primary",
      display_order: 1,
      external: false,
    });
  });

  test("accepts safe HTTP(S) external URLs", () => {
    const action = normalizeHeroAction({
      ...base,
      href: "https://example.com/resource",
      variant: "ghost",
    });
    expect(action?.external).toBe(true);
    expect(action?.href).toBe("https://example.com/resource");
    expect(action?.variant).toBe("ghost");
  });

  test("rejects script URLs and protocol-relative URLs", () => {
    expect(
      normalizeHeroAction({ ...base, href: "javascript:alert(1)" }),
    ).toBeNull();
    expect(
      normalizeHeroAction({ ...base, href: "//evil.example/path" }),
    ).toBeNull();
  });

  test("rejects internal paths that are not real public routes", () => {
    expect(
      normalizeHeroAction({ ...base, href: "/admin/users" }),
    ).toBeNull();
    expect(
      normalizeHeroAction({ ...base, href: "/activities/not valid" }),
    ).toBeNull();
  });

  test("does not render hidden or empty actions", () => {
    expect(
      normalizeHeroAction({ ...base, href: "/about", is_visible: false }),
    ).toBeNull();
    expect(
      normalizeHeroAction({ ...base, href: "/about", label_ar: "   " }),
    ).toBeNull();
  });
});
