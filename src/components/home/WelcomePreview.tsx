import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";

interface WelcomePreviewProps {
  message?: string | null;
}

const DEFAULT_MESSAGE =
  "نرحّب بكم في الموقع الرسمي لمدرسة الناصرية الابتدائية الجديدة، حيث نلتزم بتوفير بيئة تعليمية آمنة ومحفزة تجمع بين جودة التعليم وتنمية القيم، ونحرص على أن يكون كل طالب شريكًا حقيقيًا في مسيرة النجاح.";

export function WelcomePreview({ message }: WelcomePreviewProps) {
  return (
    <Section tone="muted" spacing="default">
      <Container size="narrow" className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary">
          كلمة ترحيب
        </p>
        <h2 className="mt-4 rule-accent inline-block">أهلاً بكم في مدرستنا</h2>
        <p className="mx-auto mt-8 max-w-2xl text-base leading-loose text-muted-foreground sm:text-lg">
          {message?.trim() || DEFAULT_MESSAGE}
        </p>
        <div className="mt-9">
          <Button asChild size="lg">
            <Link to="/about">
              المزيد عن المدرسة
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}
