# Staging shell schedule site_slug general edit consolidation implementation (G-9g3d1)

**Phase:** `G-9g3d1-general-edit-consolidation-implementation`  
**Date:** 2026-06-17  
**Prior:** G-9g3d planning — commit `be26fd1`  
**Type:** implementation only — **no Save click, no DB write, no Supabase SQL execution**

---

## Gates

```txt
stagingShellScheduleGeneralEditPocNotExecuted: true
readyForG9g3d2GeneralEditDryRunSmokeTest: true
```

**Save was not clicked.** **DB write was not executed.**

---

## 1. General edit UI strategy

- Six safe fields (`title`, `venue`, `open_time`, `start_time`, `price`, `description`) in one form inside `AdminStagingScheduleSiteSlugEditSection`
- **Single Save** path: `executeG9G3dGeneralEditNonDryRunSave`
- **changed-fields-only** payload — not full safe-fields payload
- Preview reuses `buildSiteSlugScheduleEditDryRunResult` (G-9g3a); Save payload keys match preview `changedFields`
- Loaded DB values shown read-only per field; edit inputs initialize from row (no PoC auto-fill on arm)

---

## 2. Approval ID

```txt
G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc
```

Registered in `SCHEDULE_WRITE_APPROVAL_IDS` (`schedule-write-types.ts`).

---

## 3. Env arm

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED=true
```

Plus standard staging write stack (inline env in execution — do not commit `.env`).

Optional legacy PoC UI disclosure (default off):

```txt
PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE=true
```

---

## 4. Payload strategy (changed-fields-only)

- UI tracks `lastPreviewG9g3dChangedFields` + per-field raw values at preview time
- Save builds payload via `buildG9G3dGeneralEditPayload(changedFields, rawValues)`
- Guard: `assertG9G3dGeneralEditPayloadOnly(payload, changedFields)` — keys must match `changedFields` exactly
- Non-changed safe fields must match loaded row at Save time

---

## 5. Null / empty string handling

| Field | Rule |
| --- | --- |
| `title` | trim; empty → abort Save |
| `venue`, `open_time`, `start_time`, `price` | trim; `""` → `null` in payload |
| `description` | trim; `""` → `null` (per G-9g3d planning §6.3) |

---

## 6. Safety gates

- Host hard gate (`evaluateSupabaseHostGate`) — Save blocked when failed
- `id + legacy_id + site_slug` scope (`assertBeforeSnapshotSiteSlugScope`)
- `expectedBeforeUpdatedAt` optimistic lock via `buildScheduleLockedWriteRequest`
- Staging admin auth (`isSignedInStagingAuth`) — UI banner + Save gate
- Single-arm: G-9g2 / G-9g3b / G-9g3c / G-6-g1 / G-6-g2 arms must be off when G-9g3d armed
- `service_role` never used
- Save default `disabled={true}`; enabled only when all gates pass after Preview
- Preview required before Save; stale blocks Save

---

## 7. Legacy PoC UI freeze policy

- G-9g2 / G-9g3b / G-9g3c slice executors retained for audit
- Slice env arms fail with `Slice PoC executed — do not re-run; use G-9g3d general edit`
- Legacy Save buttons hidden by default; visible only when `PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE=true` in collapsed `<details>` with re-run banner
- PoC default field injection only when legacy UI visible **and** slice armed (frozen in practice)

---

## 8. Files touched

| File | Role |
| --- | --- |
| `staging-schedule-site-slug-config.ts` | G-9g3d phase, approval, env constants |
| `staging-schedule-site-slug-general-edit-poc-config.ts` | Arm / single-arm config |
| `staging-schedule-site-slug-general-edit-poc-save.ts` | `executeG9G3dGeneralEditNonDryRunSave` |
| `schedule-write-guards.ts` | `assertG9G3dGeneralEditPayloadOnly`, `buildG9G3dGeneralEditPayload` |
| `schedule-write-types.ts` | Approval ID registration |
| `staging-schedule-site-slug-edit-binding.ts` | G-9g3d binding fields |
| `staging-schedule-site-slug-edit-ui.ts` | General Save gating, auth banner, preview session |
| `AdminStagingScheduleSiteSlugEditSection.astro` | Unified form UX, legacy panel |
| Slice poc configs (g9g2/g9g3b/g9g3c) | Re-run block + g9g3d single-arm |
| `verify-url-to-staging-pipeline.mjs` | G-9g3d1 marker checks |

`/admin` untouched. Production host block maintained.

---

## 9. Next phase

**G-9g3d2-general-edit-dry-run-smoke-test** — Preview / gate smoke in dev; still no Save / DB write unless execution phase.

---

## 10. Pilot row baseline (unchanged — post G-9g3c)

```txt
id:         aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id:  schedule-2026-07-010
site_slug:  gosaki-piano
updated_at: 2026-06-17T15:45:35.433566+00:00
```

**Do not re-run G-9g2 / G-9g3b / G-9g3c Save.**
