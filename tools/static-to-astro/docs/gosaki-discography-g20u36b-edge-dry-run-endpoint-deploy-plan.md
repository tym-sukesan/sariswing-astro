# G-20u36b — Gosaki Discography Edge dry-run endpoint deploy plan

**Phase:** `G-20u36b-edge-dry-run-endpoint-deploy-plan`  
**Status:** **complete** — deploy plan doc only · **no Edge Function implementation / deploy / SQL / Save enablement**  
**Date:** 2026-07-11  
**Base commit:** `0c07a95`  
**Prior:** G-20u36a permissions remediation after-verification PASS · G-20u33 dry-run endpoint draft · G-20u32 schema · G-20u31 Save design · G-20u35 write test plan

| Check | Status |
| --- | --- |
| Deploy plan doc | **yes** (this file) |
| Edge Function implemented | **no** — Cursor did not implement |
| `supabase/functions/**` changed | **no** |
| Edge Function deployed | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Save UI enabled | **no** |
| Production changed | **no** — **STOP** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunEndpointDeployPlanPrepared: true
phase: G-20u36b-edge-dry-run-endpoint-deploy-plan
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
proceedToImplementationPlan: true
proceedToSave: false
proceedToDbWrite: false
proceedToEdgeDeploy: false
```

**G-20u36b scope:** deploy plan doc only. No implementation, deploy, SQL, or Save enablement.

---

## 1. Prerequisites (must be satisfied before any deploy phase)

| Prerequisite | Status |
| --- | --- |
| G-20u36a permissions remediation after-verification | **PASS** — `H.after_verification.summary = PASS` |
| authenticated UPDATE grants | **0** (was 2 pre-REVOKE) |
| anon write grants | **0** |
| SELECT grants | **maintained** — anon 2 · authenticated 2 |
| RLS enabled | **true** — both `discography` + `discography_tracks` |
| Data baseline | **4 releases / 34 tracks** · **discography-002 = 1 / 8** |
| Permissions remediation complete candidate | **true** |
| Effective write risk | **NEEDS_REVIEW** — **no longer RISK** |
| Admin ALL policies remain | `discography_admin_all` · `discography_tracks_admin_all` — policy hardening **deferred** |
| Browser direct write | **blocked at grant layer** (authenticated UPDATE = 0) |
| Save UI | **disabled** — First Save **not yet allowed** |
| G-20u33 dry-run endpoint draft | **complete** |
| G-20u32 API schema + approval registry | **complete** |

**Prior result doc:** `gosaki-discography-g20u36a-permissions-remediation-after-verification-result.md`

---

## 2. Purpose — why deploy a dry-run endpoint before Save

Before enabling Discography Save (non-dry-run), the admin UI needs a **server-side dry-run path** that:

| Goal | Detail |
| --- | --- |
| Validate payload server-side | Reuse G-20u32 request schema + G-20u33 validation pipeline |
| Return diff / wouldWrite | Server compares against current staging DB snapshot (SELECT-only read inside Edge) |
| Return approval requirements | Confirm dry-run approval ID shape; **reject save approval IDs** |
| No DB mutation | `operation = dryRun` only · `didWrite` / `dbWrite` / `networkWrite` always **false** |
| Bridge browser → Edge | Admin UI will call Edge (future phase) instead of direct PostgREST write |
| Preserve grant-layer safety | Browser never gets `service_role`; authenticated UPDATE grant remains **0** |

G-20u30 browser dry-run remains valid for local preview. G-20u36b plans the **server-side** complement required by G-20u35 pre-execution checklist item #7.

---

## 3. Endpoint specification (planned — not implemented in G-20u36b)

| Item | Value |
| --- | --- |
| **Name** | `gosaki-discography-save-dry-run` |
| **Deploy path (future)** | `supabase/functions/gosaki-discography-save-dry-run/` — **not created in G-20u36b** |
| **Draft module (existing)** | `scripts/lib/gosaki-discography-save-dry-run-endpoint-draft.mjs` (G-20u33) |
| **Environment** | **staging only** |
| **Staging project ref** | `kmjqppxjdnwwrtaeqjta` / `static-to-astro-cms-staging` |
| **Production project ref** | `vsbvndwuajjhnzpohghh` — **STOP / forbidden** |
| **Target siteSlug** | `gosaki-piano` only |
| **Initial target album** | `discography-002` (Continuous · 8 tracks) |
| **HTTP method** | `POST` only |
| **operation** | **`dryRun` only** — reject `save` with 400 |
| **approvalId** | Dry-run approval only — e.g. `G-20u31-gosaki-discography-save-dry-run-endpoint` |
| **Save approval ID** | **Not accepted** in dry-run endpoint |
| **Staging URL (future)** | `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run` |

### Request (G-20u32 schema — unchanged)

See G-20u33 §2. Required fields: `operation`, `siteSlug`, `legacyId`, `approvalId`, `release`, `tracksText`, `trackPolicy`, `clientDryRun`.

### Response (G-20u33 draft — unchanged)

| Field | G-20u36b deploy plan rule |
| --- | --- |
| `ok` | boolean |
| `operation` | always `"dryRun"` |
| `wouldWrite` | **may be `true`** when diff detects changes |
| `didWrite` | **always `false`** |
| `dbWrite` | **always `false`** |
| `networkWrite` | **always `false`** (no GitHub/FTP/deploy side effects) |
| `saveEnabled` | **always `false`** |
| `diff` | track diff + `releaseFieldsChanged` |
| `changedCounts` | releaseFields · tracksAdded/Removed/Reordered |
| `errors` / `warnings` | validation messages |
| `backupToken` | **null** — not issued at dry-run stage |
| `readBack` | **null** — Save phase only |

---

## 4. Auth & secrets (plan — verification in separate phase)

| Rule | Value |
| --- | --- |
| `service_role` | **Edge Function internal only** — Supabase secrets / env |
| Browser exposure | **Forbidden** — never in static admin package or client JS |
| Anon key direct write | **Forbidden** — authenticated UPDATE grant = 0 |
| Operator auth | Supabase session JWT (staging operator) — details in implementation plan |
| CORS | Staging admin origin only — allowlist in implementation phase |
| Secrets / env confirmation | **Separate phase** — not in G-20u36b |

---

## 5. Safety gates (required before deploy)

| # | Gate | Block if fail |
| --- | --- | --- |
| 1 | Target project = staging `kmjqppxjdnwwrtaeqjta` | yes |
| 2 | Production ref `vsbvndwuajjhnzpohghh` not used | yes |
| 3 | G-20u36a after-verification PASS recorded | yes |
| 4 | authenticated UPDATE grants = 0 | yes |
| 5 | `operation = save` rejected at endpoint | yes |
| 6 | `didWrite` / `dbWrite` / `networkWrite` always false | yes |
| 7 | No INSERT / UPDATE / DELETE / UPSERT in dry-run path | yes |
| 8 | Request schema conforms to G-20u32 | yes |
| 9 | Response schema conforms to G-20u33 draft | yes |
| 10 | `service_role` not exposed to browser | yes |
| 11 | Save button remains disabled in admin UI | yes |
| 12 | No Discography fetch POST added to admin UI (this phase) | yes |
| 13 | No SQL mutation files created | yes |
| 14 | No GitHub workflow_dispatch / FTP / deploy from Edge | yes |
| 15 | Deploy preflight completed before manual deploy | yes |
| 16 | Operator explicit approval for one-time deploy | yes |

---

## 6. STOP conditions

Stop and ask human operator if any of the following occur:

| Condition | Action |
| --- | --- |
| Production project `vsbvndwuajjhnzpohghh` targeted | **STOP** |
| `service_role` exposed to browser / static package / logs | **STOP** |
| `operation = save` accepted by dry-run endpoint | **STOP** |
| `didWrite` / `dbWrite` / `networkWrite` = true in dry-run response | **STOP** |
| `supabase/functions/**` edited before plan approval | **STOP** (G-20u36b is plan-only) |
| Deploy attempted before deploy-preflight phase | **STOP** |
| Browser direct DB write reintroduced (anon/authenticated PostgREST UPDATE) | **STOP** |
| Save button enabled before explicit Save phase | **STOP** |
| SQL mutation executed without dedicated approval | **STOP** |
| Secrets printed or logged | **STOP** |
| Edge Function calls GitHub / FTP / deploy pipeline | **STOP** |
| REVOKE / GRANT / RLS policy change without dedicated phase | **STOP** |
| localStorage / approval state persistence added | **STOP** |

---

## 7. Future phases (deploy pipeline — not executed in G-20u36b)

| Phase | Scope | Deploy? |
| --- | --- | --- |
| **G-20u36b-edge-dry-run-endpoint-implementation-plan** | Formal implementation plan doc; map G-20u33 draft → Deno Edge Function structure | no |
| **G-20u36b-edge-dry-run-endpoint-inert-implementation** | Create `supabase/functions/gosaki-discography-save-dry-run/` — inert stub (no DB write, no deploy) | no |
| **G-20u36b-edge-dry-run-endpoint-deploy-preflight** | Preflight checklist · secrets confirmation · staging-only verification SQL (SELECT-only) | no |
| **G-20u36b-edge-dry-run-endpoint-deploy-manual** | Operator manual `supabase functions deploy` — staging only · one-time approval | yes (operator) |
| **G-20u36b-edge-dry-run-endpoint-live-verify** | Live HTTP verify · valid dryRun payload · invalid siteSlug · operation=save rejected | no write |
| **G-20u36c+** | Admin UI fetch POST wiring (dry-run call only) — separate phase | no Save |
| **G-20u36e** | First controlled Save — blocked until live dry-run verified | Save (future) |

---

## 8. Success criteria — future live dry-run (after deploy-manual + live-verify)

All must PASS before proceeding to Save UI wiring or First Save:

| Criterion | Expected |
| --- | --- |
| Endpoint reachable on staging | HTTP 200 for valid dryRun |
| Valid payload returns validation + diff | `ok: true` · `wouldWrite` reflects diff |
| Invalid `siteSlug` rejected | HTTP 400 · error in response |
| `operation = save` rejected | HTTP 400 · not accepted |
| `didWrite` / `dbWrite` / `networkWrite` | **always false** |
| Table data unchanged | SELECT-only before/after — 4/34 · discography-002/8 |
| Permissions remain | authenticated UPDATE = 0 · anon write = 0 |
| Admin UI Save | **remains disabled** until later explicit phase |
| Admin ALL policies | may remain — NEEDS_REVIEW acceptable for dry-run gate |

---

## 9. Not executed in G-20u36b

| Item | Status |
| --- | --- |
| Edge Function implementation | **not executed** — Cursor did not implement |
| `supabase/functions/**` edit | **not executed** |
| Edge Function deploy | **not executed** |
| SQL execution | **not executed** |
| DB write / REVOKE / GRANT / RLS change | **not executed** |
| Save button enablement | **not executed** |
| Discography fetch POST in admin UI | **not added** |
| Secrets / env change | **not executed** |
| FTP / package upload / production | **not executed** |
| localStorage / approval persistence | **not added** |
| GitHub workflow_dispatch | **not triggered** |

---

## 10. Related docs

| Doc | Role |
| --- | --- |
| `gosaki-discography-g20u36a-permissions-remediation-after-verification-result.md` | Prerequisite — permissions PASS |
| `gosaki-discography-g20u36a-permissions-remediation-apply-plan.md` | REVOKE context |
| `gosaki-discography-save-design.md` | G-20u31 Save spec |
| `gosaki-discography-save-dry-run-endpoint-draft.md` | G-20u33 endpoint draft |
| `gosaki-discography-staging-db-write-test-plan-rollback-drill.md` | G-20u35 checklist item #7 |

---

## 11. Verify

```bash
cd tools/static-to-astro
npm run verify:g20u36b-edge-dry-run-endpoint-deploy-plan
npm run verify:current-active-regression
```

Historical verifier — not in active regression suite (23 verifiers unchanged).
