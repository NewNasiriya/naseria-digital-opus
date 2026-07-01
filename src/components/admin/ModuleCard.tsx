import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import type { AdminModule } from "@/lib/admin-modules";

interface ModuleCardProps {
  module: AdminModule;
  count?: string;
  drafts?: number;
  lastUpdated?: string;
}

export function ModuleCard({
  module,
  count = "—",
  drafts = 0,
  lastUpdated = "—",
}: ModuleCardProps) {
  const Icon = module.icon;
  return (
    <Link
      to={`/admin/${module.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:elevation-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"
        >
          <Icon className="h-5 w-5" />
        </span>
        {drafts > 0 && (
          <span className="rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-semibold text-warning">
            {drafts} مسودة
          </span>
        )}
      </div>

      <h3 className="mt-4 text-base font-semibold text-foreground">
        {module.short}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">
        {module.description}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
        <div>
          <dt className="text-muted-foreground">العناصر</dt>
          <dd className="mt-0.5 font-semibold text-foreground">{count}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">آخر تحديث</dt>
          <dd className="mt-0.5 font-semibold text-foreground">{lastUpdated}</dd>
        </div>
      </dl>

      <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors group-hover:text-primary-hover">
        فتح
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      </div>
    </Link>
  );
}
