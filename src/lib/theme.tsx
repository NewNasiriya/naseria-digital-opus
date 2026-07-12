import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "auto";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "app-theme";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "auto";
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "auto") return value;
  } catch {
    /* localStorage unavailable */
  }
  return "auto";
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Time-of-day resolver for "auto" mode.
 * Daytime is 06:00–17:59 local time (light), otherwise dark.
 * Uses local hours so the site follows the visitor's clock — the same
 * behaviour visitors expect from a school in Egypt (day = light, night = dark).
 */
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 18; // exclusive

function isDaytimeNow(): boolean {
  if (typeof window === "undefined") return true;
  const h = new Date().getHours();
  return h >= DAY_START_HOUR && h < DAY_END_HOUR;
}

function applyTheme(mode: ThemeMode): ResolvedTheme {
  const resolved: ResolvedTheme =
    mode === "auto" ? (isDaytimeNow() ? "light" : "dark") : mode;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  root.setAttribute("data-theme", resolved);
  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start in "auto" for SSR — the pre-hydration script has already set the
  // right class on <html>, so no visual flash occurs when we sync on mount.
  const [mode, setModeState] = useState<ThemeMode>("auto");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  // Sync state from storage on mount.
  useEffect(() => {
    const initial = readStoredMode();
    setModeState(initial);
    setResolved(applyTheme(initial));
  }, []);

  // While in "auto", re-evaluate periodically so the theme flips
  // automatically at sunrise / sunset without needing a reload.
  useEffect(() => {
    if (mode !== "auto" || typeof window === "undefined") return;
    const tick = () => setResolved(applyTheme("auto"));
    const interval = window.setInterval(tick, 60_000); // every minute
    const onVisibility = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [mode]);

  // Cross-tab sync.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = readStoredMode();
      setModeState(next);
      setResolved(applyTheme(next));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolved,
      setMode: (next) => {
        try {
          window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
          /* ignore */
        }
        setModeState(next);
        setResolved(applyTheme(next));
      },
    }),
    [mode, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}

/**
 * Inline script executed before hydration to prevent FOUC.
 * Reads the persisted preference (or the OS setting) and applies the
 * `.dark` class + color-scheme on <html> before the first paint.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k='${STORAGE_KEY}';var v=localStorage.getItem(k);var m=(v==='light'||v==='dark'||v==='auto')?v:'auto';var d=m==='dark'||(m==='auto'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.style.colorScheme=d?'dark':'light';r.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;
