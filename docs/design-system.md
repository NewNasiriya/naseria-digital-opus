# Design System — New Al-Nasiriyah Primary School

Arabic-first (RTL), premium, calm, governmental. This document is the contract
every future screen (public site, CMS, auth, admin) inherits from.

## 1. Foundations
- `lang="ar"`, `dir="rtl"` on `<html>` (see `src/routes/__root.tsx`).
- Always use logical Tailwind utilities: `ms-*`, `me-*`, `ps-*`, `pe-*`,
  `start-*`, `end-*`, `text-start`, `text-end`.
- Font: **Alexandria** (300–800) loaded via `<link>` in the root head, exposed
  as `--font-sans`, `--font-display`, `--font-arabic`.
- Body leading: `1.7`. Never tighten letter-spacing on Arabic text.

## 2. Typography scale
Fluid, clamp-based headings (`h1`–`h6`) declared in `src/styles.css`.
Prefer semantic tags (`<h1>`, `<p>`, `<small>`) over ad-hoc `text-*` sizing.

## 3. Color system (semantic only)
| Role | Token | Usage |
| --- | --- | --- |
| Page | `bg-background` / `text-foreground` | App shell |
| Surface | `bg-surface` / `bg-surface-muted` | Cards, panels |
| Primary | `bg-primary text-primary-foreground` | Deep Royal Blue — CTAs |
| Secondary | `bg-secondary` | Professional Blue |
| Accent | `bg-accent` | Soft Sky Blue — highlights only |
| Feedback | `success`, `warning`, `destructive`, `info` | Status |
| Borders | `border-border` / `border-border-strong` | Hairlines |
| Focus | `--ring` + `shadow-focus` | 3px accessible ring |

No saturated colors. No decorative gradients. Never hardcode hex/oklch.

## 4. Spacing — 8px grid
Use multiples of `2` (8px) for rhythm. Section bands: `section-y` / `section-y-sm`.

## 5. Radius
Base `--radius: 12px`. Utilities: `rounded-xs|sm|md|lg|xl|2xl|3xl|full`.
Cards `rounded-lg`, dialogs `rounded-xl`, pills `rounded-full`.

## 6. Elevation
Editorial soft shadows: `elevation-sm|md|lg|xl`.

## 7. Z-index
`--z-base, -raised, -dropdown, -sticky, -header, -overlay, -modal, -popover, -toast, -tooltip`.

## 8. Breakpoints
Tailwind defaults, mobile-first. Containers: `container-narrow (960)`,
`container-page (1280)`, `container-wide (1440)`.

## 9. Motion
`--duration-fast|base|slow`, `--ease-out`, `--ease-in-out`. Presets:
`motion-fade-in`, `motion-rise`. Reduced-motion respected globally.

## 10. Components
- Low-level: shadcn primitives under `src/components/ui/*`.
- Foundations: `src/components/layout/*` (Container, Section).
- Patterns (later phases): `src/components/patterns/*` (NewsCard, StatCard,
  TimelineItem, GalleryCard, …). All consume semantic tokens only.

## 11. Accessibility
WCAG 2.1 AA contrast, keyboard operable, focus-visible via `--shadow-focus`,
icon-only controls require `aria-label`, single `<main>` per route.

## 12. Naming
- Files: `PascalCase.tsx` components, `kebab-case.ts` utils.
- Style knobs: `variant`, `size`, `tone` via `cva`.
- Tokens: extend `:root`, `.dark`, `@theme inline` together — never in isolation.

## 13. Performance
Alexandria uses `display=swap` + `preconnect`. Images responsive + lazy by
default (except LCP). Data via TanStack Query loaders.

## 14. Scalability
Extend the design system; never fork per feature.
