import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "muted" | "primary";
type Spacing = "default" | "sm" | "none";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: Tone;
  spacing?: Spacing;
  as?: "section" | "div" | "article";
}

const toneClass: Record<Tone, string> = {
  default: "bg-background text-foreground",
  muted: "bg-surface-muted text-foreground",
  primary: "bg-primary text-primary-foreground",
};

const spacingClass: Record<Spacing, string> = {
  default: "section-y",
  sm: "section-y-sm",
  none: "",
};

/**
 * Section — vertical rhythm wrapper.
 * Pairs with <Container> to compose page bands.
 */
export function Section({
  tone = "default",
  spacing = "default",
  as: Tag = "section",
  className,
  ...props
}: SectionProps) {
  return (
    <Tag
      className={cn(toneClass[tone], spacingClass[spacing], className)}
      {...props}
    />
  );
}
