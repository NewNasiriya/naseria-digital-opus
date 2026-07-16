import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SchoolLogo } from "@/components/brand/SchoolLogo";

// Beta namespace on @supabase/supabase-js — narrow typing just for these three methods.
interface OAuthAuthorizationDetails {
  client?: { name?: string | null; redirect_uri?: string | null } | null;
  scope?: string | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
}
interface OAuthDecisionResult {
  redirect_url?: string | null;
  redirect_to?: string | null;
}
interface AuthOAuthNamespace {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: OAuthAuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: OAuthDecisionResult | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: OAuthDecisionResult | null; error: { message: string } | null }>;
}
function oauthAuth(): AuthOAuthNamespace {
  return (supabase.auth as unknown as { oauth: AuthOAuthNamespace }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // Browser-only: the Supabase client reads its session from localStorage,
  // absent on the SSR pass. Without this, getSession() is null on the server.
  ssr: false,
  head: () => ({
    meta: [
      { title: "منح صلاحية الوصول · لوحة إدارة المدرسة" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) {
      throw redirect({ to: "/auth", search: { redirect: next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId =
      new URLSearchParams(location.search).get("authorization_id") ?? "";
    const { data, error } = await oauthAuth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) {
      throw redirect({ href: immediate });
    }
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main dir="rtl" className="grid min-h-dvh place-items-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-8 elevation-sm">
        <div className="flex items-start gap-3 text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-bold text-foreground">تعذّر تحميل طلب الصلاحية</h1>
            <p className="mt-2 text-sm leading-loose text-muted-foreground">
              {String((error as Error)?.message ?? error)}
            </p>
          </div>
        </div>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "التطبيق المُتصِل";
  const redirectHost = (() => {
    try {
      const raw = details?.client?.redirect_uri;
      return raw ? new URL(raw).host : null;
    } catch {
      return null;
    }
  })();

  async function decide(approve: boolean) {
    setError(null);
    setBusy(approve ? "approve" : "deny");
    const result = approve
      ? await oauthAuth().approveAuthorization(authorization_id)
      : await oauthAuth().denyAuthorization(authorization_id);
    if (result.error) {
      setBusy(null);
      setError(result.error.message);
      return;
    }
    const target = result.data?.redirect_url ?? result.data?.redirect_to;
    if (!target) {
      setBusy(null);
      setError("لم يُرجِع خادم التفويض عنوان توجيه صالح.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main dir="rtl" className="grid min-h-dvh place-items-center bg-background px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 elevation-sm">
        <div className="mb-6 flex items-center gap-3">
          <SchoolLogo size={48} className="h-12 w-12" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              طلب اتصال آمن
            </p>
            <h1 className="mt-1 text-lg font-bold text-foreground">
              ربط <span className="text-primary">{clientName}</span> بحسابك
            </h1>
          </div>
        </div>

        <p className="text-sm leading-loose text-muted-foreground">
          سيتمكّن <span className="font-semibold text-foreground">{clientName}</span> من
          استخدام أدوات الموقع نيابةً عنك أثناء تسجيل دخولك، وقراءة المحتوى المنشور فقط
          (الأخبار، الإنجازات، الألبومات).
        </p>

        {redirectHost ? (
          <p className="mt-3 text-xs text-muted-foreground">
            سيُعاد التوجيه إلى: <span className="font-mono text-foreground">{redirectHost}</span>
          </p>
        ) : null}

        <div className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-surface-muted p-3 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
          <span>
            هذا لا يتجاوز صلاحيات لوحة الإدارة أو سياسات الأمان في قاعدة البيانات. يمكنك
            إلغاء الاتصال في أي وقت.
          </span>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() => decide(false)}
          >
            {busy === "deny" ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />
                جارٍ الإلغاء…
              </>
            ) : (
              "رفض"
            )}
          </Button>
          <Button
            type="button"
            className="font-semibold"
            disabled={busy !== null}
            onClick={() => decide(true)}
          >
            {busy === "approve" ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />
                جارٍ الاعتماد…
              </>
            ) : (
              "اعتماد الاتصال"
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
