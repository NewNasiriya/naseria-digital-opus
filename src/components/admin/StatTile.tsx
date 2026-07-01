import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}

export function StatTile({ label, value, hint, icon: Icon }: StatTileProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          aria-hidden="true"
          className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary"
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      {hint && (
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
