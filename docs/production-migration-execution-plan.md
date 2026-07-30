# Production migration execution plan

## Scope and gates

This plan independently reviewed all 30 historical SQL files and uses the Phase 1
audit as its authoritative input. Historical migrations are immutable and must run
in filename order only in a disposable PostgreSQL 17-compatible Supabase project.
The new remediation is not permission to deploy. **Production remains blocked until
the complete disposable run and approval gate in the runbook pass.**

Risk: **H** can fail, mutate content, or expose access; **M** is order/environment
sensitive; **L** has limited final-state effect. “Schema” means required to obtain
the schema currently consumed by the application, not that embedded seed rows are
required. “Old refs” covers fixed UUIDs and old/repository/Storage asset paths.

## Complete historical classification

|   # | Filename                                                  | Classification                  | Purpose                                                                        | Direct dependencies                  | Replay / production risk                       |       Schema?        | Project content? |          Old refs?          |
| --: | --------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------ | ---------------------------------------------- | :------------------: | :--------------: | :-------------------------: |
|   1 | `20260701182124_09d21461-a20e-4710-8e60-46eb5122c336.sql` | schema foundation               | Extension, enums, 43 tables, functions, triggers, grants, RLS, policies, seeds | `auth`, `storage`, `pgcrypto`        | H: non-idempotent foundation; first-user admin |         yes          | yes, mixed seeds |      yes, asset paths       |
|   2 | `20260701182136_91959087-d83a-4876-a3b1-f087e2e4fda7.sql` | security/RLS                    | Revoke default function execution                                              | functions from 1                     | L / M if omitted                               |         yes          |        no        |             no              |
|   3 | `20260701182157_c3352331-dbe8-4118-8ad5-371ef7180e92.sql` | storage                         | Initial object policies                                                        | buckets named externally; `is_staff` | H: buckets absent, broad reads                 |         yes          |        no        |        paths assumed        |
|   4 | `20260701191053_7766d7a6-6b9f-4392-8d00-7a00d4aaae3d.sql` | structural evolution            | News pin/read-time columns and index                                           | `news`                               | M: non-idempotent                              |         yes          |        no        |             no              |
|   5 | `20260701194150_5761e74a-6e1a-42ee-90c5-a9cc58cb5ce3.sql` | structural evolution            | Honor boards schema, security, academic-year/grade seeds                       | years/grades/helpers                 | H: mixed non-idempotent schema/data            |         yes          |       yes        | generated IDs/path context  |
|   6 | `20260701194205_e0ef7a56-21d0-4b52-a8c7-0f0d118d055c.sql` | content/data import             | Honor-board image-path updates                                                 | rows from 5                          | M: silent no-op/wrong content                  |          no          |       yes        |        storage paths        |
|   7 | `20260701195120_26a1ec2e-a6ce-477f-ae5e-24e02407d539.sql` | content/data import             | One honor-board image update                                                   | row from 5                           | H: UUID-bound                                  |          no          |       yes        |          UUID/path          |
|   8 | `20260701201217_a3b51796-944a-4aa1-a549-bcb4b96a544a.sql` | destructive data transformation | Achievement evolution plus renovation import and media rebuild                 | achievement/media tables             | H: deletes/rebuilds content                    | schema columns only  |       yes        |         UUIDs/paths         |
|   9 | `20260701201941_e8d02366-5529-4d17-901d-9364856cbb16.sql` | security/RLS                    | Temporarily grant role helpers                                                 | helpers                              | H if sequence stops here                       |  yes, final history  |        no        |             no              |
|  10 | `20260701202638_670dd4f2-f3b0-4eba-8149-878e62719553.sql` | content/data import             | Achievement image/order changes                                                | imported achievements/media          | H: UUID-bound inserts/updates                  |          no          |       yes        |         UUIDs/paths         |
|  11 | `20260701203833_5afdb1d7-9ecc-4e4f-aab0-567c01597532.sql` | destructive data transformation | Kindergarten achievement upsert and media rebuild                              | achievement/media schema             | H: delete then insert                          |          no          |       yes        |         UUIDs/paths         |
|  12 | `20260701205011_a65746bd-9024-4e6f-b020-463b8a74b092.sql` | content/data import             | Kindergarten media changes                                                     | content from 11                      | H: content-bound                               |          no          |       yes        |         UUIDs/paths         |
|  13 | `20260701223116_f69cdfde-8a3d-4403-b5e1-4d59dd08836e.sql` | structural evolution            | Roles, profile lifecycle, staff semantics                                      | enum/profiles/helper                 | M: enum/order sensitive                        |         yes          |        no        |             no              |
|  14 | `20260701223131_5472ee2a-7b10-4ac0-b1fc-0ae42bddf4ce.sql` | security/RLS                    | Revoke anon helper execution                                                   | functions from 1/13                  | L / H if omitted                               |         yes          |        no        |             no              |
|  15 | `20260701225340_25e606f2-e434-42bf-b6fa-bcb557df34ae.sql` | content/data import             | Contact/school/settings/hours fields and school values                         | singleton tables                     | H: schema mixed with site-specific values      | schema columns only  |       yes        |     asset/site identity     |
|  16 | `20260701230733_ebe0010d-ca76-4eb5-b887-8bea3bd324e0.sql` | structural evolution            | Timeline enum/table/security plus events                                       | years/helper/trigger                 | H: policies and content not replay-safe        |         yes          |       yes        | no fixed UUID; school dates |
|  17 | `20260701232021_01fdb1b9-e2c1-4653-b9ac-35b5906b9543.sql` | structural evolution            | Policies/FAQ schema/security plus guidance seeds                               | helper/trigger/content tables        | H: mixed schema/import                         |         yes          |       yes        |  generated relational IDs   |
|  18 | `20260701233224_01160a1c-432b-432f-8610-998e3056c259.sql` | content/data import             | Publish selected news slugs                                                    | news seeds                           | M: content-dependent                           |          no          |       yes        |          old slugs          |
|  19 | `20260701235602_498a1316-7e51-44a2-8b84-2ccb39ff5756.sql` | security/RLS                    | Re-grant anon helpers                                                          | helpers                              | H until later revoke                           | yes, ordered history |        no        |             no              |
|  20 | `20260702002449_fcf3f61c-d43e-479e-b730-ae94173e35f0.sql` | structural evolution            | Analytics tables/security                                                      | helper                               | H: public inserts; non-idempotent              |         yes          |        no        |             no              |
|  21 | `20260702014754_8760cd0a-a52a-4b0e-b8e4-35e000a27b1b.sql` | structural evolution            | Academic notes/resources schema/security                                       | grades/media/helper                  | M: non-idempotent                              |         yes          |        no        |  media rows later required  |
|  22 | `20260705000809_ea4d9f52-deb3-44d1-85a6-835559ada7e6.sql` | destructive data transformation | Delete helpers; drop/rebuild policies dynamically                              | fixed table list/helpers             | H: destroys matching policies                  |         yes          |        no        |      fixed table names      |
|  23 | `20260706000616_0e3987a6-2aea-4556-8f00-712fd3eb7cc5.sql` | structural evolution            | School identity columns                                                        | `school_info`                        | M: non-idempotent                              |         yes          |        no        |             no              |
|  24 | `20260713172744_8b21a79b-7f9e-4265-bb3a-7b1f9adff97b.sql` | security/RLS                    | Validate analytics writes; tighten functions                                   | analytics/functions                  | M: policy replacement                          |         yes          |        no        |             no              |
|  25 | `20260714003121_0e05c45e-b6bb-4894-8140-98d45d3e5571.sql` | security/RLS                    | Again grant anon role helpers                                                  | helpers                              | H until 26                                     | yes, ordered history |        no        |             no              |
|  26 | `20260714003218_0f071b44-d341-4268-a69e-f4a3891d89aa.sql` | security/RLS                    | Split 17 read policies; revoke anon helpers                                    | content tables/helpers               | H if partial; final read model                 |         yes          |        no        |             no              |
|  27 | `20260715011359_e59b8339-ec9a-4029-8204-d954f4003f4c.sql` | content/data import             | Attach two achievement covers                                                  | old media/content rows               | H: UUID-bound                                  |          no          |       yes        |      fixed media UUIDs      |
|  28 | `20260723022640_1e6adc77-259b-4b4c-9f62-da97eae49631.sql` | security/RLS                    | Definer media visibility and media policy                                      | many content tables                  | H until 29; policy replacement                 |         yes          |        no        |             no              |
|  29 | `20260724003534_b0a2cfa1-0bbf-444c-ba30-2be5ab8d4b5c.sql` | compatibility/remediation       | Invoker visibility; referenced-object policy                                   | media/content/storage                | M: buckets still absent                        |         yes          |        no        |        storage paths        |
|  30 | `20260725024142_8c0b9a3c-2616-4bdb-8e17-cbde4fd32f37.sql` | destructive data transformation | Honor media updates and archive                                                | old honor/media rows                 | H: UUID-bound archive                          |          no          |       yes        |      fixed UUIDs/paths      |

## Execution lanes

### 1. Required application schema

The historical CLI cannot selectively apply parts of a file, so the disposable
compatibility run applies 1–30 unchanged, then the remediation. Logically required
schema/security is: 1–5 (excluding seeds), schema portions of 8 and 15–17, and
13–14, 19–26, 28–29. Migration 9/19/25 intermediate grants are unsafe alone but
must remain in their ordered historical context. The remediation is required.

### 2. Optional historical school content

All foundation singleton/category seeds and content portions of 5, 8, 11, 15–17
are optional school content. Migrations 6, 10, 12 and 18 are also optional. They
must be accepted by content owners and must not be treated as schema completeness.

### 3. Unsafe/environment-specific imports

Migrations 7, 27 and 30 are explicitly UUID/path-bound; the destructive portions
of 8, 11 and 22 are high risk; 6, 10 and 12 assume old paths/rows. Do not invent
assets. Before any approved production run, export an asset manifest separately,
upload verified objects, and validate every `public.media(bucket, storage_path)`
reference against `storage.objects(bucket_id, name)`. A dry-run diagnostic is:

```sql
SELECT m.id, m.bucket, m.storage_path
FROM public.media AS m
LEFT JOIN storage.objects AS o
  ON o.bucket_id = m.bucket AND o.name = m.storage_path
WHERE m.bucket <> 'external' AND o.id IS NULL
ORDER BY m.bucket, m.storage_path;
```

Run this only on the disposable environment (and later under an approved
production change); nonempty results require a separate upload/import plan.
Fixed UUIDs can be inventoried statically with
`rg -n "[0-9a-f]{8}-[0-9a-f-]{27,}" supabase/migrations` and reviewed, not replaced.
