import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface NewsPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  categorySlug?: string;
  q?: string;
}

export function NewsPagination({ page, pageSize, total, categorySlug, q }: NewsPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.max(0, page - 3) + 5,
  );

  const linkClass = (active: boolean) =>
    cn(
      "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
    );

  const searchFor = (p: number) => ({
    ...(categorySlug ? { category: categorySlug } : {}),
    ...(q ? { q } : {}),
    ...(p > 1 ? { page: p } : {}),
  });

  return (
    <nav aria-label="التنقل بين صفحات الأخبار" className="mt-10 flex items-center justify-center gap-1.5">
      <Link
        to="/news"
        search={searchFor(Math.max(1, page - 1))}
        aria-label="الصفحة السابقة"
        aria-disabled={page <= 1}
        className={cn(linkClass(false), page <= 1 && "pointer-events-none opacity-40")}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      {pages.map((p) => (
        <Link key={p} to="/news" search={searchFor(p)} className={linkClass(p === page)}>
          {p}
        </Link>
      ))}
      <Link
        to="/news"
        search={searchFor(Math.min(totalPages, page + 1))}
        aria-label="الصفحة التالية"
        aria-disabled={page >= totalPages}
        className={cn(linkClass(false), page >= totalPages && "pointer-events-none opacity-40")}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Link>
    </nav>
  );
}
