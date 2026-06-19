# Staging shell schedule site_slug operational Save re-click smoke marker restore preflight (G-9g3h1b)

**Phase:** `G-9g3h1b-smoke-marker-restore-preflight`
**Status:** **complete**
**Date:** 2026-06-19
**Prior:** G-9g3h1a smoke success — commit `03cbbbe`
**Type:** restore preflight + execution runbook — **no Save, no Preview by Cursor, no DB write, no SQL mutation, no restore execution**

| Check | Status |
| --- | --- |
| Save clicked (this phase) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed (this phase) | **no** |
| Restore executed | **no** |
| Rollback SQL executed | **no** |
| service_role used | **no** |

Prior docs:

- [staging-shell-schedule-site-slug-operational-save-success-reclick-prevention-smoke-test-result.md](./staging-shell-schedule-site-slug-operational-save-success-reclick-prevention-smoke-test-result.md)
- [staging-shell-schedule-site-slug-operational-save-success-reclick-prevention.md](./staging-shell-schedule-site-slug-operational-save-success-reclick-prevention.md)
- [staging-shell-schedule-site-slug-operational-general-edit-restore-preflight.md](./staging-shell-schedule-site-slug-operational-general-edit-restore-preflight.md)
- [staging-shell-schedule-site-slug-operational-general-edit-restore-execution-result.md](./staging-shell-schedule-site-slug-operational-general-edit-restore-execution-result.md)

**Do not re-click G-9g3g4 operational Save.** **Do not re-click G-9g3g5c restore Save.** **Do not re-click G-9g3h1a smoke Save.** **Cursor / AI must not click Save or Preview.**

---

## Gates

```txt
stagingShellScheduleSiteSlugOperationalSaveReclickSmokeMarkerRestorePreflightComplete: true
readyForG9g3h1cSmokeMarkerRestoreExecution: true
markerRemainsInStagingDb: true
restoreExecuted: false
operatorPending: false
cursorClickedSave: false
cursorClickedPreview: false
dbWriteExecuted: false
rollbackSqlExecuted: false
serviceRoleUsed: false
productionUntouched: true
readyForAnyDbWrite: false
```

**Next:** `G-9g3h1c-smoke-marker-restore-execution` (requires G-9g3h1b1 row-picker exception — see linked doc)

---

## 1a. Row picker exception (G-9g3h1b1 — prerequisite)

G-9g3h1c was **paused** when the target row appeared under **PoC audit rows (read-only — not selectable)** because the G-9g3h1a smoke marker matches `[CMS Kit staging]`.

Implementation: [staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-row-picker-exception.md](./staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-row-picker-exception.md)

| Operator check | Action |
| --- | --- |
| Row only in audit panel, no **Select (restore)** | **STOP** — exception criteria not met (`updated_at` / marker mismatch) |
| Row in selectable list with **G-9g3h1a restore target** badge | Proceed to Step D |
| Row selectable but no restore badge | **STOP** — wrong row |

Narrow exception requires **all**: target id / legacy_id / `gosaki-piano` / G-9g3h1a smoke marker / `updated_at` = `2026-06-19T01:18:46.3938+00:00`.

---

## 1. Restore path recommendation

### Option A — G-9g3g general operational path (**recommended**)

Use the existing G-9g3g general operational edit path:

- Set **YOUR EDIT (CANDIDATE)** `description` to the original (marker removed).
- Preview once → Save once via `#site-slug-edit-g9g3g-operational-save-btn`.
- Approval ID: `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run`
- Env arm: `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=true`

**Why Option A is safe and sufficient:**

| Reason | Detail |
| --- | --- |
| Same write path as append | G-9g3h1a marker was appended via G-9g3g general operational Save |
| changedFields-only | `description` only — matches `assertG9G3gOperationalGeneralEditPayloadOnly` |
| Optimistic lock | `expectedBeforeUpdatedAt` from Preview applies at Save |
| Host gate | Staging host only; production blocked |
| Re-click prevention | G-9g3h1 hardening applies after restore Save |
| No new code | Execution can proceed in G-9g3h1c without new arm / approval |

### Option B — G-9g3g5 dedicated restore mode (**not recommended for G-9g3h1a**)

G-9g3g5 restore mode exists but is **semantically bound to the G-9g3g4 marker round-trip**:

| Code / doc constraint | Effect on G-9g3h1a |
| --- | --- |
| `G9G3G5_RESTORE_CURRENT_MARKER_DESCRIPTION` | Hardcoded to G-9g3g4 marker string |
| `assertG9G3g5RestoreWritableRow` | Requires G-9g3g4 marker in `before.description` |
| `assertG9G3g5RestorePayloadOnly` | Requires `payload.description === G9G3G4_OPERATIONAL_DESCRIPTION_ORIGINAL` |
| Approval ID | `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run` (G-9g3g4 restore semantics) |
| Single-arm rule | G-9g3g arm must be **off** when G-9g3g5 restore arm is on |

**Conclusion:** Do **not** reuse G-9g3g5 restore mode for G-9g3h1a smoke marker removal without new constants, guards, and approval ID (over-engineering). Option B deferred unless a future phase explicitly generalizes restore mode.

**Chosen path:** **Option A — G-9g3g general operational path**

---

## 2. Target row / current marker state

| Field | Value |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| title | `<ごちまきトリオ>` |
| source_route | `/schedule/2026-03/` |

### Current description (expected in staging DB after G-9g3h1a Save)

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker
```

### G-9g3h1a smoke marker

```txt
[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker
```

### Restore target description (candidate + expected afterSnapshot)

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
```

```json
{
  "description": "出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo\n会場website: https://subsaku.com/ginza/"
}
```

### expectedBeforeUpdatedAt (lock baseline — reconfirm live via Preview in G-9g3h1c)

```txt
2026-06-19T01:18:46.3938+00:00
```

From G-9g3h1a smoke Save. Operator must not assume this value without a fresh Preview in execution phase.

---

## 3. Required env stack (Option A — G-9g3g operational)

Stop any routine dev server. **Do not commit** `.env` / `.env.local`. **Never use `service_role`.**

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

### Arms — must be **off**

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED — off (do not use G-9g3g5 restore mode)
PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED — off
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED — off
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED — off
PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED — off
```

### Host / safety

```txt
approval ID: G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run
env arm:     PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=true
staging host:     kmjqppxjdnwwrtaeqjta.supabase.co (only)
production host:  vsbvndwuajjhnzpohghh.supabase.co (blocked)
service_role: forbidden
```

Non-dry-run dev server: start **only for G-9g3h1c operator execution**; stop after execution and return to routine dry-run defaults.

---

## 4. Exact UI controls

| Control | Value |
| --- | --- |
| Route | `/__admin-staging-shell/musician-basic/#schedule` |
| URL | `http://localhost:4321/__admin-staging-shell/musician-basic/#schedule` |
| Preview button | `#site-slug-edit-dry-run-preview-btn` |
| Preview label | `Preview G-9 site_slug general edit dry-run` |
| Preview result panel title | `G-9 site_slug general edit preview result` |
| Preview result | `#site-slug-edit-dry-run-result` |
| Save button | `#site-slug-edit-g9g3g-operational-save-btn` |
| Save label | `Save operational general edit` |
| Save result | `#site-slug-edit-g9g3g-operational-save-result` |
| Gate panel | `#site-slug-edit-save-gate-panel` |

---

## 5. Operator execution runbook (G-9g3h1c — pending)

### Step A — Arm dev server — **pending**

Stop existing dev server. Start with §3 env stack (G-9g3g operational). No secrets in chat/logs.

### Step B — Open staging shell — **pending**

`http://localhost:4321/__admin-staging-shell/musician-basic/#schedule`

### Step C — Select target row — **pending**

Row picker → `888c58f2-f152-4563-a3cf-a20d7c2456c1` / `schedule-2026-03-001` / `<ごちまきトリオ>`.

**G-9g3h1b1:** Row must appear in **selectable** list (not audit-only) with badge **G-9g3h1a restore target — restore only** and button **Select (restore)**.

**STOP** if row remains under PoC audit rows with no restore select button.

### Step D — Loaded DB baseline — **pending**

`Description` → `Loaded from DB (read-only)` must equal §2 current marker description.

**STOP** if G-9g3h1a smoke marker is absent or description differs from expected.

### Step E — Restore candidate (description only) — **pending**

Edit **YOUR EDIT (CANDIDATE)** `description` only → §2 restore target (original, no marker).

### Step F — G-9 Preview (operator manual once) — **pending**

Click `#site-slug-edit-dry-run-preview-btn` once.

**Expected preview (`#site-slug-edit-dry-run-result`):**

| Field | Expected |
| --- | --- |
| actualWrite | `false` |
| wouldWrite | `true` |
| changedFields | `description` only |
| target.id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| target.legacy_id | `schedule-2026-03-001` |
| target.site_slug | `gosaki-piano` |
| before.description | includes G-9g3h1a smoke marker |
| after.description | equals original (no marker) |
| optimisticLock.stale | `false` |
| optimisticLock.expectedBeforeUpdatedAt | `2026-06-19T01:18:46.3938+00:00` |
| hostGatePassed | `true` |
| payload | `description` only |

### Step G — Save gate (before Save) — **pending**

| Check | Expected |
| --- | --- |
| Mode | G-9g3g general operational (restore arm **off**) |
| approvalId | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=true` |
| preview | valid |
| changedFields | `description` only |
| hostGatePassed | `true` |
| Save button | **enabled** |

### Step H — Operator manual Save once — **pending (execution phase only)**

Click `#site-slug-edit-g9g3g-operational-save-btn` **exactly once**.

**Expected Save result:**

| Field | Expected |
| --- | --- |
| actualWrite | `true` |
| rowsAffected | `1` |
| changedFields | `description` only |
| approvalId | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| beforeSnapshot.description | includes G-9g3h1a smoke marker |
| afterSnapshot.description | equals original (no marker) |
| expectedBeforeUpdatedAt | `2026-06-19T01:18:46.3938+00:00` |
| updated_at | changes from baseline |
| serviceRoleUsed | `false` |
| stagingOnly | `true` |
| productionBlocked | `true` |

### Step I — Re-click prevention (no second Save) — **pending**

After Step H success, **do not click Save again**.

| Check | Expected |
| --- | --- |
| Save button | **disabled** |
| Result panel | executed-state; re-click blocked message |
| Gate panel | fresh Preview required |
| Second Save | **not clicked** |

---

## 6. Stop conditions (before restore Save in G-9g3h1c)

**STOP immediately** if any:

- Wrong target row id / legacy_id / title
- Loaded DB description does **not** include G-9g3h1a smoke marker
- Loaded DB description differs from §2 current state
- `optimisticLock.expectedBeforeUpdatedAt` is not `2026-06-19T01:18:46.3938+00:00` at Preview (live row changed)
- `changedFields` includes anything other than `description`
- Payload includes non-description fields
- `after.description` in Preview is not original (marker still present or wrong text)
- `hostGatePassed=false`
- Active host is not `kmjqppxjdnwwrtaeqjta.supabase.co`
- Production host `vsbvndwuajjhnzpohghh.supabase.co` active
- Approval ID is not G-9g3g general operational ID
- G-9g3g5 restore arm is on
- Any PoC arm is on
- Preview stale before first Save
- Candidate / preview mismatch
- Save enabled for unknown reason
- Row not selectable (G-9g3h1b1 restore exception not active)
- Operator uncertainty

**G-9g3h1b:** Save not clicked. Preview not clicked.

---

## 7. Wrong buttons / forbidden paths

- Legacy G-6 preview/update panels
- `#schedule-dry-run-update-btn`
- G-9g3d PoC Save (`#site-slug-edit-g9g3d-save-btn`)
- G-9g2 / G-9g3b / G-9g3c PoC Save buttons
- **G-9g3g5 restore mode** — do not arm for G-9g3h1a marker (G-9g3g4-specific guards)
- G-9g3g4 / G-9g3g5c / G-9g3h1a Save re-click
- SQL rollback / restore SQL
- FTP / deploy / `workflow_dispatch`
- Cursor / AI / Playwright Save or Preview

---

## 8. Rollback note (documentation only — not executed)

If G-9g3h1c restore Save succeeds but wrong description results, manual rollback would re-append G-9g3h1a marker or restore from beforeSnapshot — **separate approval phase only**. No rollback SQL in G-9g3h1b or G-9g3h1c without explicit operator approval.

---

## 9. Git

```txt
G-9g3h1a smoke result: 03cbbbe (pushed)
G-9g3h1b restore preflight: complete (uncommitted)
```
