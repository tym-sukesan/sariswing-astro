# Staging shell schedule site_slug operational general edit implementation (G-9g3g1)

**Phase:** `G-9g3g1-operational-save-path-implementation`  
**Status:** **G-9g3g1 implementation completed**  
**Date:** 2026-06-18  
**Prior:** G-9g3g planning — commit `b10b09a`  
**Type:** implementation only — **Save not clicked, no DB write, no SQL execution**

| Check | Status |
| --- | --- |
| Save clicked | **no** |
| Preview clicked (Cursor) | **no** |
| DB write executed | **no** |
| SQL executed | **no** |
| service_role used | **no** |

Prior doc: [staging-shell-schedule-site-slug-operational-general-edit-planning.md](./staging-shell-schedule-site-slug-operational-general-edit-planning.md)

**Do not re-run G-9g2 / G-9g3b / G-9g3c / G-9g3d PoC Save.**

---

## Gates

```txt
stagingShellScheduleSiteSlugOperationalGeneralEditImplementationComplete: true
readyForG9g3g2OperationalSaveUiGateSmokeTest: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

---

## Approval ID

```txt
G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run
```

Registered in `SCHEDULE_WRITE_APPROVAL_IDS` (`schedule-write-types.ts`).

Distinct from frozen G-9g3d PoC:

```txt
G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc
```

---

## Env arm

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED
```

Single-arm mutual exclusion with G-9g2 / G-9g3b / G-9g3c / G-9g3d arms (enforced in operational config + legacy PoC configs).

Routine dev default: **off** (unset).

---

## Operational Save path

| Component | Path |
| --- | --- |
| Config | `src/lib/admin/staging-data/staging-schedule-site-slug-operational-general-edit-config.ts` |
| Executor | `src/lib/admin/staging-write/staging-schedule-site-slug-operational-general-edit-save.ts` |
| Guards | `src/lib/admin/staging-write/schedule-write-guards.ts` |
| UI gates | `src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts` |
| SSR binding | `src/lib/admin/staging-data/staging-schedule-site-slug-edit-binding.ts` |
| Template | `tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro` |

### Executor behavior

- Anon Supabase client only — **no `service_role`**
- `id` + `legacy_id` + `site_slug` + `expectedBeforeUpdatedAt` optimistic lock
- PoC audit row rejected (`assertOperationalNotPocAuditRow`)
- `site_slug=gosaki-piano` scope on write
- Changed-fields-only payload (6 safe fields)
- Candidate ↔ latest G-9 preview match required
- Stale preview / optimistic lock blocks Save
- Result shape: `beforeSnapshot`, `payload`, `afterSnapshot`, `changedFields`, `rowsAffected`, `safety`

---

## Safe fields (operational)

```txt
title, venue, open_time, start_time, price, description
```

---

## Preview / Save relationship

| Rule | Implementation |
| --- | --- |
| Preview button | `#site-slug-edit-dry-run-preview-btn` (unchanged) |
| Preview result | `#site-slug-edit-dry-run-result` |
| Save enabled | Latest G-9 preview valid, not stale, candidate values match preview |
| Row switch | Preview invalidated via `markG9PreviewStale` / `invalidateDryRunPreview` |
| Legacy G-6-e2 | Not used for operational gates |
| G-9g3d PoC Save | Frozen — `#site-slug-edit-g9g3d-save-btn` remains disabled |

---

## UI surface

| Element | id |
| --- | --- |
| Operational Save button | `#site-slug-edit-g9g3g-operational-save-btn` |
| Operational Save result | `#site-slug-edit-g9g3g-operational-save-result` |
| Save gate panel | `#site-slug-edit-save-gate-panel` |

Button label: **Save operational general edit**

**Default:** `disabled=true` in routine dev (G-9g3g arm off).

---

## PoC audit row block

- Pilot row `aa440e29-5be8-402e-9190-0d81c48434c0` — not selectable (existing picker)
- `[CMS Kit staging]` marker rows — blocked at preview + Save guards

---

## Legacy PoC Save freeze

G-9g2 / G-9g3b / G-9g3c / G-9g3d Save paths unchanged and frozen. Operational path is separate.

---

## Host / auth gates

- Staging host gate (`kmjqppxjdnwwrtaeqjta.supabase.co`)
- Production host block
- Signed-in staging admin required when armed
- `ENABLE_ADMIN_STAGING_WRITE=true` + `PUBLIC_ADMIN_WRITE_DRY_RUN=false` when armed

---

## Forbidden (this phase)

- Save / Preview auto-click
- DB write / SQL mutation
- FTP / deploy / workflow_dispatch
- `/admin` / production
- `service_role`

---

## Verifiers

```bash
node tools/static-to-astro/scripts/verify-g9g3g1-operational-save-path-implementation.mjs
node tools/static-to-astro/scripts/verify-url-to-staging-pipeline.mjs
```

---

## Next phase

**`G-9g3g2-operational-save-ui-gate-smoke-test`**

Smoke: verify Save button disabled in routine dev; gate panel fields; no Save click.
