import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ExternalLink } from "lucide-react";

interface AdminSectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  crumbs?: { label: string; to?: string }[];
  publicHref?: string;
}

export function AdminSectionHeader({
  eyebrow,
  title,
  description,
  action,
  crumbs,
  publicHref,
}: AdminSectionHeaderProps) {
  return (
    <header className="mb-8 border-b border-border pb-6">
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="المسار" className="mb-3">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <li key={i} className="flex items-center gap-1.5">
                  {c.to && !isLast ? (
                    <Link
                      to={c.to}
                      className="transition-colors hover:text-foreground"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={isLast ? "page" : undefined}
                      className={isLast ? "text-foreground" : ""}
                    >
                      {c.label}
                    </span>
                  )}
                  {!isLast && (
                    <ChevronLeft
                      className="h-3 w-3 text-muted-foreground/60"
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-loose text-muted-foreground">
              {description}
            </p>
          )}
          {publicHref && (
            <a
              href={publicHref}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              عرض على الموقع
            </a>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
