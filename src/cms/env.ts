/**
 * Environment abstraction.
 *
 * The whole app should read configuration through `env` so that swapping
 * providers or promoting from preview to production never requires editing
 * scattered `import.meta.env.*` accesses.
 *
 * Values are read at module load and validated once. Secrets stay on the
 * server — this file must never expose service-role or private keys.
 */

export interface CmsEnv {
  supabaseUrl: string;
  supabasePublishableKey: string;
  supabaseProjectId?: string;
  mode: "development" | "preview" | "production";
  isServer: boolean;
}

function readClient(key: string): string | undefined {
  const value = (import.meta as any).env?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readServer(key: string): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  const value = process.env[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readEither(clientKey: string, serverKey: string): string | undefined {
  return readClient(clientKey) ?? readServer(serverKey);
}

function detectMode(): CmsEnv["mode"] {
  const raw = (import.meta as any).env?.MODE ?? readServer("NODE_ENV") ?? "development";
  if (raw === "production") return "production";
  if (raw === "preview" || raw === "staging") return "preview";
  return "development";
}

export const env: CmsEnv = {
  supabaseUrl: readEither("VITE_SUPABASE_URL", "SUPABASE_URL") ?? "",
  supabasePublishableKey:
    readEither("VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY") ?? "",
  supabaseProjectId: readEither("VITE_SUPABASE_PROJECT_ID", "SUPABASE_PROJECT_ID"),
  mode: detectMode(),
  isServer: typeof window === "undefined",
};

/** True once Supabase credentials are wired in (both preview and prod). */
export const isBackendConfigured: boolean =
  env.supabaseUrl.length > 0 && env.supabasePublishableKey.length > 0;
