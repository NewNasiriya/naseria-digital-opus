/**
 * Declarative RBAC catalogue.
 *
 * Rules:
 *   - Roles live in the database (`public.app_role`). This file maps each
 *     role to a set of granular permissions the UI reads to hide/show
 *     actions. Server-side enforcement stays with Supabase RLS.
 *   - Permissions are additive across a user's roles.
 *   - Never hardcode role checks in components — always call
 *     `useAuth().can(permission)` or `hasAny(role)` from the auth hook.
 */
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "مسؤول أعلى",
  admin: "مدير النظام",
  principal: "مدير المدرسة",
  vice_principal: "وكيل المدرسة",
  media_coordinator: "منسق الإعلام",
  academic_coordinator: "منسق أكاديمي",
  editor: "محرر",
  viewer: "مشاهد",
};

/**
 * Full permission taxonomy. Anything the UI needs to conditionally render
 * should be represented here — never inline role strings inside components.
 */
export const PERMISSIONS = [
  // Content modules
  "homepage.manage",
  "about.manage",
  "academic.manage",
  "news.manage",
  "achievements.manage",
  "honor.manage",
  "activities.manage",
  "gallery.manage",
  "contact.manage",
  // Publishing lifecycle
  "content.publish",
  "content.archive",
  "content.delete",
  // Media library
  "media.view",
  "media.upload",
  "media.replace",
  "media.delete",
  "media.manage_folders",
  "documents.download",
  // Administration
  "users.manage",
  "settings.manage",
  "seo.manage",
  "notifications.manage",
  "analytics.view",
  "audit.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: readonly Permission[] = PERMISSIONS;

/** Default permission grants per role. Extend by editing this map. */
export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  super_admin: ALL,
  admin: ALL,
  principal: ALL,
  vice_principal: [
    "homepage.manage",
    "about.manage",
    "academic.manage",
    "news.manage",
    "achievements.manage",
    "honor.manage",
    "activities.manage",
    "gallery.manage",
    "contact.manage",
    "content.publish",
    "content.archive",
    "media.upload",
    "seo.manage",
    "analytics.view",
    "audit.view",
  ],
  media_coordinator: [
    "news.manage",
    "achievements.manage",
    "activities.manage",
    "gallery.manage",
    "content.publish",
    "content.archive",
    "media.upload",
    "media.delete",
  ],
  academic_coordinator: [
    "academic.manage",
    "honor.manage",
    "content.publish",
    "content.archive",
    "media.upload",
  ],
  editor: [
    "news.manage",
    "achievements.manage",
    "activities.manage",
    "gallery.manage",
    "media.upload",
  ],
  viewer: [],
};

/** Roles that count as "staff" — able to reach the admin dashboard. */
export const STAFF_ROLES: readonly AppRole[] = [
  "super_admin",
  "admin",
  "principal",
  "vice_principal",
  "media_coordinator",
  "academic_coordinator",
  "editor",
];

export function computePermissions(roles: readonly AppRole[]): Set<Permission> {
  const out = new Set<Permission>();
  for (const role of roles) {
    for (const p of ROLE_PERMISSIONS[role] ?? []) out.add(p);
  }
  return out;
}

export function isStaffRole(role: AppRole): boolean {
  return STAFF_ROLES.includes(role);
}
