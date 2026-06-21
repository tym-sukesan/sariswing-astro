# G-9k4a — Gosaki schedule existing event UI Save enable implementation preflight

Phase: `G-9k4a-gosaki-schedule-existing-event-ui-save-enable-implementation-preflight`

## Scope (this phase)

| Item | Status |
| --- | --- |
| Save executor module | **yes** |
| UI Save wiring + gate | **yes** |
| before/after / updated_at display | **yes** |
| Cursor Save click | **no** |
| DB write / non-dry-run execution | **no** (G9K_SAVE_BUTTON_SAVE_ENABLED=false) |

## Default

```txt
G9K_SAVE_BUTTON_SAVE_ENABLED = false
```

Save remains disabled in routine dev until G-9k4 sets compile-time gate + env arm stack.

## Env / approval stack (all required when Save enabled)

```txt
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_WRITE_DRY_RUN=false
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9k-gosaki-schedule-existing-event-save-button-non-dry-run
```

Do **not** reuse G-9j5 approval/arm.

## Save button enable conditions

- signed-in staging admin session
- existing event selected (`site_slug=gosaki-piano`, `updated_at` present)
- dry-run OK (`ready_to_save` when Save enabled; `ready_but_save_disabled` when gate off)
- changedFields ≥ 1 (6 safe fields only)
- payload keys ⊆ safe fields
- title non-empty
- G-9k env arm + approvalId satisfied
- `G9K_SAVE_BUTTON_SAVE_ENABLED=true` (G-9k4)

## Save click safety flow

1. Re-check auth session
2. Re-check project ref allowlist / sari-site block
3. Re-check `site_slug=gosaki-piano`
4. Re-check optimistic lock `updated_at`
5. Re-run dry-run guards; recompute changedFields / payload
6. `updateScheduleWrite` — 1 row only
7. Post-save fetch; `rowsAffected === 1`
8. Verify post-save changedFields
9. Update UI row `updated_at`; reset dry-run state

## Modules

- `gosaki-schedule-existing-event-save-button-save.ts`
- `gosaki-schedule-existing-event-save-button-config.ts` (`evaluateG9kOperatorSaveButtonUiGate`)
- `gosaki-staging-schedule-operator-ui.ts`

## Gates

```txt
gosakiScheduleExistingEventUiSaveEnableImplementationPreflightComplete: true
G9K_SAVE_BUTTON_SAVE_ENABLED: false
readyForG9k4OperatorManualSaveOnce: true
readyForAnyDbWrite: false
cursorClickedSave: false
```

## Next

`G-9k4-gosaki-schedule-existing-event-save-button-manual-save-once` — operator manual Save once.

## Verifier

```bash
node tools/static-to-astro/scripts/verify-g9k4a-gosaki-schedule-existing-event-ui-save-enable-implementation-preflight.mjs
```
