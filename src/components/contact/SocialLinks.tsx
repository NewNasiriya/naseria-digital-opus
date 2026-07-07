import { Facebook, Instagram, Youtube, Twitter, Linkedin, Globe, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SocialLink } from "@/lib/contact";

const ICONS: Record<string, LucideIcon> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  twitter: Twitter,
  x: Twitter,
  linkedin: Linkedin,
};

const PLATFORM_LABELS_AR: Record<string, string> = {
  facebook: "فيسبوك",
  instagram: "إنستغرام",
  youtube: "يوتيوب",
  twitter: "تويتر",
  x: "منصة X",
  linkedin: "لينكدإن",
};

function iconFor(link: SocialLink): LucideIcon {
  const key = (link.icon_key || link.platform || "").toLowerCase();
  return ICONS[key] ?? Globe;
}

function labelFor(link: SocialLink): string {
  if (link.label) return link.label;
  const key = link.platform?.toLowerCase() ?? "";
  return PLATFORM_LABELS_AR[key] ?? "حساب رسمي";
}

interface Props {
  links: SocialLink[];
  className?: string;
  size?: "sm" | "md";
}

export function SocialLinksRow({ links, className, size = "md" }: Props) {
  if (!links || links.length === 0) return null;
  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10";
  const iconSize = size === "sm" ? 16 : 18;
  return (
    <ul className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {links.map((link) => {
        const Icon = iconFor(link);
        const label = labelFor(link);
        return (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} — يفتح في نافذة جديدة`}
              title={label}
              className={cn(
                "inline-grid place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                dim,
              )}
            >
              <Icon size={iconSize} aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
