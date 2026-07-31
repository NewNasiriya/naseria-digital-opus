/** Public homepage hero reader and action validation. */
import { supabase } from "@/integrations/supabase/client";

export type HeroActionVariant = "primary" | "secondary" | "ghost";

export interface HeroAction {
  id: string;
  label_ar: string;
  href: string;
  variant: HeroActionVariant;
  display_order: number;
  external: boolean;
}

interface RawHeroAction {
  id: string;
  label_ar: string;
  href: string;
  variant: string;
  display_order: number;
  is_visible?: boolean;
}

export interface HomepageHeroContent {
  headline_ar: string | null;
  subheadline_ar: string | null;
  actions: HeroAction[];
}

const INTERNAL_EXACT_PATHS = new Set([
  "/",
  "/about",
  "/academic",
  "/academic/admission-guide",
  "/academic/attendance",
  "/academic/attendance-behaviour",
  "/academic/behaviour",
  "/academic/calendar",
  "/academic/faq",
  "/academic/parent-guidelines",
  "/academic/policies",
  "/academic/student-guidelines",
  "/news",
  "/achievements",
  "/honor",
  "/activities",
  "/gallery",
  "/contact",
  "/search",
]);

const INTERNAL_DYNAMIC_PATHS = [
  /^\/academic\/grades\/[1-6]$/,
  /^\/honor\/grades\/[1-6]$/,
  /^\/news\/[a-z0-9-]+$/i,
  /^\/achievements\/[a-z0-9-]+$/i,
  /^\/activities\/[a-z0-9-]+$/i,
  /^\/gallery\/[a-z0-9-]+$/i,
];

function normalizeVariant(value: string): HeroActionVariant {
  return value === "primary" || value === "ghost" ? value : "secondary";
}

function normalizeInternalHref(href: string): string | null {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  try {
    const parsed = new URL(href, "https://school.invalid");
    if (parsed.origin !== "https://school.invalid") return null;
    const pathname = parsed.pathname.replace(/\/{2,}/g, "/");
    const valid =
      INTERNAL_EXACT_PATHS.has(pathname) ||
      INTERNAL_DYNAMIC_PATHS.some((pattern) => pattern.test(pathname));
    return valid ? `${pathname}${parsed.search}${parsed.hash}` : null;
  } catch {
    return null;
  }
}

function normalizeExternalHref(href: string): string | null {
  try {
    const parsed = new URL(href);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function normalizeHeroAction(raw: RawHeroAction): HeroAction | null {
  if (raw.is_visible === false) return null;
  const label = raw.label_ar?.trim();
  const sourceHref = raw.href?.trim();
  if (!label || !sourceHref) return null;

  const internalHref = normalizeInternalHref(sourceHref);
  const externalHref = internalHref ? null : normalizeExternalHref(sourceHref);
  const href = internalHref ?? externalHref;
  if (!href) return null;

  return {
    id: raw.id,
    label_ar: label,
    href,
    variant: normalizeVariant(raw.variant),
    display_order: Number.isFinite(raw.display_order) ? raw.display_order : 0,
    external: Boolean(externalHref),
  };
}

export async function fetchHomepageHero(): Promise<HomepageHeroContent | null> {
  const { data, error } = await supabase
    .from("homepage_hero")
    .select(
      "headline_ar,subheadline_ar,actions:homepage_hero_actions(id,label_ar,href,variant,display_order,is_visible)",
    )
    .eq("id", 1)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const actions = (
    (data as unknown as { actions?: RawHeroAction[] }).actions ?? []
  )
    .map(normalizeHeroAction)
    .filter((action): action is HeroAction => action !== null)
    .sort((a, b) => a.display_order - b.display_order);

  return {
    headline_ar: data.headline_ar?.trim() || null,
    subheadline_ar: data.subheadline_ar?.trim() || null,
    actions,
  };
}
