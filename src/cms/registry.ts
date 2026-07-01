/**
 * CMS module registry.
 *
 * Maps each admin module to its backing table(s), search columns, and
 * media policy. UI panels use this registry to create repositories and
 * services on demand without hard-coding table names in components.
 */
import type { Database } from "@/integrations/supabase/types";

import type { AdminModuleId } from "@/lib/admin-modules";

type PublicTable = keyof Database["public"]["Tables"];

export interface CmsModuleConfig {
  id: AdminModuleId;
  table: PublicTable;
  slugColumn?: string;
  searchColumns?: string[];
  defaultOrderBy?: string;
  supportsDraft: boolean;
  supportsFeatured?: boolean;
  supportsPinned?: boolean;
  supportsSort?: boolean;
  mediaBucket?: string;      // storage bucket used for uploads in this module
  seoScope?: string;         // key under site_settings for module-wide SEO
}

export const CMS_MODULES: Partial<Record<AdminModuleId, CmsModuleConfig>> = {
  news: {
    id: "news",
    table: "news",
    slugColumn: "slug",
    searchColumns: ["title_ar", "title_en", "excerpt_ar"],
    supportsDraft: true,
    supportsFeatured: true,
    supportsPinned: true,
    mediaBucket: "media",
    seoScope: "news",
  },
  achievements: {
    id: "achievements",
    table: "achievements",
    slugColumn: "slug",
    searchColumns: ["title_ar", "title_en"],
    supportsDraft: true,
    supportsFeatured: true,
    supportsSort: true,
    mediaBucket: "media",
    seoScope: "achievements",
  },
  activities: {
    id: "activities",
    table: "activities",
    slugColumn: "slug",
    searchColumns: ["title_ar", "title_en"],
    supportsDraft: true,
    supportsSort: true,
    mediaBucket: "media",
    seoScope: "activities",
  },
  honor: {
    id: "honor",
    table: "honor_boards",
    searchColumns: ["title_ar"],
    supportsDraft: true,
    supportsSort: true,
    mediaBucket: "media",
  },
  gallery: {
    id: "gallery",
    table: "gallery_albums",
    slugColumn: "slug",
    searchColumns: ["title_ar", "title_en"],
    supportsDraft: true,
    supportsFeatured: true,
    supportsSort: true,
    mediaBucket: "media",
  },
  media: {
    id: "media",
    table: "media",
    searchColumns: ["title_ar", "alt_ar"],
    supportsDraft: false,
    mediaBucket: "media",
  },
  contact: {
    id: "contact",
    table: "contact_info",
    supportsDraft: true,
  },
  settings: {
    id: "settings",
    table: "site_settings",
    supportsDraft: false,
  },
  users: {
    id: "users",
    table: "profiles",
    searchColumns: ["full_name"],
    supportsDraft: false,
  },
  homepage: {
    id: "homepage",
    table: "homepage_sections",
    supportsDraft: true,
    supportsSort: true,
    mediaBucket: "media",
  },
  about: {
    id: "about",
    table: "school_info",
    supportsDraft: true,
  },
  academic: {
    id: "academic",
    table: "academic_calendar_events",
    searchColumns: ["title_ar"],
    supportsDraft: true,
  },
  seo: {
    id: "seo",
    table: "site_settings",
    supportsDraft: false,
  },
};

export function getCmsModule(id: AdminModuleId): CmsModuleConfig | undefined {
  return CMS_MODULES[id];
}
