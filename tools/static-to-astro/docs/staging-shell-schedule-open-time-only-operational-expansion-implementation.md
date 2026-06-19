# Staging shell schedule open_time-only operational expansion implementation (G-9g4a2a)

**Phase:** `G-9g4a2a-open-time-only-operational-expansion-implementation`  
**Status:** **complete**  
**Date:** 2026-06-19  
**Prior:** G-9g4a2 text fields operational expansion planning — commit `0d80d7d`; G-9g4a1 venue-only round-trip — commit `3b807c8`  
**Type:** implementation only — **Save not clicked, Preview not clicked by Cursor, no DB write, no SQL mutation**

| Check | Status |
| --- | --- |
| Row picker clicked (Cursor/AI) | **no** |
| Save clicked (this phase) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed (this phase) | **no** |
| SQL mutation executed (this phase) | **no** |
| Restore / rollback SQL executed | **no** |
| service_role used | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |

Prior docs:

- [staging-shell-schedule-text-fields-operational-expansion-planning.md](./staging-shell-schedule-text-fields-operational-expansion-planning.md) (G-9g4a2)
- [staging-shell-schedule-venue-only-operational-expansion-implementation.md](./staging-shell-schedule-venue-only-operational-expansion-implementation.md) (G-9g4a1 pattern)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.** **Do not re-click G-9g3g4 / G-9g3h1 / G-9g4a1 venue-only Save.**

---

## Gates

```txt
stagingShellScheduleOpenTimeOnlyOperationalExpansionImplementationComplete: true
readyForG9g4a2a1OpenTimeOnlyOperationalExpansionPreflight: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

**Recommended next:** `G-9g4a2a1-open-time-only-operational-expansion-preflight`

---

## G-9g4a2 planning reference

- Single-field-first policy: `open_time` only (not `open_time` + `start_time` pair)
- Smoke marker: **not used in implementation phase** (preflight/execution only)
- Restore path: same G-9g4a2a open_time-only UI (not G-9g3g5)

---

## G-9g4a1 success pattern reference

G-9g4a1 venue-only round-trip proved: field-specific approval ID + env arm + guards + UI gate + executor + optimistic lock + re-click prevention + same-path restore. G-9g4a2a clones this structure for `open_time`.

---

## Implementation scope

| Component | Path |
| --- | --- |
| Approval ID / types | `src/lib/admin/staging-write/schedule-write-types.ts` |
| Constants | `src/lib/admin/staging-data/staging-schedule-site-slug-config.ts` |
| Config (env arm) | `src/lib/admin/staging-data/staging-schedule-site-slug-open-time-only-operational-config.ts` |
| Guards | `src/lib/admin/staging-write/schedule-write-guards.ts` |
| Save executor | `src/lib/admin/staging-write/staging-schedule-site-slug-open-time-only-operational-save.ts` |
| UI gates | `src/lib/admin/staging-data/staging-schedule-site-slug-open-time-only-operational-edit-ui.ts` |
| UI init wiring | `src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts` |
| SSR binding | `src/lib/admin/staging-data/staging-schedule-site-slug-edit-binding.ts` |
| Template | `tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro` |
| Re-click mode | `src/lib/admin/staging-data/staging-schedule-site-slug-operational-save-reclick.ts` (`open-time-only`) |

Mutual exclusion: G-9g4a2a arm blocks G-9g4a1 / G-9g3g / G-9g3g5; G-9g4a1 / G-9g3g / G-9g3g5 arms block G-9g4a2a.

---

## Target field

```txt
open_time only
```

---

## Approval ID / env arm

```txt
G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=true
```

- Registered in `SCHEDULE_WRITE_APPROVAL_IDS`
- Env arm default: **off** (not written to `.env` / `.env.local` in this phase)

---

## Payload exact policy

```json
{ "open_time": "<non-empty string>" }
```

- Payload keys === `changedFields` keys === exactly `open_time`
- `open_time` must be non-empty trimmed string (conservative — empty string rejected)
- No extra keys; no forbidden metadata fields

---

## changedFields exact policy

```txt
changedFields: ["open_time"] only
```

---

## open_time-only guard design

| Guard | Purpose |
| --- | --- |
| `assertG9G4a2aOpenTimeOnlyChangedFieldsOnly` | `changedFields` exactly `["open_time"]` |
| `assertG9G4a2aOpenTimeOnlyPayloadOnly` | payload exactly `{ open_time: non-empty string }` |
| `assertG9G4a2aNoRouteDatePublicationImageMutation` | blocks venue, title, description, start_time, price, date, routes, publication, images, ids |
| `assertG9G4a2aOpenTimeOnlyApproval` | approval ID match |
| `assertG9G4a2aOpenTimeOnlyWritableRow` | content row; blocks PoC audit row |
| `buildG9G4a2aOpenTimeOnlyPayload` | non-empty trimmed open_time |

Forbidden in same Save: `venue`, `title`, `description`, `start_time`, `price`, `date`, `year`, `month`, `source_route`, `source_file`, `published`, `show_on_home`, `home_order`, `sort_order`, `image_url`, `home_image_url`, `id`, `legacy_id`, `site_slug`, `created_at`, `updated_at`.

---

## UI gate / button IDs

| Element | id |
| --- | --- |
| open_time-only Preview | `#site-slug-edit-g9g4a2a-open-time-only-dry-run-preview-btn` |
| open_time-only Preview result | `#site-slug-edit-g9g4a2a-open-time-only-dry-run-result` |
| Save gate panel | `#site-slug-edit-g9g4a2a-open-time-only-save-gate-panel` |
| open_time-only Save | `#site-slug-edit-g9g4a2a-open-time-only-save-btn` |
| Save result | `#site-slug-edit-g9g4a2a-open-time-only-save-result` |

Save button default: `disabled=true`. Gate panel refreshes **after** `g9g4a2aOpenTimeOnlyPreviewValid = true` (G-9g4a1 gate sync pattern).

---

## Optimistic lock policy

- `expectedBeforeUpdatedAt` from loaded row at Preview
- stale check blocks Save enablement
- Save passes lock baseline via `buildScheduleLockedWriteRequest`
- Re-run Preview required when `updated_at` changes

---

## Re-click prevention policy

- One Save per preview identity (`open-time-only` mode)
- After successful Save: Preview consumed message; Save disabled
- `g9g4a2aOpenTimeOnlySaveSuccess` gates operator-completed copy
- Pattern matches G-9g3h1 / G-9g4a1

---

## Mutual exclusion policy

When `PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=true`:

```txt
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

Config modules enforce mutual exclusion at arm evaluation time.

---

## Routine dev safety

```txt
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

- Do **not** write arms to `.env` / `.env.local`
- Staging host only; production blocked
- `service_role` forbidden

---

## Safety flags (this phase)

```json
{
  "serviceRoleUsed": false,
  "productionBlocked": true,
  "scheduleMonthsTouched": false,
  "deleteEnabled": false,
  "publishTriggered": false,
  "stagingOnly": true
}
```

---

## Forbidden operations (this phase)

| Operation | Status |
| --- | --- |
| Cursor/AI row picker click | **no** |
| Cursor/AI Preview click | **no** |
| Cursor/AI Save click | **no** |
| DB write / SQL mutation | **no** |
| Rollback / restore SQL | **no** |
| FTP / workflow_dispatch / deploy | **no** |
| Smoke marker in DB | **no** (implementation phase) |

---

## Recommended next phase

**`G-9g4a2a1-open-time-only-operational-expansion-preflight`**

Target row selection, before.open_time, optional smoke candidate documentation, rollback SQL document-only, env stack for execution window — **no operator Save in preflight phase**.
