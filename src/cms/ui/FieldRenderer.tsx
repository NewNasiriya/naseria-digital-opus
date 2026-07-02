import { useEffect, useState } from "react";
import { Image as ImageIcon, Pencil, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { mediaLibrary, type MediaBucket, type MediaItem } from "@/cms/media-library";

import type { FieldDef } from "./fields";
import { slugify } from "./fields";
import { MediaPickerDialog } from "./MediaPickerDialog";

export interface FieldRendererProps {
  field: FieldDef;
  value: unknown;
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  disabled?: boolean;
  error?: string;
}

export function FieldRenderer({
  field,
  value,
  values,
  onChange,
  disabled,
  error,
}: FieldRendererProps) {
  const describedBy =
    (field.kind !== "readonly" && field.kind !== "boolean" && "helpText" in field && field.helpText) || error
      ? `${field.name}-help`
      : undefined;

  const helpBlock =
    field.kind !== "readonly" && field.kind !== "boolean" && "helpText" in field && field.helpText ? (
      <p id={describedBy} className="mt-1 text-xs text-muted-foreground">
        {field.helpText}
      </p>
    ) : null;

  const errorBlock = error ? (
    <p id={describedBy} className="mt-1 text-xs text-destructive">
      {error}
    </p>
  ) : null;

  switch (field.kind) {
    case "text": {
      return (
        <div>
          <Label htmlFor={field.name} className="mb-1.5 block text-sm">
            {field.label}
            {field.required && <span className="ms-1 text-destructive">*</span>}
          </Label>
          <Input
            id={field.name}
            value={(value as string | undefined) ?? ""}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            dir={field.dir ?? "auto"}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy}
          />
          {errorBlock ?? helpBlock}
        </div>
      );
    }
    case "textarea": {
      return (
        <div>
          <Label htmlFor={field.name} className="mb-1.5 block text-sm">
            {field.label}
            {field.required && <span className="ms-1 text-destructive">*</span>}
          </Label>
          <Textarea
            id={field.name}
            value={(value as string | undefined) ?? ""}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            rows={field.rows ?? 5}
            dir={field.dir ?? "auto"}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className="resize-y"
          />
          {errorBlock ?? helpBlock}
        </div>
      );
    }
    case "slug": {
      const source = field.sourceField ? (values[field.sourceField] as string | undefined) : undefined;
      return (
        <div>
          <Label htmlFor={field.name} className="mb-1.5 block text-sm">
            {field.label}
          </Label>
          <div className="flex gap-2">
            <Input
              id={field.name}
              value={(value as string | undefined) ?? ""}
              onChange={(e) => onChange(field.name, slugify(e.target.value))}
              dir="ltr"
              disabled={disabled}
              aria-describedby={describedBy}
              className="font-mono text-xs"
            />
            {source ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onChange(field.name, slugify(source))}
              >
                توليد
              </Button>
            ) : null}
          </div>
          {errorBlock ?? helpBlock}
        </div>
      );
    }
    case "boolean": {
      return (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="min-w-0">
            <Label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
            </Label>
            {field.helpText && (
              <p className="mt-0.5 text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
          <Switch
            id={field.name}
            checked={!!value}
            onCheckedChange={(v) => onChange(field.name, v)}
            disabled={disabled}
          />
        </div>
      );
    }
    case "select": {
      const current = (value as string | undefined) ?? "";
      return (
        <div>
          <Label htmlFor={field.name} className="mb-1.5 block text-sm">
            {field.label}
            {field.required && <span className="ms-1 text-destructive">*</span>}
          </Label>
          <Select
            value={current || undefined}
            onValueChange={(v) => onChange(field.name, v)}
            disabled={disabled}
          >
            <SelectTrigger id={field.name} aria-describedby={describedBy}>
              <SelectValue placeholder="اختر…" />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.allowClear && current && (
            <button
              type="button"
              onClick={() => onChange(field.name, null)}
              className="mt-1 text-xs text-muted-foreground underline"
            >
              إزالة الاختيار
            </button>
          )}
          {errorBlock ?? helpBlock}
        </div>
      );
    }
    case "number": {
      return (
        <div>
          <Label htmlFor={field.name} className="mb-1.5 block text-sm">
            {field.label}
          </Label>
          <Input
            id={field.name}
            type="number"
            value={(value as number | undefined) ?? ""}
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            onChange={(e) =>
              onChange(field.name, e.target.value === "" ? null : Number(e.target.value))
            }
            disabled={disabled}
            aria-describedby={describedBy}
          />
          {errorBlock ?? helpBlock}
        </div>
      );
    }
    case "date": {
      const iso = (value as string | undefined) ?? "";
      const dateOnly = iso ? iso.slice(0, 10) : "";
      return (
        <div>
          <Label htmlFor={field.name} className="mb-1.5 block text-sm">
            {field.label}
          </Label>
          <Input
            id={field.name}
            type="date"
            value={dateOnly}
            onChange={(e) => onChange(field.name, e.target.value || null)}
            disabled={disabled}
            aria-describedby={describedBy}
          />
          {errorBlock ?? helpBlock}
        </div>
      );
    }
    case "media": {
      return (
        <MediaField
          field={field}
          value={(value as string | null | undefined) ?? null}
          onChange={(v) => onChange(field.name, v)}
          disabled={disabled}
          describedBy={describedBy}
          errorBlock={errorBlock}
          helpBlock={helpBlock}
        />
      );
    }
    case "readonly": {
      return (
        <div>
          <p className="text-xs text-muted-foreground">{field.label}</p>
          <div className="mt-1 text-sm text-foreground">
            {field.render ? field.render(value, values) : String(value ?? "—")}
          </div>
        </div>
      );
    }
  }
}

function MediaField({
  field,
  value,
  onChange,
  disabled,
  describedBy,
  errorBlock,
  helpBlock,
}: {
  field: Extract<FieldDef, { kind: "media" }>;
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
  describedBy?: string;
  errorBlock: React.ReactNode;
  helpBlock: React.ReactNode;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [preview, setPreview] = useState<{ url: string | null; name: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setPreview(null);
      return;
    }
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await (supabase as any)
          .from("media")
          .select("bucket, storage_path, file_name, mime_type")
          .eq("id", value)
          .maybeSingle();
        if (cancelled || !data) return;
        if ((data.mime_type ?? "").startsWith("image/")) {
          const url = await mediaLibrary.signedUrl({
            bucket: data.bucket as MediaBucket,
            path: data.storage_path,
            expiresInSeconds: 60 * 30,
          });
          setPreview({ url, name: data.file_name });
        } else {
          setPreview({ url: null, name: data.file_name });
        }
      } catch {
        setPreview(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  const handleSelect = (item: MediaItem) => onChange(item.id);

  return (
    <div>
      <Label className="mb-1.5 block text-sm">{field.label}</Label>
      {value && preview ? (
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-start gap-3">
            <div className="w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted">
              <AspectRatio ratio={4 / 3}>
                {preview.url ? (
                  <img
                    src={preview.url}
                    alt={preview.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-muted-foreground">
                    <ImageIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                )}
              </AspectRatio>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" title={preview.name}>
                {preview.name}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setPickerOpen(true)}
                  disabled={disabled}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  استبدال
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => onChange(null)}
                  disabled={disabled}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  إزالة
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setPickerOpen(true)}
          disabled={disabled}
          aria-describedby={describedBy}
          className="w-full justify-start gap-2 border-dashed"
        >
          <ImageIcon className="h-4 w-4" />
          اختر من مكتبة الوسائط…
        </Button>
      )}
      {errorBlock ?? helpBlock}

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelect}
        bucket={field.bucket}
        kind={field.mediaKind}
        defaultFolder={field.folder}
      />
    </div>
  );
}
