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
  countRemainingReferences(mediaId: UUID): Promise<number>;
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
    let linked: UUID | null;
    try {
      linked = await adapter.readLinkedMediaId(target);
    } catch (cause) {
      throw new CmsError(
        "reconciliation_required",
        "تعذّر التحقق من الرابط الجديد؛ تُرك سجلا الوسائط دون تغيير للمراجعة",
        { cause },
      );
    }
    if (linked !== created.id) throw new CmsError("stale", "تعذّر التحقق من رابط الوسائط الجديد");
    let remainingReferences: number;
    try {
      remainingReferences = await adapter.countRemainingReferences(target.oldMediaId);
    } catch (cause) {
      throw new CmsError(
        "reconciliation_required",
        "تعذّر التحقق من مراجع الوسائط القديمة؛ تُرك السجل نشطًا للمراجعة",
        { cause },
      );
    }
    if (remainingReferences === 0) await adapter.archive(target.oldMediaId);
    return created;
  } catch (error) {
    // Cleanup requires a successful positive read proving the entity does not use the new record.
    if (created && !(error instanceof CmsError && error.kind === "reconciliation_required")) {
      let confirmedLink: UUID | null;
      try {
        confirmedLink = await adapter.readLinkedMediaId(target);
      } catch (cause) {
        throw new CmsError(
          "reconciliation_required",
          "تعذّر التحقق بعد فشل الاستبدال؛ تُرك سجلا الوسائط دون تغيير للمراجعة",
          { cause },
        );
      }
      if (confirmedLink !== created.id) await adapter.cleanupNewOrphan?.(created);
    }
    throw toCmsError(error);
  }
}
