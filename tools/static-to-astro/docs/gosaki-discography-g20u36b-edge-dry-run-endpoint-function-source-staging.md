# G-20u36b — Gosaki Discography Edge dry-run endpoint function source staging

**Phase:** `G-20u36b-edge-dry-run-endpoint-function-source-staging`  
**Status:** **complete** — tools draft only · **no root supabase/functions edit / deploy / SQL / Save enablement**  
**Date:** 2026-07-12  
**Base commit:** `13c5bc6`  
**Prior:** G-20u36b deploy-manual-plan · deploy-preflight-result READY · inert implementation

| Check | Status |
| --- | --- |
| Function source draft (tools) | **yes** |
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
gosakiDiscographyEdgeDryRunEndpointFunctionSourceStaged: true
phase: G-20u36b-edge-dry-run-endpoint-function-source-staging
toolsDraftOnly: true
rootSupabaseFunctionsChanged: false
edgeFunctionDeployed: false
saveEnabled: false
discographySaveDbWriteExecuted: false
cursorDbWriteExecuted: false
cursorSqlExecuted: false
cursorEdgeDeployExecuted: false
serviceRoleConnected: false
supabaseClientConnected: false
proceedToRootPlacementPlan: true
proceedToRootPlacement: false
proceedToDeployManualExecution: false
proceedToSave: false
```

**G-20u36b function-source-staging scope:** tools draft only. No root placement, no deploy, no SQL, no Save enablement.

---

## Prerequisites (satisfied)

| Prerequisite | Status |
| --- | --- |
| G-20u36b deploy-manual-plan | **complete** |
| G-20u36b deploy-preflight-result | **READY** — `H.deploy_preflight.summary = READY_FOR_EDGE_DRY_RUN_DEPLOY_PREFLIGHT` |
| Inert module | `scripts/lib/gosaki-discography-edge-dry-run-endpoint-inert.mjs` — local verifier PASS |
| authenticated UPDATE grants | **0** |
| Save / First controlled write | **blocked** |
| Admin fetch POST | **not added** |

---

## Function source draft location

| Item | Path |
| --- | --- |
| **Entry (Deno.serve)** | `scripts/edge-functions/gosaki-discography-save-dry-run/index.ts` |
| **Handler** | `scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts` |
| **Basis** | Port from `gosaki-discography-edge-dry-run-endpoint-inert.mjs` + G-20u33 draft |
| **Root placement target (future)** | `supabase/functions/gosaki-discography-save-dry-run/` — **not edited in this phase** |

---

## Endpoint policy (draft)

| Item | Value |
| --- | --- |
| **Function name** | `gosaki-discography-save-dry-run` |
| **Deploy target (future)** | staging `kmjqppxjdnwwrtaeqjta` / `static-to-astro-cms-staging` |
| **Production STOP** | `vsbvndwuajjhnzpohghh` — **forbidden** |
| **HTTP method** | **POST only** |
| **Content-Type** | `application/json` |
| **siteSlug** | `gosaki-piano` only — wrong siteSlug rejected |
| **operation** | **`dryRun` only** — `save` rejected |
| **approvalId** | dry-run ID only — save approval ID rejected |
| **Write flags** | `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` = **false** (always) |
| **service_role** | **NOT CONNECTED** — `SUPABASE_SERVICE_ROLE_CONNECTED = false` |
| **Supabase client** | **NOT CONNECTED** — `resolveCurrentSnapshot()` returns empty (schema-only dry-run) |
| **DB mutations** | **none** — no insert/update/delete/upsert/rpc |
| **GitHub / FTP / deploy calls** | **none** |

---

## service_role / secrets (not connected)

| Item | This phase |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | **Not read** · not connected |
| `SUPABASE_URL` | **Not read** |
| `ALLOWED_ORIGIN` | **Not read** (CORS uses `*` in draft) |
| Browser/response/log exposure | **Forbidden** |
| Secret values in doc | **Forbidden** |

Future root-placement phase will connect SELECT-only client via internal `service_role` — separate review required.

---

## Handler behavior summary

| Case | Expected |
| --- | --- |
| Valid dryRun payload | HTTP 200 · `ok: true` · diff returned |
| `operation=save` | reject · write flags false |
| Wrong `siteSlug` | reject |
| Save approval ID | reject |
| Invalid approvalId / schema | reject |
| `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` | **always false** |
| `resolveCurrentSnapshot` | empty (no DB read until root placement) |

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Root `supabase/functions/**` edit | **not executed** |
| Edge Function deploy / Supabase CLI deploy | **not executed** |
| SQL execution | **not executed** |
| DB write | **not executed** |
| Save button enablement | **not executed** |
| Admin Discography fetch POST | **not added** |
| Secrets/env change | **not executed** |
| FTP / production | **not executed** |

---

## Next phases

| Phase | Scope | Deploy? |
| --- | --- | --- |
| **G-20u36b-edge-dry-run-endpoint-root-placement-plan** | Plan diff for root `supabase/functions/**` copy | no |
| **G-20u36b-edge-dry-run-endpoint-root-placement** | Copy reviewed draft to root · connect SELECT-only client | no deploy |
| **G-20u36b-edge-dry-run-endpoint-deploy-manual** | Operator manual deploy — staging only · separate approval | yes (operator) |
| **G-20u36b-edge-dry-run-endpoint-deploy-manual-result-record** | Record deploy outcome | no |
| **G-20u36b-edge-dry-run-endpoint-live-verify** | Live HTTP verify | no write |
| **G-20u36c** | Admin UI dry-run fetch POST wiring | no Save |
| **G-20u36e** | First controlled Save — blocked until live-verify PASS | Save (future) |

---

## STOP conditions

Stop and ask human operator if:

| Condition | Action |
| --- | --- |
| Production project `vsbvndwuajjhnzpohghh` targeted | **STOP** |
| Root `supabase/functions/**` edited without root-placement approval | **STOP** |
| `service_role` exposed to browser/response/logs | **STOP** |
| `operation=save` accepted | **STOP** |
| `didWrite` / `dbWrite` / `networkWrite` = true | **STOP** |
| DB write method added | **STOP** |
| Save button enabled | **STOP** |
| Admin fetch POST added | **STOP** |
| SQL mutation executed | **STOP** |
| Secrets printed/logged | **STOP** |
| Edge calls GitHub/FTP/deploy pipeline | **STOP** |
| Deploy attempted from dirty working tree | **STOP** |

---

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36b-edge-dry-run-endpoint-function-source-staging
npm run verify:current-active-regression
```

Historical verifier — not in active regression suite (23 verifiers unchanged).
