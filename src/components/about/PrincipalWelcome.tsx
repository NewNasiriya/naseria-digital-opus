import { Quote, UserRound } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";

export interface PrincipalMessage {
  title?: string | null;
  message?: string | null;
  name?: string | null;
  position?: string | null;
  signature_url?: string | null;
  portrait_url?: string | null;
}

const DEFAULT_TITLE = "كلمة مدير المدرسة";

export function PrincipalWelcome({ data = {} }: { data?: PrincipalMessage }) {
  const message = data.message?.trim();
  const name = data.name?.trim();
  const position = data.position?.trim();

  return (
    <Section id="principal" tone="default" spacing="default">
      <Container size="default">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 elevation-md sm:p-12">
          <span
            aria-hidden="true"
            className="absolute -top-8 -end-8 text-primary-soft"
          >
            <Quote className="h-40 w-40" />
          </span>
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              من الإدارة
            </p>
            <h2 className="mt-3 rule-accent inline-block">
              {data.title?.trim() || DEFAULT_TITLE}
            </h2>

            <div className="mt-8 grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
              <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                <div className="relative">
                  {data.portrait_url ? (
                    <img
                      src={data.portrait_url}
                      alt={name || "مدير المدرسة"}
                      className="h-24 w-24 rounded-2xl border border-border object-cover elevation-sm lg:h-32 lg:w-32"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="grid h-24 w-24 place-items-center rounded-2xl border border-dashed border-border bg-surface-muted text-muted-foreground lg:h-32 lg:w-32"
                    >
                      <UserRound className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-foreground">
                    {name || "اسم المدير — قيد التحديث"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {position || "المنصب الوظيفي"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-base leading-loose text-foreground sm:text-lg">
                  {message ||
                    "ستُنشر كلمة مدير المدرسة الرسمية في هذا المكان عبر لوحة الإدارة."}
                </p>
                {data.signature_url && (
                  <img
                    src={data.signature_url}
                    alt="توقيع مدير المدرسة"
                    className="mt-8 h-16 w-auto opacity-90"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
