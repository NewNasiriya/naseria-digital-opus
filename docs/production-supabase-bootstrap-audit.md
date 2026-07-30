# Production Supabase bootstrap audit

## Scope and conclusion

This is a static review of the 30 SQL files in `supabase/migrations`, ordered by
their timestamped filenames. No SQL or Supabase command was executed. The
target is a clean Supabase project using PostgreSQL 17.

**Recommendation: do not execute this migration set unchanged in production.**
The schema is broadly coherent when applied strictly in order, but the set
mixes schema, permissions, and environment-specific content; grants elevated
rights to the first user created; temporarily grants anonymous execution of
role helpers; assumes pre-existing Storage buckets; and contains data changes
bound to UUIDs from the previous database. Produce and test a reviewed,
forward-only bootstrap series before production deployment.

## Ordered inventory and dependencies

All later files depend on the initial foundation unless noted. Files described
as “data” require the named rows/objects to exist and are not independent.

| # | Migration | Purpose and direct dependencies |
|---:|---|---|
| 1 | `20260701182124_09d21461-a20e-4710-8e60-46eb5122c336.sql` | Foundation: extension, enums, 43 core tables, helpers, triggers, indexes, grants, RLS, policies, singleton rows and seed content. Depends on Supabase `auth` and `storage` schemas. |
| 2 | `20260701182136_91959087-d83a-4876-a3b1-f087e2e4fda7.sql` | Revokes default execution on the four foundation functions. |
| 3 | `20260701182157_c3352331-dbe8-4118-8ad5-371ef7180e92.sql` | Storage object policies for `media`, `documents`, and `private-uploads`; depends on `is_staff` and externally created buckets. |
| 4 | `20260701191053_7766d7a6-6b9f-4392-8d00-7a00d4aaae3d.sql` | Adds news pin/reading fields and partial index. |
| 5 | `20260701194150_5761e74a-6e1a-42ee-90c5-a9cc58cb5ce3.sql` | Seeds an academic year, creates `honor_boards` plus grants/RLS/policies/indexes, and seeds grade boards. |
| 6 | `20260701194205_e0ef7a56-21d0-4b52-a8c7-0f0d118d055c.sql` | Updates honor-board image paths by grade. |
| 7 | `20260701195120_26a1ec2e-a6ce-477f-ae5e-24e02407d539.sql` | Updates one honor board by hard-coded UUID. |
| 8 | `20260701201217_a3b51796-944a-4aa1-a549-bcb4b96a544a.sql` | Extends achievement tables, seeds/updates renovation content, deletes and rebuilds its media rows. |
| 9 | `20260701201941_e8d02366-5529-4d17-901d-9364856cbb16.sql` | Grants `anon` and `authenticated` execution of role helpers. |
| 10 | `20260701202638_670dd4f2-f3b0-4eba-8149-878e62719553.sql` | UUID-bound achievement image and ordering updates/inserts. |
| 11 | `20260701203833_5afdb1d7-9ecc-4e4f-aab0-567c01597532.sql` | Upserts kindergarten achievement data, deletes/rebuilds associated media. |
| 12 | `20260701205011_a65746bd-9024-4e6f-b020-463b8a74b092.sql` | Updates and adds kindergarten achievement media. |
| 13 | `20260701223116_f69cdfde-8a3d-4403-b5e1-4d59dd08836e.sql` | Extends `app_role`, adds profile lifecycle fields, replaces `is_staff`. |
| 14 | `20260701223131_5472ee2a-7b10-4ac0-b1fc-0ae42bddf4ce.sql` | Revokes anonymous role-helper execution; grants authenticated/service role. |
| 15 | `20260701225340_25e606f2-e434-42bf-b6fa-bcb557df34ae.sql` | Extends and seeds contact, school, settings and hours data. |
| 16 | `20260701230733_ebe0010d-ca76-4eb5-b887-8bea3bd324e0.sql` | Adds timeline enum/table, grants, RLS, policies, trigger, index and seed events. |
| 17 | `20260701232021_01fdb1b9-e2c1-4653-b9ac-35b5906b9543.sql` | Adds policies/FAQ tables and security objects; seeds policies, FAQ, instructions, attendance and behaviour content. |
| 18 | `20260701233224_01160a1c-432b-432f-8610-998e3056c259.sql` | Publishes five news rows selected by slug. |
| 19 | `20260701235602_498a1316-7e51-44a2-8b84-2ccb39ff5756.sql` | Again grants `anon` role-helper execution. |
| 20 | `20260702002449_fcf3f61c-d43e-479e-b730-ae94173e35f0.sql` | Adds three analytics tables, indexes, grants and permissive insert/read RLS. |
| 21 | `20260702014754_8760cd0a-a52a-4b0e-b8e4-35e000a27b1b.sql` | Adds academic notes/resources tables, triggers, indexes, grants and RLS. |
| 22 | `20260705000809_ea4d9f52-deb3-44d1-85a6-835559ada7e6.sql` | Adds delete-permission helpers and dynamically drops/rebuilds policies on a fixed table list. |
| 23 | `20260706000616_0e3987a6-2aea-4556-8f00-712fd3eb7cc5.sql` | Adds school identity fields. |
| 24 | `20260713172744_8b21a79b-7f9e-4265-bb3a-7b1f9adff97b.sql` | Replaces analytics insert policies with validation and tightens function execution. |
| 25 | `20260714003121_0e05c45e-b6bb-4894-8140-98d45d3e5571.sql` | Again grants `anon` role-helper execution. |
| 26 | `20260714003218_0f071b44-d341-4268-a69e-f4a3891d89aa.sql` | Splits 17 public/authenticated read-policy pairs and revokes anonymous role-helper execution. |
| 27 | `20260715011359_e59b8339-ec9a-4029-8204-d954f4003f4c.sql` | Sets achievement media using two hard-coded media UUIDs. |
| 28 | `20260723022640_1e6adc77-259b-4b4c-9f62-da97eae49631.sql` | Adds `SECURITY DEFINER` media-visibility helper and replaces public media policy. |
| 29 | `20260724003534_b0a2cfa1-0bbf-444c-ba30-2be5ab8d4b5c.sql` | Changes media helper to invoker security and replaces the Storage public-read policy. |
| 30 | `20260725024142_8c0b9a3c-2616-4bdb-8e17-cbde4fd32f37.sql` | UUID-bound honor-board media updates and archives one media row. |

## Objects created

- **Enums (5):** `app_role`, `content_status`, `timetable_kind`,
  `instruction_audience`, and `academic_event_type`. Later `app_role` values
  are `super_admin`, `principal`, `vice_principal`, `media_coordinator`, and
  `academic_coordinator`.
- **Tables (49):** identity/RBAC (`profiles`, `user_roles`); media
  (`media`, `media_categories`, `media_usages`); site/contact configuration;
  homepage, academic, activity, honor, achievement, news, gallery,
  instructions, audit/version/outbox, timeline, policies/FAQ, analytics, notes,
  and resources. The exact table names are visible in the ordered migrations;
  no Storage bucket row is created by this series.
- **Functions (7):** `set_updated_at`, `has_role`, `is_staff`,
  `handle_new_user`, `has_content_delete`, `has_media_delete`, and
  `is_media_publicly_visible`.
- **Triggers (38):** 37 update/auth triggers plus the `auth.users`
  `on_auth_user_created` trigger; most call `set_updated_at`.
- **Indexes (36):** B-tree/partial indexes for status, dates and foreign-key
  access, GIN indexes for tags/search vectors, and the partial unique current
  academic-year index.
- **Storage:** policies refer to buckets `media`, `documents`, and
  `private-uploads`, but the migrations create **zero buckets**.
- **Grants and RLS:** RLS is enabled on application tables. `service_role`
  generally receives all privileges; `authenticated` receives table-specific
  reads/writes guarded by staff/role policies; `anon` receives published/public
  reads and constrained analytics inserts. Storage policies govern reads and
  staff writes on `storage.objects`.

## Security and replay findings

### Destructive and non-idempotent operations

- Migration 8 and migration 11 delete achievement-media rows before rebuilding
  them. Migration 22 dynamically drops all policies it finds for a fixed list
  of content/media tables. Migrations 24, 26, 28 and 29 drop named policies
  before replacing them. Migration 30 archives an existing media record.
- Foundation `CREATE TABLE`, most triggers/policies/indexes, and the analytics,
  honor-board, academic notes/resources tables are not guarded by `IF NOT
  EXISTS`; replay on a partially initialized database will fail. Several seed
  inserts also lack conflict handling and can duplicate or violate uniqueness.
- `CREATE POLICY` has no idempotent form here. Files 3, 5, 16, 17, 20 and 21
  will fail on replay if policies remain. Migration 22's policy regeneration
  is destructive to policies not represented by its generated template.
- Hard-coded content/media/honor UUIDs and asset paths create silent no-op,
  foreign-key failure, or wrong-row risks on a clean or independently seeded
  project. Timestamp order is therefore mandatory but not sufficient.

### Definer, search path, and privilege analysis

- `has_role`, `is_staff`, `handle_new_user`, `has_content_delete`, and
  `has_media_delete` use `SECURITY DEFINER`. They set `search_path = public`,
  which is better than inheriting the caller path, but does not exclude a
  writable `public` schema. PostgreSQL 17 deployments should confirm no
  untrusted role can create/replace objects in `public`; a hardened path such
  as `pg_catalog, public` and fully qualified object names should be reviewed.
- `is_media_publicly_visible` is briefly a definer function executable by
  `anon`/`authenticated` in migration 28. Migration 29 replaces it with
  `SECURITY INVOKER`, so only the final ordered state removes that elevation.
- Migrations 9, 19 and 25 grant anonymous execution on internal role helpers;
  migrations 14, 24 and finally 26 revoke it. Interrupted or selective
  execution can leave anonymous callers able to probe role membership for
  arbitrary UUIDs. The final state grants these helpers to authenticated and
  service roles only.
- The first foundation migration grants table privileges before policies;
  transactions normally prevent intermediate visibility, but each file's
  atomic behavior must be verified in the chosen deployment mechanism.
- Anonymous clients can insert analytics events in the final state, with
  length/value checks but no database-side rate limit. Authenticated staff can
  operate through RLS. The service role bypasses RLS and must remain server-only.

### Bootstrap administrator

`handle_new_user` checks whether `user_roles` is empty and assigns the first
new auth user the `admin` role; later users receive `viewer`. This is a race and
an account-takeover/bootstrap risk: whichever signup trigger wins becomes an
administrator. It is not bound to an approved identity, and the later addition
of `super_admin` does not change this behavior. Disable public signup during
bootstrap and replace this mechanism in a reviewed forward migration or use an
explicit, audited administrator provisioning decision.

### Storage policy risks

- Required buckets are assumed rather than created, including their public/
  private flags and file constraints. Policy creation does not validate bucket
  existence, so migration success can hide an unusable Storage setup.
- Initial policy 3 exposes every object in `media` and `documents`. Migration
  29 narrows Storage reads to media rows passing relational visibility checks,
  but `documents` public behavior changes implicitly and must be confirmed.
- The invoker visibility function depends on caller-visible rows across many
  tables. Policy recursion/performance and missing public policies may cause
  false negatives. Object paths must exactly match `media.bucket` and
  `media.storage_path`. Upload size, MIME type, path ownership, and overwrite
  constraints are not enforced in these policies.

## Old-project assumptions and PostgreSQL 17

No project reference or Supabase URL is embedded in the SQL. Nevertheless,
the data migrations assume rows and UUIDs produced in the old project, and
`/__l5e/assets-v1/...` paths assume historical Lovable assets. Storage buckets,
Auth configuration, signup policy, and existing content are all external
assumptions. These must be inventoried and mapped without querying or mutating
production during this phase.

The SQL uses supported PostgreSQL 17 features (enums, generated columns, GIN,
PL/pgSQL, partial indexes, RLS and `SECURITY INVOKER`). Compatibility concerns
are operational rather than a known syntax blocker: confirm Supabase's
available `pgcrypto` extension, enum `ADD VALUE` transaction behavior, trigger
permissions on `auth.users`, ownership/privileges on `storage.objects`, and
generated full-text expressions under the target extensions/collations. Test
the exact series against an disposable local PostgreSQL/Supabase environment
matching production before approval.

## Recommended clean-project execution strategy

1. Do not link to or run this series against production yet. Freeze the 30
   historical files and create forward-only remediation migrations in a later
   reviewed phase rather than editing history.
2. Build an ephemeral local Supabase environment matching PostgreSQL 17. Apply
   all files once, strictly in filename order and transactionally where the CLI
   supports it; capture failures without skipping files.
3. Separate and review schema/security bootstrap from optional content import.
   Replace old UUID references with deterministic keys/mapping or validated
   lookups, and make content operations replay-safe.
4. Add explicit, reviewed bucket creation/configuration and final-state Storage
   policies. Test anon, ordinary authenticated, every staff role, and service
   role access, including negative cases and interrupted migration states.
5. Replace or gate first-user admin assignment; pre-authorize the bootstrap
   identity through a documented manual control with public signup disabled.
6. Validate catalog state: 49 tables, five enums, seven functions, 38 triggers,
   36 named indexes, RLS on every exposed table, expected grants/policies, and
   no unexpected `PUBLIC` function execution.
7. Take a production change window and backup only after dry-run results,
   remediation SQL, rollback/runbook, and the unresolved decisions below are
   approved. Actual production application is outside Phase 1.

## Explicit unresolved decisions

1. Which approved identity receives the initial `admin`/`super_admin` role, and
   whether self-service signup is disabled during and after bootstrap?
2. Are historical content seeds required in production, and what deterministic
   UUID/media mapping will replace old-project identifiers?
3. Which Storage buckets are required, which are public, and what MIME, size,
   path, ownership, caching and overwrite rules apply?
4. Should `documents` remain anonymously readable after the final Storage
   policy replacement?
5. May authenticated non-staff execute/probe `has_role`, or should access be
   further constrained behind caller-equals-subject functions?
6. What rate limiting, retention and privacy rules apply to anonymous analytics?
7. What exact Supabase PostgreSQL 17 version/extensions and migration transaction
   semantics will production use?
8. Should seed publishing/status updates be part of database bootstrap or a
   separately audited content import?

Until these decisions are resolved and a clean local dry run passes, the
migrations are **not safe to execute unchanged** on the new production project.
