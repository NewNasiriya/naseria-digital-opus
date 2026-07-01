import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import type { NewsCategory } from "@/lib/news";

interface CategoriesFilterProps {
  categories: NewsCategory[];
  activeSlug?: string;
}

export function CategoriesFilter({ categories, activeSlug }: CategoriesFilterProps) {
  return (
    <nav aria-label="تصنيفات الأخبار" className="flex flex-wrap gap-2">
      <Link
        to="/news"
        search={{}}
        className={cn(
          "inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
          !activeSlug
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
        )}
      >
        الكل
      </Link>
      {categories.map((c) => {
        const active = activeSlug === c.slug;
        return (
          <Link
            key={c.id}
            to="/news"
            search={{ category: c.slug }}
            className={cn(
              "inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {c.name_ar}
          </Link>
        );
      })}
    </nav>
  );
}
