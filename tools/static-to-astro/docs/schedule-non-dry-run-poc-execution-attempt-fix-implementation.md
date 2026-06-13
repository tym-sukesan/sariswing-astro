# Schedule Non-Dry-Run PoC Execution Attempt Fix Implementation

**Phase:** `G-6-e5-schedule-non-dry-run-poc-execution-attempt-fix-implementation`  
**Prerequisites:** [schedule-non-dry-run-poc-execution-attempt-diagnosis.md](./schedule-non-dry-run-poc-execution-attempt-diagnosis.md) (commit `63fd4dc`)

## 1. Purpose

This document records code fixes for the first execution attempt where the one-off Run button was clicked once but the staging database remained unchanged.

This phase does **not** re-click the Run button.  
This phase does **not** invoke `updateScheduleWrite` at runtime.  
This phase does **not** write schedule records.  
This phase does **not** execute rollback SQL.  
This phase does **not** use Playwright / Chromium auto-click.

## 2. Problem recap

```txt
manualRunButtonClickedOnce: true (previous execution attempt)
dbUnchangedVerified: true
descriptionChanged: false
rollbackNeeded: false
likely root cause: local mock allowlist admin gate ("Admin role required.")
```

Profile PoC succeeded via Supabase Auth session + RLS / `admin_users`.  
Schedule PoC blocked real staging admins because `auth.session.role !== "admin"` used mock allowlist only.

## 3. Fixes applied

### 3.1 Mock allowlist hard admin gate removed

**Before:** `executeScheduleNonDryRunPoc` aborted when mock role was not `"admin"`.

**After:** Signed-in Supabase session is still required. Mock allowlist role is informational only — added to `warnings`, not a hard abort. Authorization for writes remains Supabase RLS / `admin_users` via authenticated client + `updateScheduleWrite`.

Files:

```txt
src/lib/admin/staging-write/schedule-non-dry-run-poc-auth.ts (new)
src/lib/admin/staging-write/schedule-non-dry-run-poc-trigger.ts
```

### 3.2 Signed-in session check maintained

```txt
errorCode: auth_session_missing
errorMessage: Sign in as staging admin before running the PoC.
```

When `session.status !== "signed-in"` or email missing.

### 3.3 Active Supabase host display

Danger Zone now shows:

```txt
Supabase host: (from PUBLIC_SUPABASE_URL)
Expected project: static-to-astro-cms-staging
Expected host: kmjqppxjdnwwrtaeqjta.supabase.co
```

Host mismatch shows a visible warning note. Anon key / tokens are not displayed.

Files:

```txt
src/lib/admin/staging-write/schedule-non-dry-run-poc-config.ts (extractSupabaseHost)
tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleNonDryRunPocTriggerSection.astro
src/lib/admin/staging-write/staging-schedule-non-dry-run-poc-ui.ts
```

### 3.4 Error panel improved

Result panel now renders consistently with:

```txt
status, actualWrite, operation, targetTable, targetId
authEmail, authStatus, mockRole
warnings, errorCode, errorMessage, preCheck.abortReason
before/after description, timestamp
```

Structured error codes include:

```txt
auth_session_missing
mock_role_not_admin_warning (warning only)
before_snapshot_mismatch
target_row_not_found
write_guard_failed
update_failed
unexpected_exception
```

File: `src/lib/admin/staging-write/schedule-non-dry-run-poc-error.ts` (new)

### 3.5 Exception handling

`handleRunClick` now has `try/catch/finally`. Unexpected errors render `unexpected_exception` in the result panel (not console-only). Button state is restored in `finally`.

### 3.6 scrollIntoView

After click handler completes (success or failure), Danger Zone / result panel scrolls into view.

### 3.7 Double-click guard

```txt
executionInFlight flag
button disabled while running
re-entry blocked in click handler
```

### 3.8 sessionStorage persistence

Last result panel snapshot saved to `schedule-non-dry-run-poc-last-result` (no secrets). Restored on page load.

### 3.9 Button type

Run button remains `type="button"` (not submit).

## 4. Design alignment with Profile PoC

```txt
signedInSessionStillRequired: true
mockRoleHardGateRemovedOrRelaxed: true
rlsAdminUsersSourceOfTruth: true
updateScheduleWrite remains sole DB write path
service_role not used
```

## 5. Static verification expectations

```txt
"Admin role required." hard abort removed from trigger
.update() only in schedule-write-adapter.ts and profile-update-poc-adapter.ts
updateScheduleWrite used from hidden trigger only (not /admin/)
src/pages/admin untouched
```

## 6. Browser check (this phase — display only)

Run button was **not** clicked in this phase.

Expected manual checks before retry:

```txt
Normal dev: Danger Zone hidden
Env-gated dev: Danger Zone visible, Supabase host shown, manual confirm enables button
Do not click Run until fix verification + explicit retry phase
```

## 7. Gate decision

```txt
mockRoleHardGateRemovedOrRelaxed: true
signedInSessionStillRequired: true
rlsAdminUsersSourceOfTruth: true
activeSupabaseHostDisplayed: true
errorPanelImproved: true
unexpectedExceptionCaptured: true
scrollIntoViewAdded: true
doubleClickGuardVerified: true
triggerClickedInThisPhase: false
executionPathInvokedInThisPhase: false
writeAdapterInvokedInThisPhase: false
dbWritesPerformedInThisPhase: false
scheduleRecordsUpdatedInThisPhase: false
rollbackNeeded: false
retryAllowed: false
readyForFixVerification: true
readyForRetry: false
readyForNonDryRunSchedulePoC: false
recommendedNextPhase: G-6-e5-schedule-non-dry-run-poc-execution-attempt-fix-verification
```

## 8. Recommended next phase

```txt
G-6-e5-schedule-non-dry-run-poc-execution-attempt-fix-verification
```

Static + browser display verification (still no Run click).  
Then explicit retry phase with one manual click only.

## 9. Safety statement

First manual click produced no DB change. Rollback is not needed.

Fix implementation completed without re-execution, without DB writes, and without Playwright auto-click.

Retry remains blocked until fix verification passes.

## 10. Fix verification follow-up

**G-6-e5-schedule-non-dry-run-poc-execution-attempt-fix-verification（完了）:** [schedule-non-dry-run-poc-execution-attempt-fix-verification.md](./schedule-non-dry-run-poc-execution-attempt-fix-verification.md) — mock role hard gate removal verified; signed-in session requirement verified; active Supabase host display verified; error panel / catch / scroll behavior verified; normal dev hidden and env-gated visible verified; Run button not clicked; retry still blocked.

**G-6-e5-schedule-non-dry-run-poc-execution-attempt-fix-verification-result（完了）:** [schedule-non-dry-run-poc-execution-attempt-fix-verification-result.md](./schedule-non-dry-run-poc-execution-attempt-fix-verification-result.md) — fix verification result recorded; fix verification passed; ready for explicit retry; Run button not clicked; DB unchanged.

