import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";

interface NewsSearchProps {
  initialValue?: string;
}

/**
 * Client-side search input. Debounces changes into the URL as `?q=`,
 * ready for future server-side full-text search wiring.
 */
export function NewsSearch({ initialValue = "" }: NewsSearchProps) {
  const navigate = useNavigate({ from: "/news" });
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const t = setTimeout(() => {
      navigate({
        search: (prev) => ({
          ...prev,
          q: value.trim() ? value.trim() : undefined,
          page: undefined,
        }),
        replace: true,
      });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className="relative w-full sm:max-w-sm"
    >
      <label htmlFor="news-search" className="sr-only">
        بحث في الأخبار
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        id="news-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ابحث في عناوين الأخبار…"
        className="w-full rounded-full border border-border bg-card py-2.5 pr-10 pl-4 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </form>
  );
}
