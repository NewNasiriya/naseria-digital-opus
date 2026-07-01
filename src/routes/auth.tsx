import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AlertCircle, Eye, EyeOff, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { signInWithPassword } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SchoolLogo } from "@/components/brand/SchoolLogo";

const searchSchema = z.object({
  redirect: z.string().optional(),
  forbidden: z.union([z.literal("1"), z.boolean()]).optional(),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول · لوحة إدارة المدرسة" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "تسجيل الدخول إلى لوحة إدارة مدرسة الناصرية الابتدائية الجديدة.",
      },
    ],
  }),
  validateSearch: (input) => searchSchema.parse(input),
  component: AuthPage,
});

const formSchema = z.object({
  email: z.string().trim().email("بريد إلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور قصيرة جدًا"),
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/admin";

  // If already signed in, bounce to admin (or the redirect target).
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled && data.user) {
        navigate({ to: redirectTo, replace: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigate, redirectTo]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    const parsed = formSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.errors) {
        const key = issue.path[0];
        if (key === "email" || key === "password") fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      await signInWithPassword({ email, password, rememberMe: remember });
      navigate({ to: redirectTo, replace: true });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message.includes("Invalid login credentials")
            ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
            : err.message
          : "تعذّر تسجيل الدخول، حاول مرة أخرى.";
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-dvh bg-background">
      <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
        {/* Brand panel */}
        <aside className="relative hidden overflow-hidden bg-gradient-to-bl from-primary via-primary to-primary/85 text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              background:
                "radial-gradient(1200px 500px at 100% 0%, hsl(var(--primary-foreground) / 0.25), transparent 55%), radial-gradient(700px 400px at 0% 100%, hsl(var(--primary-foreground) / 0.15), transparent 60%)",
            }}
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              لوحة إدارة آمنة
            </span>
            <h1 className="mt-8 text-4xl font-bold leading-snug">
              مرحبًا بعودتك إلى لوحة إدارة
              <br />
              <span className="text-primary-foreground/90">مدرسة الناصرية الابتدائية الجديدة</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-loose text-primary-foreground/80">
              أدر جميع محتوى الموقع من مكان واحد: الأخبار، الإنجازات، الجداول، ولوحة الشرف — بأمان
              كامل وصلاحيات دقيقة لكل عضو في فريق الإدارة.
            </p>
          </div>
          <ul className="relative mt-10 space-y-3 text-sm text-primary-foreground/85">
            <li className="flex items-center gap-3">
              <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-primary-foreground/10">
                <ShieldCheck className="h-4 w-4" />
              </span>
              اتصال مشفّر وحماية على مستوى الصفوف والصلاحيات
            </li>
            <li className="flex items-center gap-3">
              <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-primary-foreground/10">
                <LockKeyhole className="h-4 w-4" />
              </span>
              جلسات دائمة مع تجديد تلقائي وخروج آمن
            </li>
          </ul>
        </aside>

        {/* Form panel */}
        <section className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-start">
              <SchoolLogo
                eager
                size={72}
                className="mx-auto mb-4 h-16 w-16 lg:mx-0"
              />
              <h2 className="text-2xl font-bold text-foreground">تسجيل الدخول</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                استخدم بيانات حساب الإدارة الرسمي للوصول إلى لوحة التحكم.
              </p>
            </div>

            {search.forbidden ? (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <p>حسابك لا يملك صلاحية الوصول إلى لوحة الإدارة. راجع مسؤول النظام.</p>
              </div>
            ) : null}

            {errors.form ? (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <p>{errors.form}</p>
              </div>
            ) : null}

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    dir="ltr"
                    className="h-11 pe-10 text-start"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    placeholder="name@school.edu.eg"
                    required
                  />
                </div>
                {errors.email ? (
                  <p id="email-error" className="text-xs text-destructive">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    dir="ltr"
                    className="h-11 pe-10 text-start"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    className="absolute inset-y-0 end-2 my-auto grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password ? (
                  <p id="password-error" className="text-xs text-destructive">
                    {errors.password}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(v) => setRemember(Boolean(v))}
                    aria-label="تذكرني على هذا الجهاز"
                  />
                  <span>تذكرني</span>
                </label>
                <span className="text-xs text-muted-foreground">
                  نسيت كلمة المرور؟ راجع المسؤول
                </span>
              </div>

              <Button
                type="submit"
                className="h-11 w-full text-sm font-semibold"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    جارٍ التحقق…
                  </>
                ) : (
                  "تسجيل الدخول"
                )}
              </Button>
            </form>

            <p className="mt-10 text-center text-xs text-muted-foreground">
              الوصول مقتصر على فريق إدارة المدرسة. جميع محاولات الدخول مسجّلة لأغراض التدقيق.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
