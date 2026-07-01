/**
 * CMS error taxonomy.
 *
 * All repository / service calls throw one of these so UI can render the
 * right state (validation banner, permission dialog, retry button, etc.)
 * without inspecting Supabase-specific error shapes.
 */
import type { PostgrestError } from "@supabase/supabase-js";

export type CmsErrorKind =
  | "validation"
  | "not_found"
  | "permission"
  | "conflict"
  | "network"
  | "storage"
  | "unknown";

export class CmsError extends Error {
  readonly kind: CmsErrorKind;
  readonly cause?: unknown;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    kind: CmsErrorKind,
    message: string,
    options: { cause?: unknown; fieldErrors?: Record<string, string[]> } = {},
  ) {
    super(message);
    this.name = "CmsError";
    this.kind = kind;
    this.cause = options.cause;
    this.fieldErrors = options.fieldErrors;
  }
}

/** Map a Postgrest error to a CmsError. */
export function fromPostgrest(error: PostgrestError | null | undefined, fallback = "حدث خطأ غير متوقع"): CmsError {
  if (!error) return new CmsError("unknown", fallback);
  const code = error.code ?? "";
  if (code === "PGRST116") return new CmsError("not_found", "العنصر غير موجود", { cause: error });
  if (code.startsWith("42501") || /permission|rls/i.test(error.message)) {
    return new CmsError("permission", "لا تملك صلاحية لتنفيذ هذه العملية", { cause: error });
  }
  if (code === "23505") return new CmsError("conflict", "قيمة مكررة، حاول تغيير المعرّف أو الرابط", { cause: error });
  if (code === "23514" || code.startsWith("22")) return new CmsError("validation", error.message, { cause: error });
  return new CmsError("unknown", error.message || fallback, { cause: error });
}

/** Wrap unknown thrown values into a CmsError. */
export function toCmsError(err: unknown): CmsError {
  if (err instanceof CmsError) return err;
  if (err instanceof Error) return new CmsError("unknown", err.message, { cause: err });
  return new CmsError("unknown", "حدث خطأ غير متوقع", { cause: err });
}

/** Arabic message helper for UI toasts. */
export function messageFor(err: CmsError): string {
  switch (err.kind) {
    case "validation":
      return "بيانات غير صحيحة، راجع الحقول المميزة.";
    case "not_found":
      return "العنصر غير موجود أو تم حذفه.";
    case "permission":
      return "لا تملك صلاحية لتنفيذ هذه العملية.";
    case "conflict":
      return "يوجد تعارض مع بيانات موجودة بالفعل.";
    case "network":
      return "تعذّر الاتصال بالخادم، تحقق من الشبكة وحاول مجددًا.";
    case "storage":
      return "تعذّر معالجة الملف، حاول مرة أخرى.";
    default:
      return err.message || "حدث خطأ غير متوقع.";
  }
}
