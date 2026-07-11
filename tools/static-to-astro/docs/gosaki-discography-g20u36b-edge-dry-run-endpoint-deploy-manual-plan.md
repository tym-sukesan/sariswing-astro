# G-20u36b — Gosaki Discography Edge dry-run endpoint deploy manual plan

**Phase:** `G-20u36b-edge-dry-run-endpoint-deploy-manual-plan`  
**Status:** **complete** — manual deploy plan doc only · **no Edge deploy / root supabase/functions edit / SQL / Save enablement**  
**Date:** 2026-07-12  
**Base commit:** `2189c82`  
**Prior:** G-20u36b deploy-preflight-result READY · inert implementation · G-20u36a permissions PASS

| Check | Status |
| --- | --- |
| Manual deploy plan doc | **yes** (this file) |
| Edge Function deployed | **no** — Cursor did not deploy |
| Root `supabase/functions/**` changed | **no** |
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
gosakiDiscographyEdgeDryRunEndpointDeployManualPlanPrepared: true
phase: G-20u36b-edge-dry-run-endpoint-deploy-manual-plan
planOnly: true
edgeFunctionDeployed: false
saveEnabled: false
discographySaveDbWriteExecuted: false
cursorDbWriteExecuted: false
cursorSqlExecuted: false
cursorEdgeDeployExecuted: false
cursorFtpUploadExecuted: false
rootSupabaseFunctionsChanged: false
productionUploadStop: true
productionDbWriteStop: true
serviceRoleBrowserExposure: false
secretsPrinted: false
proceedToFunctionSourceStaging: true
proceedToDeployManualExecution: false
proceedToSave: false
proceedToDbWrite: false
proceedToEdgeDeploy: false
```

**G-20u36b deploy-manual-plan scope:** doc only. No function source placement, no deploy, no SQL, no Save enablement.

---

## Prerequisites (must be satisfied before deploy execution)

| Prerequisite | Status |
| --- | --- |
| G-20u36b deploy-preflight-result | **READY** — `H.deploy_preflight.summary = READY_FOR_EDGE_DRY_RUN_DEPLOY_PREFLIGHT` |
| authenticated UPDATE grants | **0** |
| anon write grants | **0** |
| SELECT grants | **maintained** |
| RLS enabled | **true** |
| Data baseline | **4 / 34** · **discography-002 / 1 / 8** |
| Inert module local verifier | **PASS** |
| Save / First controlled write | **blocked** |
| Admin fetch POST | **not added** |

**Prior result doc:** `gosaki-discography-g20u36b-edge-dry-run-endpoint-deploy-preflight-result.md`

---

## Manual deploy policy

| Item | Value |
| --- | --- |
| **Function name** | `gosaki-discography-save-dry-run` |
| **Deploy target** | **staging only** — `kmjqppxjdnwwrtaeqjta` / `static-to-astro-cms-staging` |
| **Production STOP** | `vsbvndwuajjhnzpohghh` — **forbidden** |
| **siteSlug** | `gosaki-piano` only |
| **Initial legacyId** | `discography-002` |
| **operation** | **`dryRun` only** — reject `save` |
| **Write flags** | `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` = **false** |
| **service_role** | Edge runtime secret only — **never browser/response/log** |
| **Deploy executor** | **Human operator** — separate explicit approval per deploy |

---

## A. Function source staging (next phase — not this phase)

Before any deploy, function source must be placed under root `supabase/functions/gosaki-discography-save-dry-run/` in a **dedicated future phase**.

| Rule | Value |
| --- | --- |
| Source basis | Port from `scripts/lib/gosaki-discography-edge-dry-run-endpoint-inert.mjs` + G-20u33 draft |
| Inert safety preserved | dryRun valid · save reject · write flags false · no mutation |
| `Deno.serve` | Required in deployed function — **review scope documented in source phase** |
| Supabase client | **SELECT-only read** for baseline diff — no write methods |
| `service_role` | `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")` internal only |
| Deploy review | **Mandatory** before deploy-manual execution |
| This phase | **No root `supabase/functions/**` edit** |

**Future phase name (recommended):** `G-20u36b-edge-dry-run-endpoint-function-source-staging`

---

## B. Secrets / env existence check (operator — before deploy execution)

**This phase and plan do not display secret values.** Cursor must not read or log secrets.

| Secret name | Confirm existence only |
| --- | --- |
| `SUPABASE_URL` | Staging project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge internal SELECT-only |
| `ALLOWED_ORIGIN` (optional) | CORS allowlist for staging admin |

| Rule | Value |
| --- | --- |
| Print secret values | **Forbidden** |
| Paste secrets to ChatGPT/Cursor | **Forbidden** |
| Operator confirmation | Supabase Dashboard / CLI — existence only |
| Set secrets during deploy | **deploy-manual execution phase only** |

---

## C. Future manual deploy command draft

```txt
NOT EXECUTED IN THIS PHASE
HUMAN OPERATOR ONLY
STAGING ONLY — project ref kmjqppxjdnwwrtaeqjta
STOP if project ref = vsbvndwuajjhnzpohghh (production)
Requires: function source staged · secrets confirmed · explicit one-time approval
```

Future draft (confirm in deploy-manual **execution** phase — **do not run now**):

```bash
# NOT EXECUTED — draft only
# 1. Confirm Supabase CLI linked to staging project ref kmjqppxjdnwwrtaeqjta
# 2. Confirm function source exists at supabase/functions/gosaki-discography-save-dry-run/
# 3. Confirm secrets set (values not logged)
# 4. Operator explicit one-time approval required

# supabase functions deploy gosaki-discography-save-dry-run \
#   --project-ref kmjqppxjdnwwrtaeqjta
```

| Rule | Value |
| --- | --- |
| Execute in this phase | **no** |
| Production deploy | **STOP** |
| Deploy without preflight READY | **STOP** |
| Deploy without function source review | **STOP** |
| Deploy without operator approval | **STOP** |

---

## D. Live verify plan (after deploy execution — not this phase)

| Case | Expected |
| --- | --- |
| Valid dryRun payload | HTTP 200 · `ok: true` · diff returned |
| `operation=save` | reject · no write |
| Wrong `siteSlug` | reject |
| Invalid approvalId | reject |
| `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` | **always false** |
| DB data baseline | unchanged — 4/34 · discography-002/8 |
| Permissions | authenticated UPDATE = **0** |
| Admin UI Save | **remains disabled** |
| Admin fetch POST | **not yet wired** |

**Future phase:** `G-20u36b-edge-dry-run-endpoint-live-verify`

---

## E. Rollback / disable plan (document only — not executed)

| Scenario | Action |
| --- | --- |
| Endpoint returns unexpected write flags | **STOP** — do not wire admin UI |
| Endpoint unreachable / 500 | Investigate logs — **no secrets in logs** |
| Data change detected post-deploy | **STOP** — separate incident phase |
| Disable function | Supabase Dashboard disable or delete — **separate operator approval** |
| UI impact | Limited — admin UI has **no fetch POST** yet |

**This phase:** no disable, delete, rollback, or deploy operations.

---

## Pre-deploy checklist (for future deploy-manual execution)

| # | Check | Block if fail |
| --- | --- | --- |
| 1 | Preflight result **READY** recorded | yes |
| 2 | Function source staged + reviewed | yes |
| 3 | Secrets existence confirmed (values not logged) | yes |
| 4 | Project ref = `kmjqppxjdnwwrtaeqjta` | yes |
| 5 | Production ref **not** targeted | yes |
| 6 | Working tree clean at documented commit | yes |
| 7 | Inert module verifier PASS | yes |
| 8 | Operator explicit approval form | yes |
| 9 | Save still disabled · fetch POST not added | yes |

---

## STOP conditions

Stop and ask human operator if:

| Condition | Action |
| --- | --- |
| Production project `vsbvndwuajjhnzpohghh` targeted | **STOP** |
| Project ref cannot be confirmed | **STOP** |
| Root `supabase/functions/**` edited before plan approval | **STOP** |
| `service_role` exposed to browser/response/logs | **STOP** |
| `operation=save` accepted | **STOP** |
| `didWrite` / `dbWrite` / `networkWrite` = true | **STOP** |
| DB write method added to function | **STOP** |
| Save button enabled | **STOP** |
| Admin fetch POST added | **STOP** |
| SQL mutation executed | **STOP** |
| Secrets printed/logged | **STOP** |
| Edge calls GitHub/FTP/deploy pipeline | **STOP** |
| Permissions baseline degraded (UPDATE grants > 0) | **STOP** |
| Working tree dirty at deploy attempt | **STOP** |
| Preflight result not READY | **STOP** |

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
| **G-20u36b-edge-dry-run-endpoint-function-source-staging** | Place function source under root `supabase/functions/**` — review required | no |
| **G-20u36b-edge-dry-run-endpoint-deploy-manual** | Operator manual deploy execution — staging only · separate approval | yes (operator) |
| **G-20u36b-edge-dry-run-endpoint-deploy-manual-result-record** | Record deploy outcome | no |
| **G-20u36b-edge-dry-run-endpoint-live-verify** | Live HTTP verify | no write |
| **G-20u36c** | Admin UI dry-run fetch POST wiring | no Save |
| **G-20u36e** | First controlled Save — blocked until live-verify PASS | Save (future) |

---

## Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36b-edge-dry-run-endpoint-deploy-manual-plan
npm run verify:current-active-regression
```

Historical verifier — not in active regression suite (23 verifiers unchanged).
