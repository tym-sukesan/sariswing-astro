# Staging shell schedule site_slug operational general edit — restore approval arm implementation (G-9g3g5b1)

## Phase

`G-9g3g5b1-operational-restore-approval-arm-implementation`

## Status

**implementation complete** — restore execution **not** performed in this phase.

## Restore approval ID

`G-9g3g5-schedule-site-slug-operational-restore-non-dry-run`

## Restore env arm

`PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED`

## Implementation gap (G-9g3g5b audit)

| Gap (G-9g3g5b) | G-9g3g5b1 status |
| --- | --- |
| `schedule-write-types.ts` allowlist | **resolved** — `G9G3G5_SCHEDULE_OPERATIONAL_RESTORE_NON_DRY_RUN_APPROVAL_ID` registered |
| Restore config (`getG9G3g5OperationalRestoreConfig`) | **resolved** |
| Restore guards / save executor | **resolved** — `assertG9G3g5Restore*` + `executeG9G3g5OperationalRestoreSave` |
| UI gate (`canEnableG9G3g5OperationalRestoreSave` / restore mode panel) | **resolved** |
| Single-arm mutual exclusion (G-9g3g ↔ G-9g3g5 + PoC arms) | **resolved** |
| PoC configs check G-9g3g5 arm off | **resolved** |
| Row picker restore target selectable | **resolved** — `isG9G3g4OperationalRestoreTargetRow` exception |

**Unresolved (by design — later phases):**

- G-9g3g5b2 UI gate smoke test not run
- G-9g3g5c restore execution not run
- Live `updated_at` reconfirm before G-9g3g5c

## Allowlist

`SCHEDULE_WRITE_APPROVAL_IDS` includes restore ID separate from `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run`.

## Single-arm mutual exclusion

When any of the following arms is on, all others must be off:

- G-9g2 title PoC
- G-9g3b venue/description PoC
- G-9g3c time/price PoC
- G-9g3d general edit PoC
- G-9g3g operational Save
- G-9g3g5 restore

G-9g3g operational arm + G-9g3g5 restore arm **cannot** both be on.

## Save gate

Same operational Save button (`#site-slug-edit-g9g3g-operational-save-btn`) and result panel (`#site-slug-edit-g9g3g-operational-save-result`).

Restore mode gates:

- restore approval ID + restore env arm required
- `changedFields` = `description` only
- payload = `description` only → original candidate
- target row id / legacy_id / site_slug match
- `before.description` includes G-9g3g4 temporary marker
- `after.description` equals original candidate
- optimistic lock + host gate + signed-in staging admin
- `ENABLE_ADMIN_STAGING_WRITE=true`, `PUBLIC_ADMIN_WRITE_DRY_RUN=false`
- `service_role` not used

## UI gate copy

Gate panel shows `G-9g3g5 restore mode` when restore arm active, restore approval ID, restore env arm, and warning not to re-click G-9g3g4 Save.

## Target row / restore candidate

| Field | Value |
| --- | --- |
| id | `888c58f2-f152-4563-a3cf-a20d7c2456c1` |
| legacy_id | `schedule-2026-03-001` |
| site_slug | `gosaki-piano` |
| title | `<ごちまきトリオ>` |
| lock baseline `updated_at` | `2026-06-18T16:35:45.060011+00:00` |
| current marker | `[CMS Kit staging] G-9g3g4 operational Save test — temporary marker` in description |
| restore candidate | original description without marker (`G9G3G4_OPERATIONAL_DESCRIPTION_ORIGINAL`) |
| changedFields | `description` only |

## Execution status (this phase)

| Action | Status |
| --- | --- |
| Save clicked | **no** |
| Preview clicked by Cursor | **no** |
| DB write | **not executed** |
| SQL / rollback / restore | **not executed** |
| Marker in staging DB | **yes** — unchanged |

## Gates

```txt
stagingShellScheduleSiteSlugOperationalRestoreApprovalArmImplementationComplete: true
readyForG9g3g5b2OperationalRestoreApprovalArmUiGateSmokeTest: true
readyForG9g3g5cOperationalRestoreExecution: false
markerRemainsInStagingDb: true
restoreExecuted: false
dbWriteExecuted: false
saveNotClicked: true
previewNotClickedByCursor: true
serviceRoleUsed: false
```

## Next phase recommendation

**Recommended:** `G-9g3g5b2-operational-restore-approval-arm-ui-gate-smoke-test`

Do **not** jump directly to `G-9g3g5c-operational-restore-execution` unless UI gate smoke is explicitly waived.

Then: `G-9g3g5c-operational-restore-execution` (operator Preview once → Save once).
