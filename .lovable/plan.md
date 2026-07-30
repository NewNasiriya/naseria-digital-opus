## Diagnosis (read-only; nothing was changed)

### 1. Backend reference
- Code and `.env`: project ref `tlyehajicuotulmfaewi` (`https://tlyehajicuotulmfaewi.supabase.co`), consumed via `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` in `src/integrations/supabase/client.ts`.
- Published build: the live JS bundle `https://newnasiriya.com/assets/client-Bp6Ispas.js` contains **zero occurrences** of the project ref or the key. The published deployment references **no backend at all**.
- `newnasiriya.com` and `naseria-digital-opus.lovable.app` serve the **same** build (identical title/markup), so the custom domain is correctly attached — it is not a wrong-project issue.

### 2. Do the rows satisfy public filters and RLS?
Yes. Verified with anonymous REST calls using the publishable key (no session):
- `news?status=eq.published` → returns rows (e.g. "بدء استقبال ملفات الطلاب الجدد", published_at 2026-07-01).
- `achievements` → 2 published rows returned to `anon`.
- `gallery_albums` → 2 published rows; `gallery_items` readable through the album-published policy.
- `homepage_hero` → 1 published row returned.
- `media` → readable.
- `statistics` → 3 rows, all `is_visible = true` (the table is `statistics`, not `school_stats`).
RLS policies are split correctly into `TO anon` (published only) and `TO authenticated` (published OR staff). **No RLS or query-filter problem exists.**

### 3. Exact runtime error on the live domain
Browser load of `https://newnasiriya.com/`:
```
[Supabase] Missing Supabase environment variable(s): SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY. Connect Supabase in Lovable Cloud.
Error: Missing Supabase environment variable(s)... at client-Bp6Ispas.js:11:54385
```
Thrown three times during hydration. **Zero network requests to supabase.co were made** — every data hook fails before it can fetch, so news, achievements, gallery, hero and statistics all render empty and the count-up statistics show nothing.

Cause: `VITE_SUPABASE_*` are build-time replacements. `.env` is git-ignored, so the build that produced the current published assets ran without those variables and inlined nothing. The preview works because the sandbox `.env` is present there.

### 4. Is the CMS on the same database / admin identity?
- Yes, same client module and same project ref — admin and public read/write the identical database.
- Database state: 1 auth user (email confirmed), 1 profile, 1 `user_roles` row with role `admin`. Storage/media rows intact.
- Consequence: on the **published domain** the admin CMS is equally broken (same missing-env throw at `/auth` and `/admin`), while inside the Lovable preview it works normally. No second/forked backend exists.

### 5. Minimal safe recovery plan (no data moves, no deletions)
1. Re-publish from Lovable so the build runs with Cloud env injection, producing a bundle with the URL and publishable key inlined. This is the entire fix — one publish action.
2. Re-verify: reload `newnasiriya.com`, confirm the bundle contains the project ref, confirm zero console errors, confirm news/achievements/gallery/statistics render, confirm `/auth` sign-in and `/admin` load.
3. If the republished bundle is still keyless, the publish pipeline is not injecting Cloud env — then (and only then) add a runtime-safe fallback so the client reads the keys from a server-provided config instead of build-time inlining. No database or content change either way.
4. Optional hardening, not required for recovery: a small SSR-rendered fallback so a client-side backend failure degrades gracefully instead of showing an empty page.

Nothing in the database, storage, auth, or RLS needs to be touched.

### 6. Actions requiring your explicit approval
- Publishing/redeploying the app (step 1) — this is a deployment action.
- Any code change (step 3 or 4).
- Any change to secrets or environment variables.
- Nothing else; no migration, no data write, no storage change is proposed.
