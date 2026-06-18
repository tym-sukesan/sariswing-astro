# Staging shell schedule site_slug operational general edit restore preflight (G-9g3g5b)

**Phase:** `G-9g3g5b-operational-restore-preflight`  
**Status:** **preflight complete / restore execution pending**  
**Date:** 2026-06-18  
**Prior:** G-9g3g5 planning — commit `d202797`  
**Type:** restore preflight + implementation gap audit — **no Save, no Preview by Cursor, no DB write, no SQL, no restore execution**

| Check | Status |
| --- | --- |
| Save clicked (this phase) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed (this phase) | **no** |
| Restore executed | **no** |
| Rollback SQL executed | **no** |
| service_role used | **no** |

Prior docs:

- [staging-shell-schedule-site-slug-operational-general-edit-post-execution-hardening-and-restore-decision.md](./staging-shell-schedule-site-slug-operational-general-edit-post-execution-hardening-and-restore-decision.md)
- [staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-execution-result.md](./staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-execution-result.md)
- [staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-preflight.md](./staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-preflight.md)

**Do not re-click G-9g3g4 operational Save.** **Do not use SQL rollback.**

---

## Gates

```txt
stagingShellScheduleSiteSlugOperationalRestorePreflightComplete: true
readyForG9g3g5b1OperationalRestoreApprovalArmImplementation: true
readyForG9g3g5cOperationalRestoreExecution: false
markerRemainsInStagingDb: true
restoreExecuted: false
readyForAnyDbWrite: false
```

**Blocker:** restore-dedicated approval / env arm **not implemented** in write path — see §4.

---

## 1. Target row / current marker baseline

| Field | Value |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| title | `<ごちまきトリオ>` |
| expected current updated_at (G-9g3g4) | `2026-06-18T16:35:45.060011+00:00` |
| changedFields (restore) | `description` only |

### Current description (expected in staging DB)

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
[CMS Kit staging] G-9g3g4 operational Save test — temporary marker
```

### Restore candidate (`description` only)

```txt
出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo
会場website: https://subsaku.com/ginza/
```

```json
{
  "description": "出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo\n会場website: https://subsaku.com/ginza/"
}
```

**Operator:** Reconfirm live `currentUpdatedAt` via UI hydrate / Preview before G-9g3g5c Save — do not assume G-9g3g4 value without Preview.

---

## 2. Restore approval / env stack (G-9g3g5c — not armed in this phase)

### Restore-dedicated (recommended — requires G-9g3g5b1 implementation)

```txt
approval ID: G-9g3g5-schedule-site-slug-operational-restore-non-dry-run
env arm:     PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=true
```

### Inline dev arm (G-9g3g5c only — operator; do not commit secrets)

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=schedule \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g3g5-schedule-site-slug-operational-restore-non-dry-run \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=true \
PUBLIC_SUPABASE_URL="https://kmjqppxjdnwwrtaeqjta.supabase.co" \
PUBLIC_SUPABASE_ANON_KEY="<staging anon key>" \
npm run dev
```

### Single-arm rule (restore stack)

| Arm | Required |
| --- | --- |
| `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED` | **on** |
| `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED` | **off** |
| G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC arms | **off** |
| staging host `kmjqppxjdnwwrtaeqjta.supabase.co` | only |
| production host `vsbvndwuajjhnzpohghh.supabase.co` | blocked |
| `service_role` | **forbidden** |

**G-9g3g5b:** do not arm this stack; do not click Save.

---

## 3. Implementation gap audit

Audit date: 2026-06-18 (G-9g3g5b preflight). Code read only — no runtime Save.

| # | Component | Restore ID / arm | Status |
| --- | --- | --- | --- |
| 1 | `staging-schedule-site-slug-config.ts` | constants `G9G3G5_OPERATIONAL_RESTORE_*` | **implemented** (planning constants only) |
| 2 | `schedule-write-types.ts` | approval ID in union + `SCHEDULE_WRITE_APPROVAL_IDS` | **not implemented** |
| 3 | `staging-schedule-site-slug-operational-restore-config.ts` (or extend operational config) | `getG9G3g5OperationalRestoreConfig()` | **not implemented** |
| 4 | `schedule-write-guards.ts` | `assertG9G3g5RestorePayloadOnly` (description → original, marker removed) | **not implemented** |
| 5 | `staging-schedule-site-slug-operational-restore-save.ts` | `executeG9G3g5OperationalRestoreSave()` | **not implemented** |
| 6 | `staging-schedule-site-slug-edit-ui.ts` | `canEnableG9G3g5OperationalRestoreSave()` + gate panel | **not implemented** |
| 7 | `staging-schedule-site-slug-operational-general-edit-config.ts` | mutual exclusion: G-9g3g arm off when G-9g3g5 restore arm on | **not implemented** (G-9g3g5 arm not checked) |
| 8 | PoC / G-9g3g operational configs | G-9g3g5 restore arm must be off in routine / G-9g3g path | **not implemented** |
| 9 | `AdminStagingScheduleSiteSlugEditSection.astro` | restore approval ID in gate display | **not implemented** |
| 10 | Save executor wiring | accepts `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run` | **not implemented** — only `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` |

### Audit conclusion

```txt
restoreDedicatedApprovalEnv: config constants only — NOT wired
uiSavePossibleWithRestoreArmToday: false
blocker: yes
readyForG9g3g5cOperationalRestoreExecution: false
recommendedNextPhase: G-9g3g5b1-operational-restore-approval-arm-implementation
```

**Why G-9g3g arm cannot be used for restore today without G-9g3g5b1:**

- `getG9G3gOperationalGeneralEditConfig()` requires `PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run` and G-9g3g arm — restore stack would fail arm check.
- Re-arming G-9g3g for restore would reuse the G-9g3g4 test approval ID — violates G-9g3g5 dedicated-restore design and risks operator confusion with “second general edit.”

**G-9g3g5c execution is blocked until G-9g3g5b1 completes.**

---

## 4. Expected G-9 Preview (G-9g3g5c — operator manual)

**Press — OK (after G-9g3g5b1):**

| Item | Value |
| --- | --- |
| Section | G-9 site_slug general edit |
| Button label | `Preview G-9 site_slug general edit dry-run` |
| Button id | `#site-slug-edit-dry-run-preview-btn` |
| Result panel id | `#site-slug-edit-dry-run-result` |

**Expected preview result:**

| Check | Expected |
| --- | --- |
| actualWrite | `false` |
| wouldWrite | `true` |
| changedFields | `description` only |
| target.id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| target.legacy_id | `schedule-2026-03-001` |
| target.site_slug | `gosaki-piano` |
| before.description | includes G-9g3g4 temporary marker |
| after.description | equals restore candidate §1 (no marker) |
| optimisticLock.stale | `false` |
| hostGatePassed | `true` |
| payload | `{ "description": "<restore candidate>" }` only |

**G-9g3g5b:** Preview not clicked.

---

## 5. Expected Restore Save (G-9g3g5c — operator manual once)

**Press — OK (after G-9g3g5b1 — same button id, restore gate):**

| Item | Value |
| --- | --- |
| Button label | `Save operational general edit` |
| Button id | `#site-slug-edit-g9g3g-operational-save-btn` |
| Result panel id | `#site-slug-edit-g9g3g-operational-save-result` |

**Expected Save result:**

| Check | Expected |
| --- | --- |
| operator manual | once only |
| actualWrite | `true` |
| rowsAffected | `1` |
| approvalId | `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run` |
| changedFields | `description` only |
| beforeSnapshot.description | includes marker |
| afterSnapshot.description | equals original (no marker) |
| updated_at | changes from G-9g3g4 baseline |
| serviceRoleUsed | `false` |
| production | untouched |

**G-9g3g5b:** Save not clicked.

---

## 6. Stop conditions (before restore Save in G-9g3g5c)

Stop immediately if any occur:

- Current loaded description **lacks** G-9g3g4 temporary marker
- Wrong target row (id / legacy_id / title / site_slug)
- `changedFields` includes anything other than `description`
- Payload includes fields other than `description`
- Preview `optimisticLock.stale=true`
- Candidate / preview mismatch
- `hostGatePassed=false` or non-staging `activeHost`
- `PUBLIC_ADMIN_WRITE_APPROVAL_ID` is not restore dedicated ID
- Restore env arm not `true`
- G-9g3g operational arm or any PoC arm simultaneously on
- Save enabled for unknown reason
- Operator uncertainty

---

## 7. Wrong buttons / forbidden paths

| Item | Reason |
| --- | --- |
| Re-click G-9g3g4 operational Save | Frozen — append test complete |
| G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save | Wrong path |
| Legacy G-6 `#schedule-dry-run-update-btn` | Invalid approval |
| SQL rollback / restore SQL | Discouraged — use UI restore after G-9g3g5b1 |
| FTP / deploy / workflow_dispatch | Out of scope |

---

## 8. Operator checklist (G-9g3g5c — after G-9g3g5b1)

1. Confirm G-9g3g5b1 implementation verifier passes
2. Stop routine dev; arm §2 restore stack only
3. Open `/#schedule`; select target row (may need filter override if `[CMS Kit staging]` hidden)
4. Set Description candidate to §1 restore candidate only
5. Preview once — verify §4
6. Confirm gate shows **restore** approval ID
7. Save once — verify §5
8. Restart routine dev (dry-run, all arms off)
9. Do not Save again

---

## 9. Safety checklist (G-9g3g5b)

| Check | Status |
| --- | --- |
| Save clicked | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed | **no** |
| Restore executed | **no** |
| Rollback SQL executed | **no** |
| service_role | **no** |

---

## 10. Next phase

**Recommended:** `G-9g3g5b1-operational-restore-approval-arm-implementation`

Then: `G-9g3g5c-operational-restore-execution` → `G-9g3g5d-post-restore-hardening`

**Do not skip to G-9g3g5c** until restore arm implementation is complete and verified.

---

## 11. Git

```txt
G-9g3g5 committed at: d202797
G-9g3g5b preflight: complete (uncommitted)
```
