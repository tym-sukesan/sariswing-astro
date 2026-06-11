# Staging Profile Update PoC Verification Checklist

## 1. Purpose

**G-6-d-verify is a verification and execution-planning phase.**

G-6-d implemented a gated staging profile update PoC (default disabled, dry-run default). G-6-d-verify reviews that implementation and prepares checklists for the **first manual non-dry-run staging write**. Cursor and automation must **not** execute non-dry-run writes in this phase.

```txt
G-6-d-verify is a verification and execution-planning phase.
It does not execute the first non-dry-run write.
It reviews the G-6-d implementation before manual staging write execution.
No production data is touched.
No /admin route is connected.
No Storage or Publish operation is used.
```

Follows:

- [staging-profile-update-poc-implementation.md](./staging-profile-update-poc-implementation.md) (G-6-d)
- [staging-profile-update-poc-approval-plan.md](./staging-profile-update-poc-approval-plan.md) (G-6-d-prep)

Staging shell route only: `/__admin-staging-shell/musician-basic/`.

## 2. Current implementation summary

```txt
approval ID: G-6-d-staging-profile-update-poc
target module: profile
target table: profile
target operation: update
target scope: single existing row
target fields: name / bio
default disabled: true
dry-run default: true
non-dry-run not executed
```

Implementation files:

- `src/lib/admin/staging-write/staging-write-config.ts`
- `src/lib/admin/staging-write/profile-update-poc-adapter.ts`
- `src/lib/admin/staging-write/staging-profile-update-ui.ts`

```txt
display_name was mapped to name in implementation.
Confirm the staging profile table actually uses name, not display_name, before non-dry-run execution.
```

Logical UI field `display_name` maps to DB column `name` per `musician-basic-supabase-v1` read adapter (`PROFILE_SELECT: id, legacy_id, name, bio, image_url`).

## 3. Column mapping verification

**Cursor does not run SQL.** Confirm on staging Supabase dashboard (Table Editor / SQL editor) or approved schema docs — do not commit schema dumps or secrets.

```txt
[ ] profile table exists
[ ] primary key / row id column confirmed
[ ] name column exists
[ ] bio column exists
[ ] display_name column does not need to be used, or mapping is intentionally name
[ ] updated_at column exists or update can proceed without it
[ ] updated_by column exists or update can proceed without it
```

Steps (manual):

1. Open **staging** Supabase project only (not production).
2. Confirm table name `profile` (or documented equivalent — G-6-d adapter uses `profile`).
3. Verify columns `id`, `name`, `bio` exist on the target row.
4. Confirm G-6-d adapter allowlist matches: `display_name` → `name`, `bio` → `bio`.
5. Note whether `updated_at` / `updated_by` are auto-managed by DB triggers; kit does not set them in G-6-d.

## 4. Target row verification

```txt
[ ] staging project confirmed
[ ] production project excluded
[ ] profile row exists
[ ] target row id copied locally only
[ ] target row id not committed
[ ] before values recorded locally
[ ] rollback values recorded locally
```

**Before snapshot template** (store locally — do not commit):

```txt
Target table: profile
Target row id:
Before name:
Before bio:
Before updated_at:
Before updated_by:
Checked by:
Checked at:
```

Obtain `target row id` from dry-run result panel or staging Table Editor. Never commit row IDs or customer content to git.

## 5. RLS / role verification

```txt
[ ] RLS enabled on profile
[ ] anon write is blocked
[ ] authenticated viewer cannot update
[ ] authenticated editor can update only if intended
[ ] authenticated admin can update only if intended
[ ] service role is not used
[ ] browser role display is not treated as security boundary
```

Manual checks:

1. Staging Auth: sign in as intended admin/editor test account (staging only).
2. Attempt dry-run with viewer / unsigned session — Save should not succeed with real update path if RLS is correct.
3. Confirm kit uses **anon key + RLS** only — no `SERVICE_ROLE` in client or env.

```txt
If RLS is uncertain, do not run non-dry-run. Keep PUBLIC_ADMIN_WRITE_DRY_RUN=true.
```

G-6-d-verify does **not** create or change RLS policies.

## 6. Dry-run QA checklist

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

```txt
[ ] staging shell opens
[ ] profile update PoC section appears
[ ] approval ID is visible
[ ] dry-run status is true
[ ] Save button is enabled only in gated dry-run mode
[ ] changing name/bio creates intended payload
[ ] no Supabase update is executed
[ ] rollback instruction appears
[ ] no create/delete/publish/storage action is enabled
```

Report dry-run result:

```bash
node tools/static-to-astro/scripts/report-staging-profile-update-poc-verification.mjs \
  --out-dir tools/static-to-astro/output/staging-profile-update-poc-verification/gosaki
```

## 7. First non-dry-run execution checklist

**Cursor must not execute this step automatically. The user must run it manually after confirming all checklist items.**

```txt
[ ] User explicitly approves first non-dry-run staging write
[ ] Approval ID confirmed: G-6-d-staging-profile-update-poc
[ ] staging project URL confirmed
[ ] production project excluded
[ ] profile target row confirmed
[ ] name/bio columns confirmed
[ ] before snapshot saved locally
[ ] rollback plan saved locally
[ ] RLS reviewed
[ ] user is authenticated as intended admin/editor
[ ] PUBLIC_ADMIN_WRITE_DRY_RUN=false set manually
[ ] only one profile update will be executed
[ ] no other action will be tested
```

Decision: proceed only if state is `readyForManualNonDryRun` (see §13).

**Blocked until schema alignment:** If `public.profile` does not exist on staging, remain in `notReadyForNonDryRun`. See [profile-schema-alignment-plan.md](./profile-schema-alignment-plan.md).

## 8. Non-dry-run command template

**Manual execution only.** User runs after §7 checklist complete.

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
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_SUPABASE_URL="<staging project url>" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

```txt
Use staging project only.
Do not use production Supabase URL.
Do not commit env values.
Do not run unless rollback is ready.
```

Execute **one** profile text update. Record after snapshot (§9). Do not test create/delete/publish/storage.

## 9. After-write verification checklist

```txt
[ ] UI shows success
[ ] after snapshot appears
[ ] only target row changed
[ ] only approved fields changed
[ ] no publish status changed
[ ] no storage object created
[ ] no public site update triggered
[ ] rollback instruction visible
[ ] output/report saved locally if needed
```

**After snapshot template** (local only):

```txt
Target table: profile
Target row id:
After name:
After bio:
After updated_at:
After updated_by:
Write executed by:
Executed at:
Result:
```

## 10. Rollback checklist

```txt
[ ] before values are available
[ ] rollback target row id confirmed
[ ] rollback updates only name/bio
[ ] rollback does not touch publish/storage
[ ] rollback result verified
[ ] rollback status recorded
```

Draft rollback SQL (reference — **do not run from automation**):

```sql
-- DRAFT ONLY. DO NOT RUN FROM THIS DOC.
-- Restore profile name/bio on staging using before-snapshot values.
-- UPDATE profile
-- SET name = :before_name, bio = :before_bio
-- WHERE id = :target_row_id;
```

Verify rollback via read-only preview panel or Table Editor. Set `PUBLIC_ADMIN_WRITE_DRY_RUN=true` after rollback test.

## 11. Failure handling

| Case | Response |
| --- | --- |
| wrong approval ID | Fix `PUBLIC_ADMIN_WRITE_APPROVAL_ID`; keep dry-run |
| wrong module | Set `PUBLIC_ADMIN_WRITE_MODULE=profile` |
| missing Supabase env | Add staging URL/key locally; never commit |
| RLS denied | Review RLS; stay on dry-run; do not expand scope |
| missing column | Re-check §3 mapping; fix adapter only in separate approved phase |
| target row not found | Confirm staging data seeded; check `limit 1` row |
| network error | Retry; capture error in local evidence |
| unexpected update result | Stop; run rollback §10; share logs with team (no secrets) |

General: return to `PUBLIC_ADMIN_WRITE_DRY_RUN=true`, disable `ENABLE_ADMIN_STAGING_WRITE` when finished testing.

## 12. Evidence to collect

**Before execution:**

```txt
- dry-run screenshot
- disabled state screenshot
- target row before values
- RLS confirmation note
```

**After execution:**

```txt
- success screenshot
- after values
- rollback instruction
- any error message
```

Rules:

- Do not include secrets in screenshots
- Do not commit customer emails or production project names
- Store evidence locally or in private ticket — not in git

## 13. Decision states

```txt
notReadyForNonDryRun:
- schema unknown
- RLS unknown
- target row unknown
- rollback not ready

readyForManualNonDryRun:
- dry-run successful
- schema confirmed
- RLS reviewed
- rollback ready
- user explicitly approves

nonDryRunExecuted:
- exactly one staging profile update executed
- after snapshot recorded
- rollback available
```

G-6-d-verify completion state: `readyForManualNonDryRunDecision: true`, `nonDryRunExecuted: false`.

**G-6-d-blocker（完了）:** [profile-schema-alignment-plan.md](./profile-schema-alignment-plan.md) — `public.profile` missing on `static-to-astro-cms-staging`; non-dry-run **blocked**; `readyForG6DNonDryRun: false`; `readyForSchemaApplyApproval: true`.

**G-6-d-schema-apply-prep（完了）:** [profile-schema-apply-prep.md](./profile-schema-apply-prep.md) — manual SQL package ready; `admin_users` confirmed without `is_active`; Cursor must not execute SQL; `readyForManualSchemaApply: true`.

**G-6-d-schema-apply（ユーザー手動・完了）:** `public.profile` exists on staging; seed row; RLS policies (read: anon/authenticated; update: admin/editor via `admin_users`; no `is_active`).

**G-6-d-dry-run-retry-after-schema-apply（完了）:** [staging-profile-schema-apply-verification-and-dry-run-qa.md](./staging-profile-schema-apply-verification-and-dry-run-qa.md) — dry-run passed after GRANT; `readyForManualNonDryRunDecision: true`; `readyForG6DNonDryRun: false`.

**G-6-d-manual-non-dry-run-prep（完了）:** [staging-profile-manual-non-dry-run-prep.md](./staging-profile-manual-non-dry-run-prep.md) — first update staging-only; bio-only recommended; manual non-dry-run aborted.

**G-6-d-auth-session-display-investigation（完了）:** [staging-auth-session-display-investigation.md](./staging-auth-session-display-investigation.md) — real auth email not visible; mock preview; write disabled; `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; non-dry-run blocked; `readyForG6E: false`.

**G-6-d-staging-env-gate-client-fix（完了）:** [staging-env-gate-client-fix.md](./staging-env-gate-client-fix.md) — server injects ENABLE_* gates; Debug Panel accurate; non-dry-run blocked.

**G-6-d-staging-password-reset-callback（完了）:** [staging-password-reset-callback.md](./staging-password-reset-callback.md) — staging password reset callback implemented; `updateUser({ password })` is staging-only; no profile update executed; no non-dry-run profile update yet; `readyForAuthLoginRetry: true`. Next: recovery email再送 → 新パスワード設定 → 通常ログイン → Debug Panel確認.

**G-6-d-auth-status-denied-fix（完了）:** [staging-auth-status-denied-fix.md](./staging-auth-status-denied-fix.md) — Auth status denied issue fixed; valid session prioritized; authenticated when session.user.email available.

**G-6-d-result-report（完了）:** [staging-profile-non-dry-run-result-report.md](./staging-profile-non-dry-run-result-report.md) — first manual staging non-dry-run update succeeded; `public.profile` row updated; production not touched; `/admin` unconnected; `readyForG6E: false`; broader write expansion requires new approved planning phase.

## 14. G-6-d-verify completion criteria

```txt
verificationChecklistCreated: true
columnMappingChecklistCreated: true
targetRowChecklistCreated: true
rlsRoleChecklistCreated: true
dryRunQaChecklistCreated: true
nonDryRunExecutionChecklistCreated: true
rollbackChecklistCreated: true
cursorWillNotExecuteNonDryRun: true
readyForManualNonDryRunDecision: true
nonDryRunExecuted: false
```

```bash
node tools/static-to-astro/scripts/report-staging-profile-update-poc-verification.mjs \
  --out-dir tools/static-to-astro/output/staging-profile-update-poc-verification/gosaki
```

## 15. Next phase recommendation

```txt
If dry-run and preflight pass:
- user may manually approve and run one non-dry-run staging profile update.

After one successful staging write:
- create G-6-d-result report
- do not expand to G-6-e automatically
```

**Do not proceed to G-6-e create operation** without a separate approval gate and planning phase.

## 16. Final safety statement

```txt
G-6-d-verify does not execute non-dry-run writes.
It prepares the checklist for manual first staging write.
No production data is touched.
No /admin route is connected.
No Storage operation is implemented.
No Publish operation is implemented.
No RLS policy is created or changed.
```
