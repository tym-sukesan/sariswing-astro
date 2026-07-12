# G-20u36d — Gosaki Discography Edge dry-run readBack root placement plan

**Phase:** `G-20u36d-readback-root-placement-plan`  
**Status:** **plan only** — no root supabase/functions edit · no deploy · no SQL · no Save  
**Date:** 2026-07-12  
**Base commit:** `0cbcf2f`  
**Prior:** G-20u36d readBack tools draft complete · deployed Edge still schema-only (readBack not reflected)

| Check | Status |
| --- | --- |
| Root placement plan doc | **yes** (this file) |
| Root `supabase/functions/**` changed | **no** |
| Edge Function redeployed | **no** — Cursor did not deploy |
| Supabase CLI deploy | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Save enablement | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| Secrets printed | **no** |
| Production changed | **no** — **STOP** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunReadBackRootPlacementPlanPrepared: true
phase: G-20u36d-readback-root-placement-plan
planOnly: true
rootSupabaseFunctionsChanged: false
edgeDeployExecuted: false
cursorSqlExecuted: false
cursorDbWriteExecuted: false
saveEnabled: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsed: false
anonSelectPreferred: true
proceedToRootPlacement: true
proceedToEdgeDeploy: false
proceedToSave: false
```

**G-20u36d readBack root-placement-plan scope:** doc only. No root copy, no deploy, no SQL, no Save enablement, no admin UI change.

---

## Prerequisites (satisfied)

| Prerequisite | Status |
| --- | --- |
| G-20u36d readBack tools draft | **complete** — anon SELECT adapter · sanitized summary · mock verifier PASS |
| G-20u36b root placement (initial) | **complete** — root `gosaki-discography-save-dry-run/` exists (pre-readBack) |
| G-20u36b Edge deploy + live verify | **complete** — staging endpoint live · schema-only baseline |
| G-20u36c admin fetch POST + STG QA | **complete** — endpoint dry-run **200 / ok=true** · write flags false |
| Permissions baseline | anon SELECT on `discography` + `discography_tracks` · authenticated UPDATE **0** |
| Save / First controlled write | **blocked** |

**Prior docs:** `gosaki-discography-g20u36d-readback-implementation-in-tools-draft.md` · `gosaki-discography-g20u36d-discography-edge-dry-run-readback-enhancement-plan.md`

---

## Problem statement

| State | Detail |
| --- | --- |
| Tools draft | readBack implemented — DB-grounded diff when enabled |
| Root `supabase/functions/**` | **pre-readBack** G-20u36b copy — `resolveCurrentSnapshot()` → `{}` · `readBack: null` |
| Deployed staging Edge | **pre-readBack** — STG QA `wouldWrite=true` / `tracksAdded=9` (schema-only false positive) |
| Goal | Copy readBack-enhanced tools draft to root · redeploy in **separate phase** |

---

## Root placement policy

| Item | Value |
| --- | --- |
| **Function name** | `gosaki-discography-save-dry-run` |
| **Deploy target (future)** | staging `kmjqppxjdnwwrtaeqjta` / `static-to-astro-cms-staging` |
| **Production STOP** | `vsbvndwuajjhnzpohghh` — **forbidden** |
| **Scope exception** | Root `supabase/functions/gosaki-discography-save-dry-run/**` only — **next phase only** |
| **Files copied** | **2 files only** — `index.ts` + `handler.ts` |
| **NOT copied** | `tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-readback.mjs` (verifier/mock only · logic is inlined in handler.ts) |
| **Deploy** | **Separate phase** — root placement does not deploy |
| **Operator approval** | **Required** for root-placement execution phase |

---

## Copy map (future root-placement phase — NOT EXECUTED in this phase)

| Copy from (tools draft) | Copy to (repo root) |
| --- | --- |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/index.ts` | `supabase/functions/gosaki-discography-save-dry-run/index.ts` |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts` | `supabase/functions/gosaki-discography-save-dry-run/handler.ts` |

Relative path from tools draft to repo root target:

```txt
../../supabase/functions/gosaki-discography-save-dry-run/index.ts
../../supabase/functions/gosaki-discography-save-dry-run/handler.ts
```

| Rule | Value |
| --- | --- |
| Execute copy in this phase | **no** |
| Modify other root `supabase/functions/**` | **no** |
| Add `_shared/` dependency without review | **no** |
| Connect service_role during copy | **no** |
| Deploy after copy | **no** — edge-deploy is separate phase |
| Enable Save after copy | **no** |

---

## readBack behavior after root placement (review checklist)

Before approving root-placement execution, operator must verify the copied source preserves:

| Review item | Expected |
| --- | --- |
| readBack auth | **anon SELECT** via PostgREST GET · `SUPABASE_ANON_KEY` only |
| `SUPABASE_SERVICE_ROLE_KEY` | **not referenced** |
| `service_role` / `createClient` with service_role | **forbidden** |
| DB write methods | **none** — no insert/update/delete/upsert/rpc |
| `operation` | **`dryRun` only** — reject `save` |
| `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` | **always false** |
| `SUPABASE_SERVICE_ROLE_CONNECTED` | **false** |
| Staging ref | `kmjqppxjdnwwrtaeqjta` only in URL guard |
| Production ref | `vsbvndwuajjhnzpohghh` — **STOP** if in config |
| readBack summary | **sanitized only** — `enabled` · `source` · `releaseFound` · `trackCount` · `legacyId` · `siteSlug` |
| Raw DB rows / UUID / JWT / keys in response | **forbidden** |
| Query scope | `site_slug = gosaki-piano` + `legacy_id = request.legacyId` |
| Tracks order | `track_number` ASC · `sort_order` ASC |

### `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` env gate

| Env value | Behavior |
| --- | --- |
| **unset / not `true`** | Schema-only fallback — `resolveCurrentSnapshot()` → `{}` · `readBack: null` · same as current deployed behavior |
| **`true`** + valid `SUPABASE_URL` + `SUPABASE_ANON_KEY` | readBack enabled — anon SELECT release + tracks · DB snapshot diff · sanitized readBack summary in response |
| **`true`** + invalid/missing env | Fallback to schema-only (readBack adapter creation fails gracefully) |

**Deploy note (future edge-deploy phase):** Operator must set Edge secrets/env explicitly. readBack is **opt-in** via env — default off preserves backward-compatible schema-only dry-run until operator arms readBack.

### readBack disabled vs enabled diff behavior

| Mode | Baseline | `wouldWrite` semantics |
| --- | --- | --- |
| **readBack disabled** (default) | Empty snapshot `{}` | Payload vs empty — may show false positives (STG QA class) |
| **readBack enabled** | DB snapshot from anon SELECT | Payload vs DB reality — accurate `wouldWrite` / `changedCounts` / `diffSummary` |

---

## Expected root diff summary (execution phase preview)

Root handler gains (from tools draft):

| Addition | Purpose |
| --- | --- |
| `G20U36D_READBACK_PHASE` | Phase marker |
| `buildAnonSelectDiscographyReleasePath` / `buildAnonSelectDiscographyTracksPath` | PostgREST URL builders |
| `resolveReadBackSnapshot` | SELECT-only snapshot via injectable adapter |
| `buildSanitizedReadBackSummary` | Sanitized readBack response |
| `simulateDiscographySaveDryRunEndpointWithReadBack` | DB-grounded diff |
| `handleDiscographyEdgeDryRunHttpAsync` | Async HTTP with optional readBack |
| `createAnonSelectReadBackAdapter` | GET-only fetch · staging ref guard |

Root index gains:

| Addition | Purpose |
| --- | --- |
| `resolveReadBackOptions()` | Env gate for readBack |
| `handleDiscographyEdgeDryRunHttpAsync` wiring | Async handler path |
| `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` | Opt-in readBack arm |

Sync `handleDiscographyEdgeDryRunHttp` remains for schema-only fallback when readBack disabled.

---

## Root-placement execution procedure (future phase — separate approval)

**Phase name:** `G-20u36d-readback-root-placement`

| Step | Action |
| --- | --- |
| 1 | Confirm this plan doc + tools-draft readBack verifier PASS |
| 2 | Confirm permissions baseline intact (anon SELECT · authenticated UPDATE **0**) |
| 3 | Confirm working tree clean at documented commit |
| 4 | Copy `index.ts` + `handler.ts` per copy map above |
| 5 | Update file header comments (tools draft → root deployed source · G-20u36d readBack) |
| 6 | Run root-placement verifier — **no deploy** |
| 7 | Record result in root-placement result doc (if applicable) |

**NOT in root-placement execution (without separate approval):**

- Supabase CLI deploy / Edge redeploy
- `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED=true` on staging (deploy phase)
- Live HTTP readBack verify
- Save enablement
- Admin UI sanitizer update (readBack display)
- SQL mutation / DB write

---

## Deploy remains separate

Root placement **does not** deploy. Sequence after root placement:

| Phase | Scope | Root edit? | Deploy? |
| --- | --- | --- | --- |
| **G-20u36d-readback-root-placement** | Copy readBack tools draft to root | yes | no |
| **G-20u36d-readback-edge-deploy-plan** | Pre-deploy checklist · env/secrets plan | no | no |
| **G-20u36d-readback-edge-deploy** | Operator staging Edge redeploy | no | yes (operator) |
| **G-20u36d-readback-live-verify** | Live HTTP · DB-grounded diff accuracy | no | no |
| **G-20u36d-readback-admin-sanitizer-update** | Allow sanitized readBack in admin UI | no | no |
| **G-20u36e-controlled-save-planning** | First controlled Save — **only after readBack stable** | no | Save (future) |

Deploy command and secrets checklist remain in future edge-deploy-plan doc — **NOT EXECUTED** until edge-deploy phase with operator approval.

---

## STOP conditions

Stop and ask human operator if:

| Condition | Action |
| --- | --- |
| Production project ref `vsbvndwuajjhnzpohghh` appears as deploy target or URL | **STOP** |
| Root placement attempted before this plan is approved | **STOP** |
| Deploy attempted before root placement completes | **STOP** |
| `service_role` required for readBack | **STOP** → separate approval phase |
| `SUPABASE_SERVICE_ROLE_KEY` referenced in copied source | **STOP** |
| `service_role` exposed to browser/response/logs | **STOP** |
| `operation=save` accepted in copied source | **STOP** |
| `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` = true | **STOP** |
| DB write / mutation method added to copied source | **STOP** |
| readBack returns full raw DB rows / UUID / secrets | **STOP** |
| Save button enabled | **STOP** |
| Admin UI change required for root placement | **STOP** — sanitizer is separate phase |
| SQL mutation executed | **STOP** |
| Secrets printed/logged | **STOP** |
| Edge calls GitHub/FTP/deploy pipeline | **STOP** |
| Permissions baseline degraded (authenticated UPDATE > 0) | **STOP** |
| Copy modifies unrelated root `supabase/functions/**` | **STOP** |
| Working tree dirty at placement attempt | **STOP** |
| anon SELECT returns 403 / RLS block at live verify | **STOP** → grant/RLS investigation; no silent service_role fallback |

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Root `supabase/functions/**` edit / copy | **not executed** |
| Edge Function deploy / Supabase CLI deploy | **not executed** |
| SQL execution | **not executed** |
| DB write | **not executed** |
| Save enablement | **not executed** |
| Admin UI change | **not executed** |
| FTP upload | **not executed** |
| Live Supabase HTTP verify | **not executed** |
| `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` arm on staging | **not executed** |
| Secrets/env change | **not executed** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-root-placement-plan
npm run verify:g20u36d-readback-implementation-in-tools-draft
npm run verify:g20u36d-discography-edge-dry-run-readback-enhancement-plan
```

Historical verifiers — not in active regression suite.
