# Phase 2 — Content Architecture & CMS Data Foundation

Goal: build the complete, production-ready database schema that powers every future page and admin module. No UI, no components, no seed content.

## 1. Backend Activation

- Enable **Lovable Cloud** (Supabase under the hood) to provision the database, auth, and storage.
- No edge functions are introduced in this phase.

## 2. Cross-Cutting Conventions

Applied to every table:

- `id uuid primary key default gen_random_uuid()`
- `created_at`, `updated_at timestamptz` with auto-update trigger `set_updated_at()`.
- `created_by`, `updated_by uuid references auth.users(id)` where content is admin-managed.
- Publishing model on public content: `status text check (status in ('draft','published','archived'))`, `published_at timestamptz`, `scheduled_at timestamptz`.
- Soft-delete: `deleted_at timestamptz` (nullable) where applicable.
- Ordering: `display_order int default 0`.
- Multilingual-ready: `title_ar / title_en`, `body_ar / body_en`, `slug` (unique). Arabic is primary; English optional.
- SEO fields where the record maps to a public URL: `seo_title`, `seo_description`, `og_image_id` (FK to `media`).
- Search-ready: `search_tsv tsvector` generated column + GIN index on textual tables (news, achievements, activities, gallery, honor_board).
- Analytics-ready: `view_count int default 0` on public content items (updated later via RPC).
- API-integration-ready: `external_ref jsonb` for future third-party sync.

All `public.*` tables receive explicit `GRANT`s:
- `authenticated`: SELECT/INSERT/UPDATE/DELETE (RLS decides).
- `service_role`: ALL.
- `anon`: SELECT only on tables that serve public reads, gated to `status = 'published'` by RLS.

## 3. Roles & Access Control

- Enum `app_role`: `admin`, `editor`, `viewer`.
- Table `user_roles(user_id, role)` — the only place roles live (never on `profiles`).
- Security-definer function `has_role(_user_id uuid, _role app_role)`.
- Helper `is_staff(_user_id)` = admin OR editor.
- Table `profiles(id, full_name, avatar_media_id, phone, locale, created_at, updated_at)` — 1:1 with `auth.users`, populated by trigger on signup.
- RLS pattern:
  - Public read: `status = 'published'` for `anon` + `authenticated`.
  - Staff write: `has_role(auth.uid(),'admin') OR has_role(auth.uid(),'editor')`.
  - Admin-only: role management, settings, users.

## 4. Content Models (Tables)

Grouped by module. Every table follows the conventions above.

### 4.1 Media Library (foundation — created first)
- `media_categories(id, name_ar, name_en, slug, display_order)`
- `media(id, storage_path, file_name, mime_type, width, height, size_bytes, alt_ar, alt_en, caption_ar, caption_en, category_id, tags text[], is_archived, created_by, created_at, updated_at)`
- `media_usages(id, media_id, entity_table, entity_id, field_name, created_at)` — reverse index so the admin can see "where is this image used" before delete.
- Storage buckets: `media` (public), `documents` (public, PDFs for timetables), `private-uploads` (private, future use).

### 4.2 Site Settings (singleton)
- `site_settings(id smallint pk default 1 check (id=1), school_name_ar, school_name_en, logo_media_id, favicon_media_id, default_og_image_id, footer_text_ar, footer_text_en, copyright_text, seo_default_title, seo_default_description, updated_by, updated_at)`
- `working_hours(id, day_of_week smallint, opens_at time, closes_at time, is_closed bool, note_ar, note_en)` — 7 rows managed by admin.

### 4.3 School Information
- `school_info(id smallint pk default 1 check (id=1), welcome_message_ar/en, principal_message_ar/en, principal_name, principal_photo_media_id, mission_ar/en, vision_ar/en, history_ar/en, updated_by, updated_at)`

### 4.4 Homepage
- `homepage_hero(id smallint pk default 1 check (id=1), headline_ar/en, subheadline_ar/en, hero_image_media_id, status, published_at, updated_by, updated_at)`
- `homepage_hero_actions(id, hero_id, label_ar/en, href, variant, display_order)` — CTA buttons.
- `homepage_sections(id, key text unique, is_enabled bool, display_order)` — toggle/reorder sections without code.

### 4.5 Statistics
- `statistics(id, key text unique, label_ar/en, value int, icon_key, display_order, is_visible, updated_by, updated_at)` — students, teachers, classrooms, extendable.

### 4.6 Academic Life
- `academic_years(id, name, starts_on, ends_on, is_current)`
- `grades(id, name_ar/en, level int, display_order)`
- `timetables(id, kind text check (kind in ('academic','exam')), title_ar/en, academic_year_id, grade_id nullable, document_media_id, cover_image_media_id, status, published_at, display_order)`
- `academic_calendar_events(id, title_ar/en, description_ar/en, starts_on, ends_on, category text, color, status)`
- `attendance_info(id smallint pk default 1, content_ar/en, updated_by, updated_at)`
- `behaviour_guidelines(id, title_ar/en, body_ar/en, display_order, status)`

### 4.7 Activities
- `activity_categories(id, key text unique, name_ar/en, icon_key, display_order)` — sports, cultural, art, trips, competitions (rows created by admin, not seeded).
- `activities(id, category_id, title_ar/en, slug, summary_ar/en, body_ar/en, cover_image_media_id, event_date, status, published_at, is_featured, search_tsv)`
- `activity_media(id, activity_id, media_id, display_order, caption_ar/en)`

### 4.8 Honor Board
- `honor_categories(id, name_ar/en, slug, display_order)`
- `honor_entries(id, category_id, student_name, academic_year_id, grade_id, description_ar/en, achievement_date, display_order, status)`
- `honor_entry_media(id, honor_entry_id, media_id, display_order)`

### 4.9 Achievements
- `achievement_categories(id, name_ar/en, slug, display_order)`
- `achievements(id, category_id, title_ar/en, slug, description_ar/en, cover_image_media_id, achieved_on, is_featured, status, published_at, search_tsv)`
- `achievement_media(id, achievement_id, media_id, display_order, caption_ar/en)`

### 4.10 News
- `news_categories(id, name_ar/en, slug, display_order)`
- `news(id, category_id, title_ar/en, slug unique, summary_ar/en, body_ar/en, featured_image_media_id, author_id references auth.users, is_featured, status, published_at, scheduled_at, view_count, search_tsv)`
- `news_media(id, news_id, media_id, display_order, caption_ar/en)`

### 4.11 Gallery
- `gallery_albums(id, title_ar/en, slug, description_ar/en, cover_media_id, category text, display_order, status, published_at)`
- `gallery_items(id, album_id, media_id, caption_ar/en, display_order)`

### 4.12 Instructions
- `instruction_lists(id, audience text check (audience in ('student','parent')), title_ar/en, description_ar/en, display_order, status)`
- `instruction_items(id, list_id, body_ar/en, display_order, icon_key)`

### 4.13 Behaviour Guidelines — covered in Academic Life (4.6).

### 4.14 Contact
- `contact_info(id smallint pk default 1, phone_primary, phone_secondary, email, address_ar/en, google_maps_embed_url, google_maps_lat, google_maps_lng, updated_by, updated_at)`
- `social_links(id, platform text, url, display_order, is_visible)`

### 4.15 Administration Support
- `audit_log(id, actor_id, action, entity_table, entity_id, diff jsonb, created_at)` — admin-only read.
- `content_versions(id, entity_table, entity_id, snapshot jsonb, created_by, created_at)` — versioning readiness (write hooks come later).
- `notifications_outbox(id, channel, payload jsonb, status, scheduled_at, sent_at)` — future notifications.

## 5. Row Level Security

Two policy shapes, applied per table:

- **Public content tables** (news, activities, achievements, gallery, honor, timetables, homepage_hero, statistics, site_settings, contact_info, school_info, calendar, guidelines, instructions, working_hours, social_links):
  - `SELECT` for `anon` + `authenticated` where `status = 'published'` (or always, for settings/contact).
  - `INSERT/UPDATE/DELETE` for `authenticated` where `is_staff(auth.uid())`.
- **Admin-only tables** (user_roles, audit_log, content_versions, notifications_outbox, media_usages):
  - All operations restricted to `has_role(auth.uid(),'admin')`.
- **Media**: read public; write by staff. `profiles`: read own + staff; update own.

## 6. Storage

- Bucket `media` (public): images used across the site.
- Bucket `documents` (public): PDF timetables, calendars.
- Bucket `private-uploads` (private): future.
- Storage policies: read public for public buckets; write restricted to staff via `is_staff(auth.uid())`.

## 7. Triggers & Functions

- `set_updated_at()` — BEFORE UPDATE on every table with `updated_at`.
- `handle_new_user()` — AFTER INSERT on `auth.users` → creates a `profiles` row. First-ever user is auto-granted `admin` role (bootstrap); subsequent users get `viewer` by default, upgraded by an admin.
- `has_role`, `is_staff` — security definer.
- `tsv_update_*` — generated columns keep `search_tsv` current on content tables.

## 8. Deliverables (this phase)

Single SQL migration containing:

1. Enums, helpers, roles.
2. Media library + storage buckets/policies.
3. Site settings, school info, homepage, statistics, working hours.
4. Academic life (years, grades, timetables, calendar, attendance, guidelines).
5. Activities, honor board, achievements, news, gallery, instructions.
6. Contact + social links.
7. Administration (audit, versions, outbox).
8. All GRANTs, RLS enable + policies.
9. Triggers.

No frontend code is changed. No seed data. No components. Admin dashboard, forms, and public pages are Phase 3+.

## 9. Out of Scope (deferred)

- Admin CMS UI, forms, editors, media picker.
- Public site pages.
- Edge functions, notifications delivery, search UI.
- Localization runtime (fields are ready; the switcher comes later).
- Realtime channels.

Approve to proceed with enabling Lovable Cloud and applying the migration.
