# G-20u36b — Gosaki Discography Edge dry-run endpoint implementation plan

**Phase:** `G-20u36b-edge-dry-run-endpoint-implementation-plan`  
**Status:** **complete** — implementation plan doc only · **no Edge Function source / deploy / SQL / Save enablement**  
**Date:** 2026-07-12  
**Base commit:** `1629573`  
**Prior:** G-20u36b deploy plan · G-20u36a permissions remediation PASS · G-20u33 dry-run endpoint draft · G-20u32 schema · G-20u31 Save design

| Check | Status |
| --- | --- |
| Implementation plan doc | **yes** (this file) |
| Edge Function source added | **no** — Cursor did not implement |
| `supabase/functions/**` changed | **no** |
| Edge Function deployed | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Save UI enabled | **no** |
| Production changed | **no** — **STOP** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunEndpointImplementationPlanPrepared: true
phase: G-20u36b-edge-dry-run-endpoint-implementation-plan
planOnly: true
edgeFunctionImplemented: false
edgeFunctionDeployed: false
saveEnabled: false
discographySaveDbWriteExecuted: false
cursorDbWriteExecuted: false
cursorSqlExecuted: false
cursorEdgeDeployExecuted: false
cursorFtpUploadExecuted: false
productionUploadStop: true
productionDbWriteStop: true
serviceRoleBrowserExposure: false
anonKeyDirectWriteAllowed: false
proceedToInertImplementation: true
proceedToSave: false
proceedToDbWrite: false
proceedToEdgeDeploy: false
```

**G-20u36b implementation-plan scope:** doc only. No `.ts`/`.js` Edge source, no deploy, no SQL, no Save enablement.

---

## 1. Prerequisites

| Prerequisite | Status |
| --- | --- |
| G-20u36b deploy plan | **complete** — `gosaki-discography-g20u36b-edge-dry-run-endpoint-deploy-plan.md` |
| G-20u36a permissions remediation after-verification | **PASS** — `H.after_verification.summary = PASS` |
| authenticated UPDATE grants | **0** |
| anon write grants | **0** |
| SELECT grants | **maintained** — anon 2 · authenticated 2 |
| RLS enabled | **true** — both tables |
| Data baseline | **4 releases / 34 tracks** · **discography-002 = 1 / 8** |
| Permissions remediation complete candidate | **true** |
| Save / First controlled write | **blocked** |
| G-20u33 dry-run endpoint draft | **complete** |
| G-20u32 schema + approval registry | **complete** |
| G-20u34 Save UI arm design | **complete** — `executableSaveAllowed` always false |

---

## 2. Implementation policy (this phase — plan only)

| Rule | Value |
| --- | --- |
| Cursor implements Edge Function | **no** — this phase is plan doc only |
| `supabase/functions/**` edit | **no** — deferred to inert-implementation phase |
| Deploy | **no** |
| SQL / DB write | **no** |
| Save enablement | **no** |
| Discography fetch POST in admin UI | **no** — deferred to G-20u36c |
| `.ts` / `.js` Edge source in repo | **no** — not added in this phase |

---

## 3. Endpoint specification (to implement in future phases)

| Item | Value |
| --- | --- |
| **Name** | `gosaki-discography-save-dry-run` |
| **Future path** | `supabase/functions/gosaki-discography-save-dry-run/index.ts` — **not created in this phase** |
| **Environment** | **staging only** |
| **Staging project ref** | `kmjqppxjdnwwrtaeqjta` / `static-to-astro-cms-staging` |
| **Production project ref** | `vsbvndwuajjhnzpohghh` — **STOP / forbidden** |
| **Staging URL (future)** | `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run` |
| **siteSlug** | `gosaki-piano` only |
| **Initial legacyId** | `discography-002` |
| **operation** | **`dryRun` only** — reject `save` |
| **approvalId** | dry-run approval only — `G-20u31-gosaki-discography-save-dry-run-endpoint` |
| **Save approval ID** | **rejected** — e.g. `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` |
| **didWrite / dbWrite / networkWrite** | **always false** |
| **DB mutation** | **none** — SELECT-only read for baseline comparison |

---

## 4. Existing modules to reuse (implementation candidates)

| Module | Path | Role in Edge implementation |
| --- | --- | --- |
| Dry-run endpoint draft | `scripts/lib/gosaki-discography-save-dry-run-endpoint-draft.mjs` | `validateDiscographySaveDryRunEndpointRequest` · `buildDiscographySaveDryRunEndpointResponse` · `simulateDiscographySaveDryRunEndpoint` — port logic to Deno |
| Save schema | `scripts/lib/gosaki-discography-save-schema.mjs` | `validateDiscographySaveRequest` · `assertDiscographySaveIsStagingOnly` · `assertNoBrowserServiceRole` · release field list |
| Approval registry | `scripts/lib/gosaki-discography-save-approval-registry.mjs` | `validateApprovalIdShape` · `GOSAKI_DISCOGRAPHY_SAVE_APPROVAL_REGISTRY` · dry-run vs save approval policy |
| Save UI arm design | `scripts/lib/gosaki-discography-save-ui-arm-design.mjs` | Gate names · UI states · `executableSaveAllowed` remains false until G-20u36e |

### Draft module exports (G-20u33 — reference for port)

| Export | Purpose |
| --- | --- |
| `GOSAKI_DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_NAME` | `"gosaki-discography-save-dry-run"` |
| `DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_OPERATION` | `"dryRun"` |
| `validateDiscographySaveDryRunEndpointRequest()` | Reject `save` · delegate to G-20u32 schema |
| `buildDiscographySaveDryRunEndpointResponse()` | Response builder — write flags always false |
| `simulateDiscographySaveDryRunEndpoint()` | Pure simulation — no DB in draft; Edge adds SELECT-only read |

**Port strategy (future inert-implementation phase):** Copy validation logic into Deno Edge Function; do **not** import Node-only modules at runtime. Keep draft module as source-of-truth for local verifier parity.

---

## 5. Request validation plan

### 5.1 Transport

| Item | Plan |
| --- | --- |
| HTTP method | **POST only** — reject GET/PUT/DELETE/PATCH with 405 |
| Content-Type | **`application/json`** — reject others with 415 |
| Body | JSON object matching G-20u32 request schema |

### 5.2 Required fields

| Field | Validation |
| --- | --- |
| `operation` | Must be `"dryRun"` — reject `"save"` with 400 |
| `siteSlug` | Must be `"gosaki-piano"` — reject other slugs |
| `legacyId` | Required · non-empty string · initial pilot restricts to `discography-002` (warn or reject others per inert-implementation gate) |
| `approvalId` | Required · must match dry-run registry entry · **reject save approval IDs** |
| `release` | Object with 10 metadata fields (G-20u32 `DISCOGRAPHY_SAVE_RELEASE_FIELDS`) |
| `tracksText` | Non-empty string (unless `allowEmptyTrackList: true`) |
| `trackPolicy` | Object with boolean flags |
| `clientDryRun` | Browser snapshot for cross-check |

### 5.3 Reject conditions

| Condition | Response |
| --- | --- |
| `operation = "save"` | 400 · `"operation save is rejected by dry-run endpoint"` |
| Wrong `siteSlug` | 400 · staging guard error |
| Missing / invalid `approvalId` | 400 · shape or registry mismatch |
| Save approval ID used | 400 · `"save approval ID not accepted on dry-run endpoint"` |
| `service_role` in payload | 400 · `assertNoBrowserServiceRole` |
| Non-staging environment / project ref | 403 · hard block |
| Payload implying write execution | 400 · e.g. `executeWrite: true` if such field appears |
| Malformed JSON | 400 |

### 5.4 Validation pipeline (ordered)

1. HTTP method + Content-Type check  
2. JSON parse  
3. Reject `operation = save` (early exit)  
4. `validateDiscographySaveRequest()` (G-20u32)  
5. `validateApprovalIdShape()` with `operation: dryRun`  
6. Registry lookup — approval must be dry-run entry  
7. `assertDiscographySaveIsStagingOnly()`  
8. `assertNoBrowserServiceRole()`  
9. `parseDiscographyTrackListLines()` + track policy  
10. SELECT-only read current baseline (future Edge — not in this phase)  
11. Diff vs baseline · set `wouldWrite`  
12. `buildDiscographySaveDryRunEndpointResponse()` — write flags false  

---

## 6. Response validation plan

### 6.1 Success response (200)

| Field | Rule |
| --- | --- |
| `ok` | `true` when validation passes |
| `operation` | always `"dryRun"` |
| `endpoint` | `"gosaki-discography-save-dry-run"` |
| `siteSlug` | `"gosaki-piano"` |
| `legacyId` | echoed from request |
| `approvalId` | echoed from request |
| `wouldWrite` | `true` when diff detects changes · `false` when no diff |
| `didWrite` | **always `false`** |
| `dbWrite` | **always `false`** |
| `networkWrite` | **always `false`** |
| `saveEnabled` | **always `false`** |
| `changedCounts` | `{ releaseFields, tracksAdded, tracksRemoved, tracksReordered }` |
| `diff` | G-20u30 track diff + `releaseFieldsChanged` |
| `errors` | `[]` on success |
| `warnings` | duplicate titles etc. |
| `backupToken` | **null** |
| `backupPreview` | **null** |
| `readBack` | **null** |
| `serverTime` | ISO-8601 |
| **Secrets** | **never included** |

### 6.2 Error response (400 / 403 / 405 / 415)

| Field | Rule |
| --- | --- |
| `ok` | `false` |
| `operation` | `"dryRun"` (or omitted with clear error) |
| `didWrite` / `dbWrite` / `networkWrite` | **always `false`** |
| `wouldWrite` | **always `false`** on validation failure |
| `errors` | human-readable rejection reasons |
| `approvalRequirements` | when approval invalid — list required dry-run approval ID |

### 6.3 Response invariants (verifier-enforced in future phases)

- No `service_role` · no Supabase keys · no internal env values  
- No `backupToken` issued at dry-run stage  
- No `readBack` (Save phase only)  

---

## 7. Security plan

| Rule | Implementation |
| --- | --- |
| `service_role` | Read from Edge runtime secret (`Deno.env.get`) only — **never in request/response/logs** |
| Browser exposure | **Forbidden** — static admin package uses anon key + session JWT only |
| Supabase write methods | **Forbidden** — no `.insert()` / `.update()` / `.upsert()` / `.delete()` / mutation RPC |
| DB access in dry-run | **SELECT-only** — read current `discography` + `discography_tracks` rows for diff |
| GitHub / FTP / deploy | **Forbidden** from Edge Function |
| localStorage / approval persistence | **Forbidden** |
| CORS | Minimum required origin allowlist — staging admin host only (exact list in deploy-preflight) |
| Staging guard | Hard-check project ref `kmjqppxjdnwwrtaeqjta` in Edge env · reject production ref |
| Auth | Supabase session JWT — operator must be authenticated (details in deploy-preflight) |
| Logging | No secrets · no full payloads with credentials · redact approval tokens if any |
| Grant layer | Preserve authenticated UPDATE = 0 · do not reintroduce browser direct write |

---

## 8. Inert implementation preview (next phase — not executed here)

The **G-20u36b-edge-dry-run-endpoint-inert-implementation** phase will:

| Item | Scope |
| --- | --- |
| Create | `supabase/functions/gosaki-discography-save-dry-run/index.ts` — inert stub |
| Handler | Parse JSON · run validation pipeline · return mock/simulated response |
| DB | **No connection** in inert phase — use `currentSnapshot` injection or hardcoded fixture |
| Deploy | **No** — local verifier only |
| Deno.serve | Present but not deployed until deploy-manual phase |

This phase (**implementation-plan**) does **not** create any of the above files.

---

## 9. Future phases

| Phase | Scope | Deploy? |
| --- | --- | --- |
| **G-20u36b-edge-dry-run-endpoint-inert-implementation** | Inert function source + local verifier — no deploy | no |
| **G-20u36b-edge-dry-run-endpoint-deploy-preflight** | secrets/env/project ref · SELECT-only preflight SQL | no |
| **G-20u36b-edge-dry-run-endpoint-deploy-manual** | Operator manual `supabase functions deploy` — staging only | yes (operator) |
| **G-20u36b-edge-dry-run-endpoint-live-verify** | Live HTTP verify · valid/invalid payloads · no table changes | no write |
| **G-20u36c** | Admin UI dry-run fetch POST wiring — dry-run call only | no Save |
| **G-20u36e** | First controlled Save — **blocked until live-verify PASS** | Save (future) |

---

## 10. STOP conditions

Stop and ask human operator if:

| Condition | Action |
| --- | --- |
| `supabase/functions/**` edited before plan approval | **STOP** |
| `service_role` exposed to browser / static package / response / logs | **STOP** |
| `operation = save` accepted | **STOP** |
| `didWrite` / `dbWrite` / `networkWrite` = true | **STOP** |
| DB write method (insert/update/delete/upsert/mutation RPC) added | **STOP** |
| Production project `vsbvndwuajjhnzpohghh` targeted | **STOP** |
| Save button enabled | **STOP** |
| Discography fetch POST added to admin UI (this phase) | **STOP** |
| SQL mutation executed | **STOP** |
| Secrets/env logged or returned | **STOP** |
| Edge calls GitHub / FTP / deploy | **STOP** |
| localStorage / approval state persistence added | **STOP** |
| CORS broadened beyond staging admin minimum | **STOP** |

---

## 11. Not executed in this phase

| Item | Status |
| --- | --- |
| Edge Function `.ts` / `.js` source | **not added** |
| `supabase/functions/**` edit | **not executed** |
| Edge Function deploy | **not executed** |
| SQL execution | **not executed** |
| DB write / REVOKE / GRANT / RLS change | **not executed** |
| Save button enablement | **not executed** |
| Discography fetch POST | **not added** |
| Secrets / env change | **not executed** |
| FTP / package upload / production | **not executed** |

---

## 12. Related docs

| Doc | Role |
| --- | --- |
| `gosaki-discography-g20u36b-edge-dry-run-endpoint-deploy-plan.md` | Prior deploy plan |
| `gosaki-discography-g20u36a-permissions-remediation-after-verification-result.md` | Permissions PASS |
| `gosaki-discography-save-dry-run-endpoint-draft.md` | G-20u33 endpoint draft |
| `gosaki-discography-save-design.md` | G-20u31 Save spec |
| `gosaki-discography-staging-db-write-test-plan-rollback-drill.md` | G-20u35 checklist |

---

## 13. Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36b-edge-dry-run-endpoint-implementation-plan
npm run verify:current-active-regression
```

Historical verifier — not in active regression suite (23 verifiers unchanged).
