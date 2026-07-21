/**
 * Homepage Hero — public reader.
 *
 * Reads the single published `homepage_hero` row (id = 1) and its
 * visible action buttons. Values are used as CMS overrides for the
 * hardcoded defaults in `src/components/home/Hero.tsx` — the current
 * hero images and layout remain the default fallback.
 */
import { supabase } from "@/integrations/supabase/client";

export interface HeroAction {
  id: string;
  label_ar: string;
  href: string;
  variant: string;
  display_order: number;
}

export interface HomepageHeroContent {
  headline_ar: string | null;
  subheadline_ar: string | null;
  actions: HeroAction[];
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
  const actions = ((data as { actions?: HeroAction[] & { is_visible?: boolean }[] }).actions ?? [])
    .filter((a: HeroAction & { is_visible?: boolean }) => a.is_visible !== false)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  return {
    headline_ar: data.headline_ar ?? null,
    subheadline_ar: data.subheadline_ar ?? null,
    actions,
  };
}
