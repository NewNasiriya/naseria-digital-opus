import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

interface LocationMapProps {
  embedUrl?: string | null;
  title?: string;
}

/**
 * Lazy-loaded Google Maps embed. The iframe is only injected once the
 * container enters the viewport to preserve Lighthouse performance.
 */
export function LocationMap({ embedUrl, title = "موقع المدرسة على الخريطة" }: LocationMapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!embedUrl || visible) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [embedUrl, visible]);

  return (
    <div
      ref={ref}
      className="relative h-full min-h-[320px] w-full overflow-hidden rounded-3xl border border-border bg-surface-muted elevation-sm"
    >
      {embedUrl && visible ? (
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="h-full min-h-[320px] w-full border-0"
        />
      ) : (
        <div className="relative flex h-full min-h-[320px] flex-col items-center justify-center gap-4 p-10 text-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,theme(colors.primary/8),transparent_60%)]"
          />
          <span
            aria-hidden="true"
            className="relative grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary"
          >
            <MapPin className="h-8 w-8" />
          </span>
          <p className="relative text-sm text-muted-foreground">
            {embedUrl
              ? "جاري تحميل الخريطة…"
              : "ستظهر الخريطة هنا فور إضافة رابط التضمين من لوحة الإدارة."}
          </p>
        </div>
      )}
    </div>
  );
}
