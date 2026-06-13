# Schedule Non-Dry-Run PoC Execution Attempt Diagnosis

**Phase:** `G-6-e5-schedule-non-dry-run-poc-execution-attempt-diagnosis`  
**Prerequisites:** First manual execution attempt during `G-6-e5-schedule-non-dry-run-poc-execution` (Run button clicked once; DB unchanged)

## 1. Purpose

This document diagnoses why the first one-off Run button click did **not** update the staging `schedules` row.

This phase does **not** re-click the Run button.  
This phase does **not** invoke `updateScheduleWrite`.  
This phase does **not** write schedule records.  
This phase does **not** execute rollback SQL.  
This phase does **not** use Playwright / Chromium auto-click.  
This phase does **not** expose `/admin`.  
This phase does **not** touch production data.

## 2. Execution attempt summary

```txt
manualRunButtonClickedOnce: true
triggerClicked: true
executionPathInvoked: unknown (likely reached executeScheduleNonDryRunPoc; not proven at runtime)
writeAdapterInvoked: unknown / likely false
dbWritesPerformed: false
scheduleRecordsUpdated: false
descriptionChanged: false
rollbackNeeded: false
rollbackExecuted: false
retryAllowed: false
playwrightAutoClickAllowed: false
autoBrowserExecutionStopped: true
```

**Observed user experience after click:**

```txt
- Result panel success/failure details not confirmed visible
- View appeared to return near Dashboard section
- Supabase SQL Editor: target row unchanged
```

## 3. DB unchanged verification (user-confirmed)

Target row after the click:

```txt
id: aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id: schedule-2026-07-010
description: 出演：
updated_at: 2026-06-05 17:39:44.140168+00
```

```txt
dbUnchangedVerified: true
descriptionChanged: false
rollbackNeeded: false
```

No SQL was re-run in this diagnosis phase.

## 4. Static code review — files examined

| File | Role |
| --- | --- |
| `src/lib/admin/staging-write/schedule-non-dry-run-poc-config.ts` | Env gates for visibility / enabled |
| `src/lib/admin/staging-write/schedule-non-dry-run-poc-trigger.ts` | Auth + beforeSnapshot + `updateScheduleWrite` |
| `src/lib/admin/staging-write/staging-schedule-non-dry-run-poc-ui.ts` | Click handler + result panel |
| `tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleNonDryRunPocTriggerSection.astro` | Markup + Run button |
| `src/lib/admin/staging-auth/staging-auth-session.ts` | `getSession()` + mock allowlist role |
| `src/lib/admin/staging-auth/mock-allowlist.ts` | example.com emails only |
| `src/lib/admin/staging-write/profile-update-poc-adapter.ts` | Contrast: profile PoC has no mock-role gate |

## 5. Button type and navigation (static)

### 5.1 Button type — PASS

`AdminStagingScheduleNonDryRunPocTriggerSection.astro`:

```html
<button type="button" id="schedule-non-dry-run-poc-run-btn" ...>
```

- Not inside a `<form>`.
- Default submit behaviour is **not** expected.

**Conclusion:** Form submit / implicit submit is **unlikely** root cause.

### 5.2 Event handler — partial gaps

`staging-schedule-non-dry-run-poc-ui.ts`:

- Click listener calls `handleRunClick()` via `void handleRunClick()` — no `preventDefault()` (acceptable for `type="button"`).
- No `location.reload()` or explicit navigation in handler.
- **Gap:** `handleRunClick` has `try/finally` but **no `catch`**. Thrown errors (network, Supabase client) become unhandled rejections; result panel may stay at `not executed` or `Running…` until `finally` resets the button label.
- **Gap:** Early return when `!config.enabled || !isManualConfirmValid()` updates **nothing** in the result panel (silent no-op).

### 5.3 Dashboard scroll hypothesis — plausible UX cause

Prototype layout order (`musician-basic-admin-prototype.astro`):

1. Schedule dry-run + hidden PoC trigger section (`#schedule-dry-run-poc-shell-section`)
2. Dashboard section (`#dashboard`) **below** the trigger

Side nav includes `{ href: "#dashboard" }`. Accidental nav click or browser hash change scrolls **down** to Dashboard, moving the Danger Zone result panel **off-screen above** the viewport.

**Conclusion:** Result panel may have rendered an error, but user could not see it after scrolling to Dashboard. This explains “returned to Dashboard” without requiring a full page reload.

## 6. Auth session (static)

### 6.1 Supabase client used at click time

`staging-schedule-non-dry-run-poc-ui.ts` → `getSupabaseEnv()` reads:

```txt
import.meta.env.PUBLIC_SUPABASE_URL
import.meta.env.PUBLIC_SUPABASE_ANON_KEY
```

Same URL/key passed to `executeScheduleNonDryRunPoc` → `getStagingAuthSessionDetails` → `client.auth.getSession()` and row SELECT.

**Risk:** Root repo `.env` points at **production** Supabase (`vsbvndwuajjhnzpohghh`). Staging execution requires **inline** staging `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` at dev start. If staging override was missing, auth/SELECT/update would target the wrong project; **staging DB would remain unchanged**.

Schedule PoC config gates do **not** require `ENABLE_ADMIN_STAGING_AUTH=true` (unlike auth UI). Trigger can be visible while Auth status panel shows mock/disabled scaffold.

### 6.2 Session check in trigger

`schedule-non-dry-run-poc-trigger.ts`:

```txt
1. getStagingAuthSessionDetails(url, anonKey)
2. abort if session.status !== "signed-in" OR !rawEmail
   → errorMessage: "Sign in as staging admin before running the PoC."
3. abort if session.role !== "admin"
   → errorMessage: "Admin role required."
```

### 6.3 Mock allowlist vs real staging admin — HIGH likelihood blocker

`staging-auth-session.ts` maps Supabase session email through `resolveMockAdminRole()` only (`roleSource: "mock-allowlist"`; `adminUsersQueried: false`).

`mock-allowlist.ts` contains **only** `@example.com` addresses:

```txt
mock-admin@example.com
mock-editor@example.com
mock-viewer@example.com
```

Real staging admin (e.g. `ysktoyamax@gmail.com`, documented in profile PoC) is **not** in the mock allowlist → `role` is `undefined` → `auth.session.role !== "admin"` → abort **before** row fetch and **before** `updateScheduleWrite`.

**Contrast with profile PoC:** `profile-update-poc-adapter.ts` does **not** enforce mock allowlist admin role. Profile non-dry-run succeeded via RLS + `admin_users` while UI still showed mock-denied role. Schedule PoC added a **stricter client gate** that profile PoC lacks.

**Conclusion:** If user was signed in with a real staging admin email, **“Admin role required.”** is the most likely abort path. DB unchanged is consistent.

## 7. Error visibility (static)

### 7.1 Designed error display

When `outcome.errorMessage && !outcome.result`, UI sets:

```html
<p class="schedule-non-dry-run-poc-result__error">…</p>
```

When `outcome.result` exists (including `actualWrite: false`), `renderResultPanel` shows `errorCode` / `errorMessage` from adapter result (`auth_missing`, `before_snapshot_mismatch`, `update_failed`, `guard_failed`, etc.).

### 7.2 Visibility gaps

| Scenario | Panel behaviour |
| --- | --- |
| Auth missing | Error paragraph shown (if handler completes) |
| Mock allowlist role denied | Error: “Admin role required.” |
| beforeSnapshot mismatch | Error from `abortReason` |
| Thrown exception in handler | **No catch** — panel may not update |
| Silent early return (gates/confirm) | Panel stays `not executed` |
| User scrolls to `#dashboard` | Panel updated but **off-screen** |

**Conclusion:** Errors are **designed** for the result panel, not console-only — but scroll-away and missing `catch` can hide failures.

## 8. updateScheduleWrite reachability (static call chain)

```txt
Run click
  → handleRunClick (UI gates: config.enabled + manual confirm)
  → executeScheduleNonDryRunPoc
      → config.enabled (env gates)
      → getStagingAuthSessionDetails (signed-in + role === admin)  ← likely stop
      → SELECT schedules single row by target id
      → validateScheduleNonDryRunPocBeforeSnapshot
      → updateScheduleWrite (approvalId, targetId, beforeSnapshot, payload)
```

| Gate | Reached if… |
| --- | --- |
| UI enabled + confirm | User typed exact approval ID; env gates satisfied at click |
| `config.enabled` | Same env gates as visibility |
| Auth signed-in | Valid Supabase session on configured project |
| `role === "admin"` | Email in mock allowlist **only** (not `admin_users`) |
| Target row SELECT | Staging project + RLS SELECT allowed |
| beforeSnapshot | id, legacy_id, description match fixed PoC values |
| `updateScheduleWrite` | All above pass; dryRun false via env |

**Judgment:**

```txt
writeAdapterInvoked: likely false
updateScheduleWrite reached: unlikely without mock-allowlist admin OR without valid session
```

## 9. Likely cause ranking

| Rank | Cause | Evidence | DB unchanged? |
| --- | --- | --- | --- |
| **1** | Mock allowlist blocks real staging admin (`role !== "admin"`) | Schedule trigger checks mock role; profile PoC docs note same gap; example.com-only allowlist | Yes |
| **2** | No Supabase session at click (`auth_missing`) | Auth UI scaffold / unknown session reported | Yes |
| **3** | Wrong Supabase project in client env (production `.env`) | Root `.env` is production; staging requires inline override | Yes (staging) |
| **4** | Result panel off-screen after `#dashboard` nav scroll | Layout order + hash nav links | Yes (orthogonal) |
| **5** | Unhandled exception in click handler | No `catch` in `handleRunClick` | Yes |
| **6** | Form submit / page reload | `type="button"`, no form | Unlikely |

## 10. Playwright / auto execution

```txt
playwrightAutoClickAllowed: false
autoBrowserExecutionStopped: true
retryAllowed: false
```

Playwright/Chromium auto-click was stopped and is **prohibited** for this PoC until an explicit fix + retry phase.

## 11. Recommended fixes (implementation phase — not applied here)

1. **Align schedule PoC auth with profile PoC:** Remove or bypass mock-allowlist `role === "admin"` gate; rely on Supabase session + RLS (or resolve role from `admin_users` when auth enabled).
2. **Document staging env in Danger Zone:** Show active `PUBLIC_SUPABASE_URL` host (staging vs production) before Run.
3. **Require `ENABLE_ADMIN_STAGING_AUTH=true`** in PoC env gates when authenticated execution is mandatory.
4. **Scroll/focus result panel** after click completes (`scrollIntoView` on `#schedule-non-dry-run-poc-result`).
5. **Add `catch` in `handleRunClick`** and render unexpected errors in result panel.
6. **Persist last outcome** in `sessionStorage` so hash navigation does not lose diagnosis data.

## 12. Gate decision

```txt
diagnosisRequired: true
diagnosisRecorded: true
manualRunButtonClickedOnce: true
dbUnchangedVerified: true
descriptionChanged: false
rollbackNeeded: false
rollbackExecuted: false
retryAllowed: false
playwrightAutoClickAllowed: false
readyForRetry: false
readyForFixImplementation: true
readyForNonDryRunSchedulePoC: false
readyForG6E5ScheduleNonDryRunPocExecutionResult: false
```

## 13. Recommended next phases

```txt
1. G-6-e5-schedule-non-dry-run-poc-execution-fix (implement §11 fixes)
2. G-6-e5-schedule-non-dry-run-poc-execution (manual retry — one click only, after fix)
3. G-6-e5-schedule-non-dry-run-poc-execution-result (record outcome + SQL verification)
```

## 14. Safety statement

The one-off Run button was clicked **once** manually during the execution attempt.

The staging database **remained unchanged**. Rollback is **not** needed.

This diagnosis phase performed **no retry**, **no DB write**, **no rollback SQL**, and **no Playwright auto-click**.

Actual non-dry-run schedule PoC remains blocked until fix implementation and an explicit retry phase.
