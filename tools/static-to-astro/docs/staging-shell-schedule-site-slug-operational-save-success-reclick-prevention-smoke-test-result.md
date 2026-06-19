# Staging shell schedule site_slug operational Save success re-click prevention smoke test result (G-9g3h1a)

**Phase:** `G-9g3h1a-save-success-reclick-prevention-smoke-test`
**Status:** **success — G-9g3h1a re-click prevention smoke passed**
**Date:** 2026-06-19
**Prior:** G-9g3h1a smoke runbook — commit `78c51b8`
**Type:** operator manual UI smoke — **one operational Save allowed in execution phase only**

| Check | Status |
| --- | --- |
| Save clicked | **yes** (operator manual, exactly once) |
| Preview clicked (Cursor/AI) | **no** |
| Preview clicked (operator) | **yes** (once) |
| Second Save clicked | **no** |
| Second Preview clicked | **no** |
| DB write executed | **yes** (one row, description only) |
| SQL mutation executed (Cursor/AI) | **no** |
| Rollback / restore executed | **no** |
| service_role used | **no** |

Cursor did **not** click Save or Preview.
Operator performed Preview + Save manually (Steps F, H).
Operator performed re-click prevention check (Step I) and candidate change check (Step J) without second Preview/Save.

Prior docs:

- [staging-shell-schedule-site-slug-operational-save-success-reclick-prevention.md](./staging-shell-schedule-site-slug-operational-save-success-reclick-prevention.md)
- [staging-shell-schedule-site-slug-operational-general-edit-post-restore-hardening.md](./staging-shell-schedule-site-slug-operational-general-edit-post-restore-hardening.md)
- [staging-shell-schedule-site-slug-operational-general-edit-restore-execution-result.md](./staging-shell-schedule-site-slug-operational-general-edit-restore-execution-result.md)

**Do not re-click G-9g3g4 operational Save.** **Do not re-click G-9g3g5c restore Save.** **Do not re-click G-9g3h1a smoke Save.** **Cursor / AI must not click Save or Preview.**

---

## Gates

```txt
stagingShellScheduleSiteSlugOperationalSaveSuccessReclickPreventionSmokeTestPassed: true
readyForG9g3h1bSmokeMarkerRestorePreflight: true
operatorPending: false
cursorClickedSave: false
cursorClickedPreview: false
dbWriteExecuted: true
restoreExecuted: false
rollbackSqlExecuted: false
serviceRoleUsed: false
productionUntouched: true
markerRemainsInStagingDb: true
readyForAnyDbWrite: false
```

**Next:** `G-9g3h1b-smoke-marker-restore-preflight`

---

## Summary (operator-confirmed)

```txt
Smoke: PASS
Preview: executed once by operator (actualWrite=false, wouldWrite=true)
Save: executed once by operator (actualWrite=true, rowsAffected=1)
Second Save: not clicked
Second Preview: not clicked
Re-click blocked: confirmed (Save disabled, executed-state message)
Candidate change: confirmed without Preview/Save (Preview stale, Save disabled)
changedFields: description only
optimistic lock: PASS (stale=false at preview; expectedBeforeUpdatedAt matched at Save)
service_role used: false
production touched: false
/admin touched: false
FTP / workflow_dispatch: not executed
rollback needed: false
rollback executed: false
restore needed: yes (G-9g3h1a smoke marker remains in staging DB)
```

### Safety flags

```json
{
  "stagingOnly": true,
  "productionBlocked": true,
  "serviceRoleUsed": false,
  "scheduleMonthsTouched": false,
  "deleteEnabled": false,
  "publishTriggered": false
}
```

---

## 1. Smoke strategy

Operator manually confirmed G-9g3h1 re-click prevention on staging shell:

| # | Check | Result |
| --- | --- | --- |
| 1 | Preview succeeds (`actualWrite=false`, `wouldWrite=true`) | **PASS** |
| 2 | Save succeeds **once** (`actualWrite=true`, `rowsAffected=1`) | **PASS** |
| 3 | After success, Save button **disabled** | **PASS** |
| 4 | Result panel shows **executed-state** / re-click blocked message | **PASS** |
| 5 | Same preview / same candidate / same target **cannot** enable Save again | **PASS** |
| 6 | Gate panel shows **consumed preview** / **fresh Preview required** | **PASS** |
| 7 | Candidate change clears success state; **fresh Preview required**; Save disabled | **PASS** |
| 8 | **No second DB write** (do not click Save a second time) | **PASS** |

**Mode:** G-9g3g general operational (not restore mode).

---

## 2. Target row

| Field | Value |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| title | `<ごちまきトリオ>` |
| source_route | `/schedule/2026-03/` |

### Loaded description (baseline — Step D)

Post-G-9g3g5c original — **no marker** (confirmed):

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
```

### Smoke candidate (description only — Step E)

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker
```

```json
{
  "description": "出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo\n会場website: https://subsaku.com/ginza/\n[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker"
}
```

---

## 3. Required env stack (G-9g3g operational — operator Step A)

Stop any routine dev server (`PUBLIC_ADMIN_WRITE_DRY_RUN=true`, all non-dry-run arms off).  
**Do not commit** `.env` / `.env.local`. **Never use `service_role`.**

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
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED — off (restore mode forbidden)
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

---

## 4. Exact UI controls

| Control | Value |
| --- | --- |
| Route | `/__admin-staging-shell/musician-basic/#schedule` |
| URL | `http://localhost:4321/__admin-staging-shell/musician-basic/#schedule` |
| Preview button | `#site-slug-edit-dry-run-preview-btn` |
| Preview label | `Preview G-9 site_slug general edit dry-run` |
| Preview result | `#site-slug-edit-dry-run-result` |
| Save button | `#site-slug-edit-g9g3g-operational-save-btn` |
| Save label | `Save operational general edit` |
| Save result | `#site-slug-edit-g9g3g-operational-save-result` |
| Gate panel | `#site-slug-edit-save-gate-panel` |

---

## 5. Operator steps — results

### Step A — Arm dev server (G-9g3g operational stack) — **PASS**

Operator started §3 env stack. No secrets in chat/logs.

### Step B — Open staging shell — **PASS**

`http://localhost:4321/__admin-staging-shell/musician-basic/#schedule`

### Step C — Select target row — **PASS**

Row picker → `888c58f2-f152-4563-a3cf-a20d7c2456c1` / `schedule-2026-03-001` / `<ごちまきトリオ>`.

### Step D — Loaded DB baseline — **PASS**

`Description` → `Loaded from DB (read-only)` matched §2 original (no marker).

### Step E — Description candidate (smoke marker) — **PASS**

Edit **YOUR EDIT (CANDIDATE)** only → §2 smoke candidate.

### Step F — G-9 Preview (operator manual once) — **PASS**

Operator clicked `#site-slug-edit-dry-run-preview-btn` once.

**Recorded preview (`#site-slug-edit-dry-run-result`):**

| Field | Value |
| --- | --- |
| actualWrite | `false` |
| wouldWrite | `true` |
| changedFields | `description` only |
| target.id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| target.legacy_id | `schedule-2026-03-001` |
| target.site_slug | `gosaki-piano` |
| optimisticLock.expectedBeforeUpdatedAt | `2026-06-18T18:07:44.737552+00:00` |
| optimisticLock.currentUpdatedAt | `2026-06-18T18:07:44.737552+00:00` |
| optimisticLock.stale | `false` |
| activeHost | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| expectedHost | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| hostGatePassed | `true` |
| payload | `description` only |
| before.description | original (no marker) |
| after.description | original + G-9g3h1a smoke marker |

### Step G — Save gate (before Save) — **PASS**

```txt
G-9g3g operational Save: enabled — operator manual only · approvalId: G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run · env arm: true · preview target id: 888c58f2-f152-4563-a3cf-a20d7c2456c1 · preview: valid · changedFields: description · Host gate: passed (kmjqppxjdnwwrtaeqjta.supabase.co) · Auth: staging admin signed in · Preview: dry-run on selected row (G-9g3f3c hardened) · Routine dev should use dry-run with all non-dry-run arms off.
```

| Check | Result |
| --- | --- |
| Mode | G-9g3g general operational (restore arm **off**) |
| approvalId | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=true` |
| preview | valid |
| changedFields | `description` only |
| Save button | **enabled** |

### Step H — Operator manual Save once — **PASS**

Operator clicked `#site-slug-edit-g9g3g-operational-save-btn` **exactly once**.

**Recorded Save result (`#site-slug-edit-g9g3g-operational-save-result`):**

| Field | Value |
| --- | --- |
| actualWrite | `true` |
| rowsAffected | `1` |
| changedFields | `description` only |
| approvalId | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| expectedBeforeUpdatedAt | `2026-06-18T18:07:44.737552+00:00` |
| updated_at after Save | `2026-06-19T01:18:46.3938+00:00` |
| serviceRoleUsed | `false` |
| stagingOnly | `true` |
| productionBlocked | `true` |
| scheduleMonthsTouched | `false` |
| deleteEnabled | `false` |
| publishTriggered | `false` |

**beforeSnapshot.description:**

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
```

**payload:**

```json
{
  "description": "出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo\n会場website: https://subsaku.com/ginza/\n[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker"
}
```

**afterSnapshot.description:**

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker
```

**Executed-state message observed:**

```txt
Operator manual Save completed once. Do not re-click. Save completed. Re-click is blocked. Run a fresh Preview after changing the candidate or reloading the row.
```

### Step I — Re-click prevention (no second Save) — **PASS**

After Step H success, operator **did not** click Save again.

**Recorded gate panel:**

```txt
G-9g3g operational Save: disabled — Save completed. Re-click is blocked. Run a fresh Preview after changing the candidate or reloading the row. · approvalId: G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run · env arm: true · preview: fresh Preview required · Operator manual Save completed once. Do not re-click. · executed-state: Save success recorded (general / rowsAffected=1) · Host gate: passed (kmjqppxjdnwwrtaeqjta.supabase.co) · Auth: staging admin signed in · Preview: dry-run on selected row (G-9g3f3c hardened) · Routine dev should use dry-run with all non-dry-run arms off.
```

| Check | Result |
| --- | --- |
| Save button | **disabled** |
| Result panel | executed-state; re-click blocked message |
| Gate panel | consumed preview / fresh Preview required |
| Same preview identity | cannot re-enable Save |
| Second Save clicked | **no** |

### Step J — Candidate change behavior (no second Preview/Save) — **PASS**

Operator changed description candidate only. **Did not** run Preview or Save.

Candidate marker changed to:

```txt
[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker candidate-change-check
```

**Recorded gate panel after candidate change:**

```txt
G-9g3g operational Save: disabled — Latest G-9 preview required · approvalId: G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run · env arm: true · preview: required · Host gate: passed (kmjqppxjdnwwrtaeqjta.supabase.co) · Auth: staging admin signed in · Preview: dry-run on selected row (G-9g3f3c hardened) · Preview: Preview is stale — run G-9 preview again · Routine dev should use dry-run with all non-dry-run arms off.
```

| Check | Result |
| --- | --- |
| Success state | cleared / no longer enables Save |
| Gate panel | fresh Preview required; Preview is stale |
| Save button | **disabled** until new Preview |
| Second Preview clicked | **no** |
| Second Save clicked | **no** |

---

## 6. Wrong buttons / forbidden paths

- Legacy G-6 preview/update panels
- `#schedule-dry-run-update-btn`
- G-9g3d PoC Save (`#site-slug-edit-g9g3d-save-btn`)
- G-9g2 / G-9g3b / G-9g3c PoC Save buttons
- G-9g3g5 restore mode / restore approval / restore arm
- G-9g3g4 / G-9g3g5c / G-9g3h1a re-click
- SQL rollback / restore SQL (in this phase)
- FTP / deploy / `workflow_dispatch`
- Cursor / AI / Playwright Save or Preview

---

## 7. Stop conditions (reference — observed none during smoke)

**STOP immediately** if any:

- Wrong target row id / legacy_id / title
- Loaded description is not original (unexpected marker present)
- `changedFields` includes anything other than `description`
- Payload includes non-description fields
- `hostGatePassed=false`
- Active host is not `kmjqppxjdnwwrtaeqjta.supabase.co`
- Production host `vsbvndwuajjhnzpohghh.supabase.co` active
- Approval ID is not G-9g3g general operational ID
- Restore arm is on
- Any PoC arm is on
- Preview stale before first Save
- Candidate / preview mismatch
- Save enabled for unknown reason after success
- Operator uncertainty

None triggered during G-9g3h1a smoke execution.

---

## 8. Post-smoke restore plan

G-9g3h1a smoke marker **remains** in staging DB until removed in a dedicated restore phase.

**Recommended sequence:**

```txt
G-9g3h1a-save-success-reclick-prevention-smoke-test     ← complete (this doc)
G-9g3h1b-smoke-marker-restore-preflight                 ← next (restore original description)
G-9g3h1c-smoke-marker-restore-execution                 ← dedicated restore Save once
```

Rationale: mirrors G-9g3g4 → G-9g3g5c round-trip; smoke scope limited to re-click prevention; restore uses separate approval/env if needed.

**Do not** run restore without `G-9g3h1b` preflight.

---

## 9. Operator pass record

| Field | Value |
| --- | --- |
| Operator | manual (staging admin) |
| Date | 2026-06-19 |
| Preview clicked | yes (once) |
| Save clicked | yes (once) |
| Second Save clicked | no |
| Second Preview clicked | no |
| actualWrite | `true` |
| rowsAffected | `1` |
| re-click blocked confirmed | yes |
| candidate change behavior confirmed | yes |
| smoke marker remains in DB | yes |
| Notes | G-9g3h1 re-click prevention smoke passed; restore required next |

---

## 10. Git

```txt
G-9g3h1 implementation: 8780f84 (pushed)
G-9g3h1a smoke runbook: 78c51b8 (pushed)
G-9g3h1a smoke result: success (uncommitted)
```
