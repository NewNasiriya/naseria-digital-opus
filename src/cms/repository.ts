/**
 * Repository layer.
 *
 * Every module exposes data through the `Repository<T>` contract so the
 * UI, hooks, and services never depend on Supabase directly. The default
 * `createSupabaseRepository` is a thin adapter over PostgREST that speaks
 * to any public table with the standard `id / created_at / updated_at`
 * shape.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

import { CmsError, fromPostgrest, toCmsError } from "./errors";
import type { EntityMeta, ListQuery, Page, UUID } from "./types";

type PublicTable = keyof Database["public"]["Tables"];

export interface Repository<T extends { id: UUID }> {
  list(query?: ListQuery): Promise<Page<T>>;
  getById(id: UUID): Promise<T | null>;
  getBySlug?(slug: string): Promise<T | null>;
  create(input: Partial<T>): Promise<T>;
  update(id: UUID, patch: Partial<T>): Promise<T>;
  remove(id: UUID): Promise<void>;
}

export interface SupabaseRepositoryOptions {
  slugColumn?: string;                // defaults to "slug" if present
  searchColumns?: string[];           // for `search` ILIKE queries
  defaultOrderBy?: string;            // defaults to "updated_at"
  defaultOrderDir?: "asc" | "desc";   // defaults to "desc"
  select?: string;                    // PostgREST select expression
}

/** Generic Supabase repository. Works for any table with `id`. */
export function createSupabaseRepository<T extends EntityMeta>(
  table: PublicTable,
  opts: SupabaseRepositoryOptions = {},
): Repository<T> {
  const {
    slugColumn = "slug",
    searchColumns = [],
    defaultOrderBy = "updated_at",
    defaultOrderDir = "desc",
    select = "*",
  } = opts;

  return {
    async list(query: ListQuery = {}): Promise<Page<T>> {
      try {
        // Cast to any: PostgREST builder types are per-table and we're intentionally generic here.
        let q = ((supabase as any).from(table) as any)
          .select(select, { count: "exact" });

        if (query.status && query.status !== "all") q = q.eq("status", query.status);
        if (typeof query.featured === "boolean") q = q.eq("featured", query.featured);
        if (typeof query.pinned === "boolean") q = q.eq("pinned", query.pinned);
        for (const [k, v] of Object.entries(query.filters ?? {})) {
          if (v === null) q = q.is(k, null);
          else q = q.eq(k, v as never);
        }
        if (query.search && searchColumns.length > 0) {
          const or = searchColumns.map((c) => `${c}.ilike.%${query.search}%`).join(",");
          q = q.or(or);
        }

        const orderBy = query.orderBy ?? defaultOrderBy;
        const orderDir = query.orderDir ?? defaultOrderDir;
        q = q.order(orderBy, { ascending: orderDir === "asc" });

        const limit = query.limit ?? 25;
        const offset = query.offset ?? 0;
        q = q.range(offset, offset + limit - 1);

        const { data, error, count } = await q;
        if (error) throw fromPostgrest(error);
        return {
          rows: (data ?? []) as T[],
          total: count ?? 0,
          limit,
          offset,
        };
      } catch (err) {
        throw toCmsError(err);
      }
    },

    async getById(id) {
      try {
        const { data, error } = await ((supabase as any).from(table) as any)
          .select(select)
          .eq("id", id)
          .maybeSingle();
        if (error) throw fromPostgrest(error);
        return (data ?? null) as T | null;
      } catch (err) {
        throw toCmsError(err);
      }
    },

    async getBySlug(slugValue) {
      try {
        const { data, error } = await ((supabase as any).from(table) as any)
          .select(select)
          .eq(slugColumn, slugValue)
          .maybeSingle();
        if (error) throw fromPostgrest(error);
        return (data ?? null) as T | null;
      } catch (err) {
        throw toCmsError(err);
      }
    },

    async create(input) {
      try {
        const { data, error } = await ((supabase as any).from(table) as any)
          .insert(input as never)
          .select(select)
          .single();
        if (error) throw fromPostgrest(error);
        return data as T;
      } catch (err) {
        throw toCmsError(err);
      }
    },

    async update(id, patch) {
      try {
        const { data, error } = await ((supabase as any).from(table) as any)
          .update(patch as never)
          .eq("id", id)
          .select(select)
          .single();
        if (error) throw fromPostgrest(error);
        return data as T;
      } catch (err) {
        throw toCmsError(err);
      }
    },

    async remove(id) {
      try {
        const { error } = await ((supabase as any).from(table) as any).delete().eq("id", id);
        if (error) throw fromPostgrest(error);
      } catch (err) {
        throw toCmsError(err);
      }
    },
  };
}

/** In-memory repository used by tests & scaffolds while Supabase is offline. */
export function createInMemoryRepository<T extends EntityMeta>(seed: T[] = []): Repository<T> {
  let rows: T[] = [...seed];
  return {
    async list(query = {}) {
      let filtered = [...rows];
      if (query.status && query.status !== "all") {
        filtered = filtered.filter((r) => r.status === query.status);
      }
      if (query.search) {
        const s = query.search.toLowerCase();
        filtered = filtered.filter((r) => JSON.stringify(r).toLowerCase().includes(s));
      }
      const total = filtered.length;
      const limit = query.limit ?? 25;
      const offset = query.offset ?? 0;
      return { rows: filtered.slice(offset, offset + limit), total, limit, offset };
    },
    async getById(id) {
      return rows.find((r) => r.id === id) ?? null;
    },
    async getBySlug(slugValue) {
      return rows.find((r) => r.slug === slugValue) ?? null;
    },
    async create(input) {
      const now = new Date().toISOString();
      const created = {
        id: (input.id as UUID) ?? crypto.randomUUID(),
        status: "draft",
        created_at: now,
        updated_at: now,
        ...input,
      } as T;
      rows = [created, ...rows];
      return created;
    },
    async update(id, patch) {
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) throw new CmsError("not_found", "العنصر غير موجود");
      const updated = { ...rows[idx], ...patch, updated_at: new Date().toISOString() } as T;
      rows[idx] = updated;
      return updated;
    },
    async remove(id) {
      rows = rows.filter((r) => r.id !== id);
    },
  };
}
