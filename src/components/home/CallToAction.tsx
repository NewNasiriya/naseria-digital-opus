import { Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, MapPin, Navigation, Phone } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { primaryEmail, useContactInfo } from "@/lib/contact";

export function CallToAction() {
  const { data: info } = useContactInfo();
  const email = primaryEmail(info);
  const address = info?.address_ar;
  const mapsLink = info?.google_maps_link;

  return (
    <Section
      tone="primary"
      spacing="default"
      className="home-cta-luxury"
    >
      <Container size="narrow" className="text-center">
        <h2 className="text-primary-foreground">هل تودّون التواصل مع المدرسة؟</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-loose text-primary-foreground/85 sm:text-lg">
          فريق الإدارة سعيد بالإجابة عن استفساراتكم واستقبال ملاحظاتكم في أي
          وقت خلال ساعات العمل الرسمية.
        </p>

        {(address || email || mapsLink) && (
          <ul className="mx-auto mt-8 grid max-w-3xl gap-3 text-sm text-primary-foreground/90 sm:grid-cols-3">
            {address && (
              <li className="home-contact-chip flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{address}</span>
              </li>
            )}
            {email && (
              <li className="home-contact-chip flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3">
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                <a href={`mailto:${email}`} dir="ltr" className="truncate hover:underline">
                  {email}
                </a>
              </li>
            )}
            {mapsLink && (
              <li className="home-contact-chip flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3">
                <Navigation className="h-4 w-4 shrink-0" aria-hidden="true" />
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate hover:underline"
                >
                  الاتجاهات على الخريطة
                </a>
              </li>
            )}
          </ul>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="home-hero-action home-cta-primary bg-white px-6 text-primary hover:bg-white/95"
          >
            <Link to="/contact">
              <Phone className="h-4 w-4" aria-hidden="true" />
              تواصل معنا
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="home-hero-action border-white/40 bg-transparent px-6 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          >
            <Link to="/about">
              تعرّف على المدرسة
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
