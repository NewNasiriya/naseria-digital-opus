/**
 * TanStack Query bindings for the CMS domain.
 *
 * Every module composes these hooks with its own repository/service to
 * expose typed list/detail/mutation APIs without duplicating cache logic.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { toCmsError, type CmsError } from "./errors";
import { cmsKeys } from "./keys";
import type { Repository } from "./repository";
import type { ContentService } from "./service";
import type { EntityMeta, ListQuery, Page, UUID } from "./types";

export function useCmsList<T extends EntityMeta>(
  module: string,
  repo: Repository<T>,
  query: ListQuery = {},
  options?: Omit<UseQueryOptions<Page<T>, CmsError>, "queryKey" | "queryFn">,
) {
  return useQuery<Page<T>, CmsError>({
    queryKey: cmsKeys.list(module, query),
    queryFn: () => repo.list(query),
    ...options,
  });
}

export function useCmsEntity<T extends EntityMeta>(
  module: string,
  repo: Repository<T>,
  id: UUID | undefined,
  options?: Omit<UseQueryOptions<T | null, CmsError>, "queryKey" | "queryFn" | "enabled">,
) {
  return useQuery<T | null, CmsError>({
    queryKey: cmsKeys.detail(module, id ?? "new"),
    queryFn: () => repo.getById(id as UUID),
    enabled: Boolean(id),
    ...options,
  });
}

interface MutationCallbacks<T> {
  onSuccess?: (data: T) => void;
  onError?: (err: CmsError) => void;
}

export function useCmsMutations<T extends EntityMeta>(
  module: string,
  service: ContentService<T>,
) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: cmsKeys.module(module) });

  function withInvalidate<Args, Result extends { id?: UUID } | void>(
    fn: (args: Args) => Promise<Result>,
    cb?: MutationCallbacks<Result>,
  ): UseMutationOptions<Result, CmsError, Args> {
    return {
      mutationFn: async (args) => {
        try {
          return await fn(args);
        } catch (err) {
          throw toCmsError(err);
        }
      },
      onSuccess: (data) => {
        invalidate();
        cb?.onSuccess?.(data);
      },
      onError: (err) => cb?.onError?.(err),
    };
  }

  const saveDraft = useMutation(
    withInvalidate<Partial<T> & { id?: UUID }, T>((input) => service.saveDraft(input)),
  );
  const publish = useMutation(withInvalidate<UUID, T>((id) => service.publish(id)));
  const unpublish = useMutation(withInvalidate<UUID, T>((id) => service.unpublish(id)));
  const archive = useMutation(withInvalidate<UUID, T>((id) => service.archive(id)));
  const restore = useMutation(withInvalidate<UUID, T>((id) => service.restore(id)));
  const duplicate = useMutation(withInvalidate<UUID, T>((id) => service.duplicate(id)));
  const remove = useMutation(withInvalidate<UUID, void>((id) => service.repo.remove(id)));

  return { saveDraft, publish, unpublish, archive, restore, duplicate, remove };
}
