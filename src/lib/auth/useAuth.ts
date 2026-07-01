/**
 * Client auth hook. Subscribes to Supabase auth state, exposes the current
 * admin profile (with roles/permissions), and provides `can()` for
 * permission-gated UI.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

import { computePermissions, type AppRole, type Permission } from "./permissions";
import { fetchAdminProfile, signOut as doSignOut, type AdminProfile } from "./service";

type AuthState = {
  status: "loading" | "unauthenticated" | "authenticated";
  profile: AdminProfile | null;
};

export function useAuth() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ status: "loading", profile: null });

  const load = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setState({ status: "unauthenticated", profile: null });
      return;
    }
    const profile = await fetchAdminProfile(data.user.id, data.user.email ?? "");
    setState({ status: profile ? "authenticated" : "unauthenticated", profile });
  }, []);

  useEffect(() => {
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setState({ status: "unauthenticated", profile: null });
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        void load();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const permissions = useMemo(
    () => computePermissions(state.profile?.roles ?? []),
    [state.profile],
  );

  const can = useCallback(
    (permission: Permission) => permissions.has(permission),
    [permissions],
  );

  const hasRole = useCallback(
    (role: AppRole) => Boolean(state.profile?.roles.includes(role)),
    [state.profile],
  );

  const signOut = useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await doSignOut();
    setState({ status: "unauthenticated", profile: null });
  }, [queryClient]);

  return {
    ...state,
    isAuthenticated: state.status === "authenticated",
    isLoading: state.status === "loading",
    permissions,
    can,
    hasRole,
    reload: load,
    signOut,
  };
}
