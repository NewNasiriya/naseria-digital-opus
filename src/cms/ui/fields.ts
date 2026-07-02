/**
 * Field definitions for the reusable Entity Editor.
 *
 * Modules describe their editable schema declaratively (label, kind,
 * validation). The editor renders the right control, wires state, and
 * feeds values back to the CMS service. No module implements its own
 * form controls or media pickers.
 */
import type { ReactNode } from "react";
import type { MediaBucket, MediaKind } from "@/cms/media-library";

export type FieldValue = string | number | boolean | null | string[] | undefined;

export type FieldDef =
  | {
      kind: "text";
      name: string;
      label: string;
      required?: boolean;
      placeholder?: string;
      maxLength?: number;
      dir?: "rtl" | "ltr" | "auto";
      helpText?: string;
    }
  | {
      kind: "textarea";
      name: string;
      label: string;
      rows?: number;
      required?: boolean;
      placeholder?: string;
      maxLength?: number;
      dir?: "rtl" | "ltr" | "auto";
      helpText?: string;
    }
  | {
      kind: "slug";
      name: string;
      label: string;
      sourceField?: string;
      helpText?: string;
    }
  | {
      kind: "boolean";
      name: string;
      label: string;
      helpText?: string;
    }
  | {
      kind: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
      required?: boolean;
      allowClear?: boolean;
      helpText?: string;
    }
  | {
      kind: "number";
      name: string;
      label: string;
      min?: number;
      max?: number;
      step?: number;
      helpText?: string;
    }
  | {
      kind: "date";
      name: string;
      label: string;
      helpText?: string;
    }
  | {
      kind: "media";
      name: string;
      label: string;
      bucket?: MediaBucket;
      mediaKind?: MediaKind;
      folder?: string;
      helpText?: string;
    }
  | {
      kind: "reference";
      name: string;
      label: string;
      table: string;
      valueField?: string;   // default "id"
      labelField: string;    // e.g. "name_ar"
      orderBy?: string;      // e.g. "display_order"
      required?: boolean;
      allowClear?: boolean;
      helpText?: string;
    }
  | {
      kind: "custom";
      name: string;
      label?: string;
      render: (ctx: {
        values: Record<string, unknown>;
        onChange: (name: string, value: unknown) => void;
        disabled?: boolean;
      }) => ReactNode;
    }
  | {
      kind: "readonly";
      name: string;
      label: string;
      render?: (value: unknown, record: Record<string, unknown>) => ReactNode;
    };

export interface FieldSection {
  id: string;
  title?: string;
  description?: string;
  columns?: 1 | 2;
  fields: FieldDef[];
}

export function fieldKey(field: FieldDef): string {
  return field.name;
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "") // arabic diacritics
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
