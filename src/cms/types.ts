/**
 * CMS domain types.
 *
 * Vendor-neutral shapes shared by every module. Repositories translate
 * these to/from the underlying Supabase tables so UI code never imports
 * the database types directly.
 */
import type { Database } from "@/integrations/supabase/types";

export type ContentStatus = Database["public"]["Enums"]["content_status"]; // "draft" | "published" | "archived"
export type AppRole = Database["public"]["Enums"]["app_role"];             // "admin" | "editor" | "viewer"

export type UUID = string;
export type ISODateString = string;
export type Locale = "ar" | "en";

/** Common metadata every editable content entity carries. */
export interface EntityMeta {
  id: UUID;
  slug?: string | null;
  status: ContentStatus;
  featured?: boolean;
  pinned?: boolean;
  sort_order?: number;
  created_at: ISODateString;
  updated_at: ISODateString;
  published_at?: ISODateString | null;
  created_by?: UUID | null;
  updated_by?: UUID | null;
}

/** SEO / Open Graph metadata block (per-entity, per-locale). */
export interface SeoMeta {
  title?: string | null;
  description?: string | null;
  keywords?: string[] | null;
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_id?: UUID | null;
  twitter_card?: "summary" | "summary_large_image" | null;
  robots?: string | null;
}

/** Localizable string. Arabic is primary; English is optional today. */
export interface LocalizedText {
  ar: string;
  en?: string | null;
}

/** Reference to a media library asset. */
export interface MediaRef {
  id: UUID;
  bucket: string;
  path: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
}

/** Query options accepted by every list repository. */
export interface ListQuery {
  search?: string;
  status?: ContentStatus | "all";
  featured?: boolean;
  pinned?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Record<string, string | number | boolean | null>;
}

export interface Page<T> {
  rows: T[];
  total: number;
  limit: number;
  offset: number;
}

/** Publishing lifecycle transitions supported by every content service. */
export type LifecycleAction =
  | "save_draft"
  | "publish"
  | "unpublish"
  | "archive"
  | "restore"
  | "duplicate";

/** Version snapshot (backed by content_versions table). */
export interface VersionSnapshot<T = unknown> {
  id: UUID;
  entity_table: string;
  entity_id: UUID;
  version: number;
  data: T;
  created_at: ISODateString;
  created_by?: UUID | null;
}
