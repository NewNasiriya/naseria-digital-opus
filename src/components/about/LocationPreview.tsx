import { MapPin, Navigation, ExternalLink } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";

export interface LocationData {
  address?: string | null;
  directions?: string | null;
  maps_embed_url?: string | null;
  maps_link?: string | null;
}

export function LocationPreview({ data = {} }: { data?: LocationData }) {
  const address = data.address?.trim();
  const directions = data.directions?.trim();
  const embed = data.maps_embed_url?.trim();
  const link = data.maps_link?.trim();

  return (
    <Section id="location" tone="default" spacing="default">
      <Container size="wide">
        <div className="grid items-stretch gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface-muted elevation-sm">
            {embed ? (
              <iframe
                src={embed}
                title="موقع المدرسة على الخريطة"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
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
                  ستظهر خريطة المدرسة هنا فور إضافة رابط التضمين من لوحة الإدارة.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
              موقع المدرسة
            </p>
            <h2 className="mt-3 rule-accent inline-block">كيف تصل إلينا</h2>
            <p className="mt-6 text-base leading-loose text-muted-foreground">
              {address ||
                "سيتم إضافة عنوان المدرسة بالتفصيل من لوحة إدارة المحتوى."}
            </p>
            {directions && (
              <p className="mt-3 text-sm leading-loose text-muted-foreground">
                {directions}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" disabled={!link}>
                <a
                  href={link || "#"}
                  target={link ? "_blank" : undefined}
                  rel={link ? "noreferrer" : undefined}
                  aria-disabled={!link}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  فتح في خرائط جوجل
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" disabled={!link}>
                <a
                  href={link || "#"}
                  target={link ? "_blank" : undefined}
                  rel={link ? "noreferrer" : undefined}
                  aria-disabled={!link}
                >
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  الاتجاهات
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
