# G-20u36b — Gosaki Discography Edge dry-run endpoint root placement plan

**Phase:** `G-20u36b-edge-dry-run-endpoint-root-placement-plan`  
**Status:** **complete** — root placement plan doc only · **no root supabase/functions edit / deploy / SQL / Save enablement**  
**Date:** 2026-07-12  
**Base commit:** `e3b5e01`  
**Prior:** G-20u36b function-source-staging · deploy-manual-plan · deploy-preflight-result READY

| Check | Status |
| --- | --- |
| Root placement plan doc | **yes** (this file) |
| Root `supabase/functions/**` changed | **no** |
| Edge Function deployed | **no** — Cursor did not deploy |
| Supabase CLI deploy | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Save UI enabled | **no** |
| Admin fetch POST added | **no** |
| Secrets printed | **no** |
| Production changed | **no** — **STOP** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunEndpointRootPlacementPlanPrepared: true
phase: G-20u36b-edge-dry-run-endpoint-root-placement-plan
planOnly: true
rootSupabaseFunctionsChanged: false
edgeFunctionDeployed: false
saveEnabled: false
discographySaveDbWriteExecuted: false
cursorDbWriteExecuted: false
cursorSqlExecuted: false
cursorEdgeDeployExecuted: false
serviceRoleConnected: false
supabaseClientConnected: false
proceedToRootPlacement: true
proceedToDeployManualExecution: false
proceedToSave: false
```

**G-20u36b root-placement-plan scope:** doc only. No root copy, no deploy, no SQL, no Save enablement.

---

## Prerequisites (satisfied)

| Prerequisite | Status |
| --- | --- |
| G-20u36b function-source-staging | **complete** — tools draft staged |
| G-20u36b deploy-manual-plan | **complete** |
| G-20u36b deploy-preflight-result | **READY** — `H.deploy_preflight.summary = READY_FOR_EDGE_DRY_RUN_DEPLOY_PREFLIGHT` |
| authenticated UPDATE grants | **0** |
| Save / First controlled write | **blocked** |
| Admin fetch POST | **not added** |

**Prior docs:** `gosaki-discography-g20u36b-edge-dry-run-endpoint-function-source-staging.md` · `gosaki-discography-g20u36b-edge-dry-run-endpoint-deploy-manual-plan.md`

---

## Root placement policy

| Item | Value |
| --- | --- |
| **Function name** | `gosaki-discography-save-dry-run` |
| **Deploy target (future)** | staging `kmjqppxjdnwwrtaeqjta` / `static-to-astro-cms-staging` |
| **Production STOP** | `vsbvndwuajjhnzpohghh` — **forbidden** |
| **Scope exception** | Root `supabase/functions/gosaki-discography-save-dry-run/**` only — **next phase only** |
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
| Connect Supabase client / service_role during copy | **no** — separate approval |
| Deploy after copy | **no** — deploy-manual is separate phase |

---

## Expected diff at root-placement execution (review checklist)

Before approving root-placement execution, operator must verify the copied source preserves:

| Review item | Expected |
| --- | --- |
| `Deno.serve` | **index.ts only** — not in handler.ts |
| HTTP method | **POST only** (+ OPTIONS for CORS) |
| Content-Type | `application/json` |
| `operation` | **`dryRun` only** — reject `save` |
| `siteSlug` | `gosaki-piano` only — wrong siteSlug rejected |
| `approvalId` | dry-run ID only — save approval ID rejected |
| `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` | **always false** |
| `SUPABASE_SERVICE_ROLE_CONNECTED` | **false** |
| Supabase client | **NOT CONNECTED** |
| `resolveCurrentSnapshot()` | returns empty (schema-only dry-run) |
| DB write methods | **none** — no insert/update/delete/upsert/rpc |
| `service_role` / secrets in request/response/log | **forbidden** |
| GitHub / FTP / deploy pipeline calls | **none** |
| Admin fetch POST | **not added** |
| localStorage | **none** |

---

## Root-placement execution procedure (future phase — separate approval)

**Phase name:** `G-20u36b-edge-dry-run-endpoint-root-placement`

| Step | Action |
| --- | --- |
| 1 | Confirm this plan doc + function-source-staging verifier PASS |
| 2 | Confirm deploy-preflight result **READY** |
| 3 | Confirm working tree clean at documented commit |
| 4 | Copy index.ts + handler.ts per copy map above |
| 5 | Update file header comments (tools draft → root deployed source) |
| 6 | Run root-placement verifier — **no deploy** |
| 7 | Record result in root-placement result doc (if applicable) |

**NOT in root-placement execution (without separate approval):**

- Supabase CLI deploy
- `service_role` env read / Supabase client connect
- SELECT-only DB baseline read
- Save enablement
- Admin fetch POST

---

## Deploy remains separate

Root placement **does not** deploy. Deploy sequence after root placement:

| Phase | Scope |
| --- | --- |
| **G-20u36b-edge-dry-run-endpoint-root-placement** | Copy to root · verifier · **no deploy** |
| **G-20u36b-edge-dry-run-endpoint-deploy-manual** | Operator manual deploy — staging only |
| **G-20u36b-edge-dry-run-endpoint-deploy-manual-result-record** | Record deploy outcome |
| **G-20u36b-edge-dry-run-endpoint-live-verify** | Live HTTP verify |

Deploy command remains in deploy-manual-plan doc — **NOT EXECUTED** until deploy-manual phase with operator approval.

---

## STOP conditions

Stop and ask human operator if:

| Condition | Action |
| --- | --- |
| Production project ref `vsbvndwuajjhnzpohghh` appears as deploy target | **STOP** |
| Root placement attempted before this plan is approved | **STOP** |
| Deploy attempted before root placement completes | **STOP** |
| `service_role` exposed to browser/response/logs | **STOP** |
| `operation=save` accepted in copied source | **STOP** |
| `didWrite` / `dbWrite` / `networkWrite` = true | **STOP** |
| DB write method added to copied source | **STOP** |
| Save button enabled | **STOP** |
| Admin fetch POST added | **STOP** |
| SQL mutation executed | **STOP** |
| Secrets printed/logged | **STOP** |
| Edge calls GitHub/FTP/deploy pipeline | **STOP** |
| Permissions baseline degraded (authenticated UPDATE > 0) | **STOP** |
| Copy modifies unrelated root `supabase/functions/**` | **STOP** |
| Working tree dirty at placement attempt | **STOP** |

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Root `supabase/functions/**` edit / copy | **not executed** |
| Edge Function deploy / Supabase CLI deploy | **not executed** |
| SQL execution | **not executed** |
| DB write | **not executed** |
| Save button enablement | **not executed** |
| Admin Discography fetch POST | **not added** |
| Secrets/env change | **not executed** |
| FTP / production | **not executed** |

---

## Next phases

| Phase | Scope | Root edit? | Deploy? |
| --- | --- | --- | --- |
| **G-20u36b-edge-dry-run-endpoint-root-placement** | Copy tools draft to root · separate operator approval | yes | no |
| **G-20u36b-edge-dry-run-endpoint-deploy-manual** | Operator manual deploy — staging only | no | yes (operator) |
| **G-20u36b-edge-dry-run-endpoint-deploy-manual-result-record** | Record deploy outcome | no | no |
| **G-20u36b-edge-dry-run-endpoint-live-verify** | Live HTTP verify | no | no |
| **G-20u36c** | Admin UI dry-run fetch POST wiring | no | no |
| **G-20u36e** | First controlled Save — blocked until live-verify PASS | no | Save (future) |

---

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36b-edge-dry-run-endpoint-root-placement-plan
npm run verify:current-active-regression
```

Historical verifier — not in active regression suite (23 verifiers unchanged).
