
# New Al-Nasiriyah Primary School — Implementation Strategy

**Project:** مدرسة الناصرية الابتدائية الجديدة / New Al-Nasiriyah Primary School
**Deliverable:** Arabic-first (RTL) public website + private administrative CMS
**Stack (planned):** React, TypeScript, Vite, Tailwind, Supabase (DB + Storage + Auth), GitHub, Cloudflare Pages + CDN

> Note: This document is strategy only. No code, no components, no UI is produced in this phase.

---

## 1. Product Vision

Deliver a calm, elegant, trustworthy digital home for the school that reflects the dignity of Egyptian public education while feeling as polished as a private international institution. The site is Arabic-first, mobile-first, fast on low-end devices and weak networks, and fully controllable by non-technical administrators through a visual CMS. No feature exists that a school secretary cannot operate confidently within a day of training.

**Design ethos:** premium, quiet, editorial. Not corporate, not childish, not "government-portal generic." Typography-led, generous whitespace, restrained color, respectful of Arabic script proportions.

---

## 2. Project Goals

1. Give parents a single reliable source of truth (timetables, calendar, news, rules, contact).
2. Elevate the school's public image and institutional credibility.
3. Empower administrators to publish updates in minutes without developer involvement.
4. Guarantee performance on 3G/entry-level Android devices common in the community.
5. Enforce security so only authorized staff can modify content.
6. Establish a scalable foundation for future modules (multi-school, parent portal, results, notifications).

**Non-goals (v1):** parent/student accounts, online payments, e-learning, chat, grade lookup, mobile app.

---

## 3. User Types

| Type | Access | Primary Need |
|---|---|---|
| Parents | Public | Timetables, calendar, news, contact, rules |
| Prospective parents | Public | Reputation, achievements, welcome message, location |
| Students | Public | Timetables, activities, honor board |
| Teachers | Public (v1) | Timetables, calendar, announcements |
| Community / press | Public | News, achievements, gallery |
| Administrator (Principal / Vice-Principal) | CMS — full | Publish + manage everything, manage users |
| Editor (Secretary / delegated staff) | CMS — limited | Draft + publish content, no user/settings management |
| Super-admin (technical owner) | CMS — full + system | Emergency access, backups, settings |

Only administrative roles authenticate. Public users never log in.

---

## 4. User Journeys

**Parent checking tomorrow's schedule (mobile, evening):** lands on homepage → taps "الجدول الدراسي" from primary nav or hero shortcut → picks grade → sees today/tomorrow highlighted → done in <15 seconds.

**Parent verifying an exam date:** homepage → "جدول الامتحانات" → grade → subject/date list, printable.

**Prospective parent researching the school:** homepage hero + stats → welcome message → achievements + honor board → gallery → contact + location + working hours.

**Journalist / community member:** news list → article → share.

**Administrator publishing news (desktop, morning):** login → dashboard → News → New → title + body + cover image + gallery → Save Draft → preview → Publish → item live within seconds via CDN.

**Administrator updating timetable at term start:** login → Academic Timetables → select grade → upload image or fill structured table → publish → parents see it immediately.

**Editor uploading gallery photos from a school event:** Media Gallery → new album → drag 20 photos → auto-optimized → publish.

---

## 5. Information Architecture

Top-level public IA (Arabic labels shown, English in parentheses for this doc only):

- الرئيسية (Home)
- عن المدرسة (About): welcome message, statistics, honor board, achievements
- الأخبار (News)
- الأنشطة (Activities)
- الجداول (Schedules): academic timetables, exam timetables, academic calendar
- التعليمات واللوائح (Guidelines): student instructions, parent instructions, rules & behaviour
- معرض الوسائط (Media Gallery)
- اتصل بنا (Contact): contact info, working hours, location

Cross-cutting: search (v2), print-friendly views for schedules, share links for news/achievements.

---

## 6. Website Sitemap

```text
/                              Home (hero, welcome excerpt, stats, latest news, quick links)
/about                         Welcome message + school overview
/about/statistics              Stats detail (optional; can live on /about)
/about/honor-board             Honor board
/about/achievements            Achievements list
/about/achievements/:slug      Single achievement
/news                          News list (paginated)
/news/:slug                    Single news article
/activities                    Activities list
/activities/:slug              Single activity
/schedules/academic            Academic timetables (by grade)
/schedules/exams               Exam timetables (by grade)
/schedules/calendar            Academic calendar
/guidelines/students           Student instructions
/guidelines/parents            Parent instructions
/guidelines/rules              Rules & behaviour
/gallery                       Album grid
/gallery/:slug                 Single album (lightbox)
/contact                       Contact + hours + map/location
/not-found                     404
```

---

## 7. CMS Sitemap

```text
/admin/login
/admin                                 Dashboard (recent activity, quick actions, health)
/admin/homepage                        Hero images, quick links, section toggles
/admin/welcome                         Welcome message (rich text + author photo)
/admin/statistics                      Stat cards (label, number, icon)
/admin/news                            List → new/edit; draft/publish; cover + gallery
/admin/achievements                    List → new/edit
/admin/honor-board                     Students by term/grade (name, photo, rank, note)
/admin/timetables/academic             Per grade: image upload OR structured grid
/admin/timetables/exams                Per grade
/admin/activities                      List → new/edit
/admin/calendar                        Events (date, title, type, description)
/admin/instructions/students
/admin/instructions/parents
/admin/rules
/admin/gallery                         Albums → photos (bulk upload, reorder)
/admin/contact                         Phones, emails, address
/admin/working-hours                   Weekly hours + exceptions
/admin/location                        Coordinates, map embed, directions
/admin/settings                        Site identity, logo, favicon, social, SEO defaults
/admin/users                           (Admin only) invite/remove staff, roles
/admin/audit-log                       (Admin only) who changed what, when
```

Every content screen exposes: **Save Draft**, **Preview**, **Publish**, **Unpublish**, **History (v2)**.

---

## 8. Content Architecture

Core entities (conceptual — table design happens in build phase):

- **site_settings** — singleton: names (AR/EN), logo, favicon, social handles, default SEO.
- **homepage** — singleton: hero slides, section order, feature toggles.
- **welcome_message** — singleton: rich text (AR), signer name/title, portrait.
- **statistics** — ordered list: label, value, icon, visible.
- **news** — id, slug, title, excerpt, body (rich text), cover_image, gallery[], status (draft/published), published_at, author.
- **achievements** — same shape as news + category (academic/sports/cultural).
- **honor_board_entries** — student_name, grade, term, year, rank, note, photo.
- **timetables_academic** — grade, term, year, mode (image|structured), image_url or grid JSON.
- **timetables_exams** — grade, term, year, mode, image_url or rows JSON.
- **activities** — id, slug, title, body, cover, gallery[], date, status.
- **calendar_events** — date_start, date_end, title, type (holiday/exam/event/meeting), description.
- **instructions_students / instructions_parents / rules** — singletons: rich text (AR), last_updated_by, last_updated_at.
- **gallery_albums** — id, slug, title, cover, date, status.
- **gallery_photos** — album_id, storage_path, caption, order.
- **contact_info** — singleton: phones[], emails[], address (AR/EN).
- **working_hours** — weekly rows + exception dates.
- **location** — lat, lng, embed url, directions.
- **users** — Supabase auth; role in `user_roles` (admin | editor | super_admin) — never on the profile row.
- **audit_log** — user_id, entity, entity_id, action, diff, timestamp.

**Rich text:** minimal Arabic-safe editor (headings, bold, lists, links, images, quotes). No custom HTML. Sanitized on write and render.

**Draft/Publish model:** every publishable entity carries `status` and `published_at`. Public reads filter to `published`. Preview uses an authenticated draft view.

---

## 9. Functional Modules

1. Authentication & role management (admin, editor, super-admin) via Supabase Auth + separate `user_roles` table + `has_role()` security-definer function.
2. Content editor (rich text + media picker, Arabic-first, RTL by default).
3. Media pipeline: upload → auto-resize → WebP/AVIF → CDN URL.
4. Draft/Publish workflow with preview.
5. Ordering / drag-and-drop for lists (news order, hero slides, gallery photos, stats).
6. Bulk media upload for gallery.
7. Structured timetable editor (grid) + image fallback (both supported per row).
8. Calendar management with recurring/exception days.
9. Homepage composition (toggle sections, reorder, choose featured news).
10. Site settings & SEO defaults.
11. Audit log (append-only).
12. Public search (v2).
13. Notifications banner / announcements strip (v2).
14. Backup/export (v2 — Supabase-managed initially).

---

## 10. Recommended Development Phases

**Phase 0 — Foundations (design + infra)**
Design system tokens (Arabic type scale, colors, spacing, radius, motion), RTL Tailwind config, Cloudflare Pages + GitHub CI, Supabase project (dev + prod), env/secret strategy, Auth setup, roles table, storage buckets, RLS baseline.

**Phase 1 — Public shell + read-only content**
Routing, RTL layout, header/footer, homepage skeleton with seeded content, About/Welcome, Contact, static rules/instructions. Ships a usable site fast.

**Phase 2 — CMS core**
Admin login, dashboard, users & roles, settings, welcome, statistics, contact, working hours, location, rules, instructions. Draft/Publish primitives. Media pipeline.

**Phase 3 — Editorial content**
News, Achievements, Activities, Honor Board (list + detail + admin CRUD).

**Phase 4 — Schedules & Calendar**
Academic timetables, exam timetables (image + structured), academic calendar.

**Phase 5 — Media Gallery**
Albums, bulk upload, lightbox, reorder.

**Phase 6 — Homepage composition + polish**
Hero manager, section toggles, featured selection, SEO metadata per page.

**Phase 7 — Hardening**
Audit log, accessibility audit, performance budget verification, backup rehearsal, security review, admin training + handover docs.

**Phase 8 (post-launch) — v2**
Search, announcements banner, notifications, multilingual (English mirror), parent-facing portal foundations.

---

## 11. Risks and Technical Considerations

- **Arabic typography quality:** default web fonts render Arabic poorly. Must select a licensed, well-hinted Arabic typeface (e.g., IBM Plex Sans Arabic, Cairo, Rubik, Tajawal) and pair with matching Latin.
- **RTL bugs:** icons, carousels, form fields, tables often break under `dir="rtl"`. Requires Tailwind logical properties and per-component RTL QA.
- **Non-technical editors:** UI must be forgiving — no raw HTML, no markdown, no jargon, all labels Arabic.
- **Weak connectivity:** aggressive image optimization and caching are mandatory.
- **Government context:** content sensitivity — audit log + role separation are not optional.
- **Timetable variability:** schools change formats each term; supporting both image upload and structured grid avoids being locked into one.
- **Data loss:** publish/unpublish must never hard-delete; use soft delete + audit.
- **Vendor lock-in:** Supabase is fine but keep schema portable; avoid exotic Postgres extensions.
- **Scale of media:** gallery can grow fast — storage quotas and lifecycle rules matter.
- **Handover:** must include Arabic admin manual + short video walkthroughs.

---

## 12. Security Strategy

- Supabase Auth (email + password; optional Google for staff later).
- Roles in a dedicated `user_roles` table (never on profile). `has_role(user, role)` security-definer function drives all RLS policies.
- RLS enabled on every table. Public tables: `SELECT` for `anon` scoped to `status = 'published'` only. Write policies restricted to `admin` / `editor` roles.
- Storage buckets: public read for published media paths only; writes restricted to authenticated staff.
- No service-role key in the browser. Any privileged operation goes through a server function.
- Rate limiting on login; leaked-password protection enabled.
- CSP, HSTS, X-Content-Type-Options, Referrer-Policy configured at Cloudflare.
- Sanitize all rich-text on write and on render.
- Audit log for every mutating admin action.
- Session hygiene: short refresh window for admins, sign-out clears cache.
- Backups: daily Supabase snapshots + weekly export retained off-platform.
- Principle of least privilege: editors cannot manage users, settings, or roles.

---

## 13. Image Management Strategy

- Single upload endpoint per module → Supabase Storage.
- On upload: strip EXIF, generate responsive variants (e.g. 400 / 800 / 1600 wide), convert to WebP (AVIF later), keep original as fallback.
- Enforce max dimensions and file size at the client before upload.
- Serve through Cloudflare CDN with long cache TTL + immutable hashed filenames.
- Every image requires Arabic `alt` text in the CMS (accessibility + SEO).
- Hero images: curated slot with explicit aspect ratio guidance shown in the uploader.
- Gallery: bulk upload with progress, drag-to-reorder, per-photo caption.
- Lazy-load below the fold; `loading="eager"` + `fetchpriority="high"` only for LCP hero.
- Blur-up or dominant-color placeholder for perceived performance.

---

## 14. CMS Editing Philosophy

- **Arabic-first UI.** Every label, button, tooltip, error, empty state in Arabic.
- **No code, no markdown, no HTML.** Rich text editor with a tight, curated toolbar.
- **Two buttons matter: Save Draft and Publish.** Everything else is secondary.
- **Live preview** before publish, matching the actual public layout.
- **Forgiving inputs.** Validation with plain-language Arabic messages, inline, non-blocking where possible.
- **Undo-friendly.** Soft delete, unpublish, and (v2) revision history.
- **Guided uploaders.** Show required aspect ratio, max size, and a live preview.
- **Consistent screens.** Every module follows the same list → editor → preview → publish pattern so learning one teaches all.
- **No dead ends.** Every empty state includes a clear "Add first item" action.

---

## 15. Performance Strategy

- Static-first: public pages pre-rendered where possible, hydrated selectively.
- Cloudflare CDN in front of everything; cache-control tuned per asset class.
- Image optimization pipeline (see §13).
- Route-level code splitting; ship <150 KB gz JS on first load for public pages.
- Preload Arabic font subsets (Arabic + digits + basic Latin) with `font-display: swap`.
- Avoid heavy client libraries (no jQuery, no moment, no full-icon-set imports).
- LCP target < 2.5s on 3G Fast, CLS < 0.1, INP < 200ms.
- Cache admin queries with TanStack Query; invalidate on publish.
- Database indexes on `status`, `published_at`, `slug`, foreign keys used in public reads.

---

## 16. SEO Strategy

- Arabic primary metadata; English mirror only where the school uses the English name.
- Unique `<title>` and meta description per route.
- Open Graph + Twitter Card per publishable entity (news, achievements, activities, albums) using the entity's cover image.
- `lang="ar"` and `dir="rtl"` on `<html>`.
- Semantic HTML with a single H1 per page.
- `sitemap.xml` generated from published entities; `robots.txt` allowing all except `/admin`.
- Canonical URLs; clean, slugged paths in Arabic-transliterated or English-safe form.
- Structured data (JSON-LD): `EducationalOrganization` on homepage/about, `NewsArticle` on news, `Event` on calendar entries.
- Fast performance (see §15) — core web vitals are a ranking factor.
- Local SEO: full address, phone, hours, map, `Place` schema.

---

## 17. Accessibility Strategy

- WCAG 2.1 AA target.
- Full keyboard operability; visible focus rings tuned for RTL.
- Color contrast ≥ 4.5:1 for body, 3:1 for large text; verified in both themes if a dark mode ships.
- ARIA landmarks (`banner`, `nav`, `main`, `contentinfo`) and labelled regions.
- All images require Arabic `alt`; decorative images marked `alt=""`.
- Forms: label association, error text linked via `aria-describedby`, no color-only signals.
- Respect `prefers-reduced-motion`.
- Screen reader tested in Arabic (NVDA + VoiceOver).
- Print stylesheet for timetables, calendar, rules.
- CMS itself must be accessible — staff may include users with visual needs.

---

## 18. Future Expansion Possibilities

- English mirror of the public site.
- Parent portal (child-specific results, attendance, absence requests).
- Push/email notifications for news and calendar events.
- Multi-school tenancy (governorate-wide rollout).
- Teacher directory + staff profiles.
- Online admission / enrollment forms.
- E-learning resource library.
- WhatsApp broadcast integration for announcements.
- Native mobile wrapper (later, only if justified).
- Analytics dashboard for admins (most-viewed pages, downloads).

---

## 19. Suggested Folder Structure (conceptual)

```text
src/
  routes/                 # file-based routes (public + /admin subtree)
    __root.tsx
    index.tsx
    about/…
    news/…
    schedules/…
    guidelines/…
    gallery/…
    contact.tsx
    admin/…               # protected subtree
  components/
    ui/                   # primitives (button, input, dialog…)
    layout/               # header, footer, admin shell
    public/               # hero, stat card, news card, gallery grid…
    admin/                # editors, uploaders, list tables
  features/               # module-scoped logic (news, gallery, timetables…)
    <module>/
      queries.ts
      mutations.ts
      schema.ts
      components/
  lib/                    # utils, sanitizer, image helpers, rtl helpers
  integrations/
    supabase/             # client, admin client (server), types, auth middleware
  styles/                 # tokens, tailwind entry
  content/                # static seed content, legal copy
  hooks/
  server/                 # server functions (privileged ops)
public/
  fonts/                  # Arabic + Latin subsets
  favicon, og-defaults
supabase/
  migrations/             # SQL migrations, RLS policies, seed
docs/
  admin-manual-ar.md
  handover.md
```

Naming: kebab-case files, PascalCase components, Arabic content lives in DB (not hardcoded).

---

## 20. Final Technical Recommendations

1. **Lock the design system first.** Arabic type scale, spacing, color, motion — before any screen is built.
2. **Adopt Tailwind logical properties** (`ps-*`, `pe-*`, `ms-*`, `me-*`) from day one to make RTL painless.
3. **Choose a premium Arabic typeface** with a proper license (IBM Plex Sans Arabic or Tajawal recommended); pair with a matching Latin.
4. **Use Supabase RLS as the security boundary**, not application code. Every table gets policies before it gets a screen.
5. **Roles in a dedicated table** with a `has_role()` security-definer function. Never store roles on profiles.
6. **Draft/Publish is a first-class primitive**, not an afterthought — bake it into the base entity pattern.
7. **Ship a media pipeline before shipping any module that uploads media** to avoid re-processing later.
8. **Static + CDN by default.** Only hydrate what needs interactivity.
9. **Server functions for privileged writes**; browser only ever uses the publishable key.
10. **Environment separation.** Dev and prod Supabase projects; no shared data. Migrations tracked in Git.
11. **Seed realistic Arabic content early** so design decisions are validated against real script, not lorem ipsum.
12. **Accessibility and performance budgets are gates**, not aspirations — enforced in CI where feasible.
13. **Deliver an Arabic admin manual + short screencasts** with the project. Adoption depends on it.
14. **Plan a 2-week post-launch support window** with the school to fix real-world issues surfaced by actual editors.
15. **Keep v1 scope disciplined.** Every "nice to have" pushed to §18 is a win for launch quality.

---

**Next step after approval:** move to build mode and begin Phase 0 (design system + infra + auth/roles scaffolding).
