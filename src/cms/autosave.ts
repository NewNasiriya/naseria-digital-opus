/**
 * Autosave + unsaved-changes protection.
 *
 * `useAutosave` debounces a save function whenever the tracked value
 * changes, and returns a status you can render in the UI.
 * `useUnsavedChangesGuard` warns the user before they close the tab
 * while dirty.
 */
import { useEffect, useRef, useState } from "react";

import { toCmsError, type CmsError } from "./errors";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface AutosaveOptions<T> {
  value: T;
  onSave: (value: T) => Promise<void>;
  delay?: number;               // debounce ms
  enabled?: boolean;
  isEqual?: (a: T, b: T) => boolean;
}

export function useAutosave<T>({
  value,
  onSave,
  delay = 1500,
  enabled = true,
  isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b),
}: AutosaveOptions<T>) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [error, setError] = useState<CmsError | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const lastSavedRef = useRef<T>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (isEqual(lastSavedRef.current, value)) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await onSave(value);
        lastSavedRef.current = value;
        setSavedAt(new Date());
        setStatus("saved");
        setError(null);
      } catch (err) {
        setError(toCmsError(err));
        setStatus("error");
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, enabled, delay, isEqual, onSave]);

  const isDirty = !isEqual(lastSavedRef.current, value);
  return { status, error, savedAt, isDirty };
}

export function useUnsavedChangesGuard(isDirty: boolean, message = "لديك تغييرات غير محفوظة") {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, message]);
}
