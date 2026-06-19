# Staging shell schedule site_slug operational Save success re-click prevention (G-9g3h1)

**Phase:** `G-9g3h1-save-success-reclick-prevention`  
**Status:** **implementation complete**  
**Date:** 2026-06-19  
**Prior:** G-9g3g5d post-restore hardening — commit `972e640`  
**Type:** UI + client guard hardening — **no Save, no Preview by Cursor, no DB write, no SQL mutation**

| Check | Status |
| --- | --- |
| Save clicked (this phase) | **no** |
| Preview clicked (Cursor/AI) | **no** |
| DB write executed (this phase) | **no** |
| Restore / rollback SQL executed | **no** |
| service_role used | **no** |

**Do not re-click G-9g3g4 operational Save.** **Do not re-click G-9g3g5 restore Save.**

---

## Gates

```txt
stagingShellScheduleSiteSlugOperationalSaveSuccessReclickPreventionComplete: true
readyForG9g3h1aSaveSuccessReclickPreventionSmokeTest: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

**Next:** `G-9g3h1a-save-success-reclick-prevention-smoke-test`

---

## 1. What was hardened

After `actualWrite=true` / `rowsAffected=1` operational or restore Save:

- Save button **disabled** until fresh Preview on changed candidate or row reload
- Preview treated as **consumed** — same preview identity cannot enable Save again
- Result panel shows **executed-state** banner
- Gate panel shows operator copy (`preview consumed` / `fresh Preview required`)
- Client guards in `canEnableOperationalSave` + save click handler
- Write executor guards: `previewIdentity` + `consumedPreviewIdentity` check (defense in depth)

**Out of scope (deferred):** server-side session persistence of consumed previews; separate restore Save button UI (G-9g3h2).

---

## 2. General operational mode (G-9g3g)

**Approval:** `G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run`  
**Env arm:** `PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED`

| Event | Behavior |
| --- | --- |
| Save success | `operationalSaveSuccess` recorded; `clearPreviewState()`; Save disabled |
| Same preview re-run (same candidate) | `previewIdentity` matches consumed → Save blocked |
| Candidate field change | `markG9PreviewStale` → `invalidateDryRunPreview` → success cleared |
| Row switch / reload | `invalidateDryRunPreview` → success cleared |
| Fresh Preview after candidate change | New `previewIdentity` → Save may enable (if gates pass) |

---

## 3. Restore mode (G-9g3g5)

**Approval:** `G-9g3g5-schedule-site-slug-operational-restore-non-dry-run`  
**Env arm:** `PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED`

Same re-click prevention as general mode. `previewIdentity` includes `mode=restore` and restore approval ID so general and restore successes do not collide.

Gate panel: `Restore mode uses the same Save button but requires restore approval and restore arm.`

---

## 4. Consumed preview / stale behavior

**Preview identity** (`buildOperationalPreviewIdentity`):

```txt
mode | approvalId | targetId | legacyId | expectedBeforeUpdatedAt | changedFields | fieldValues JSON
```

| State | `g9g3dDryRunPreviewValid` | Save enabled |
| --- | --- | --- |
| After success | `false` (preview cleared) | **no** — `Save completed. Re-click is blocked…` |
| Re-Preview same payload | `true` | **no** — `This Preview has been consumed…` |
| Re-Preview after candidate change | `true` (success cleared) | per normal gates |
| Row reload | preview cleared, success cleared | per normal gates |

Gate panel markers: `preview consumed` / `fresh Preview required`

---

## 5. Save success disabled behavior

**Save button:** `#site-slug-edit-g9g3g-operational-save-btn`  
**Result panel:** `#site-slug-edit-g9g3g-operational-save-result`  
**Gate panel:** `#site-slug-edit-save-gate-panel`

Success message (result panel):

```txt
Save completed. Re-click is blocked. Run a fresh Preview after changing the candidate or reloading the row.
```

Executed-state banner:

```txt
Operator manual Save completed once. Do not re-click.
```

---

## 6. Guard behavior

### UI (`staging-schedule-site-slug-edit-ui.ts`)

- `operationalSaveSuccess` — in-memory success record
- `checkOperationalSaveReclickGate()` — blocks Save enable + early return on click
- `clearOperationalSaveSuccess()` — on row switch / candidate stale / invalidate

### Client module (`staging-schedule-site-slug-operational-save-reclick.ts`)

- `buildOperationalPreviewIdentity`
- `isOperationalSaveReclickBlocked`

### Write executors (client guard center; executor defense in depth)

- `previewIdentity` required on `G9G3gOperationalPreviewBinding`
- `consumedPreviewIdentity` — if matches `previewIdentity`, return `preview_consumed`
- `assertOperationalPreviewIdentityPresent` / `assertOperationalPreviewNotConsumed` in `schedule-write-guards.ts`

---

## 7. UI copy (gate / result)

| Copy | Location |
| --- | --- |
| `Operator manual Save completed once. Do not re-click.` | gate + result executed-state |
| `This Preview has been consumed by a successful Save. Run a new Preview before any further write.` | gate + Save block reason |
| `fresh Preview required` | gate after success, preview cleared |
| `Routine dev should use dry-run with all non-dry-run arms off.` | gate panel |
| `Restore mode uses the same Save button but requires restore approval and restore arm.` | gate when restore armed |

---

## 8. Files changed

| File | Change |
| --- | --- |
| `staging-schedule-site-slug-operational-save-reclick.ts` | **new** — preview identity + reclick helpers |
| `staging-schedule-site-slug-config.ts` | G-9g3h1 constants |
| `staging-schedule-site-slug-edit-ui.ts` | success state, consumed preview, UI copy |
| `staging-schedule-site-slug-operational-general-edit-save.ts` | previewIdentity guard |
| `staging-schedule-site-slug-operational-restore-save.ts` | previewIdentity guard |
| `schedule-write-guards.ts` | preview consumed asserts |

---

## 9. Recommended next phase

**`G-9g3h1a-save-success-reclick-prevention-smoke-test`**

Operator manual smoke (no Cursor Save/Preview):

1. Arm operational or restore stack
2. Preview → Save once → confirm Save disabled + executed-state
3. Re-Preview same candidate → confirm Save still blocked (preview consumed)
4. Change candidate → Preview → confirm Save can enable (dry-run only until approved execution phase)

---

## 10. Git

```txt
G-9g3g5d: 972e640 (pushed)
G-9g3h1 implementation: uncommitted
```
