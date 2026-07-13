/**
 * Shared validation primitives for CMS forms.
 * All modules build their entity schemas by composing these pieces.
 */
import { z } from "zod";

export const uuid = z.string().uuid("معرّف غير صالح");

export const slug = z
  .string()
  .trim()
  .min(1, "الرابط مطلوب")
  .max(120, "الرابط طويل جدًا")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "استخدم أحرفًا لاتينية صغيرة وأرقامًا وشرطات فقط");

export const optionalSlug = slug.optional().or(z.literal("").transform(() => undefined));

export const arabicTitle = z.string().trim().min(1, "العنوان مطلوب").max(160, "العنوان طويل جدًا");
export const optionalEnglishTitle = z
  .string()
  .trim()
  .max(160, "العنوان الإنجليزي طويل جدًا")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const shortText = z.string().trim().max(300, "النص طويل جدًا");
export const longText = z.string().trim().max(20_000, "النص طويل جدًا");

export const url = z
  .string()
  .trim()
  .url("رابط غير صالح")
  .max(2048, "الرابط طويل جدًا");
export const optionalUrl = url.optional().or(z.literal("").transform(() => undefined));

export const contentStatus = z.enum(["draft", "published", "archived"]);

/** SEO block schema — reusable across every module. */
export const seoSchema = z.object({
  title: z.string().trim().max(60, "العنوان يجب ألا يتجاوز 60 حرفًا").nullish(),
  description: z.string().trim().max(160, "الوصف يجب ألا يتجاوز 160 حرفًا").nullish(),
  keywords: z.array(z.string().trim().min(1).max(40)).max(20).nullish(),
  canonical_url: optionalUrl.nullish(),
  og_title: z.string().trim().max(80).nullish(),
  og_description: z.string().trim().max(200).nullish(),
  og_image_id: uuid.nullish(),
  twitter_card: z.enum(["summary", "summary_large_image"]).nullish(),
  robots: z.string().trim().max(120).nullish(),
});

/** Image asset descriptor accepted by media inputs. */
export const mediaRefSchema = z.object({
  id: uuid,
  bucket: z.string().min(1),
  path: z.string().min(1),
  alt: z.string().max(240).nullish(),
  width: z.number().int().positive().nullish(),
  height: z.number().int().positive().nullish(),
});

/** File-side validation for uploads (checked before hitting storage). */
export interface FileValidationOptions {
  maxBytes?: number;
  /**
   * Allow-list of MIME types. Entries may be exact ("image/png") or
   * wildcards ("image/*"). When omitted, only the built-in denylist of
   * script-capable formats is enforced.
   */
  accept?: string[];
}

/**
 * Hard denylist of MIME types + file extensions that can execute in a
 * browser when served from the public storage domain (stored XSS surface).
 * Enforced on every upload regardless of caller-supplied `accept`, so a
 * missing UI hint cannot open the hole.
 */
const DANGEROUS_MIME = new Set([
  "image/svg+xml",
  "image/svg",
  "text/html",
  "application/xhtml+xml",
  "text/xml",
  "application/xml",
  "text/javascript",
  "application/javascript",
  "application/x-javascript",
  "application/ecmascript",
  "text/ecmascript",
  "application/x-httpd-php",
]);
const DANGEROUS_EXT = /\.(svgz?|html?|xhtml|xml|js|mjs|cjs|php|phtml|jsp|aspx?|htaccess)$/i;

function matchesAccept(mime: string, accept: string[]): boolean {
  return accept.some((entry) => {
    const e = entry.trim().toLowerCase();
    if (!e) return false;
    if (e === "*/*") return true;
    if (e.endsWith("/*")) return mime.toLowerCase().startsWith(e.slice(0, -1));
    return mime.toLowerCase() === e;
  });
}

export function validateFile(file: File, opts: FileValidationOptions = {}): string | null {
  const { maxBytes = 10 * 1024 * 1024, accept } = opts;
  if (file.size > maxBytes) {
    return `حجم الملف يتجاوز الحد المسموح (${Math.round(maxBytes / (1024 * 1024))} ميغابايت).`;
  }
  const mime = (file.type || "").toLowerCase();
  if (DANGEROUS_MIME.has(mime) || DANGEROUS_EXT.test(file.name)) {
    return "نوع الملف غير مسموح لأسباب أمنية (SVG أو HTML أو ملفات نصية برمجية).";
  }
  if (accept && accept.length > 0 && !matchesAccept(mime, accept)) {
    return "نوع الملف غير مدعوم.";
  }
  return null;
}

/** Convert a Zod error into the CmsError `fieldErrors` shape. */
export function zodToFieldErrors(err: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.errors) {
    const key = issue.path.join(".") || "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
