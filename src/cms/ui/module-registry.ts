/**
 * UI-side module registry.
 *
 * Bridges the shared Entity List / Editor to each CMS module. Every module
 * registers:
 *   • the repository / service pair (built from the shared CMS engine)
 *   • the list view configuration (columns, permission, preview URL)
 *   • the editor configuration (field sections, publish permission)
 *
 * Wave 1 ships the registry infrastructure only. Individual modules
 * (news, academic, achievements, honor, activities, contact, about,
 * timeline, gallery) will register in later waves through
 * `registerCmsModule` without ever touching the shared runtime.
 */
import { createSupabaseRepository } from "../repository";
import { createContentService, type ContentService } from "../service";
import { getCmsModule } from "../registry";
import type { AdminModuleId } from "@/lib/admin-modules";
import type { EntityMeta } from "../types";
import type { Repository } from "../repository";

import type { EntityListConfig } from "./EntityListView";
import type { EntityEditorConfig } from "./EntityEditor";

export interface CmsUiModule<T extends EntityMeta = EntityMeta> {
  id: AdminModuleId;
  repository: Repository<T>;
  service: ContentService<T>;
  list: EntityListConfig<T>;
  editor: EntityEditorConfig<T>;
}

const REGISTRY = new Map<AdminModuleId, CmsUiModule<EntityMeta>>();

export interface RegisterCmsModuleInput<T extends EntityMeta> {
  id: AdminModuleId;
  list: EntityListConfig<T>;
  editor: EntityEditorConfig<T>;
  /** Optional custom repository. Defaults to a generic Supabase repository. */
  repository?: Repository<T>;
  /** Optional custom service. Defaults to the standard content service. */
  service?: ContentService<T>;
}

/**
 * Register a module's UI. Called at bundle import time (module files import
 * themselves in `src/cms/ui/modules/index.ts`, added in later waves).
 */
export function registerCmsModule<T extends EntityMeta>(
  input: RegisterCmsModuleInput<T>,
): void {
  const cfg = getCmsModule(input.id);
  const repository =
    input.repository ??
    (cfg
      ? createSupabaseRepository<T>(cfg.table, {
          slugColumn: cfg.slugColumn,
          searchColumns: cfg.searchColumns,
          defaultOrderBy: cfg.defaultOrderBy,
        })
      : undefined);
  if (!repository) {
    throw new Error(
      `[cms] Cannot register module "${input.id}" — no repository provided and no CmsModuleConfig registered.`,
    );
  }
  const service = input.service ?? createContentService<T>(repository);
  REGISTRY.set(input.id, {
    id: input.id,
    repository: repository as Repository<EntityMeta>,
    service: service as ContentService<EntityMeta>,
    list: input.list as EntityListConfig<EntityMeta>,
    editor: input.editor as EntityEditorConfig<EntityMeta>,
  });
}

export function getCmsUiModule(id: AdminModuleId): CmsUiModule<EntityMeta> | undefined {
  return REGISTRY.get(id);
}

export function listCmsUiModules(): CmsUiModule<EntityMeta>[] {
  return Array.from(REGISTRY.values());
}
