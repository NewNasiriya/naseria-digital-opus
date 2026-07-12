import { cn } from "@/lib/utils";

// Served from /public so it always loads on the published domain,
// independent of the CDN asset prefix (which some networks/blockers
// treat as third-party and drop). Optimized 256px transparent PNG.
export const SCHOOL_LOGO_URL = "/school-logo-256.png";
export const SCHOOL_LOGO_ALT = "شعار مدرسة الناصرية الابتدائية الجديدة";

interface SchoolLogoProps {
  className?: string;
  /** width/height in px used for the <img> intrinsic size (prevents CLS) */
  size?: number;
  /** decorative usage (adjacent visible text label) */
  decorative?: boolean;
  eager?: boolean;
}

/**
 * Official school identity mark. Do not restyle, recolor, or crop.
 * Always used as a square raster with preserved proportions.
 */
export function SchoolLogo({
  className,
  size = 44,
  decorative = false,
  eager = false,
}: SchoolLogoProps) {
  return (
    <img
      src={SCHOOL_LOGO_URL}
      alt={decorative ? "" : SCHOOL_LOGO_ALT}
      aria-hidden={decorative || undefined}
      width={size}
      height={size}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      draggable={false}
      className={cn("object-contain select-none", className)}
    />
  );
}
