import { CmsError } from "./errors";

/** Phase A invariant: normal CMS workflows archive; they never hard-delete. */
export const NORMAL_CMS_PERMANENT_DELETE_AVAILABLE = false as const;

export interface PermanentDeleteProof {
  elevatedPermission: boolean;
  referencesChecked: boolean;
  hasDependencies: boolean;
  typedTitle: string;
  entityTitle: string;
  irreversibleConfirmation: boolean;
  publicDependencyProof: boolean;
}

export function assertPermanentDeleteProof(proof: PermanentDeleteProof): void {
  if (!proof.elevatedPermission) throw new CmsError("permission", "يلزم تصريح حذف دائم مرتفع");
  if (!proof.referencesChecked || proof.hasDependencies || !proof.publicDependencyProof) {
    throw new CmsError("conflict", "لم يثبت خلو المحتوى من المراجع العامة والوسائط");
  }
  if (proof.typedTitle !== proof.entityTitle || !proof.irreversibleConfirmation) {
    throw new CmsError("validation", "تأكيد الحذف الدائم غير مكتمل");
  }
}

export function preserveFallback<T>(backend: T | null | undefined, fallback: T): T {
  return backend ?? fallback;
}
