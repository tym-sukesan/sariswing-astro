# Staging Profile Non-dry-run Result Report

## 1. Purpose

**Phase:** `G-6-d-result-report`

This report records the first successful manual staging-only non-dry-run profile update for the G-6-d write PoC on project `static-to-astro-cms-staging`.

This report records the first successful manual staging-only non-dry-run profile update.
It does not perform additional database writes.
It does not roll back the update.
It does not connect /admin.
It does not touch production data.

Cursor did not execute the update documented here. The user performed the manual non-dry-run Save from the staging shell.

## 2. Scope

```txt
Project: static-to-astro-cms-staging
Route: /__admin-staging-shell/musician-basic/
Table: public.profile
Operation: update
Rows: one existing row
Fields: name / bio payload submitted; bio actually changed; name unchanged
Production: not touched
/admin: not connected
Auth: Supabase staging Auth (anon client); ysktoyamax@gmail.com (admin in admin_users)
Approval ID: G-6-d-staging-profile-update-poc
```

## 3. Before snapshot

Row id: redacted / recorded locally (do not commit UUID).

```txt
name: Demo Artist
bio: Demo biography for staging CMS verification.
updated_at: 2026-06-10 17:26:42.959244+00
updated_by: NULL
```

## 4. Update payload

Submitted from staging shell profile update PoC:

```json
{
  "name": "Demo Artist",
  "bio": "Demo biography for staging CMS verification. Updated by G-6-d first non-dry-run test."
}
```

## 5. UI result

Staging shell displayed:

```txt
Staging write executed — profile row updated
```

## 6. After snapshot

Verified in Supabase SQL Editor after Save:

```txt
name: Demo Artist
bio: Demo biography for staging CMS verification. Updated by G-6-d first non-dry-run test.
updated_at: 2026-06-11 14:47:36.540991+00
updated_by: NULL
```

## 7. Verification SQL

```sql
select id, name, bio, updated_at, updated_by
from public.profile
limit 5;
```

## 8. Issues encountered and fixes

### 8.1 public.profile table missing

| | |
| --- | --- |
| **Symptom** | Staging DB had no `public.profile` table. |
| **Cause** | Schema alignment not applied; only `admin_users`, `discography`, `schedule_*`, etc. existed. |
| **Fix** | G-6-d-blocker → G-6-d-schema-apply-prep → user manual `profile-schema-apply.sql`. |
| **Result** | `public.profile` created; seed row inserted; RLS policies created. |

### 8.2 profile GRANT missing

| | |
| --- | --- |
| **Symptom** | Dry-run QA: `permission denied for table profile`. |
| **Cause** | `anon` / `authenticated` lacked SELECT; `authenticated` lacked UPDATE on `public.profile`. |
| **Fix** | User applied: `GRANT SELECT ON public.profile TO anon, authenticated;` `GRANT UPDATE ON public.profile TO authenticated;` |
| **Result** | Dry-run QA passed. |

### 8.3 Auth debug panel showed mock preview

| | |
| --- | --- |
| **Symptom** | `mock-admin@example.com` shown; real signed-in user not visible. |
| **Cause** | Astro/Vite exposes only `PUBLIC_*` env to browser; `ENABLE_ADMIN_STAGING_*` read as false on client. |
| **Fix** | G-6-d-auth-session-display-investigation → G-6-d-staging-env-gate-client-fix (server gate injection + client merge). |
| **Result** | Debug Panel shows real Supabase Auth state when gates are set. |

### 8.4 Password reset flow missing

| | |
| --- | --- |
| **Symptom** | Supabase Dashboard recovery email worked; staging reset UI was preview/disabled. |
| **Cause** | No `updateUser({ password })` in staging shell. |
| **Fix** | G-6-d-staging-password-reset-callback (staging-only; anon client). |
| **Result** | User set staging password; could sign in for non-dry-run. |

### 8.5 Auth status denied despite valid session

| | |
| --- | --- |
| **Symptom** | `User email: ysktoyamax@gmail.com` but `Auth status: denied`. |
| **Cause** | Mock allowlist role denial overwrote Supabase session status in `mapSupabaseSession()`. |
| **Fix** | G-6-d-auth-status-denied-fix — valid session → `authenticated`; role display separated. |
| **Result** | Debug Panel shows `Auth status: authenticated` after login. |

### 8.6 admin_users permission denied during Save

| | |
| --- | --- |
| **Symptom** | First non-dry-run Save: `permission denied for table admin_users`. |
| **Cause** | `public.profile` UPDATE RLS policy references `admin_users`; `authenticated` could not SELECT own row. |
| **Fix** | User applied: `GRANT SELECT ON public.admin_users TO authenticated;` RLS policy `Authenticated users can read own admin user row` using `user_id = auth.uid()`. |
| **Result** | Profile update retry succeeded. |

## 9. RLS / permissions final state

**public.profile:**

```txt
- SELECT policy: Public can read profile
- UPDATE policy: Admins and editors can update profile
- GRANT SELECT to anon, authenticated
- GRANT UPDATE to authenticated
```

**public.admin_users:**

```txt
- authenticated can read own admin user row
- policy uses user_id = auth.uid()
- this enables profile UPDATE policy to check role in admin_users
```

**Note:** `admin_users` may have additional admin policies visible in the dashboard. These should be reviewed in a later RLS audit phase before broader write expansion.

## 10. Rollback plan

Rollback was **not** executed in this phase.

```sql
-- MANUAL STAGING ROLLBACK ONLY.
-- Intended project: static-to-astro-cms-staging.
-- Never run on production.
update public.profile
set
  name = 'Demo Artist',
  bio = 'Demo biography for staging CMS verification.'
where id = '<PROFILE_ID_FROM_BEFORE_SNAPSHOT>';
```

Replace `<PROFILE_ID_FROM_BEFORE_SNAPSHOT>` with the row id recorded locally before the update.

## 11. Current gate state

```txt
G-6-d first manual non-dry-run: SUCCESS
profileUpdateExecuted: true
nonDryRunExecuted: true
stagingOnly: true
targetProject: static-to-astro-cms-staging
targetTable: public.profile
operation: update
rowsAffected: 1
fieldsChanged: bio
nameUnchanged: true
updatedAtChanged: true
updatedBy: NULL
productionDataTouched: false
adminRouteConnected: false
storageTouched: false
publishTriggered: false
ftpDeployTriggered: false
githubDispatchTriggered: false
rollbackExecuted: false
readyForG6DResultReport: true
readyForG6E: false
```

**Post-test env:** Return to `PUBLIC_ADMIN_WRITE_DRY_RUN=true` for day-to-day staging work. Do not leave `PUBLIC_ADMIN_WRITE_DRY_RUN=false` as the default.

## 12. Remaining risks / follow-up

```txt
- updated_by remains NULL (not set by current write adapter)
- role display in UI still uses mock allowlist; DB RLS uses admin_users
- admin_users policies should be audited before broader write features
- publish / storage / create / delete remain disabled
- /admin route remains unconnected
- non-dry-run should be returned to dry-run mode after test
```

## 13. Recommendation

Do not proceed directly to broad G-6-e write expansion.

**Recommended next phases (planning / hardening only):**

```txt
G-6-d-hardening — updated_by support; align UI role display with admin_users (read-only)
RLS audit — review admin_users policies before broader writes
G-6-e-planning — scope next write target (create? other modules?); no implementation yet
```

Preferred order:

```txt
G-6-d-hardening / RLS audit before G-6-e implementation
```

**G-6-d-hardening（完了）:** [staging-profile-write-hardening.md](./staging-profile-write-hardening.md) — `updated_by` NULL documented; UI role mock-only vs DB RLS clarified; dry-run restore checklist; `readyForG6EPlanning: true`; `readyForG6EImplementation: false`; broader writes blocked.

**G-6-rls-audit（完了）:** [staging-rls-audit.md](./staging-rls-audit.md) — read-only RLS/GRANT audit plan for `profile` and `admin_users`.

**G-6-rls-audit-result（完了）:** [staging-rls-audit-result.md](./staging-rls-audit-result.md) — manual SQL results; profile mostly OK; broad grants detected; G-6-rls-grant-cleanup-plan recommended before G-6-e.

## 14. Final safety statement

```txt
G-6-d result confirms one successful staging-only profile update.
No production data was touched.
No /admin route was connected.
No Storage, Publish, FTP, or GitHub dispatch was triggered.
Broader write expansion remains blocked until a new approved phase.
```

## Report

```bash
node tools/static-to-astro/scripts/report-staging-profile-non-dry-run-result.mjs \
  --out-dir tools/static-to-astro/output/staging-profile-non-dry-run-result/gosaki
```
