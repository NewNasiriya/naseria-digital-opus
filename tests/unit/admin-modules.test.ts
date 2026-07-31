import { describe, expect, test } from "bun:test";

import {
  IMPLEMENTED_ADMIN_MODULE_IDS,
  VISIBLE_ADMIN_MODULES,
  isAdminModuleImplemented,
} from "../../src/lib/admin-module-availability";
import { listCmsUiModules } from "../../src/cms/ui/module-registry";
import {
  REGISTERED_CMS_UI_MODULE_IDS,
  ensureCmsUiModulesRegistered,
} from "../../src/cms/ui/modules";

describe("admin module availability", () => {
  test("keeps functional CMS and bespoke modules visible", () => {
    for (const id of [
      "homepage",
      "academic",
      "news",
      "achievements",
      "honor",
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

  test("registers every shared CMS editor before route lookup", () => {
    ensureCmsUiModulesRegistered();

    const registeredIds = listCmsUiModules()
      .map((module) => module.id)
      .filter((id) => REGISTERED_CMS_UI_MODULE_IDS.includes(id as never))
      .sort();

    expect(registeredIds).toEqual([...REGISTERED_CMS_UI_MODULE_IDS].sort());
  });

  test("hides unimplemented or misleading modules", () => {
    for (const id of [
      "about",
      "policies",
      "faq",
      "users",
      "settings",
      "seo",
      "status",
    ]) {
      expect(isAdminModuleImplemented(id)).toBe(false);
      expect(VISIBLE_ADMIN_MODULES.some((module) => module.id === id)).toBe(false);
    }
  });
});
