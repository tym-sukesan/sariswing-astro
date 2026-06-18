# Staging shell schedule site_slug operational restore approval arm UI gate smoke test result (G-9g3g5b2)

**Phase:** `G-9g3g5b2-operational-restore-approval-arm-ui-gate-smoke-test`  
**Status:** **G-9g3g5b2 operational restore approval arm UI gate smoke passed**  
**Date:** 2026-06-18  
**Prior:** G-9g3g5b1 restore approval arm implementation — commit `23b7b68`  
**Type:** operator manual UI — **no Save, no DB write, no Supabase SQL mutation, no restore execution**

| Check | Status |
| --- | --- |
| Save clicked | **no** |
| Preview clicked (Cursor/AI) | **no** |
| Preview clicked (operator manual) | **yes** (Step F — once) |
| DB write executed | **no** |
| SQL / rollback executed | **no** |
| restore executed | **no** |
| service_role used | **no** |

Prior docs:

- [staging-shell-schedule-site-slug-operational-general-edit-restore-approval-arm-implementation.md](./staging-shell-schedule-site-slug-operational-general-edit-restore-approval-arm-implementation.md)
- [staging-shell-schedule-site-slug-operational-general-edit-restore-preflight.md](./staging-shell-schedule-site-slug-operational-general-edit-restore-preflight.md)
- [staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-execution-result.md](./staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-execution-result.md)

**Do not re-click G-9g3g4 operational Save.** **Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.**

---

## Gates

```txt
stagingShellScheduleSiteSlugOperationalRestoreApprovalArmUiGateSmokeTestPassed: true
readyForG9g3g5cOperationalRestoreExecution: true
operatorPending: false
operatorManualRowSelectClicked: true
operatorManualPreviewClicked: true
operatorManualStaleInvalidationConfirmed: true
cursorClickedSave: false
cursorClickedPreview: false
restoreExecuted: false
dbWriteExecuted: false
markerRemainsInStagingDb: true
serviceRoleUsed: false
productionUntouched: true
```

**Save not clicked.** **DB write not executed.** **SQL mutation not executed.** **restore not executed.** **service_role not used.** **production untouched.**

Operator stopped restore-arm dev server after smoke; return to routine dev safety.

**Next:** `G-9g3g5c-operational-restore-execution`

---

## 1. Restore target

| Field | Value |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| title | `<ごちまきトリオ>` |
| lock baseline `updated_at` | `2026-06-18T16:35:45.060011+00:00` (reconfirm live before G-9g3g5c) |

### Loaded description (marker in DB — confirmed Step D)

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
[CMS Kit staging] G-9g3g4 operational Save test — temporary marker
```

### Restore candidate (no marker)

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
```

---

## 2. Restore approval / env stack (smoke)

```txt
approval ID: G-9g3g5-schedule-site-slug-operational-restore-non-dry-run
env arm:     PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=true
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g3g5-schedule-site-slug-operational-restore-non-dry-run
```

**Host:** `kmjqppxjdnwwrtaeqjta.supabase.co` — passed  
**Production host** `vsbvndwuajjhnzpohghh.supabase.co` — **blocked** / untouched  
**service_role:** not used

---

## 3. Exact UI controls

### G-9 Preview (operator manual — Step F)

| Item | Value |
| --- | --- |
| Section | G-9 site_slug general edit |
| Preview button label | `Preview G-9 site_slug general edit dry-run` |
| Preview button id | `#site-slug-edit-dry-run-preview-btn` |
| Result panel title | `G-9 site_slug general edit preview result` |
| Result panel id | `#site-slug-edit-dry-run-result` |

### Operational / restore Save (gate viewed — **not clicked**)

| Item | Value |
| --- | --- |
| Save button label | `Save operational general edit` |
| Save button id | `#site-slug-edit-g9g3g-operational-save-btn` |
| Save result panel id | `#site-slug-edit-g9g3g-operational-save-result` |
| Save gate panel id | `#site-slug-edit-save-gate-panel` |

---

## 4. Operator steps — results

### Step A — Restore env stack dev server — **PASS**

Restore env stack started; staging host only; `service_role` not used.

---

### Step B — Staging shell — **PASS**

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/#schedule
```

Staging admin signed in.

---

### Step C — Select restore target row — **PASS**

| Field | Value |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| title | `<ごちまきトリオ>` |

PoC audit row `aa440e29-5be8-402e-9190-0d81c48434c0` — **not** selected.

---

### Step D — Marker baseline in Loaded description — **PASS**

Loaded DB description included G-9g3g4 temporary marker (see §1).

---

### Step E — Description candidate set to restore candidate — **PASS**

Only `Description` / `YOUR EDIT (CANDIDATE)` changed to restore candidate (no marker).

---

### Step F — G-9 Preview (operator manual once) — **PASS**

Correct G-9 Preview path used (`#site-slug-edit-dry-run-preview-btn` → `#site-slug-edit-dry-run-result`).

| Check | Result |
| --- | --- |
| actualWrite | `false` |
| wouldWrite | `true` |
| changedFields | `description` only |
| target.id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| target.legacy_id | `schedule-2026-03-001` |
| target.site_slug | `gosaki-piano` |
| optimisticLock.expectedBeforeUpdatedAt | `2026-06-18T16:35:45.060011+00:00` |
| optimisticLock.currentUpdatedAt | `2026-06-18T16:35:45.060011+00:00` |
| optimisticLock.stale | `false` |
| activeHost | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| expectedHost | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| hostGatePassed | `true` |
| payload (changed-fields-only) | `{ "description": "出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo\n会場website: https://subsaku.com/ginza/" }` |

**before.description** (includes temporary marker):

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
[CMS Kit staging] G-9g3g4 operational Save test — temporary marker
```

**after.description** (equals original — no marker):

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
```

---

### Step G — Restore Save gate (view only — Save **not** clicked) — **PASS**

Observed gate panel:

```txt
G-9g3g5 restore mode: enabled — operator manual only
approvalId: G-9g3g5-schedule-site-slug-operational-restore-non-dry-run
env arm: PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=true
preview target id: 888c58f2-f152-4563-a3cf-a20d7c2456c1
preview: valid
changedFields: description
Host gate: passed (kmjqppxjdnwwrtaeqjta.supabase.co)
Auth: staging admin signed in
```

Save button hint: `Ready for restore Save (manual only — not auto-clicked)`

| Check | Result |
| --- | --- |
| restore mode | `G-9g3g5 restore mode` shown |
| approvalId | `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run` |
| env arm | `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=true` |
| preview | valid |
| changedFields | `description` only |
| marker-before | confirmed in preview |
| original-after | confirmed in preview |
| Save button state | **enabled** — operator did **not** click |

---

### Step H — Stale blocks Save — **PASS**

After candidate change post-Preview:

| Observation | Result |
| --- | --- |
| Stale message | `Preview is stale — run G-9 preview again` |
| Gate (restore mode disabled) | `G-9g3g5 restore mode: disabled — Latest G-9 preview required` |
| Save hint | `Save operational restore disabled — Latest G-9 preview required` |
| Save button | **disabled** — stale blocks Save |

---

### Step I — Mutual exclusion — **PASS** (code/verifier)

No multi-arm runtime test. Mutual exclusion confirmed via `verify-g9g3g5b1-operational-restore-approval-arm-implementation.mjs` and config/UI `cannot both be on` markers.

---

## 5. Wrong buttons / forbidden paths — observed

| Action | Result |
| --- | --- |
| Save (`#site-slug-edit-g9g3g-operational-save-btn`) | **not clicked** |
| G-9g3g4 operational Save | **not re-clicked** |
| G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save | **not clicked** |
| SQL rollback / restore SQL | **not executed** |
| FTP / deploy / workflow_dispatch | **not executed** |
| `service_role` | **not used** |
| `/admin` / production | **untouched** |
| Cursor / AI UI clicks | **none** |

---

## 6. Pass criteria — **PASS**

- [x] Restore env stack loads staging shell UI
- [x] Restore target row selectable (id / legacy_id / title verified)
- [x] Loaded description includes temporary marker
- [x] Preview dry-run valid (`actualWrite=false`, `wouldWrite=true`)
- [x] changedFields = `description` only
- [x] before.description includes temporary marker
- [x] after.description equals original (no marker)
- [x] Gate panel shows restore mode + restore approval ID + restore env arm
- [x] G-9g3g operational arm off (restore-only stack)
- [x] Save **not** clicked
- [x] DB write **not** executed
- [x] Stale blocks Save confirmed
- [x] service_role not used
- [x] production untouched

---

## 7. Operator pass record

| Field | Value |
| --- | --- |
| Operator | manual (G-9g3g5b2) |
| Date | 2026-06-18 |
| Dev host | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| Preview clicked (operator) | **yes** (once) |
| Save clicked | **no** |
| DB write | **no** |
| restore executed | **no** |
| Notes | Restore-arm dev server stopped after smoke; routine dev restored |

---

## 8. Next phase

**`G-9g3g5c-operational-restore-execution`** — operator Preview once → Save once (dedicated restore approval ID + arm).

**Do not re-run G-9g3g5b2 smoke.** **Do not click Save again until G-9g3g5c preflight + execution phase.**

---

## 9. Git

```txt
G-9g3g5b1 committed at: 23b7b68
G-9g3g5b2 smoke passed: operator manual (uncommitted)
```
