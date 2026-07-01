import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Size = "narrow" | "default" | "wide";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: Size;
}

const sizeClass: Record<Size, string> = {
  narrow: "container-narrow",
  default: "container-page",
  wide: "container-wide",
};

/**
 * Container — page-level horizontal wrapper.
 * Uses logical padding so it mirrors correctly in RTL.
 */
export function Container({
  size = "default",
  className,
  ...props
}: ContainerProps) {
  return <div className={cn(sizeClass[size], className)} {...props} />;
}
