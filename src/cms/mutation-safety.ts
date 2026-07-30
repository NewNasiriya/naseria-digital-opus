import { CmsError, fromPostgrest, toCmsError } from "./errors";

export type MutationOperation = "create" | "update" | "delete";

export interface MutationResponse<T> {
  data?: T | T[] | null;
  count?: number | null;
  error?: unknown;
}

/**
 * The one exit gate for CMS writes. A PostgREST request is not successful merely
 * because it did not throw: it must prove that at least one row changed.
 */
export function requireMutationResult<T>(
  operation: MutationOperation,
  response: MutationResponse<T>,
): T | T[] | number {
  if (response.error) throw fromPostgrest(response.error as never);
  const rows = Array.isArray(response.data)
    ? response.data.length
    : response.data == null
      ? (response.count ?? 0)
      : 1;
  if (rows === 0) {
    throw new CmsError(
      operation === "create" ? "validation" : operation === "update" ? "stale" : "not_found",
      operation === "update"
        ? "لم يتغير أي سجل؛ قد تكون النسخة قديمة أو السجل مفقودًا"
        : "لم تتأثر أي صفوف بالعملية",
    );
  }
  return response.data ?? rows;
}

export async function runSafeMutation<T>(
  operation: MutationOperation,
  request: () => Promise<MutationResponse<T>>,
): Promise<T | T[] | number> {
  try {
    return requireMutationResult(operation, await request());
  } catch (error) {
    throw toCmsError(error);
  }
}

/** Only invoke success UI after the safety gate resolves. */
export async function notifyAfterMutation<T>(mutation: Promise<T>, onSuccess: (value: T) => void) {
  const value = await mutation;
  onSuccess(value);
  return value;
}
