# G-20u36d — Gosaki Discography Edge dry-run readBack release id SELECT fix plan

**Phase:** `G-20u36d-readback-release-id-select-fix-planning`  
**Status:** **complete** — fix planning doc only · **no root edit / Edge deploy / SQL / Save enablement**  
**Date:** 2026-07-12  
**Base commit:** `79a5bfb`  
**Prior:** G-20u36d readBack live verify · PARTIAL STOP · trackCount=0

| Check | Status |
| --- | --- |
| Fix plan doc | **yes** (this file) |
| Root `supabase/functions/**` edited | **no** |
| Tools draft handler edited | **no** |
| Edge Function redeployed | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Save enablement | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| service_role used | **no** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunReadBackReleaseIdSelectFixPlanPrepared: true
phase: G-20u36d-readback-release-id-select-fix-planning
planOnly: true
rootEditExecuted: false
toolsDraftEditExecuted: false
edgeDeployExecuted: false
cursorSqlExecuted: false
cursorDbWriteExecuted: false
saveEnabled: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsedForReadBack: false
anonSelectPreferred: true
proceedToToolsDraftFix: true
proceedToRootPlacement: false
proceedToEdgeDeploy: false
proceedToLiveVerifyRetry: false
proceedToG20u36eSavePlanning: false
```

**G-20u36d readBack release-id-select-fix-planning scope:** plan doc + verifier only. No code fix, no deploy, no SQL, no Save enablement, no admin UI change.

---

## STOP cause (from live verify)

| Observation | Status |
| --- | --- |
| `readBack.enabled` | **true** — PASS |
| `readBack.source` | **`supabase-select`** — PASS |
| `readBack.releaseFound` | **true** — PASS |
| `readBack.trackCount` | **0** — STOP (expected **8** for `discography-002`) |
| matching dryRun | **400** — `empty track list blocked` |
| +1 track dryRun | **200** — `wouldWrite=true` · `tracksAdded=1` — PASS |
| operation=save | **400** reject — PASS |
| write flags | **all false** — PASS (not a dangerous failure) |

**Root cause:** `RELEASE_SELECT_FIELDS` omits internal column **`id`**. `resolveReadBackSnapshot()` reads `releaseRow.id` to build tracks SELECT `release_id=eq.{id}` — when `id` is absent, `releaseId` is empty → tracks query skipped → `trackCount=0` → matching payload `tracksText` empty → handler rejects with empty track list.

**Safety note:** write flags remained **false** throughout live verify. This is a readBack completeness bug, not a write-path regression. **Do not proceed** to G-20u36e controlled Save planning until live verify retry **PASS**.

---

## Current code (bug location — read-only review)

| File | Issue |
| --- | --- |
| `supabase/functions/gosaki-discography-save-dry-run/handler.ts` | `RELEASE_SELECT_FIELDS` has no `id` · `resolveReadBackSnapshot` uses `releaseRow.id` |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts` | same |
| `tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-readback.mjs` | same in path builder |

**Existing safe behavior (keep):**

| Function | Behavior |
| --- | --- |
| `mapReleaseRowToCurrentSnapshotRelease()` | Maps public release fields only — **does not include `id`** |
| `buildSanitizedReadBackSummary()` | Returns `enabled`, `source`, `releaseFound`, `trackCount`, `legacyId`, `siteSlug` only — **no `id`** |
| `TRACK_SELECT_FIELDS` | Track columns only — no `release_id` in response mapping |
| `WRITE_FLAGS` | `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` = **false** |

---

## Fix design (implementation phases — NOT executed in planning)

### A. Release SELECT — add internal `id`

| Item | Plan |
| --- | --- |
| Change | Add **`id`** to `RELEASE_SELECT_FIELDS` (first column recommended) |
| Purpose | Internal only — resolve `release_id` for tracks anon SELECT |
| PostgREST | `select=id,legacy_id,site_slug,...` on `public.discography` |
| RLS | anon SELECT on `discography.id` must remain allowed (already true — release row returned live) |

### B. Internal handling — strip before exposure

| Layer | Rule |
| --- | --- |
| `resolveReadBackSnapshot()` | Read `releaseRow.id` internally · pass to `fetchTracks({ releaseId })` |
| `mapReleaseRowToCurrentSnapshotRelease()` | **Continue omitting `id`** from snapshot release object |
| `buildSanitizedReadBackSummary()` | **No change** — summary fields unchanged |
| HTTP response `readBack` | **No UUID** · no raw DB rows |
| Admin UI | **No `id` display** in this fix chain |

### C. Tracks SELECT — unchanged path shape

```txt
/rest/v1/discography_tracks?site_slug=eq.{siteSlug}&release_id=eq.{internalId}&select={TRACK_SELECT_FIELDS}&order=...
```

| Item | Rule |
| --- | --- |
| `release_id` filter | Uses internal `id` from release row |
| Track rows in response | Never returned raw — only diff counts + sanitized readBack summary |
| service_role | **not used** |

### D. Expected post-fix live verify (retry phase)

| Case | Expected |
| --- | --- |
| matching dryRun | **200** · `readBack.trackCount=8` · `wouldWrite=false` · `tracksAdded=0` · `errors=[]` |
| +1 track dryRun | **200** · `wouldWrite=true` · `tracksAdded=1` |
| operation=save | **400** reject |
| wrong siteSlug | **400** reject |
| write flags | all **false** |
| readBack summary | **no `id` field** |

### E. Mock / verifier expectations (tools draft fix phase)

| Check | Expected |
| --- | --- |
| `buildAnonSelectDiscographyReleasePath` includes `id` in select | **yes** |
| `isReadBackSummarySanitized()` | **no UUID in summary** |
| matching fixture dryRun | `wouldWrite=false` · `tracksAdded=0` |
| +1 track fixture dryRun | `wouldWrite=true` · `tracksAdded=1` |
| `operation=save` | reject |
| write flags | all false |

---

## Files to change (future phases — not in planning)

| Phase | Path |
| --- | --- |
| tools-draft fix | `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts` |
| tools-draft fix | `tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-readback.mjs` |
| root placement | `supabase/functions/gosaki-discography-save-dry-run/handler.ts` (scope exception · copy from tools draft) |
| root placement | `supabase/functions/gosaki-discography-save-dry-run/index.ts` — **unchanged expected** |

**Do not change in this fix chain:** `index.ts` env gate logic · Save paths · RLS · grants · admin UI (unless separate sanitizer phase).

---

## Safety constraints (unchanged)

| Check | Expected |
| --- | --- |
| Auth for readBack | anon SELECT only · `SUPABASE_ANON_KEY` |
| `service_role` | **not used** |
| `operation=save` | **rejected** |
| Write flags | `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` = **false** |
| Mutations | insert / update / delete / upsert / rpc — **none** |
| Production ref | `vsbvndwuajjhnzpohghh` — **STOP** |
| Staging ref | `kmjqppxjdnwwrtaeqjta` only |

---

## STOP conditions

Stop and ask human if:

- `service_role` becomes necessary to read `id` or tracks
- anon SELECT cannot read `discography.id` (403 on release SELECT with `id` column)
- fix requires exposing `id` / UUID in HTTP response, readBack summary, admin UI, or docs
- fix requires returning raw DB rows in response
- mutation / insert / update / delete / upsert / rpc is required
- `operation=save` must succeed
- write flags would become true
- production ref `vsbvndwuajjhnzpohghh` appears in deploy or URL guard
- SQL grant/RLS change is required (investigate separately — not assumed in this plan)
- Save enablement or admin UI change is bundled into this fix

---

## Recommended phase order

| # | Phase | Scope |
| --- | --- | --- |
| 1 | **`G-20u36d-readback-release-id-select-fix-tools-draft`** | Edit tools draft handler + readback lib · mock/verifier PASS |
| 2 | **`G-20u36d-readback-release-id-select-fix-root-placement`** | Copy handler to root (scope exception 2 files if index unchanged) |
| 3 | **`G-20u36d-readback-release-id-select-fix-edge-deploy`** | Operator staging redeploy |
| 4 | **`G-20u36d-readback-live-verify-retry`** | Direct endpoint · expect `trackCount=8` · matching PASS |
| 5 | **`G-20u36d-admin-sanitizer-readback-summary-update`** | Optional — if admin UI blocks readBack display |
| 6 | **`G-20u36e-controlled-save-planning`** | **Only after live verify retry PASS** |

---

## Cursor execution record (this phase)

| Action | Executed |
| --- | --- |
| Plan doc created | **yes** |
| Verifier added | **yes** |
| AI context updated | **yes** |
| Root handler edited | **no** |
| Tools draft edited | **no** |
| Edge deploy | **no** |
| SQL | **no** |
| DB write | **no** |
| Save enabled | **no** |

---

## Verifier (this phase)

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-release-id-select-fix-plan
npm run verify:g20u36d-readback-live-verify
npm run verify:g20u36d-readback-edge-deploy-result
```
