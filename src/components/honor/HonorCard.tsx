import { Link } from "@tanstack/react-router";
import { ArrowLeft, Award } from "lucide-react";

import type { HonorBoardRecord } from "@/lib/honor";

interface HonorCardProps {
  board: HonorBoardRecord;
}

export function HonorCard({ board }: HonorCardProps) {
  return (
    <Link
      to="/honor/grades/$level"
      params={{ level: String(board.grade_level) }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card elevation-sm transition-all duration-300 hover:-translate-y-0.5 hover:elevation-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-muted">
        <img
          src={board.image_url}
          alt={`${board.title_ar ?? board.grade_name_ar} — ${board.academic_year}`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      </div>

      <div className="flex flex-1 items-start justify-between gap-4 border-t border-border p-6">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
            <Award className="h-3.5 w-3.5" aria-hidden="true" />
            لوحة الشرف
          </p>
          <h3 className="mt-2 truncate text-lg font-semibold text-foreground">
            {board.grade_name_ar}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            العام الدراسي {board.academic_year}
          </p>
        </div>
        <span
          aria-hidden="true"
          className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
