# Staging shell schedule site_slug operational Save success re-click prevention smoke test result (G-9g3h1a)

**Phase:** `G-9g3h1a-save-success-reclick-prevention-smoke-test`  
**Status:** **operator pending**  
**Date:** 2026-06-19  
**Prior:** G-9g3h1 re-click prevention implementation — commit `8780f84`  
**Type:** operator manual UI smoke — **one operational Save allowed in execution phase only**

| Check | Status |
| --- | --- |
| Save clicked | **no** (not yet — operator execution pending) |
| Preview clicked (Cursor/AI) | **no** |
| Preview clicked (operator) | **not yet** |
| DB write executed | **no** |
| SQL / rollback / restore executed | **no** |
| service_role used | **no** |

Prior docs:

- [staging-shell-schedule-site-slug-operational-save-success-reclick-prevention.md](./staging-shell-schedule-site-slug-operational-save-success-reclick-prevention.md)
- [staging-shell-schedule-site-slug-operational-general-edit-post-restore-hardening.md](./staging-shell-schedule-site-slug-operational-general-edit-post-restore-hardening.md)
- [staging-shell-schedule-site-slug-operational-general-edit-restore-execution-result.md](./staging-shell-schedule-site-slug-operational-general-edit-restore-execution-result.md)

**Do not re-click G-9g3g4 operational Save.** **Do not re-click G-9g3g5c restore Save.** **Cursor / AI must not click Save or Preview.**

---

## Gates (pending — fill after operator smoke)

```txt
stagingShellScheduleSiteSlugOperationalSaveSuccessReclickPreventionSmokeTestPassed: false
readyForG9g3h1bSmokeMarkerRestorePreflight: false
operatorPending: true
cursorClickedSave: false
cursorClickedPreview: false
dbWriteExecuted: false
restoreExecuted: false
rollbackSqlExecuted: false
serviceRoleUsed: false
productionUntouched: true
markerRemainsInStagingDb: false
```

After successful smoke (Save once + re-click blocked confirmed), set `stagingShellScheduleSiteSlugOperationalSaveSuccessReclickPreventionSmokeTestPassed: true`.

If smoke Save leaves G-9g3h1a marker in DB: `markerRemainsInStagingDb: true`, `readyForG9g3h1bSmokeMarkerRestorePreflight: true`.

---

## 1. Smoke strategy

Operator manually confirms G-9g3h1 re-click prevention on staging shell:

| # | Check |
| --- | --- |
| 1 | Preview succeeds (`actualWrite=false`, `wouldWrite=true`) |
| 2 | Save succeeds **once** (`actualWrite=true`, `rowsAffected=1`) |
| 3 | After success, Save button **disabled** |
| 4 | Result panel shows **executed-state** / re-click blocked message |
| 5 | Same preview / same candidate / same target **cannot** enable Save again |
| 6 | Gate panel shows **consumed preview** / **fresh Preview required** |
| 7 | Candidate change clears success state; **fresh Preview required**; Save disabled |
| 8 | **No second DB write** (do not click Save a second time) |

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

### Loaded description (baseline — must match at Step D)

Post-G-9g3g5c original — **no marker**:

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
```

**STOP** if G-9g3g4 or other `[CMS Kit staging]` marker remains in loaded description.

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

## 5. Operator steps (runbook — pending)

### Step A — Arm dev server (G-9g3g operational stack) — **pending**

Stop routine / restore-arm dev server. Start with §3 env stack. No secrets in chat/logs.

### Step B — Open staging shell — **pending**

`http://localhost:4321/__admin-staging-shell/musician-basic/#schedule`

### Step C — Select target row — **pending**

Row picker → `888c58f2-f152-4563-a3cf-a20d7c2456c1` / `schedule-2026-03-001` / `<ごちまきトリオ>`.

### Step D — Loaded DB baseline — **pending**

`Description` → `Loaded from DB (read-only)` must equal §2 original (no marker). **STOP** if marker present.

### Step E — Description candidate (smoke marker) — **pending**

Edit **YOUR EDIT (CANDIDATE)** only → §2 smoke candidate.

### Step F — G-9 Preview (operator manual once) — **pending**

Click `#site-slug-edit-dry-run-preview-btn` once.

**Expected preview (`#site-slug-edit-dry-run-result`):**

| Field | Expected |
| --- | --- |
| actualWrite | `false` |
| wouldWrite | `true` |
| changedFields | `description` only |
| target.id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| before.description | original (no marker) |
| after.description | includes G-9g3h1a smoke marker |
| optimisticLock.stale | `false` |
| hostGatePassed | `true` |
| payload | `description` only |

### Step G — Save gate (do not click yet) — **pending**

| Check | Expected |
| --- | --- |
| Mode | G-9g3g general operational (restore arm **off**) |
| approvalId | `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |
| env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=true` |
| preview | valid |
| changedFields | `description` only |
| candidate/preview match | yes |
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
| beforeSnapshot.description | original |
| afterSnapshot.description | includes G-9g3h1a smoke marker |
| updated_at | changes from preview baseline |
| serviceRoleUsed | `false` |
| production | untouched |

### Step I — Re-click prevention (no second Save) — **pending**

After Step H success, **do not click Save again**.

| Check | Expected |
| --- | --- |
| Save button | **disabled** |
| Result panel | executed-state; re-click blocked message |
| Gate panel | consumed preview / fresh Preview required |
| Same preview identity | cannot re-enable Save |

**STOP** if Save remains enabled — report without clicking.

### Step J — Candidate change behavior (no second Preview/Save) — **pending**

Change description candidate slightly (e.g. append space or edit marker text). **Do not** run Preview or Save.

| Check | Expected |
| --- | --- |
| Success state | cleared or no longer enables Save |
| Gate panel | fresh Preview required |
| Save button | **disabled** until new Preview |

Safe scope: candidate change → Save disabled confirmation only.

---

## 6. Wrong buttons / forbidden paths

- Legacy G-6 preview/update panels
- `#schedule-dry-run-update-btn`
- G-9g3d PoC Save (`#site-slug-edit-g9g3d-save-btn`)
- G-9g2 / G-9g3b / G-9g3c PoC Save buttons
- G-9g3g5 restore mode / restore approval / restore arm
- G-9g3g4 / G-9g3g5c re-click
- SQL rollback / restore SQL
- FTP / deploy / `workflow_dispatch`
- Cursor / AI / Playwright Save or Preview

---

## 7. Stop conditions (before Save)

**STOP immediately** if any:

- Wrong target row id / legacy_id / title
- Loaded description is not original (marker still present)
- `changedFields` includes anything other than `description`
- Payload includes non-description fields
- `hostGatePassed=false`
- Active host is not `kmjqppxjdnwwrtaeqjta.supabase.co`
- Production host `vsbvndwuajjhnzpohghh.supabase.co` active
- Approval ID is not G-9g3g general operational ID
- Restore arm is on
- Any PoC arm is on
- Preview stale
- Candidate / preview mismatch
- Save enabled for unknown reason
- Operator uncertainty

---

## 8. Post-smoke restore plan (recommendation)

If Step H succeeds, G-9g3h1a smoke marker **remains** in staging DB until removed.

**Recommended (separate phases — do not combine with G-9g3h1a smoke):**

```txt
G-9g3h1a-save-success-reclick-prevention-smoke-test     ← this phase (Save once + re-click check)
G-9g3h1a-smoke-test-result-execution                    ← fill result doc after smoke
G-9g3h1b-smoke-marker-restore-preflight                   ← restore original description
G-9g3h1c-smoke-marker-restore-execution                 ← dedicated restore Save once
```

Rationale: mirrors G-9g3g4 → G-9g3g5c round-trip; keeps smoke scope to re-click prevention only; restore uses separate approval/env if needed (or reuse G-9g3g5 restore path with G-9g3h1a-specific candidate).

**Do not** run restore in G-9g3h1a smoke preparation or execution without `G-9g3h1b` preflight.

---

## 9. Operator pass record (fill after execution)

| Field | Value |
| --- | --- |
| Operator | |
| Date | |
| Preview clicked | |
| Save clicked | |
| actualWrite | |
| rowsAffected | |
| re-click blocked confirmed | |
| candidate change behavior confirmed | |
| Notes | |

---

## 10. Git

```txt
G-9g3h1 implementation: 8780f84 (pushed)
G-9g3h1a smoke runbook: operator pending (uncommitted)
```
