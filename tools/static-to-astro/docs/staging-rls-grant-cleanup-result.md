# Staging RLS Grant Cleanup Result

## 1. Purpose

**Phase:** `G-6-rls-grant-cleanup-result`

This document records the manual staging-only GRANT cleanup result.
It does not execute additional REVOKE.
It does not execute GRANT.
It does not change policies.
It does not perform database writes.
It does not connect /admin.
It does not touch production data.

Cursor did not execute SQL. The user ran cleanup SQL manually in Supabase SQL Editor on `static-to-astro-cms-staging`.

Follows [staging-rls-grant-cleanup-manual-apply-prep.md](./staging-rls-grant-cleanup-manual-apply-prep.md) and [staging-rls-grant-cleanup-plan.md](./staging-rls-grant-cleanup-plan.md).

## 2. Summary

```txt
targetProject: static-to-astro-cms-staging
executionMethod: Supabase SQL Editor, manual only
cleanupExecuted: true
revokeResult: success
broadGrantsRemoved: true
afterVerification: pass
preservedPermissionsVerification: pass
smokeTest: pass
rollbackExecuted: false
productionDataTouched: false
adminRouteConnected: false
storageTouched: false
publishTriggered: false
ftpDeployTriggered: false
githubDispatchTriggered: false
readyForG6EPlanning: true
readyForG6EImplementation: false
recommendedNextPhase: G-6-e-planning
```

**Conclusion:**

```txt
Manual staging GRANT cleanup succeeded.
Broad TRUNCATE / TRIGGER / REFERENCES grants removed from anon/authenticated on key CMS tables.
Needed SELECT and profile UPDATE grants preserved.
Dry-run smoke test passed.
G-6-e implementation remains blocked — separate planning and approval required.
```

## 3. Before verification

Before REVOKE, §6 before verification SQL returned the expected broad grants:

**admin_users:**

```txt
anon: REFERENCES, TRIGGER, TRUNCATE
authenticated: REFERENCES, TRIGGER, TRUNCATE
```

**discography:**

```txt
anon: REFERENCES, TRIGGER, TRUNCATE
authenticated: REFERENCES, TRIGGER, TRUNCATE
```

**discography_tracks:**

```txt
anon: REFERENCES, TRIGGER, TRUNCATE
authenticated: REFERENCES, TRIGGER, TRUNCATE
```

**profile:**

```txt
anon: REFERENCES, TRIGGER, TRUNCATE
authenticated: REFERENCES, TRIGGER, TRUNCATE
```

**schedule_months:**

```txt
anon: REFERENCES, TRIGGER, TRUNCATE
authenticated: REFERENCES, TRIGGER, TRUNCATE
```

**schedules:**

```txt
anon: REFERENCES, TRIGGER, TRUNCATE
authenticated: REFERENCES, TRIGGER, TRUNCATE
```

**Evaluation:**

```txt
beforeVerification: expected broad grants present
```

## 4. Manual REVOKE result

The user executed the following SQL manually in Supabase SQL Editor (`static-to-astro-cms-staging`):

```txt
revoke truncate, trigger, references on table public.admin_users from anon, authenticated;
revoke truncate, trigger, references on table public.discography from anon, authenticated;
revoke truncate, trigger, references on table public.discography_tracks from anon, authenticated;
revoke truncate, trigger, references on table public.profile from anon, authenticated;
revoke truncate, trigger, references on table public.schedule_months from anon, authenticated;
revoke truncate, trigger, references on table public.schedules from anon, authenticated;
```

**Supabase SQL Editor result:**

```txt
Success. No rows returned.
```

**Evaluation:**

```txt
revokeResult: success
cleanupExecuted: true
```

## 5. After verification

§8 after verification SQL result:

```txt
Success. No rows returned.
```

**Evaluation:**

```txt
afterVerification: pass
broadGrantsRemoved: true
TRUNCATE / TRIGGER / REFERENCES no longer appear for anon/authenticated on target tables
```

## 6. Preserved permissions

§9 preserved permissions verification SQL result:

**admin_users:**

```txt
authenticated: SELECT
```

**discography:**

```txt
anon: SELECT
authenticated: SELECT
```

**discography_tracks:**

```txt
anon: SELECT
authenticated: SELECT
```

**profile:**

```txt
anon: SELECT
authenticated: SELECT
authenticated: UPDATE
```

**schedule_months:**

```txt
anon: SELECT
authenticated: SELECT
```

**schedules:**

```txt
anon: SELECT
authenticated: SELECT
```

**Evaluation:**

```txt
preservedPermissionsVerification: pass
```

Confirmed:

```txt
- admin_users authenticated SELECT remains
- profile anon/authenticated SELECT remains
- profile authenticated UPDATE remains
- public content table SELECT grants remain
- INSERT / DELETE grants were not introduced
```

## 7. Smoke test

Staging shell route: `/__admin-staging-shell/musician-basic/` (dry-run mode).

**Debug Panel:**

```txt
Auth status: authenticated
Session present: true
User email: ysktoyamax@gmail.com
Dry-run mode: true
Write enabled: true
Save enabled: true
G-6-d write result: SUCCESS recorded
```

**Profile PoC dry-run Save (one execution):**

```txt
Dry-run complete — no Supabase update was called
```

**Dry-run payload displayed:**

```txt
name: Example Musician
bio: Jazz vocalist and composer based in Tokyo.
```

**Actual DB values unchanged:**

```txt
name: Demo Artist
bio: Demo biography for staging CMS verification. Updated by G-6-d first non-dry-run test.
```

**Evaluation:**

```txt
smokeTest: pass
profileReadWorks: true
authLoginWorks: true
dryRunSaveWorks: true
dbUpdateDuringSmokeTest: false
```

## 8. Rollback status

```txt
rollbackExecuted: false
rollback not needed
rollback SQL remains documented in staging-rls-grant-cleanup-manual-apply-prep.md
```

## 9. Risk reduction

**Removed high-risk broad grants:**

```txt
TRUNCATE
TRIGGER
REFERENCES
```

**From grantees:**

```txt
anon
authenticated
```

**On tables:**

```txt
admin_users
discography
discography_tracks
profile
schedule_months
schedules
```

## 10. Remaining concerns

```txt
- updated_by remains NULL
- UI role display remains mock-only
- admin_users policy structure should remain under review
- G-6-e implementation still requires separate planning and approval
```

## 11. Gate state

```txt
cleanupExecuted: true
broadGrantsRemoved: true
rollbackExecuted: false
safeForPlanning: true
safeForLimitedImplementation: false
readyForG6EPlanning: true
readyForG6EImplementation: false
grantStatus: broad_grants_removed_cleanup_applied
productionDataTouched: false
adminRouteConnected: false
```

## 12. Recommended next phase

```txt
Recommended next: G-6-e-planning — DONE (see schedule-cms-planning.md)
```

**G-6-e-planning-schedule-cms（完了）:** [schedule-cms-planning.md](./schedule-cms-planning.md) — Schedule CMS module planned; Sariswing pattern generalized; planning only; `readyForG6EImplementation: false`; next: G-6-e1-schedule-schema-read-audit.

**Important:**

```txt
G-6-e-planning is planning only.
G-6-e implementation requires a separate approved phase.
```

## 13. Final safety statement

```txt
The manual staging GRANT cleanup succeeded.
No production data was touched.
No /admin route was connected.
No Storage, Publish, FTP, or GitHub dispatch was triggered.
G-6-e implementation remains blocked until a separate planning and approval phase.
```

## Report

```bash
node tools/static-to-astro/scripts/report-staging-rls-grant-cleanup-result.mjs \
  --out-dir tools/static-to-astro/output/staging-rls-grant-cleanup-result/gosaki
```
