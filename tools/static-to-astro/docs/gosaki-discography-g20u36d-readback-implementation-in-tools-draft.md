# G-20u36d — Gosaki Discography Edge dry-run readBack implementation (tools draft)

**Phase:** `G-20u36d-readback-implementation-in-tools-draft`  
**Status:** **tools draft only** — no root Edge edit · no deploy · no SQL · no Save  
**Date:** 2026-07-12  
**Doc HEAD:** `d99fd21`  
**Prior:** G-20u36d readBack enhancement planning complete

| Check | Status |
| --- | --- |
| Tools draft readBack | **this phase** |
| Root `supabase/functions/**` edit | **not in this phase** |
| Edge deploy | **not in this phase** |
| SQL execution | **not in this phase** |
| DB write | **not in this phase** |
| Save enablement | **not in this phase** |
| Admin UI change | **not in this phase** |
| FTP upload | **not in this phase** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunReadBackToolsDraftImplemented: true
phase: G-20u36d-readback-implementation-in-tools-draft
toolsDraftOnly: true
rootSupabaseFunctionsEdited: false
edgeDeployExecuted: false
cursorSqlExecuted: false
cursorDbWriteExecuted: false
saveEnabled: false
adminUiChanged: false
serviceRoleUsed: false
anonSelectPreferred: true
mockVerifierUsed: true
proceedToRootPlacementPlan: true
proceedToSave: false
```

---

## 1. Scope

Implement SELECT-only readBack in the **tools draft** Edge Function handler so dry-run diff can be DB-grounded before root placement and staging deploy.

| Location | Change |
| --- | --- |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts` | readBack adapter · snapshot builder · sanitized summary · async HTTP path |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/index.ts` | async handler · optional readBack env gate |
| `tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-readback.mjs` | shared readBack logic + mock fixtures for verifier |
| `supabase/functions/gosaki-discography-save-dry-run/**` | **unchanged** |

---

## 2. readBack design (anon SELECT · no service_role)

| Item | Policy |
| --- | --- |
| Auth | **anon SELECT** via PostgREST GET (`SUPABASE_ANON_KEY`) |
| Scope | `site_slug = gosaki-piano` + `legacy_id = request.legacyId` |
| Release query | `/rest/v1/discography?site_slug=eq.{slug}&legacy_id=eq.{legacyId}&select=...&limit=1` |
| Tracks query | `/rest/v1/discography_tracks?site_slug=eq.{slug}&release_id=eq.{id}&order=track_number.asc.nullslast,sort_order.asc.nullslast` |
| service_role | **not used** · **not referenced** |
| Mutations | **none** — GET-only fetch adapter |
| Staging ref | `kmjqppxjdnwwrtaeqjta` required · production ref `vsbvndwuajjhnzpohghh` **STOP** |

### Env gate (runtime · future deploy)

| Env | Purpose |
| --- | --- |
| `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED=true` | Arm readBack in tools draft index |
| `SUPABASE_URL` | Staging project URL |
| `SUPABASE_ANON_KEY` | anon SELECT only |

When readBack env is off or invalid, handler falls back to schema-only baseline (`readBack: null`).

---

## 3. Sanitized readBack summary (response only)

```json
{
  "enabled": true,
  "source": "supabase-select",
  "releaseFound": true,
  "trackCount": 8,
  "legacyId": "discography-002",
  "siteSlug": "gosaki-piano"
}
```

**Not returned:** full DB rows · internal UUID · JWT · keys · service_role hints.

Write flags remain **false**: `didWrite` · `dbWrite` · `networkWrite` · `saveEnabled`.  
`operation=save` remains **rejected**.

---

## 4. Diff accuracy (mock verifier)

Fixture: `discography-002` / SKYLARK / 8 tracks (`DISCOGRAPHY_002_READBACK_FIXTURE`).

| Scenario | Baseline | Expected |
| --- | --- | --- |
| Schema-only (empty snapshot) | `{}` | `wouldWrite: true` · `tracksAdded: 8` (STG QA false positive class) |
| readBack enabled · matching payload | DB snapshot | `wouldWrite: false` · `tracksAdded: 0` |
| readBack enabled · +1 track in payload | DB snapshot | `wouldWrite: true` · `tracksAdded: 1` |

Verifier uses **mock adapter only** — no live Supabase HTTP in this phase.

---

## 5. Handler entry points

| Function | Role |
| --- | --- |
| `resolveReadBackSnapshot(adapter, { siteSlug, legacyId })` | SELECT-only snapshot via injectable adapter |
| `buildSanitizedReadBackSummary(...)` | Sanitized readBack object |
| `simulateDiscographySaveDryRunEndpointWithReadBack(...)` | readBack + existing diff logic |
| `handleDiscographyEdgeDryRunHttpAsync(...)` | Async HTTP with optional readBack |
| `handleDiscographyEdgeDryRunHttp(...)` | Sync schema-only fallback (readBack null) |

---

## 6. Not executed in this phase

| Item | Status |
| --- | --- |
| `supabase/functions/**` edit | **not executed** |
| Edge deploy / Supabase CLI deploy | **not executed** |
| SQL mutation | **not executed** |
| DB write | **not executed** |
| Save enablement | **not executed** |
| Admin UI sanitizer update | **not executed** (future phase) |
| Live Supabase HTTP verify | **not executed** |
| FTP upload | **not executed** |
| service_role | **not used** |

---

## 7. Next phase

| Phase | Scope |
| --- | --- |
| **G-20u36d-readback-root-placement-plan** | Plan copy from tools draft → `supabase/functions/gosaki-discography-save-dry-run/` |
| **G-20u36d-readback-root-placement** | Root handler copy (scope exception) |
| **G-20u36d-readback-edge-deploy** | Staging Edge redeploy (operator approval) |
| **G-20u36d-readback-live-verify** | Live HTTP DB-grounded diff accuracy |
| **G-20u36d-readback-admin-sanitizer-update** | Allow sanitized readBack in admin UI display |
| **G-20u36e-controlled-save-planning** | First controlled Save — **only after readBack stable** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-implementation-in-tools-draft
npm run verify:g20u36d-discography-edge-dry-run-readback-enhancement-plan
npm run verify:g20u36c-admin-discography-dry-run-stg-browser-qa-result
```
