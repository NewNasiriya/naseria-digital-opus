import { describe, expect, test } from "bun:test";

import {
  IMPLEMENTED_ADMIN_MODULE_IDS,
  VISIBLE_ADMIN_MODULES,
  isAdminModuleImplemented,
} from "../../src/lib/admin-module-availability";

describe("admin module availability", () => {
  test("keeps functional CMS and bespoke modules visible", () => {
    for (const id of [
      "homepage",
      "academic",
      "news",
      "activities",
      "gallery",
      "media",
      "documents",
      "timeline",
      "contact",
      "analytics",
    ]) {
      expect(IMPLEMENTED_ADMIN_MODULE_IDS.has(id as never)).toBe(true);
    }
  });

  test("hides unimplemented or misleading modules", () => {
    for (const id of ["about", "policies", "faq", "users", "settings", "seo", "status"]) {
      expect(isAdminModuleImplemented(id)).toBe(false);
      expect(VISIBLE_ADMIN_MODULES.some((module) => module.id === id)).toBe(false);
    }
  });
});
