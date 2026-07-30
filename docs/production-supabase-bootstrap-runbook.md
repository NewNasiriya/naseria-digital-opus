# Production Supabase bootstrap runbook

> **Hard gate:** do not execute the production migration sequence until an exact,
> disposable PostgreSQL 17-compatible Supabase dry run passes. This runbook does
> not authorize Production access or deployment.

## 1. Preconditions

- Confirm the checked-out task derives from `fix/production-supabase-bootstrap`,
  the 30 historical hashes pass `bun run verify:production-bootstrap`, and no file
  in that set changed.
- Obtain named DBA, security, application, content-owner, and release approvals.
- Keep production credentials out of the repository and shell history. Disable
  public signup for the controlled bootstrap window.
- Record backups/PITR status and an abort owner. Never use production for rehearsal.

## 2. Disposable dry run

Provision an isolated Supabase environment compatible with PostgreSQL 17, with no
production link or credentials. Install dependencies with `bun install --frozen-lockfile`.
Apply the exact 30 files in lexical order and then the remediation using only the
disposable environment's approved local/ephemeral workflow. Capture every command,
transaction result, duration, warning, and schema diff. Destroy it after evidence
is retained. Any skipped/edited migration or SQL error fails the gate.

## 3. Schema migration stage

Confirm 49 expected public tables, five enums, seven historical functions, the Auth
trigger, indexes, constraints, and grants described by the audit. Because schema
and seed content share historical files, do not selectively edit SQL; instead mark
seed outcomes as optional content and validate schema objects independently.

## 4. Remediation stage

Apply `20260730000000_production_security_remediation.sql` immediately after file
30 in the disposable run. Its opening assertions must pass, its transaction must
commit atomically, the signup trigger must create a profile but no role, function
paths/grants must match the plan, and all public tables must report forced RLS.

## 5. Storage validation

Verify `media` (private, 25 MiB, images/PDF), `documents` (private, 50 MiB,
reviewed document MIME list), and `private-uploads` (private, 50 MiB, restricted
images/documents). Test: published registered media/documents read anonymously;
unpublished/unregistered objects do not; private uploads are staff-only; non-staff
writes fail; staff creates are owned; overwrite requires the owner; delete requires
owner or `has_media_delete`. Run the missing-object query in the execution plan.

## 6. Controlled initial Auth user

With public signup disabled, an authorized operator creates the intended Auth user
through the Supabase dashboard/admin workflow. Verify its email out of band and
record its Auth UUID in the change ticket—not in Git. Confirm `profiles` exists and
`user_roles` has **no** row for that UUID. Any automatic privileged role is an abort.

## 7. Controlled initial admin assignment

After two-person verification of the intended UUID, a database owner uses the SQL
editor/change workflow in the approved change window:

```sql
BEGIN;
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role FROM auth.users WHERE id = '<approved-auth-uuid>'
ON CONFLICT (user_id, role) DO NOTHING;
-- Verify exactly one intended row, then COMMIT; otherwise ROLLBACK.
COMMIT;
```

The placeholder must never be committed with a real UUID. Record operator,
approver, timestamp and result. Re-enable signup only if the security owner approves.

## 8. RLS and privilege verification

Query `pg_class` for every public table's `relrowsecurity`/`relforcerowsecurity`,
`pg_policies` for role/command/expressions, and `information_schema.routine_privileges`.
Test anon, ordinary authenticated, each staff role, and service-role server context.
RBAC, profiles, audit log, content versions, outbox and media usages intentionally
have no anonymous access. Only truly published content and its registered objects
are public. Confirm PUBLIC cannot execute any application function; anon can execute
only the invoker media-visibility helper; authenticated can execute policy helpers.

## 9. Optional content decision

Content owners must explicitly accept or reject historical school seeds/imports.
Treat missing Storage objects, old UUID operations, old paths, school identity,
news publication, timeline, FAQ and guidance text as content—not schema. Produce a
reviewed manifest and separate asset upload. Never fabricate missing content/assets.

## 10. Type generation

Only after the disposable final schema passes, generate Supabase TypeScript types
from that disposable project into the existing types location, review the diff, and
rerun TypeScript/build. Type generation against Production is not part of Phase 2.

## 11. Application environment

Configure production project URL/reference and publishable key in the hosting
platform. Configure the service-role key only in server-only secret storage. Never
commit or log values. Verify canonical origin is the approved production domain,
not a Lovable preview domain, and validate Auth redirect/CORS/SMTP settings.

## 12. Smoke tests

Test public home/news/gallery/academic reads and signed/public object retrieval;
ordinary-user denial of CMS/RBAC/storage writes; approved admin CMS CRUD; media
upload/replace/delete ownership; document and private-upload visibility; analytics
validation; Auth/profile creation; sitemap/canonical URLs; and server-only operations.

## 13. Rollback and abort

Abort on any checksum difference, migration/assertion failure, unexpected public
grant/policy, missing required object, orphaned media path, wrong Auth UUID, automatic
admin, build/type failure, or inability to restore. Before production writes, discard
the environment. During an approved production window, stop traffic/jobs, preserve
logs, and use the pre-approved restore/PITR plan—do not edit history or improvise
down migrations. Bucket/object imports require their own rollback manifest.

## 14. Production approval gate

Production execution requires signed dry-run evidence, schema/security review,
content/asset decision, backup/restore proof, maintenance plan, smoke-test owner,
and explicit DBA/security/release approval. Phase 2 stops at this gate: do not link,
push, reset, migrate, create users, assign roles, upload assets, or execute SQL on
the live project, and do not merge the draft PR.
