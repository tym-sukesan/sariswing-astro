# G-22h6b blocker — Gosaki Schedule republish Save disabled / session gate

**Phase:** `G-22h6b-blocker-gosaki-schedule-republish-save-disabled-session-gate`  
**Status:** **blocked** — G-22h6b operator Save once **not executed**  
**Date:** 2026-07-07  
**Base commit:** `9880091`  
**Prior:** [gosaki-schedule-republish-update-implementation.md](./gosaki-schedule-republish-update-implementation.md) (G-22h6a)

| Check | Status |
| --- | --- |
| G-22h6b actual UPDATE executed | **no** |
| Republish dry-run preview | **operator PASS** |
| Save button enabled | **no** |
| Displayed gate reason | `Staging admin session required.` |
| actualWrite | **false** (unchanged) |
| DB write | **no** |
| write-armed dev server | **stopped** (Cursor) |
| port 4321 LISTEN | **none** |
| Blocker fix implemented (session sync) | **yes** (this phase — not re-tested with Save) |

---

## Gates

```txt
gosakiScheduleRepublishSaveDisabledBlockerDocumented: true
phase: G-22h6b-blocker-gosaki-schedule-republish-save-disabled-session-gate
g22h6bRepublishUpdateOperatorSaveOnceExecuted: false
g22h6bBlocked: true
saveExecuted: false
actualWrite: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
packageRegenExecuted: false
ftpUploadExecuted: false
publicReflectionExecuted: false
readyForG22h6bRetryAfterSessionSyncFix: true
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. What happened (operator report)

Operator ran G-22h6b procedure on write-armed dev:

1. Manual login — **ok**
2. Filter 非公開のみ + keyword `schedule-2026-07-008` — **ok** (1 row)
3. **再公開案を作成** — **ok**
4. **変更を確認** — **ok** (dry-run preview succeeded)
5. **再公開を保存** — **disabled**
6. UI note: **`Staging admin session required.`**
7. Save target panel: env arm / actualWrite / publicReflectionPending text **overlapped** (readability issue)

Operator did **not** click Save. **No DB write.**

---

## 2. Selected target (unchanged)

| Field | Value |
| --- | --- |
| `legacy_id` | `schedule-2026-07-008` |
| `id` | `3e572f02-4f35-460e-80a1-3a7d15ca3fd9` |
| `site_slug` | `gosaki-piano` |
| `date` | `2026-07-17` |
| `title` | `<>` |
| `published` (before) | `false` |
| `expectedBeforeUpdatedAt` | `2026-07-06T13:58:41.425402+00:00` |

Target / expectedBeforeUpdatedAt matched in preview panel per operator.

---

## 3. Root cause (code investigation)

### 3.1 Session gate desync (primary)

**Authenticated admin read** and **Save gate** use different session state paths:

| Path | Session check | Updates `stagingAuthSignedIn`? |
| --- | --- | --- |
| `runAuthenticatedAdminReadRefetch()` | `resolveStagingAuthSignedIn()` locally | **no** (before fix) |
| `subscribeScheduleOperatorAuthRefetch()` on sign-in | refetch only | **no** (before fix) |
| Save gate `evaluateG22hRepublishUpdateUiGate()` | `stagingAuthSignedIn === true` | reads module cache |
| Dry-run preview `executeG22hScheduleRepublishDryRun()` | `signedIn === false` only (before fix) | weaker guard |

When operator logs in **after** page init (or Supabase async session restore fires `onAuthStateChange`):

1. Admin read refetch succeeds → unpublished rows visible (`admin-authenticated` banner).
2. Module cache `stagingAuthSignedIn` stays **`false`** from init.
3. Save gate fails at `if (!input.signedIn)` → **`Staging admin session required.`**
4. Dry-run could still appear to succeed when `signedIn` was not strictly enforced (`=== false` only).

**Not** an env arm / approvalId / target / optimistic-lock failure — those gates come **after** session check in `evaluateG22hRepublishUpdateUiGate()`.

### 3.2 Save button state not refreshed after auth refetch

`runAuthenticatedAdminReadRefetch()` updated list/banner but did **not** call `updateSaveButtonState()` after login refetch.

### 3.3 Text overlap (secondary UX)

Save target panel republish section had:

- Long inline Japanese in `<dd>` for `actualWrite` inside CSS grid (`minmax(10rem, 1fr)`)
- Duplicate `publicReflectionPending` note (`renderPublicReflectionPendingNote()` + grid row + dry-run section)

Caused visual overlap / hard-to-read panel during operator verification.

---

## 4. Fix applied (this blocker phase — no Save re-test)

| Fix | File |
| --- | --- |
| Sync `stagingAuthSignedIn` in `runAuthenticatedAdminReadRefetch()` | `gosaki-staging-schedule-operator-ui.ts` |
| Call `updateSaveButtonState()` after auth refetch paths | same |
| On sign-in: `refreshStagingAuthSignedIn()` before refetch | same |
| Align dry-run session guard: `!input.signedIn` | `gosaki-schedule-republish-dry-run.ts` |
| Shorten save-target `actualWrite` row; remove duplicate reflection note | `gosaki-staging-schedule-operator-ui.ts` |
| CSS `overflow-wrap` + `min-width: 0` on safety grid | `admin.css` |

**Cursor did not re-run write-armed Save.** Operator retry required in **G-22h6b-retry** after fix verification.

---

## 5. Safety (this phase)

| Item | Status |
| --- | --- |
| Save click | **no** |
| DB write / Supabase mutation | **no** |
| SQL INSERT / UPDATE / DELETE | **no** |
| Rollback SQL | **no** |
| GRANT / REVOKE / RLS | **no** |
| package / FTP / deploy | **no** |
| write-armed dev server | **stopped** |
| port 4321 LISTEN | **none** |
| commit / push | **no** |

---

## 6. Verifier

```bash
node tools/static-to-astro/scripts/verify-g22h6b-gosaki-schedule-republish-save-disabled-blocker.mjs
```

---

## 7. Next steps

| Step | Phase | Notes |
| --- | --- | --- |
| 1 | **G-22h6b-retry prep** | write-armed dev + read-only HTTP/marker smoke |
| 2 | **G-22h6b operator Save once (retry)** | operator manual Save once on `schedule-2026-07-008` |
| 3 | **G-22h6b afterVerification** | SELECT only |
| 4 | **G-22h7** | result closure |

**Operator retry checklist:**

1. Hard refresh after fix is deployed locally.
2. Confirm read banner = Supabase admin read (authenticated).
3. Republish preview → verify Save note does **not** say session required.
4. Save once only if all gates green.
