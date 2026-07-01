# G-19b1 — Gosaki Discography tracklist generic single-title Save implementation

**Phase:** `G-19b1-gosaki-discography-tracklist-generic-single-title-save-implementation`  
**Status:** **complete** — Save adapter implemented; **Save not executed**  
**Date:** 2026-06-29  
**Base commit:** `889a891`  
**Prior:** [gosaki-discography-g19b-tracklist-save-slice-planning.md](./gosaki-discography-g19b-tracklist-save-slice-planning.md)  
**Approval ID:** `G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice`

| Check | Status |
| --- | --- |
| G-19a generic diff Preview (4 albums) | **complete** |
| G-19b planning | **complete** — commit `889a891` |
| G-18g2 Save chain | **closed** — `discography-002` track 7 unchanged |
| G-19b1 Save adapter + guards | **yes** |
| Gated actual write path | **implemented, disabled by default** |
| Cursor Save / DB write | **no** |

---

## Gates

```txt
gosakiDiscographyG19b1TracklistGenericSingleTitleSaveImplementationComplete: true
phase: G-19b1-gosaki-discography-tracklist-generic-single-title-save-implementation
approvalId: G-19b1-gosaki-discography-tracklist-generic-single-title-non-dry-run-slice
envArm: PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED
readyForG19b1TracklistGenericSingleTitleSaveFinalPreflight: true
readyForG19b1TracklistGenericSingleTitleSaveExecution: false
saveEnabledDefault: false
dryRunDefault: true
actualWriteInThisPhase: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
g18g2SaveChainClosed: true
discography002Track7DoNotReSave: true
packageRegenExecuted: false
ftpUploadExecuted: false
```

**Supabase:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Target slice

| Field | Value |
| --- | --- |
| Album | `discography-004` / Ja-Jaaaaan! |
| Track row id | `04e987a9-e251-4b0b-b860-21a61e711f8e` |
| track_number | 1 |
| before `title` | `Mary Ann` |
| after `title` | `Mary Ann（テスト）` |
| beforeCount / afterCount | 8 / 8 |
| orderedTitleFingerprintBefore | `Mary Ann\|Nearer My God To Thee\|Shreveport Stomp\|A Fool Such As I\|Si Tu Vois Ma Mere\|St. Phillip Street Break Down\|Girl Of My Dream\|Bourbon Street Parade` |
| changed | 1 row only |
| added / deleted / reordered | 0 |

---

## 2. Implementation modules

| Module | Role |
| --- | --- |
| `gosaki-discography-g19b1-tracklist-generic-single-title-save.ts` | dry-run + gated `executeG19b1TracklistTitleSave` |
| `gosaki-discography-g19b1-tracklist-generic-title-guards.ts` | diff + fingerprint guards |
| `gosaki-discography-g19b1-tracklist-generic-single-title-save-config.ts` | env arm / save gates / G-18g2 single-arm conflict |
| `gosaki-discography-g19b1-tracklist-generic-single-title-types.ts` | constants + result types |
| `gosaki-discography-g19b1-tracklist-generic-single-title-save-page-config.ts` | SSR page config bridge |
| `discography-tracks-write-types.ts` | G-19b1 approval ID registry |
| `gosaki-staging-discography-admin-ui.ts` | `discography-004` Preview → G-19b1; Save gated |
| `AdminGosakiStagingDiscographyOperatorPage.astro` | G-19b1 page config DOM |

Reuses G-19a/G-18f: `parseDiscographyTracklistTextarea`, `diffDiscographyTracklists`, textarea form field.

---

## 3. Save gate / env arm

| Gate | Default |
| --- | --- |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `true` — blocks actual write |
| `PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED` | unset / false — Save disabled |
| G-18g2 arm | must be **off** (single-arm rule) |
| Staging shell / host / project gates | required when armed |
| Auth session | required for Save UI |
| Dry-run Preview | must succeed with `saveReadiness: ready_to_save` |

**G-18g2 approval ID / env arm are not reused.**

---

## 4. UI routing

| Album | Preview | Save |
| --- | --- | --- |
| `discography-004` | G-19b1 dry-run (`executeG19b1TracklistTitleDryRun`) | G-19b1 when armed + gates pass |
| `discography-001/002/003` | G-19a generic dry-run | Disabled |
| `discography-002` | G-19a only | Always disabled (G-18g2 closed) |

`saveReadiness` values shown in operator panel when diff matches slice guards.

---

## 5. Write path (not executed)

```txt
UPDATE discography_tracks
SET title = 'Mary Ann（テスト）'
WHERE id = '04e987a9-e251-4b0b-b860-21a61e711f8e'
  AND discography_legacy_id = 'discography-004'
  AND track_number = 1
  AND title = 'Mary Ann'
rowsAffectedRequired = 1
```

Rollback hint: `Mary Ann（テスト） -> Mary Ann` (staging only — not executed).

---

## 6. G-18g2 separation

| Item | G-18g2 | G-19b1 |
| --- | --- | --- |
| Album | `discography-002` | `discography-004` |
| Track | 7 | 1 |
| Approval ID | `G-18g2-...` | `G-19b1-...` |
| Env arm | `G18G2_..._ARMED` | `G19B1_..._ARMED` |
| UI invoke | **not invoked** (G-19a chain) | `discography-004` only |
| Chain | **closed** | new slice |

---

## 7. Verifier

```bash
node tools/static-to-astro/scripts/verify-g19b1-gosaki-discography-tracklist-single-title-save-implementation.mjs
```

---

## 8. Next phase

`G-19b1-tracklist-generic-single-title-save-final-preflight` → operator manual Save once (execution phase only).
