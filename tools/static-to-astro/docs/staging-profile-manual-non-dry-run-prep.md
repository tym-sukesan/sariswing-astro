# Staging Profile Manual Non-dry-run Prep

## 1. Purpose

**Phase:** `G-6-d-manual-non-dry-run-prep`

This phase prepares exactly **one** manual, staging-only, non-dry-run profile update for the G-6-d write PoC. It documents before snapshot, target row, payload, role checks, env procedure, execution steps, after verification, rollback, and abort conditions.

This phase prepares one manual staging-only non-dry-run profile update.
Cursor must not execute the non-dry-run update.
Cursor must not set PUBLIC_ADMIN_WRITE_DRY_RUN=false.
No database write is performed by Cursor.
No /admin route is connected.
No production data is touched.

Follows [staging-profile-schema-apply-verification-and-dry-run-qa.md](./staging-profile-schema-apply-verification-and-dry-run-qa.md) (dry-run passed after schema apply and GRANT).

## 2. Current gate status

```txt
schemaApplied: true
profileTableExists: true
seedRowExists: true
rlsPolicyApplied: true
dryRunPassed: true
readyForManualNonDryRunDecision: true
readyForG6DNonDryRun: false
nonDryRunExecuted: false
nonDryRunAborted: true
readyForManualNonDryRunExecution: false
```

**G-6-d-auth-session-display-investigation（完了）:** [staging-auth-session-display-investigation.md](./staging-auth-session-display-investigation.md) — manual non-dry-run aborted because real auth email was not visible; mock preview shown; write actions disabled; `PUBLIC_ADMIN_WRITE_DRY_RUN` restored to `true`; non-dry-run remains blocked.

**G-6-d-staging-env-gate-client-fix（完了）:** [staging-env-gate-client-fix.md](./staging-env-gate-client-fix.md) — server injects `ENABLE_*` gates to client; Debug Panel accurate; non-dry-run still blocked.

**G-6-d-staging-password-reset-callback（完了）:** [staging-password-reset-callback.md](./staging-password-reset-callback.md) — staging-only recovery callback; `updateUser({ password })` via anon client; no profile update executed; no non-dry-run profile update yet; `readyForAuthLoginRetry: true`. Next: recovery email再送 → 新パスワード設定 → 通常ログイン → Debug Panel確認.

## 3. Scope of first non-dry-run update

```txt
Project: static-to-astro-cms-staging only
Route: /__admin-staging-shell/musician-basic/ only
Table: public.profile only
Operation: update only
Rows: one existing seed row only
Fields: name and/or bio only
Create: forbidden
Delete: forbidden
Storage: forbidden
Publish: forbidden
/admin route: forbidden
Production: forbidden
```

Approval ID: `G-6-d-staging-profile-update-poc`

## 4. Confirm target row

Run in Supabase SQL Editor (staging project `static-to-astro-cms-staging` only):

```sql
select id, name, bio, updated_at, updated_by
from public.profile
limit 5;
```

Expectation:

```txt
Exactly one row should exist for the initial PoC.
If multiple rows exist, stop and decide target row explicitly.
```

Do not commit row UUIDs or customer content to git. Save `id` locally in a private note for rollback.

## 5. Before snapshot

Before the manual non-dry-run test, save these fields locally (private note or Supabase Table Editor export — not in git):

```txt
- id
- name
- bio
- updated_at
- updated_by
```

Expected seed values before first update:

```txt
name: Demo Artist
bio: Demo biography for staging CMS verification.
updated_by: null
```

No UUIDs are recorded in this doc.

## 6. Confirm admin/editor role

Run in Supabase SQL Editor (staging only):

```sql
select user_id, email, role, created_at
from public.admin_users
order by created_at desc;
```

Notes:

```txt
The logged-in user must have role admin or editor.
If role is viewer or any other value, stop.
Do not add or change admin_users in this phase.
```

## 7. Confirm Auth user match

`auth.uid()` is not directly visible in the same context when using the SQL Editor postgres role. Confirm identity through the staging shell and `admin_users` instead.

```txt
- Confirm the email used to log into the staging shell
- Confirm the same email exists in public.admin_users
- Confirm that the corresponding role is admin or editor
- If the staging shell shows authenticated user id/email, compare it with admin_users
- If mismatch is suspected, stop before non-dry-run
```

### Staging shell session display

On `/__admin-staging-shell/musician-basic/`, use:

- **Auth adapter status** — `staging-auth-user-email`, `staging-auth-user-id`, `staging-auth-session-status`
- **Auth Session / Write Gate Debug Panel** — provider, disabled reasons, write gate (G-6-d-auth-session-display-investigation)

If the UI shows `mock preview` or `mock-admin@example.com`, real Supabase Auth is not enabled. Set repo-root env gates (see [staging-auth-session-display-investigation.md](./staging-auth-session-display-investigation.md) §6 and [staging-env-gate-client-fix.md](./staging-env-gate-client-fix.md)) and confirm **Server gate injection: true** in the Debug Panel before signing in.

Compare displayed email with `admin_users.email`. The signed-in user's `user_id` in `admin_users` must match `auth.uid()` for the UPDATE RLS policy. Role UI currently uses mock allowlist only — confirm role in Supabase SQL Editor until `admin_users` resolver is added.

## 8. Proposed minimal update payload

Safe full payload option:

```txt
name: Demo Artist
bio: Demo biography for staging CMS verification. Updated by G-6-d first non-dry-run test.
```

**Recommended — `bio-only` first change:**

```txt
Update bio only (bio-only).
Keep name as Demo Artist.
```

Reason:

```txt
- smaller rollback
- easier verification
- lower risk
```

Approved test bio text:

```txt
Demo biography for staging CMS verification. Updated by G-6-d first non-dry-run test.
```

## 9. Temporary env change procedure

Current state: dry-run QA passed with `PUBLIC_ADMIN_WRITE_DRY_RUN=true`.

For the **one** manual non-dry-run test only, temporarily change local env (e.g. `.env.local` at repo root or env vars passed to `npm run dev`):

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN=false
```

**Critical:**

```txt
Set PUBLIC_ADMIN_WRITE_DRY_RUN=false only immediately before the one manual test.
Revert it back to PUBLIC_ADMIN_WRITE_DRY_RUN=true immediately after the test.
Never commit this env value.
Never put it in .env.example as default false.
```

Required gates (use `ENABLE_ADMIN_STAGING_WRITE` — not `ENABLE_ADMIN_STAGING_WRITE_POC`):

```txt
ENABLE_ADMIN_STAGING_SHELL=true
ENABLE_ADMIN_STAGING_AUTH=true
ENABLE_ADMIN_STAGING_DATA_READ=true
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_AUTH_PROVIDER=supabase
PUBLIC_ADMIN_DATA_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=profile
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-6-d-staging-profile-update-poc
PUBLIC_ADMIN_WRITE_DRY_RUN=false only for the one manual test
PUBLIC_SUPABASE_URL=<staging project url>
PUBLIC_SUPABASE_ANON_KEY=<staging anon key>
```

Cursor does **not** set `PUBLIC_ADMIN_WRITE_DRY_RUN=false` in this prep phase.

## 10. Manual execution procedure

**User only — Cursor must not execute these steps.**

```txt
1. Confirm Supabase project: static-to-astro-cms-staging
2. Run before snapshot SQL (§4)
3. Confirm exactly one profile row
4. Run admin_users role SQL (§6); confirm admin or editor
5. Confirm Auth email matches admin_users (§7)
6. Set PUBLIC_ADMIN_WRITE_DRY_RUN=false locally (§9) — do not commit
7. Start local dev server with staging shell gates enabled
8. Open /__admin-staging-shell/musician-basic/
9. Log in with the approved staging admin/editor user
10. Confirm write gate shows non-dry-run mode (dryRun: false in UI / result panel)
11. Change bio only to the approved test text (§8); leave name as Demo Artist
12. Click Save once
13. Do not click Save repeatedly
14. Immediately run after verification SQL (§11)
15. Revert PUBLIC_ADMIN_WRITE_DRY_RUN=true
16. Fill result template (§14)
```

## 11. After verification SQL

Run in Supabase SQL Editor (staging only):

```sql
select id, name, bio, updated_at, updated_by
from public.profile
limit 5;
```

Expectation:

```txt
- bio changed to the approved test text
- name unchanged (Demo Artist)
- updated_at changed
- updated_by may remain null unless adapter sets it
- no additional rows created
```

## 12. Rollback plan

Staging only. Never run on production.

Bio-only rollback (recommended if only bio was changed):

```sql
-- MANUAL STAGING ROLLBACK ONLY.
-- DO NOT RUN FROM CURSOR.
-- Intended project: static-to-astro-cms-staging
-- Replace <PROFILE_ID> and <ORIGINAL_BIO> from before snapshot.
update public.profile
set bio = '<ORIGINAL_BIO>'
where id = '<PROFILE_ID>';
```

Name and bio rollback:

```sql
-- MANUAL STAGING ROLLBACK ONLY.
-- DO NOT RUN FROM CURSOR.
-- Intended project: static-to-astro-cms-staging
-- Replace values from before snapshot.
update public.profile
set
  name = '<ORIGINAL_NAME>',
  bio = '<ORIGINAL_BIO>'
where id = '<PROFILE_ID>';
```

Notes:

- Confirm `id` matches before snapshot before rollback
- Rollback is staging-only
- User executes rollback manually if needed

Original bio for seed row:

```txt
Demo biography for staging CMS verification.
```

## 13. Abort conditions

```txt
Abort if:
- project is not static-to-astro-cms-staging
- more than one profile row exists and target row is unclear
- logged-in user is not admin/editor
- auth user/email mismatch is suspected
- dry-run result is not previously passed
- write gate does not clearly show non-dry-run mode
- UI target table/fields are unclear
- any insert/delete/storage/publish action appears
- any production URL appears
- /admin route is involved
```

## 14. Manual non-dry-run result template

Copy after execution (local note — not committed to git unless sanitized):

```txt
G-6-d first manual non-dry-run result

Date:
Project: static-to-astro-cms-staging
Route: /__admin-staging-shell/musician-basic/
User role:
Target table: profile
Target row: (local note only — do not commit UUID)
Fields changed: bio only (recommended)
Before:
  name: Demo Artist
  bio: Demo biography for staging CMS verification.
After:
  name: Demo Artist
  bio: Demo biography for staging CMS verification. Updated by G-6-d first non-dry-run test.
updated_at changed: yes / no
updated_by:
Rollback needed: yes / no
Rollback executed: yes / no
nonDryRunExecuted: true (only after successful one-time update)
readyForG6DResultReport: true (after after-verification complete)
readyForG6E: false
```

## 15. Decision states

```txt
readyForManualNonDryRunExecution:
- dry-run passed
- profile row confirmed
- admin/editor role confirmed
- rollback ready
- env procedure understood

nonDryRunExecuted:
- exactly one manual update was performed

readyForG6DResultReport:
- after verification completed
- rollback decision recorded

readyForG6E:
- false until result report confirms stable write path
```

This prep phase:

```txt
readyForManualNonDryRunExecution: false
nonDryRunExecuted: false
readyForG6DResultReport: false
readyForG6E: false
```

(`readyForManualNonDryRunExecution` becomes true only after user confirms all preflight checks in §4–§7 and §9.)

## 16. Final safety statement

This phase prepares one manual staging-only non-dry-run update.
Cursor does not execute the update.
Cursor does not set PUBLIC_ADMIN_WRITE_DRY_RUN=false.
No database write is performed by Cursor.
No /admin route is connected.
No production data is touched.

## Report

```bash
node tools/static-to-astro/scripts/report-staging-profile-manual-non-dry-run-prep.mjs \
  --out-dir tools/static-to-astro/output/staging-profile-manual-non-dry-run-prep/gosaki
```
