# Staging shell schedule venue-only operational expansion implementation (G-9g4a1)

**Phase:** `G-9g4a1-venue-only-operational-expansion-implementation`  
**Status:** **complete**  
**Date:** 2026-06-19  
**Prior:** G-9g4a text fields operational expansion planning — commit `9a38c11`  
**Type:** implementation only — **Save not clicked, Preview not clicked by Cursor, no DB write, no SQL mutation**

| Check | Status |
| --- | --- |
| Save clicked (this phase) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed (this phase) | **no** |
| SQL mutation executed (this phase) | **no** |
| Restore / rollback SQL executed | **no** |
| service_role used | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |

Prior doc: [staging-shell-schedule-text-fields-operational-expansion-planning.md](./staging-shell-schedule-text-fields-operational-expansion-planning.md)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.** **Do not re-click G-9g3g4 / G-9g3h1 operational Save.**

---

## Gates

```txt
stagingShellScheduleVenueOnlyOperationalExpansionImplementationComplete: true
readyForG9g4a1aVenueOnlyOperationalExpansionPreflight: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

**Recommended next:** `G-9g4a1a-venue-only-operational-expansion-preflight`

---

## Implementation scope

| Component | Path |
| --- | --- |
| Approval ID / types | `src/lib/admin/staging-write/schedule-write-types.ts` |
| Constants | `src/lib/admin/staging-data/staging-schedule-site-slug-config.ts` |
| Config (env arm) | `src/lib/admin/staging-data/staging-schedule-site-slug-venue-only-operational-config.ts` |
| Guards | `src/lib/admin/staging-write/schedule-write-guards.ts` |
| Save executor | `src/lib/admin/staging-write/staging-schedule-site-slug-venue-only-operational-save.ts` |
| UI gates | `src/lib/admin/staging-data/staging-schedule-site-slug-venue-only-operational-edit-ui.ts` |
| UI init wiring | `src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts` |
| SSR binding | `src/lib/admin/staging-data/staging-schedule-site-slug-edit-binding.ts` |
| Template | `tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro` |
| Re-click mode | `src/lib/admin/staging-data/staging-schedule-site-slug-operational-save-reclick.ts` (`venue-only`) |

Mutual exclusion: G-9g4a1 arm blocks G-9g3g / G-9g3g5; G-9g3g / G-9g3g5 arms block G-9g4a1.

---

## Approval ID / env arm

```txt
G-9g4a1-schedule-site-slug-venue-only-non-dry-run
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=true
```

- Registered in `SCHEDULE_WRITE_APPROVAL_IDS`
- Env arm default: **off** (not written to `.env` / `.env.local` in this phase)
- Distinct from `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run`

---

## Venue-only guard design

| Guard | Purpose |
| --- | --- |
| `assertG9G4a1VenueOnlyChangedFieldsOnly` | `changedFields` exactly `["venue"]` |
| `assertG9G4a1VenueOnlyPayloadOnly` | payload exactly `{ venue: non-empty string }` |
| `assertG9G4a1NoRouteDatePublicationImageMutation` | no date/route/publication/image/id metadata |
| `assertG9G4a1VenueOnlyApproval` | approval ID match |
| `assertG9G4a1VenueOnlyWritableRow` | content row; blocks PoC audit / pilot row |
| `buildG9G4a1VenueOnlyPayload` | non-empty trimmed venue |

Forbidden in same Save: title, description, open_time, start_time, price, date, year, month, source_route, source_file, published, show_on_home, home_order, sort_order, image_url, home_image_url, id, legacy_id, site_slug, created_at, updated_at.

---

## UI gate / button IDs

| Element | id |
| --- | --- |
| Venue-only Preview | `#site-slug-edit-g9g4a1-venue-only-dry-run-preview-btn` |
| Venue-only Preview result | `#site-slug-edit-g9g4a1-venue-only-dry-run-result` |
| Save gate panel | `#site-slug-edit-g9g4a1-venue-only-save-gate-panel` |
| Venue-only Save | `#site-slug-edit-g9g4a1-venue-only-save-btn` |
| Save result | `#site-slug-edit-g9g4a1-venue-only-save-result` |

Gate panel copy includes: `G-9g4a1 venue-only`, `changedFields: venue`, approval ID, env arm status, host gate, optimistic lock, `preview: valid` when fresh Preview succeeded, re-click blocked only after Save success, operator manual only, routine dev safety.

**G-9g4a1b1 gate sync fix:** valid Preview must refresh Save button/gate **after** preview state assignment — not inside `renderG9g4a1VenueOnlyDryRunResult` before `g9g4a1VenueOnlyPreviewValid = true`. Save-completed copy is shown only when `g9g4a1VenueOnlySaveSuccess` is set.

---

## Preview behavior

| Rule | Value |
| --- | --- |
| `actualWrite` | **false** always |
| `wouldWrite` | true when venue changed vs loaded row |
| `changedFields` | exactly `["venue"]` or preview error |
| Non-venue fields | must match loaded row |
| `venue` candidate | non-empty |
| PoC audit row | blocked |
| Optimistic lock stale | blocks Save enablement |
| `hostGatePassed` | required for Save |
| Save gate refresh | after `g9g4a1VenueOnlyPreviewValid = true` and preview identity assignment (G-9g4a1b1 gate sync fix — matches G-9g3g pattern) |

---

## Save behavior

| Rule | Value |
| --- | --- |
| Enabled when | G-9g4a1 arm + approval ID + valid fresh Preview + gates pass |
| Default | `disabled=true` in routine dev |
| One-time | Save success consumes preview identity |
| Re-click | blocked until fresh Preview |
| Candidate change | invalidates preview (stale) |
| `serviceRoleUsed` | false |
| `productionBlocked` | true |

---

## Re-click prevention integration

Uses G-9g3h1 pattern via `OperationalSaveMode: "venue-only"`:

- `buildOperationalPreviewIdentity` with mode `venue-only`
- `g9g4a1VenueOnlySaveSuccess` records consumed preview
- `isOperationalSaveReclickBlocked` blocks same preview identity Save

---

## Row selection strategy (preflight — not fixed in this phase)

**Option A (recommended):** preflight selects new safe `gosaki-piano` content row via row picker:

- not PoC audit row (`aa440e29-…` or `[CMS Kit staging]` marker)
- published preferred
- short venue for clear diff
- no prior G-9g3g4 / G-9g3h1 description operational history

**Option B (fallback):** `888c58f2-f152-4563-a3cf-a20d7c2456c1` / `schedule-2026-03-001` — technically valid for venue-only but heavily used; prefer Option A.

---

## Smoke candidate (documented — not written to DB)

```txt
before:  銀座 N
after:   銀座 N [G-9g4a1 venue smoke]
restore: 銀座 N
```

Constants: `G9G4A1_VENUE_SMOKE_*_EXAMPLE` in config.

---

## Restore strategy (placeholder)

Follow G-9g3h1 round-trip template after optional smoke execution:

| Phase | Scope |
| --- | --- |
| G-9g4a1a | preflight — target row, before.venue, env stack |
| G-9g4a1-execution | operator Preview + Save once (optional smoke) |
| G-9g4a1b | venue restore preflight |
| G-9g4a1c | venue restore execution |
| G-9g4a1d | post-restore hardening |

Restore path: G-9g4a1 venue-only Save with original venue string (not G-9g3g5 description restore).

---

## Safety requirements

- Staging host gate only (`kmjqppxjdnwwrtaeqjta.supabase.co`)
- Signed-in staging admin when armed
- `ENABLE_ADMIN_STAGING_WRITE=true` + `PUBLIC_ADMIN_WRITE_DRY_RUN=false` when armed
- `PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-9g4a1-schedule-site-slug-venue-only-non-dry-run` when armed
- Single slice armed at a time

---

## Forbidden operations avoided (this phase)

- Save / Preview auto-click
- DB write / SQL mutation / rollback / restore execution
- FTP / deploy / workflow_dispatch
- `/admin` / production
- `service_role`
- `.env` / `.env.local` non-dry-run arm writes

---

## Recommended next phase

**`G-9g4a1a-venue-only-operational-expansion-preflight`**

Select target row (Option A preferred), document beforeSnapshot / lock baseline, rollback SQL (not executed), env stack procedure for operator execution window.
