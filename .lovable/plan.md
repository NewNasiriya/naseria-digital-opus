# Phase 10 — Premium Administration Dashboard

Build the complete `/admin` experience as a UI/interface architecture pass. No authentication, no permissions, no CRUD writes — those land in later phases and will slot into this shell without further UI work.

The public website is not touched.

## Architecture

```text
src/routes/
  admin.tsx              → shared admin shell (sidebar + topbar + main)
  admin.index.tsx        → dashboard home
  admin.$module.tsx      → dynamic module landing page (uses registry)

src/components/admin/
  AdminShell.tsx         → layout composition
  AdminSidebar.tsx       → primary nav, mirrors public site structure
  AdminTopbar.tsx        → global search, notifications, user avatar
  AdminSectionHeader.tsx → page title + description + primary action slot
  StatTile.tsx           → dashboard stat block
  ModuleCard.tsx         → dashboard module tile
  QuickActionButton.tsx  → dashboard quick action
  ActivityFeed.tsx       → recent activity list
  EmptyState.tsx         → reusable placeholder (list views)
  ModuleLandingSkeleton.tsx → shared list-view scaffold for module pages

src/lib/
  admin-modules.ts       → single registry of all admin modules (icon, title,
                           description, path, quick action, hint copy)
```

The registry powers the sidebar, the dashboard module grid, and the dynamic
`admin.$module.tsx` route — one source of truth so future phases only add
real content per module without re-touching navigation.

## Dashboard home (/admin)

- Personalised welcome band ("مرحبًا بعودتك" + Egypt date, no name yet — placeholder for future auth).
- 4 stat tiles: Published Pages, News This Month, Media Files, Drafts Waiting.
- Quick actions row (6): Create News, Upload Timetable, Replace Honor Board, Upload Achievement Photos, Open Media Library, Publish Drafts.
- Modules grid (14 cards): icon, title, description, count placeholder, last-updated placeholder, draft count placeholder, "فتح" CTA.
- Two-column lower band: Recent Activity (empty state now) + Drafts Waiting (empty state now).

## Module landing pages (/admin/$module)

All 14 modules share one scaffold via `admin.$module.tsx`:
- Section header with title, description, primary action.
- Toolbar row: search field, filter chip placeholder, sort placeholder.
- Empty state card explaining what will live here + primary CTA.
- Preserves the exact tone and rhythm of the public site.

Modules registered: homepage, about, academic, news, achievements, honor,
activities, gallery, media, contact, users, settings, seo, status.

## Design language

- Reuses existing tokens (`bg-surface-muted`, `border-border`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `bg-sidebar` variants already defined in styles.css).
- Reuses shadcn `Button`, `Input` primitives.
- RTL logical properties throughout.
- Sidebar collapses to a bottom sheet on mobile via a `Sheet` primitive (already installed via shadcn) — falls back gracefully; if `Sheet` is not yet in the project we use a lightweight drawer using existing components.

## Head metadata

- Every admin route gets its own `head()` with title `<module> · لوحة الإدارة` and a `noindex, nofollow` meta so the CMS is never crawled.

## Out of scope (deferred)

- Authentication + role gating (Phase 11).
- Real CRUD editors (each module gets its own follow-up phase).
- Data reads from Supabase for counts (added when auth-gated server fns land; placeholders show "—" today).
- Notification center popover contents (icon + empty popover only).

## Verification

- Typecheck via tsgo.
- Playwright smoke on `/admin`, `/admin/news`, `/admin/media` at 375 / 1024 / 1440 to confirm no overflow, sidebar behaviour, and RTL alignment.
