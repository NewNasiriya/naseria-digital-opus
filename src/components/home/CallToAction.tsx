import { Link } from "@tanstack/react-router";
import { ArrowLeft, Phone } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";

export function CallToAction() {
  return (
    <Section tone="primary" spacing="default">
      <Container size="narrow" className="text-center">
        <h2 className="text-primary-foreground">هل تودّون التواصل مع المدرسة؟</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-loose text-primary-foreground/85 sm:text-lg">
          فريق الإدارة سعيد بالإجابة عن استفساراتكم واستقبال ملاحظاتكم في أي
          وقت خلال ساعات العمل الرسمية.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-white text-primary hover:bg-white/90"
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
            className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
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
