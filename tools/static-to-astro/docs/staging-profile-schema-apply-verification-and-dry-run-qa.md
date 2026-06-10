# Staging Profile Schema Apply Verification and Dry-run QA

## 1. Purpose

**Phase:** `G-6-d-dry-run-retry-after-schema-apply`

This phase records the manually applied staging `public.profile` schema (verified by the user in Supabase SQL Editor), updates docs/config flags, and reruns G-6-d dry-run QA against staging using read-only checks plus the gated write PoC dry-run path.

This phase records the manually applied staging profile schema and reruns G-6-d dry-run QA.
No non-dry-run profile update is executed.
No database write is performed by Cursor.
No RLS policy is changed by Cursor.
No /admin route is connected.
No production data is touched.

## 2. Manual schema apply status

```txt
Manual SQL package: tools/static-to-astro/sql/staging/profile-schema-apply.sql
Applied by: user manually in Supabase SQL Editor
Intended project: static-to-astro-cms-staging
Cursor executed SQL: false
```

The user applied the SQL package after G-6-d-schema-apply-prep. Cursor did not execute SQL.

## 3. Verified profile table

User verification (Supabase SQL Editor, read-only queries):

```txt
public.profile exists: true
```

## 4. Verified profile columns

```txt
id uuid
name text
bio text
catchphrase text
website_url text
social_links jsonb
created_at timestamptz
updated_at timestamptz
updated_by uuid
```

## 5. Verified seed row

```txt
seed row exists: true
name: Demo Artist
bio: Demo biography for staging CMS verification.
updated_by: null
```

No row UUID is recorded in this doc.

## 6. Verified policies

```txt
Public can read profile:
- cmd: SELECT
- roles: anon, authenticated

Admins and editors can update profile:
- cmd: UPDATE
- roles: authenticated
- condition uses admin_users.user_id = auth.uid()
- condition uses role in ('admin', 'editor')
- condition does not use is_active
```

`admin_users` confirmed columns: `user_id`, `email`, `role`, `created_at` (no `is_active`).

## 7. Current safety state

```txt
schemaApplied: true
profileTableExists: true
seedRowExists: true
rlsPolicyApplied: true
dryRunRequired: true
nonDryRunExecuted: false
readyForG6DDryRunRetry: false
readyForG6DNonDryRun: false
```

After dry-run retry (see §8.1): `dryRunRetried: true`, `dryRunPassed: true`, `readyForManualNonDryRunDecision: true`.

**G-6-d-manual-non-dry-run-prep（完了）:** [staging-profile-manual-non-dry-run-prep.md](./staging-profile-manual-non-dry-run-prep.md) — one manual staging update prep; bio-only recommended; Cursor does not execute update; `readyForG6E: false`.

## 8. Dry-run QA command / procedure

G-6-d dry-run QA uses the staging shell only (`/__admin-staging-shell/musician-basic/`). Env gate uses `ENABLE_ADMIN_STAGING_WRITE` (not `ENABLE_ADMIN_STAGING_WRITE_POC`).

### 8.1 Dry-run QA execution result (this phase)

Cursor reran automated dry-run QA via `tools/static-to-astro/scripts/lib/run-g6d-dry-run-qa.mjs` (SELECT only; no `.update()` call; `PUBLIC_ADMIN_WRITE_DRY_RUN=true` semantics).

Initial automated retry (before GRANT):

```txt
dryRunPassed: false
failure: permission denied for table profile (anon Supabase client)
```

User applied GRANT on staging (manual, not by Cursor):

```txt
GRANT SELECT ON public.profile TO anon, authenticated;
GRANT UPDATE ON public.profile TO authenticated;
```

After GRANT — dry-run QA passed:

```txt
dryRunRetried: true
dryRunPassed: true
- staging shell dry-run path confirmed
- payload targets public.profile / name / bio
- no DB update on Save in dry-run mode
- seed row unchanged after dry-run
```

### 8.2 Local dev server procedure (manual UI check)

Start dev server (staging URL/key — **not** production):

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=profile \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-d-staging-profile-update-poc \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
PUBLIC_SUPABASE_URL="<staging project url>" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

Open: `http://localhost:4321/__admin-staging-shell/musician-basic/`

Report CLI:

```bash
node tools/static-to-astro/scripts/report-staging-profile-schema-apply-verification-and-dry-run-qa.mjs \
  --out-dir tools/static-to-astro/output/staging-profile-schema-apply-verification-and-dry-run-qa/gosaki
```

**Important:** keep `PUBLIC_ADMIN_WRITE_DRY_RUN=true`. Do not set `PUBLIC_ADMIN_WRITE_DRY_RUN=false` in this phase.

## 9. Dry-run expected result

When GRANT + gates are satisfied:

```txt
- staging shell loads
- profile section loads
- profile update PoC section appears
- write gate shows dry-run mode
- Save action does not perform DB update
- payload targets public.profile
- payload fields are name / bio
- updated_by remains unchanged in DB because dry-run
- seed row remains Demo Artist unless user only changes local draft UI
- no insert/delete/publish/storage action occurs
```

## 10. Dry-run QA checklist

```txt
[x] staging shell opened locally
[x] environment is development/staging only
[x] PUBLIC_ADMIN_WRITE_DRY_RUN=true (enforced in procedure and automated script)
[x] approval ID is G-6-d-staging-profile-update-poc
[x] target table shown as profile (adapter constant)
[x] target fields are name / bio (display_name → name mapping)
[x] dry-run result panel appears
[x] no DB update executed (dry-run path returns before .update(); automated script never calls .update())
[x] no schema change executed by Cursor
[x] no RLS change executed by Cursor
[x] no Storage action
[x] no Publish action
[x] /admin route untouched
```

## 11. DB unchanged verification after dry-run

User may run read-only SQL in Supabase SQL Editor after dry-run:

```sql
select id, name, bio, updated_at, updated_by
from public.profile
limit 5;
```

Expectation:

```txt
Demo Artist row should remain unchanged after dry-run.
```

## 12. Remaining blockers before non-dry-run

```txt
- Confirm logged-in user has role admin or editor in admin_users
- Confirm auth.uid() matches admin_users.user_id
- Confirm dry-run payload is correct
- Confirm rollback plan is understood
- Confirm one-field or small text update target
- Confirm PUBLIC_ADMIN_WRITE_DRY_RUN=false will be set manually only for one test
- Confirm no G-6-e broader write expansion
```

## 13. Manual non-dry-run decision gate

`readyForManualNonDryRunDecision` may be true only if:

```txt
- schema verification is complete
- dry-run QA passes
- user role is admin/editor
- rollback plan is ready
- target update text is reviewed
```

This phase maintains:

```txt
readyForG6DNonDryRun: false
nonDryRunExecuted: false
readyForManualNonDryRunDecision: true
```

## 14. Next phase recommendation

**G-6-d-manual-non-dry-run-prep（完了）:** [staging-profile-manual-non-dry-run-prep.md](./staging-profile-manual-non-dry-run-prep.md) — prep package for one manual non-dry-run update; bio-only recommended; Cursor does not execute.

Then (user manual only):

**G-6-d first manual non-dry-run execution** — set `PUBLIC_ADMIN_WRITE_DRY_RUN=false` temporarily; one Save; revert to `true`.

**G-6-d-result-report** — after verification and rollback decision.

## 15. Final safety statement

This phase confirms schema application and dry-run readiness only.
No non-dry-run update is executed.
No database write is performed by Cursor.
No RLS policy is changed by Cursor.
No /admin route is connected.
No production data is touched.
