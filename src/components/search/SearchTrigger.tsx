/**
 * Global search trigger button + keyboard shortcut host.
 *
 * Renders a compact search affordance for the header and owns the
 * lifecycle of the shared {@link SearchDialog}. Also wires the
 * ⌘/Ctrl+K and `/` shortcuts globally.
 */
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { SearchDialog } from "./SearchDialog";
import { cn } from "@/lib/utils";

interface SearchTriggerProps {
  variant?: "full" | "icon";
  className?: string;
}

export function SearchTrigger({ variant = "full", className }: SearchTriggerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && ["INPUT", "TEXTAREA"].includes(target.tagName);
      const editable = target?.isContentEditable;
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "/" && !typing && !editable && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {variant === "full" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="فتح البحث في الموقع"
          className={cn(
            "hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground md:inline-flex",
            className,
          )}
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span>ابحث في الموقع…</span>
          <kbd className="ms-2 hidden rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline-block">
            /
          </kbd>
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="فتح البحث"
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-accent",
          variant === "full" && "md:hidden",
          className,
        )}
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
