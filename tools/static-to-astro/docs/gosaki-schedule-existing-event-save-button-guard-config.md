# G-9k1 — Gosaki schedule existing event save button guard / config

Phase: `G-9k1-gosaki-schedule-existing-event-save-button-guard-config-verifier`

## Scope (this phase)

| Item | Status |
| --- | --- |
| G-9k approvalId / env arm | **yes** |
| Guard / config modules | **yes** |
| Verifier | **yes** |
| Save button enabled | **no** |
| Save UI wiring | **no** |
| DB write | **no** |
| G-9j5 runner re-execution | **no** |

## G-9k dedicated identifiers

| Key | Value |
| --- | --- |
| approvalId | `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` |
| env arm | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED` |

**Do not reuse** G-9j5 approval/arm (`G-9j-gosaki-schedule-existing-event-update-non-dry-run` / `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED`).

## Allowed fields (6 safe fields only)

`title`, `venue`, `open_time`, `start_time`, `price`, `description`

## Excluded

`date`, `month`, `published`, `show_on_home`, `home_order`, `sort_order`, `source_route`, `source_file`, `schedule_months`, images, INSERT, DELETE, duplicate save, deploy.

## Safety gates

| Gate | Requirement |
| --- | --- |
| Project | `static-to-astro-cms-staging` / ref `kmjqppxjdnwwrtaeqjta` allowlist |
| Blocked | `sari-site` / ref `vsbvndwuajjhnzpohghh` |
| site_slug | `gosaki-piano` required |
| service_role | not used |
| Auth session | required |
| Optimistic lock | `expectedBeforeUpdatedAt` required |
| Payload | changedFields-only |
| UPDATE scope | 1 row; `rowsAffected === 1` |
| title | non-empty when in payload |
| changedFields | must not be empty |

## Separation from G-9j5

| Path | Purpose |
| --- | --- |
| `gosaki-schedule-existing-event-update-g9j5-config.ts` | Fixed one-row runner (G-9j5) |
| `gosaki-schedule-existing-event-save-button-config.ts` | Operator UI-selected row (G-9k) |
| `gosaki-schedule-existing-event-save-button-guards.ts` | G-9k guards (reuse G-9j field set) |

Single-arm: G-9k arm and G-9j5 arm cannot both be on.

## Modules

- `src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-config.ts`
- `src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-guards.ts`
- `src/lib/admin/staging-write/schedule-write-types.ts` (approval registry)

## Verifier

```bash
node tools/static-to-astro/scripts/verify-g9k1-gosaki-schedule-existing-event-save-button-guard-config.mjs
```

## Next

`G-9k2-gosaki-schedule-existing-event-save-button-ui-wiring` — dry-run gates Save (Save still disabled until G-9k4).

## Gates

```txt
gosakiScheduleExistingEventSaveButtonGuardConfigComplete: true
readyForG9k2SaveButtonUiWiring: true
saveButtonEnabled: false
readyForAnyDbWrite: false
```
