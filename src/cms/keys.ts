/**
 * Query key factory. Every module derives its query keys from here so
 * cache invalidation stays predictable across the app.
 */
import type { ListQuery } from "./types";

export const cmsKeys = {
  all: ["cms"] as const,
  module: (module: string) => ["cms", module] as const,
  list: (module: string, query?: ListQuery) => ["cms", module, "list", query ?? {}] as const,
  detail: (module: string, id: string) => ["cms", module, "detail", id] as const,
  bySlug: (module: string, slug: string) => ["cms", module, "slug", slug] as const,
  versions: (module: string, id: string) => ["cms", module, "versions", id] as const,
};
