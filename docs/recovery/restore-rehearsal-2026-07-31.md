# Isolated Restore Rehearsal — 2026-07-31

## Scope

A production-safe restore rehearsal was completed in the user-owned Supabase project `twixqnbgmcelbkryoezg` using an isolated, non-exposed schema:

`recovery_rehearsal_20260731_v1`

The live Lovable backend `tlyehajicuotulmfaewi` was treated as read-only. The application configuration, deployment, public target schema, Auth, and Storage were not switched or modified.

## Validation result

- Snapshot table count checks: **41/41 passed**
- Table count mismatches: **0**
- Relationship checks: **18/18 passed**
- Broken content/media relationships: **0**
- Published media backup: **33/33 files verified separately**
- Anonymous access to rehearsal schema: **revoked**
- Authenticated access to rehearsal schema: **revoked**
- Temporary HTTP extension: **removed after use**

## Target project state preserved

After the rehearsal, the existing target `public` schema remained unchanged:

- `public.news`: 0
- `public.achievements`: 1
- `public.achievement_media`: 7
- `public.gallery_albums`: 0
- `public.gallery_items`: 0
- `public.honor_boards`: 0
- `public.homepage_hero_actions`: 0
- `public.media`: 32
- `storage.objects`: 0
- `auth.users`: 0

No production row, news item, image, storage object, user, or deployment was deleted, replaced, or published.

## Security notes

Supabase advisors reported pre-existing warnings in the target project's `public` schema, including callable `SECURITY DEFINER` role-check functions and RLS/index performance recommendations. They were not changed during the restore rehearsal because modifying authorization behavior without application-level regression testing could break the CMS.

## Remaining gates before any production switch

1. Restore all 33 backed-up media bytes into an isolated private Storage namespace and verify SHA-256 checksums.
2. Establish the future Auth migration approach; password hashes and active sessions are not included in the public backup.
3. Apply and verify PR #10 migrations in the isolated target environment.
4. Deploy a preview build configured only for the isolated target.
5. Complete anonymous and authenticated CMS smoke tests.
6. Take a fresh final backup immediately before any cutover.
7. Switch configuration only after explicit approval and a documented rollback window.

PR #10 must remain Draft and must not be merged or deployed merely because the data restore rehearsal passed.
