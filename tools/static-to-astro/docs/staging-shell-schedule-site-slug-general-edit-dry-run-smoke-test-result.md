# Staging shell schedule site_slug general edit dry-run smoke test result (G-9g3d2)

**Phase:** `G-9g3d2-general-edit-dry-run-smoke-test`  
**Date:** 2026-06-17  
**Prior:** G-9g3d1 implementation — commit `6d3c104`  
**Type:** SSR + programmatic dry-run smoke — **no Save, no DB write, no Supabase SQL mutation, no browser Preview/Save clicks**

**Click policy this phase:**

| Actor | Preview | Save |
| --- | --- | --- |
| Operator (manual) | **not performed** | **not performed** |
| Cursor / AI / Playwright | **not performed** | **not performed** |

**UI verification:** HTTP GET / SSR smoke only (curl staging shell HTML).  
**Dry-run preview equivalent:** programmatic smoke (`verify-g9g3d-general-edit-dry-run-smoke.mjs`) — same diff logic as Preview button, no network write.

**actualWrite:** `false` always. **DB write:** none. **Save:** none.

Optional before G-9g3d3 preflight: operator may manually click Preview once (price candidate) to confirm UI panel — **not required** for this phase gate.

---

## Gates

```txt
stagingShellScheduleGeneralEditDryRunSmokeTestPassed: true
stagingShellScheduleGeneralEditHostGateSmokeTestPassed: true
stagingShellScheduleGeneralEditLegacyPocUiDefaultHidden: true
stagingShellScheduleGeneralEditSaveGatedAsExpected: true
readyForG9g3d3GeneralEditNonDryRunPreflight: true
cursorClickedSave: false
cursorClickedPreview: false
operatorManualPreviewClicked: false
cursorAiPlaywrightClicked: false
```

**Save was not clicked.** **DB write was not executed.**

---

## 1. Route

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/#schedule
```

| Check | Result |
| --- | --- |
| Staging shell route | **yes** (`/__admin-staging-shell/musician-basic/`) |
| `/admin` | **not used** |

---

## 2. Routine dev safety (verified)

| Env / condition | Expected | Result |
| --- | --- | --- |
| `ENABLE_ADMIN_STAGING_WRITE` | `false` | **PASS** |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `true` | **PASS** |
| `PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED` | off / not `true` | **PASS** |
| G-9g2 / G-9g3b / G-9g3c arms | off | **PASS** |
| `PUBLIC_SUPABASE_URL` host | `kmjqppxjdnwwrtaeqjta.supabase.co` | **PASS** |
| Production host | not active | **PASS** (`vsbvndwuajjhnzpohghh` not in SSR body) |
| `service_role` | not used | **PASS** |

Script: `node tools/static-to-astro/scripts/verify-g9g3d-general-edit-dry-run-smoke.mjs`

---

## 3. UI smoke — HTTP GET / SSR only

Dev server: routine `.env.local` (existing `npm run dev` on port 4321).  
**HTTP GET only** — no operator manual Preview, no operator Save, no Cursor / AI / Playwright clicks.

| Check | Result |
| --- | --- |
| General edit section title (G-9g3d) | **PASS** |
| Approval ID `G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc` | **PASS** |
| activeHost / expectedHost staging | **PASS** |
| hostGatePassed (SSR) | **PASS** |
| Loaded vs candidate (`site-slug-edit-loaded-*`) | **PASS** |
| Target row id / legacy_id / site_slug | **PASS** |
| `updated_at` (live SELECT) | `2026-06-17T15:45:35.433566+00:00` **PASS** |
| Loaded price baseline | `[CMS Kit staging] G-9g3c price PoC` **PASS** |
| `data-g9g3d-armed="false"` | **PASS** |
| `data-legacy-poc-ui-visible="false"` | **PASS** |
| Legacy PoC panel | **hidden** (default) |
| Save general edit button | present, **disabled** |
| Auth banner element | present (`site-slug-edit-auth-banner`) |
| PoC auto-fill on load | **not observed** (inputs match loaded row) |

**18/18 SSR marker checks passed** (automated parse of staging shell HTML).

---

## 4. Dry-run preview equivalent — programmatic smoke (price only)

**Operator manual Preview click:** not performed.  
**Cursor / AI / Playwright Preview click:** not performed.  
Programmatic smoke validates the same pure dry-run diff logic used by the Preview button (no network write, `actualWrite=false`).

| Field | Value |
| --- | --- |
| Candidate field | `price` only |
| from | `[CMS Kit staging] G-9g3c price PoC` |
| to | `[CMS Kit staging] G-9g3d smoke price candidate` |

| Check | Result |
| --- | --- |
| actualWrite | `false` |
| wouldWrite | `true` |
| changedFields | `["price"]` only |
| title / venue / open_time / start_time / description | **unchanged** |
| optimisticLock.expectedBeforeUpdatedAt | `2026-06-17T15:45:35.433566+00:00` |
| optimisticLock.currentUpdatedAt | (not live-fetched in programmatic smoke — operator Preview uses live stale check) |
| optimisticLock.stale | `false` (baseline fixture; live Preview expected `false` when row unchanged) |
| hostGatePassed | `true` (routine dev staging host) |

**Optional before G-9g3d3 preflight:** operator may manually click Preview in browser with the same price candidate to confirm UI panel rendering. Not required for this phase gate — SSR + programmatic smoke sufficient.

---

## 5. Save gate (routine dev)

| Check | Result |
| --- | --- |
| G-9g3d armed | `false` |
| Save general edit enabled | **no** (SSR `disabled`) |
| Disabled reason visible | arm failure / not armed (SSR hint) |
| Signed-out banner | present (auth checked client-side on load) |

---

## 6. Legacy PoC freeze

| Slice | UI default | Config re-arm |
| --- | --- | --- |
| G-9g2 | no Save button in section | blocked if arm attempted |
| G-9g3b / G-9g3c | **hidden** (`LEGACY_POC_UI_VISIBLE` off) | `Slice PoC executed — do not re-run` |

---

## 7. Pilot row baseline (unchanged)

```txt
id:         aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id:  schedule-2026-07-010
site_slug:  gosaki-piano
updated_at: 2026-06-17T15:45:35.433566+00:00
```

**Do not re-run G-9g2 / G-9g3b / G-9g3c Save. G-9g3d Save not executed.**

---

## 8. Next phase

**G-9g3d3-general-edit-non-dry-run-preflight** — beforeSnapshot / rollback SQL / dev arm stack (no Save execution in preflight).
