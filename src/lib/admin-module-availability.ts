import {
  ADMIN_MODULES,
  type AdminModule,
  type AdminModuleId,
} from "@/lib/admin-modules";

/**
 * Only modules with a complete shared CMS registration or a complete bespoke
 * admin route are exposed. Re-enable a module by adding its id after its
 * editor and public write-through path are implemented and tested.
 */
export const IMPLEMENTED_ADMIN_MODULE_IDS: ReadonlySet<AdminModuleId> = new Set([
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
]);

export function isAdminModuleImplemented(
  module: AdminModule | AdminModuleId | string | null | undefined,
): boolean {
  const id = typeof module === "object" && module ? module.id : module;
  return Boolean(id && IMPLEMENTED_ADMIN_MODULE_IDS.has(id as AdminModuleId));
}

export const VISIBLE_ADMIN_MODULES: AdminModule[] = ADMIN_MODULES.filter(
  isAdminModuleImplemented,
);
