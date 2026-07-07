/**
 * Contact & school information data layer.
 *
 * Provides typed access to the single-row `contact_info`, `site_settings`
 * and the `working_hours` schedule. All content is CMS-editable — never
 * hardcode contact data in components.
 */
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export interface EmailEntry {
  label: string;
  value: string;
  description?: string;
  primary?: boolean;
  fallback?: boolean;
}


export interface PhoneEntry {
  label: string;
  value: string;
  primary?: boolean;
}

export interface ContactInfo {
  address_ar: string | null;
  address_en: string | null;
  educational_administration_ar: string | null;
  governorate_ar: string | null;
  country_ar: string | null;
  plus_code: string | null;
  directions_ar: string | null;
  google_maps_embed_url: string | null;
  google_maps_link: string | null;
  google_maps_lat: number | null;
  google_maps_lng: number | null;
  email: string | null;
  emails: EmailEntry[];
  phones: PhoneEntry[];
  holiday_notice_ar: string | null;
  special_announcement_ar: string | null;
}

export interface SiteSettings {
  school_name_ar: string;
  school_name_en: string | null;
}

export interface WorkingHour {
  id: string;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  note_ar: string | null;
  display_order: number;
}

export const DAY_NAMES_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

async function fetchContactInfo(): Promise<ContactInfo | null> {
  const { data, error } = await supabase
    .from("contact_info")
    .select(
      "address_ar,address_en,educational_administration_ar,governorate_ar,country_ar,plus_code,directions_ar,google_maps_embed_url,google_maps_link,google_maps_lat,google_maps_lng,email,emails,phones,holiday_notice_ar,special_announcement_ar",
    )
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    emails: Array.isArray(data.emails) ? (data.emails as unknown as EmailEntry[]) : [],
    phones: Array.isArray(data.phones) ? (data.phones as unknown as PhoneEntry[]) : [],
  } as ContactInfo;
}

async function fetchSiteSettings(): Promise<SiteSettings | null> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("school_name_ar,school_name_en")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function fetchWorkingHours(): Promise<WorkingHour[]> {
  const { data, error } = await supabase
    .from("working_hours")
    .select("id,day_of_week,opens_at,closes_at,is_closed,note_ar,display_order")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WorkingHour[];
}

export function useContactInfo() {
  return useQuery({
    queryKey: ["contact-info"],
    queryFn: fetchContactInfo,
    staleTime: 60_000,
  });
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60_000,
  });
}

export function useWorkingHours() {
  return useQuery({
    queryKey: ["working-hours"],
    queryFn: fetchWorkingHours,
    staleTime: 5 * 60_000,
  });
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  label: string | null;
  icon_key: string | null;
  display_order: number;
}

async function fetchSocialLinks(): Promise<SocialLink[]> {
  const { data, error } = await supabase
    .from("social_links")
    .select("id,platform,url,label,icon_key,display_order")
    .eq("is_visible", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SocialLink[];
}

export function useSocialLinks() {
  return useQuery({
    queryKey: ["social-links"],
    queryFn: fetchSocialLinks,
    staleTime: 5 * 60_000,
  });
}


/** Format `HH:MM:SS` (or `HH:MM`) into Arabic 12-hour label. */
export function formatWorkingTime(value: string | null): string {
  if (!value) return "";
  const [hStr, mStr] = value.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? 0);
  if (Number.isNaN(h)) return value;
  const period = h < 12 ? "ص" : "م";
  const hour12 = ((h + 11) % 12) + 1;
  const mm = m.toString().padStart(2, "0");
  return `${hour12}:${mm} ${period}`;
}

export function formatWorkingRange(day: WorkingHour): string {
  if (day.is_closed) return day.note_ar || "مغلق";
  if (!day.opens_at || !day.closes_at) return "—";
  return `${formatWorkingTime(day.opens_at)} – ${formatWorkingTime(day.closes_at)}`;
}

export function primaryEmail(info: ContactInfo | null | undefined): string | null {
  if (!info) return null;
  const regular = info.emails.filter((e) => !e.fallback);
  const p = regular.find((e) => e.primary);
  return p?.value ?? regular[0]?.value ?? info.email ?? null;
}

