/**
 * Auth service. Wraps Supabase Auth with the app's expected side effects:
 * profile bootstrap, staff-role check, last-login stamp, and audit trail.
 */
import { supabase } from "@/integrations/supabase/client";
import { recordAudit } from "@/cms/audit";

import { STAFF_ROLES, type AppRole } from "./permissions";

export interface SignInInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AdminProfile {
  id: string;
  fullName: string | null;
  email: string;
  status: "active" | "suspended" | "invited";
  lastLoginAt: string | null;
  roles: AppRole[];
}

export async function fetchRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.role as AppRole);
}

export async function fetchAdminProfile(userId: string, email: string): Promise<AdminProfile | null> {
  const [{ data: profile }, roles] = await Promise.all([
    supabase.from("profiles").select("id, full_name, status, last_login_at").eq("id", userId).maybeSingle(),
    fetchRoles(userId),
  ]);
  if (!profile) return null;
  return {
    id: profile.id,
    fullName: profile.full_name,
    email,
    status: (profile.status ?? "active") as AdminProfile["status"],
    lastLoginAt: profile.last_login_at,
    roles,
  };
}

export function hasStaffRole(roles: readonly AppRole[]): boolean {
  return roles.some((r) => STAFF_ROLES.includes(r));
}

export async function signInWithPassword(input: SignInInput) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  });
  if (error) throw error;
  if (!data.user) throw new Error("لم يتم استرجاع بيانات المستخدم.");

  const roles = await fetchRoles(data.user.id);
  if (!hasStaffRole(roles)) {
    await supabase.auth.signOut();
    throw new Error("هذا الحساب لا يملك صلاحية الوصول إلى لوحة الإدارة.");
  }

  // Best-effort profile updates — do not block sign-in on failures.
  const nowIso = new Date().toISOString();
  void supabase.from("profiles").update({ last_login_at: nowIso }).eq("id", data.user.id);
  void recordAudit({
    entity_table: "auth",
    entity_id: data.user.id,
    action: "login",
    actor_id: data.user.id,
    diff: { at: nowIso },
  });

  return { userId: data.user.id, email: data.user.email ?? input.email };
}

export async function signOut() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    void recordAudit({
      entity_table: "auth",
      entity_id: user.id,
      action: "logout",
      actor_id: user.id,
    });
  }
  await supabase.auth.signOut();
}
