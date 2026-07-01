/**
 * Content service layer.
 *
 * Wraps a repository with the shared publishing lifecycle: draft, publish,
 * unpublish, archive, restore, duplicate. Modules extend this by composing
 * their entity-specific validation and side effects (media references,
 * audit log, notifications) around the same lifecycle verbs.
 */
import type { Repository } from "./repository";
import type { ContentStatus, EntityMeta, UUID } from "./types";

export interface ContentServiceOptions {
  onAfterChange?: (entityId: UUID, action: string) => void | Promise<void>;
}

export function createContentService<T extends EntityMeta>(
  repo: Repository<T>,
  opts: ContentServiceOptions = {},
) {
  async function transition(id: UUID, next: ContentStatus, extra: Partial<T> = {}) {
    const now = new Date().toISOString();
    const patch: Partial<T> = {
      ...extra,
      status: next,
      updated_at: now,
    } as Partial<T>;
    if (next === "published") {
      (patch as Record<string, unknown>).published_at = now;
    }
    const updated = await repo.update(id, patch);
    await opts.onAfterChange?.(id, `status:${next}`);
    return updated;
  }

  return {
    repo,
    saveDraft: (input: Partial<T> & { id?: UUID }) =>
      input.id
        ? repo.update(input.id, { ...input, status: "draft" } as Partial<T>)
        : repo.create({ ...input, status: "draft" } as Partial<T>),
    publish: (id: UUID) => transition(id, "published"),
    unpublish: (id: UUID) => transition(id, "draft"),
    archive: (id: UUID) => transition(id, "archived"),
    restore: (id: UUID) => transition(id, "draft"),
    async duplicate(id: UUID) {
      const source = await repo.getById(id);
      if (!source) throw new Error("Entity not found");
      const {
        id: _id,
        created_at: _c,
        updated_at: _u,
        published_at: _p,
        slug,
        ...rest
      } = source as EntityMeta & Record<string, unknown>;
      const copy = {
        ...rest,
        status: "draft" as ContentStatus,
        slug: slug ? `${slug}-copy` : undefined,
      } as Partial<T>;
      const created = await repo.create(copy);
      await opts.onAfterChange?.(created.id, "duplicate");
      return created;
    },
  };
}

export type ContentService<T extends EntityMeta> = ReturnType<typeof createContentService<T>>;
