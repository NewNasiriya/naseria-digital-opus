import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { useTheme, type ThemeMode } from "@/lib/theme";

const OPTIONS: Array<{
  value: ThemeMode;
  label: string;
  description: string;
  icon: typeof Sun;
}> = [
  {
    value: "light",
    label: "فاتح",
    description: "مظهر نهاري كلاسيكي بألوان هادئة.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "داكن",
    description: "مظهر ليلي مريح للعين مع تباين عالٍ.",
    icon: Moon,
  },
  {
    value: "auto",
    label: "تلقائي",
    description: "فاتح نهارًا وداكن ليلًا حسب توقيت جهازك.",
    icon: Monitor,
  },
];

export function AppearancePanel() {
  const { mode, resolved, setMode } = useTheme();

  return (
    <section
      aria-labelledby="appearance-title"
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="appearance-title" className="text-base font-semibold text-foreground">
            مظهر الموقع
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            اختر المظهر المفضل لواجهة الموقع. يتم حفظ التفضيل تلقائيًا على هذا الجهاز.
          </p>
        </div>
        <span className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          الحالي: {resolved === "dark" ? "داكن" : "فاتح"}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="اختيار مظهر الموقع"
        className="mt-5 grid gap-3 sm:grid-cols-3"
      >
        {OPTIONS.map(({ value, label, description, icon: Icon }) => {
          const active = mode === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(value)}
              className={cn(
                "group text-start relative flex flex-col gap-2 rounded-xl border p-4 transition-all",
                "hover:border-border-strong hover:bg-accent/40",
                active
                  ? "border-primary bg-primary-soft ring-2 ring-primary/30"
                  : "border-border bg-surface",
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    active ? "text-primary" : "text-foreground",
                  )}
                >
                  {label}
                </span>
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                {description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
