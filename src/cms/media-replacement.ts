import { CmsError, toCmsError } from "./errors";
import type { MediaRef, UUID } from "./types";

export interface ReplacementTarget {
  entityTable: string;
  entityId: UUID;
  fieldName: string;
  oldMediaId: UUID;
}
export interface MediaReplacementAdapter {
  validate(file: File): void | Promise<void>;
  uploadAndCreate(file: File): Promise<MediaRef>;
  link(target: ReplacementTarget, newMediaId: UUID): Promise<unknown>;
  readLinkedMediaId(target: ReplacementTarget): Promise<UUID | null>;
  archive(mediaId: UUID): Promise<unknown>;
  cleanupNewOrphan?(media: MediaRef): Promise<void>;
}

/**
 * Copy-on-write replacement. Old storage is never overwritten or removed.
 * Archiving the old metadata is the final step, after a read-back verification.
 */
export async function replaceMediaSafely(
  adapter: MediaReplacementAdapter,
  target: ReplacementTarget,
  file: File,
): Promise<MediaRef> {
  await adapter.validate(file);
  let created: MediaRef | undefined;
  try {
    created = await adapter.uploadAndCreate(file);
    if (!created?.id) throw new CmsError("storage", "لم يُنشأ سجل وسائط صالح");
    await adapter.link(target, created.id);
    const linked = await adapter.readLinkedMediaId(target);
    if (linked !== created.id) throw new CmsError("stale", "تعذّر التحقق من رابط الوسائط الجديد");
    await adapter.archive(target.oldMediaId);
    return created;
  } catch (error) {
    // Cleanup is limited to the newly-created orphan; never touch the old link/object.
    if (created && (await adapter.readLinkedMediaId(target).catch(() => null)) !== created.id) {
      await adapter.cleanupNewOrphan?.(created).catch(() => undefined);
    }
    throw toCmsError(error);
  }
}
