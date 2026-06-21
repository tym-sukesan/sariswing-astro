# G-9k2 — Gosaki schedule existing event save button UI wiring

Phase: `G-9k2-gosaki-schedule-existing-event-save-button-ui-wiring-dry-run-gate`

## Scope (this phase)

| Item | Status |
| --- | --- |
| Operator edit form dry-run wiring | **yes** |
| changedFields / payload keys / guard display | **yes** |
| Save readiness display | **yes** |
| Save button DB UPDATE | **no** |
| non-dry-run executor | **no** |
| DB write | **no** |

## Flow

1. Select existing event from list
2. Edit 6 safe fields
3. Click 「変更を確認」 → `executeG9kExistingEventSaveButtonDryRun`
4. UI shows changedFields, payload keys, guard result, optimistic lock baseline
5. On OK: 「保存準備OK。ただし G-9k2 では実保存未開放」
6. 「更新する」 remains disabled; click shows safe-stop message

## Modules

- `gosaki-schedule-existing-event-save-button-dry-run.ts`
- `gosaki-staging-schedule-operator-ui.ts`
- `AdminGosakiStagingScheduleOperatorPage.astro`

## Gates

```txt
gosakiScheduleExistingEventSaveButtonUiWiringComplete: true
G9K_SAVE_BUTTON_SAVE_ENABLED: false
readyForG9k3DryRunVerification: true
readyForAnyDbWrite: false
```

## Next

`G-9k3` — dry-run verification (static). `G-9k4` — one manual Save (operator).

## Verifier

```bash
node tools/static-to-astro/scripts/verify-g9k2-gosaki-schedule-existing-event-save-button-ui-wiring.mjs
```
