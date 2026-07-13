/**
 * Enterprise SEO metadata builder.
 *
 * Produces a consistent, spec-compliant set of <meta> and <link> tags for
 * every public route. All URLs are absolute against the production domain
 * so social crawlers (Facebook, X/Twitter, WhatsApp, LinkedIn, Google)
 * resolve them correctly regardless of where the page is served from.
 */

export const SITE_URL = "https://naseria-digital-opus.lovable.app";
export const SITE_NAME_AR = "مدرسة الناصرية الابتدائية الجديدة";
export const SITE_NAME_EN = "New Al-Nasiriyah Primary School";
export const SITE_LOCALE = "ar_EG";
export const SITE_THEME_COLOR = "#0b2a5b";
export const SITE_DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
export const SITE_OG_IMAGE_WIDTH = 1200;
export const SITE_OG_IMAGE_HEIGHT = 630;
export const SITE_OG_IMAGE_TYPE = "image/jpeg";
export const SITE_DEFAULT_DESCRIPTION =
  "الموقع الرسمي لمدرسة الناصرية الابتدائية الجديدة — الأخبار، الجداول الدراسية، الأنشطة، لوحة الشرف، وإرشادات الطلاب وأولياء الأمور.";

type OgType = "website" | "article" | "profile" | "book";

export interface SeoOptions {
  /** Route path starting with "/" (e.g. "/about", "/news/my-slug"). */
  path: string;
  /** Full HTML <title>. Falls back to the site name. */
  title?: string;
  /** Meta description. Falls back to the site default. */
  description?: string;
  /** Absolute or root-relative image URL. Falls back to /og-image.jpg. */
  image?: string | null;
  imageWidth?: number;
  imageHeight?: number;
  imageType?: string;
  type?: OgType;
  /** ISO date — emits article:published_time for OG articles. */
  publishedTime?: string;
  /** ISO date — emits article:modified_time for OG articles. */
  modifiedTime?: string;
  /** Set true on pages that should not be indexed (auth, admin). */
  noindex?: boolean;
}

interface MetaEntry {
  name?: string;
  property?: string;
  content?: string;
  title?: string;
  charSet?: string;
  httpEquiv?: string;
}

interface LinkEntry {
  rel: string;
  href: string;
  sizes?: string;
  type?: string;
  color?: string;
  crossOrigin?: "" | "anonymous" | "use-credentials";
  fetchpriority?: "high" | "low" | "auto";
}

export interface SeoHead {
  meta: MetaEntry[];
  links: LinkEntry[];
}

function absolutize(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${SITE_URL}${url}`;
  return `${SITE_URL}/${url}`;
}

function normalizePath(path: string): string {
  if (!path.startsWith("/")) return `/${path}`;
  return path;
}

/**
 * Build the shared meta + link set for a route.
 * Root-level tags (charset, viewport, theme-color, site_name, favicons,
 * Organization JSON-LD) live in __root.tsx and are NOT duplicated here.
 */
export function buildSeo(options: SeoOptions): SeoHead {
  const path = normalizePath(options.path);
  const canonical = `${SITE_URL}${path === "/" ? "" : path}` || SITE_URL;
  const title = options.title?.trim() || SITE_NAME_AR;
  const description = (options.description ?? SITE_DEFAULT_DESCRIPTION).trim();
  const image = absolutize(options.image?.trim() || SITE_DEFAULT_OG_IMAGE);
  const isDefaultImage = image === SITE_DEFAULT_OG_IMAGE;
  const type: OgType = options.type ?? "website";

  const meta: MetaEntry[] = [
    { title },
    { name: "description", content: description },
    {
      name: "robots",
      content: options.noindex ? "noindex, nofollow" : "index, follow",
    },

    // Open Graph
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: canonical },
    { property: "og:image", content: image },
    {
      property: "og:image:width",
      content: String(options.imageWidth ?? (isDefaultImage ? SITE_OG_IMAGE_WIDTH : 1200)),
    },
    {
      property: "og:image:height",
      content: String(options.imageHeight ?? (isDefaultImage ? SITE_OG_IMAGE_HEIGHT : 630)),
    },
    {
      property: "og:image:type",
      content: options.imageType ?? (isDefaultImage ? SITE_OG_IMAGE_TYPE : "image/jpeg"),
    },
    { property: "og:image:alt", content: title },

    // Twitter / X
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:url", content: canonical },
  ];

  if (type === "article") {
    if (options.publishedTime) {
      meta.push({ property: "article:published_time", content: options.publishedTime });
    }
    if (options.modifiedTime) {
      meta.push({ property: "article:modified_time", content: options.modifiedTime });
    }
  }

  const links: LinkEntry[] = [{ rel: "canonical", href: canonical }];

  return { meta, links };
}
