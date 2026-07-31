import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTheme, type ThemeMode } from "@/lib/theme";

const OPTIONS: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
  { value: "light", label: "فاتح", icon: Sun },
  { value: "dark", label: "داكن", icon: Moon },
  { value: "auto", label: "تلقائي", icon: Monitor },
];

type ThemeToggleProps = {
  className?: string;
  align?: "start" | "center" | "end";
};

export function ThemeToggle({ className, align = "end" }: ThemeToggleProps) {
  const { mode, resolved, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const Icon = resolved === "dark" ? Moon : Sun;

  const selectMode = (value: ThemeMode) => {
    setOpen(false);
    window.requestAnimationFrame(() => setMode(value));
  };

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="تغيير مظهر الموقع"
          className={cn("relative", className)}
        >
          <Icon className="h-[1.15rem] w-[1.15rem] transition-transform" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="z-[100] w-40">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          المظهر
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {OPTIONS.map(({ value, label, icon: OptIcon }) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => selectMode(value)}
            className={cn(
              "gap-2 text-sm",
              mode === value && "bg-accent text-accent-foreground",
            )}
          >
            <OptIcon className="h-4 w-4" aria-hidden="true" />
            <span className="flex-1">{label}</span>
            {mode === value && (
              <span
                aria-hidden="true"
                className="ms-1 inline-block h-1.5 w-1.5 rounded-full bg-primary"
              />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
