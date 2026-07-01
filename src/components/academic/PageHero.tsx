import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Home } from "lucide-react";

import { Container } from "@/components/layout/Container";

interface Crumb {
  label: string;
  to?: string;
}

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
}

/**
 * Consistent inner-page hero for the Academic Life module.
 * Uses the existing design tokens — no new colors introduced.
 */
export function PageHero({
  eyebrow = "الحياة الأكاديمية",
  title,
  description,
  crumbs,
  actions,
}: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-surface-muted">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent"
      />
      <Container size="wide" className="relative py-14 sm:py-20">
        {crumbs && crumbs.length > 0 && (
          <nav
            aria-label="مسار التنقل"
            className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-1 rounded px-1.5 py-1 hover:text-foreground"
            >
              <Home className="h-3.5 w-3.5" aria-hidden="true" />
              الرئيسية
            </Link>
            {crumbs.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                {c.to ? (
                  <Link to={c.to} className="rounded px-1.5 py-1 hover:text-foreground">
                    {c.label}
                  </Link>
                ) : (
                  <span className="px-1.5 py-1 text-foreground">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          {eyebrow}
        </p>
        <h1
          className="mt-3 text-foreground [text-wrap:balance]"
          style={{ fontSize: "clamp(1.75rem, 1.1rem + 2.4vw, 2.75rem)" }}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-base leading-loose text-muted-foreground">
            {description}
          </p>
        )}
        {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
      </Container>
    </section>
  );
}
