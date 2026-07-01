## Phase 9.5A — Navigation & Discoverability Audit

**Scope:** wiring only. No visual redesign, no new tokens, no new pages except two required destinations (`/contact`, minimal `/activities` landing) so header/footer links land on real pages instead of dead hashes.

---

### Findings

1. **Header** links to `#about`, `#academic`, `#activities`, `#honor`, `#news`, `#contact` — all hash anchors. Real routes (`/about`, `/academic`, `/honor`, `/news`, `/achievements`) are unreachable from the top nav.
2. **Footer** — same problem in Quick Links and Academic Life columns; contact section is just `id="contact"` on the footer.
3. **Homepage CTAs** all point to hashes: `#news-all`, `#honor-all`, `#activities-all`, `#about-more`, `#news/${slug}`, `#about`, `#academic`, `#contact`, `#stats`.
4. **Homepage has no entry point to `/achievements`** even though the module is fully built.
5. **Detail pages** (`news/$slug`, `achievements/$slug`, `honor/grades/$level`, `academic/grades/$level`) — no breadcrumbs, no prev/next.
6. **Missing destinations:** `/activities` (linked from header + homepage), `/contact` (linked from header + hero + footer), `/auth` (linked but route not created yet — leaving for auth phase).
7. **Empty states** on `news.index`, `achievements.index`, `honor.index` — need audit for graceful CTAs when empty.

---

### Changes

**1. Header (`SiteHeader.tsx`)**
Replace hash `<a>` items with typed `<Link to=...>` items:
- عن المدرسة → `/about`
- الحياة الأكاديمية → `/academic`
- الأنشطة → `/activities`
- لوحة الشرف → `/honor`
- الإنجازات → `/achievements` *(new item, currently missing)*
- الأخبار → `/news`
- تواصل معنا → `/contact`

Add `activeProps` for active state. Convert `/auth` `<a>` to `<Link>`. Apply to both desktop and mobile menus.

**2. Footer (`SiteFooter.tsx`)**
Rewrite Quick Links + Academic Life columns with real routes. Add a fourth column "التصفح" with Achievements, Honor Board, News, Activities. Replace `#contact` id trick with a real `/contact` link. All `<a>` → `<Link>`.

**3. Homepage CTAs**
- `WelcomePreview` "اقرأ المزيد" → `/about`
- `LatestNews` "عرض كل الأخبار" → `/news`; per-item `#news/${slug}` → `/news/$slug`
- `AcademicLifePreview` per-card hrefs → matching `/academic/*` routes
- `HonorBoardPreview` "عرض لوحة الشرف" → `/honor`
- `ActivitiesPreview` "عرض كل الأنشطة" → `/activities`
- `CallToAction` buttons → `/contact` and `/about`
- `Hero` buttons → `/about`, `/academic`; keep `#stats` (in-page scroll — valid)
- **Add a new homepage section link surface**: an "أحدث الإنجازات" preview already exists on About; add a CTA-only card in the existing `CallToAction` (or extend `AchievementsPreview` if present) linking to `/achievements`. If no achievements preview component exists on home, add a single CTA card link — no new visual pattern.

**4. New minimal pages**
- `src/routes/contact.tsx` — reuses existing `Section`/`Container` primitives; renders working hours, address (from footer data), an email/phone block, and back-to-home breadcrumb. No new components.
- `src/routes/activities.tsx` — minimal landing page reusing `Section`/`Container`; states that activities content is being prepared, with CTAs to News and Achievements. Keeps the link target valid until Phase 10 fills it.

**5. Breadcrumbs**
Add a small shared `Breadcrumbs` component under `src/components/layout/Breadcrumbs.tsx` using existing tokens (`text-muted-foreground`, `text-sm`, chevron icon). Insert at the top of every secondary/detail page:
- `/about`, `/academic`, `/academic/*`, `/news`, `/news/$slug`, `/honor`, `/honor/grades/$level`, `/achievements`, `/achievements/$slug`, `/contact`, `/activities`

Root crumb is always "الرئيسية" → `/`. Parent crumbs auto-inferred from path.

**6. Prev/Next navigation on detail pages**
Add a shared `PrevNextNav` component. Wire into:
- `news.$slug` — prev/next by `published_at`
- `achievements.$slug` — prev/next by `occurred_at`
- `honor.grades.$level` — prev/next grade level (3→4→5→6)
- `academic.grades.$level` — prev/next grade level

Uses same design tokens (surface-muted card, chevron icons). Placed above footer of each detail page.

**7. Cross-links**
- Achievement detail page: add a small "المزيد من الإنجازات" block linking back to `/achievements` (below existing story body, above PrevNext).
- News detail page: same pattern → `/news`.
- About page timeline items → link to matching `/achievements/$slug` when the achievement exists.

**8. Empty-state CTAs**
Audit `news.index`, `achievements.index`, `honor.index` for empty-list branches. Where empty, render a small centered card (existing `Card` component) with icon, message, and a CTA back to `/` or `/about`. No new visual pattern — reuse existing card styles.

**9. Verification**
- Build the project.
- Playwright: visit `/`, click each nav item, verify URL + h1 for /about, /academic, /honor, /achievements, /news, /activities, /contact.
- Confirm breadcrumbs render on every secondary page.
- Confirm prev/next works on detail pages.

---

### Technical notes

- All navigation uses `<Link to="..." params={{...}}>` from `@tanstack/react-router` — never `<a href>` for internal routes.
- Prev/next queries piggyback on existing loaders (extend loader to fetch neighbor slugs, or use `ensureQueryData` for a lightweight list query).
- Auth link stays as `<Link to="/auth">` even though `/auth` isn't built yet — flagged as Phase 10 dependency, not blocking.
- No changes to design tokens, typography, spacing, colors, or existing component internals beyond swapping link targets.

---

### Out of scope
- Building full `/activities` module content (Phase 10).
- Building `/auth` route (separate admin phase).
- CMS wiring for activities data.
