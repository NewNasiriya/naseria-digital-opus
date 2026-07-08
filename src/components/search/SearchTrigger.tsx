/**
 * Global search trigger button + keyboard shortcut host.
 *
 * Renders a compact magnifier icon for the header and owns the
 * lifecycle of the shared {@link SearchDialog}. Also wires the
 * ⌘/Ctrl+K and `/` shortcuts globally.
 */
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { SearchDialog } from "./SearchDialog";
import { cn } from "@/lib/utils";

interface SearchTriggerProps {
  /**
   * Kept for backwards compatibility. The trigger now always renders
   * as a compact icon button regardless of variant.
   */
  variant?: "full" | "icon";
  className?: string;
}

export function SearchTrigger({ className }: SearchTriggerProps) {
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="فتح البحث في الموقع"
        title="بحث"
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          className,
        )}
      >
        <Search className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
