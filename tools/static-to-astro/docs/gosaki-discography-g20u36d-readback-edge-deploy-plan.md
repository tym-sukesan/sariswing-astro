# G-20u36d — Gosaki Discography Edge dry-run readBack edge deploy plan

**Phase:** `G-20u36d-readback-edge-deploy-plan`  
**Status:** **plan only** — no Edge deploy · no Supabase CLI deploy · no SQL · no Save  
**Date:** 2026-07-12  
**Base commit:** `a91e49e`  
**Prior:** G-20u36d readBack root placement complete · deployed staging Edge still pre-readBack

| Check | Status |
| --- | --- |
| Edge deploy plan doc | **yes** (this file) |
| Edge Function redeployed | **no** — Cursor did not deploy |
| Supabase CLI deploy | **no** |
| Root `supabase/functions/**` edited | **no** |
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
gosakiDiscographyEdgeDryRunReadBackEdgeDeployPlanPrepared: true
phase: G-20u36d-readback-edge-deploy-plan
planOnly: true
edgeDeployExecuted: false
cursorEdgeDeployExecuted: false
cursorSqlExecuted: false
cursorDbWriteExecuted: false
saveEnabled: false
adminUiChanged: false
ftpUploadExecuted: false
rootSupabaseFunctionsChanged: false
serviceRoleUsedForReadBack: false
anonSelectPreferred: true
proceedToEdgeDeployPreflight: true
proceedToEdgeDeploy: false
proceedToSave: false
```

**G-20u36d readBack edge-deploy-plan scope:** doc only. No deploy, no SQL, no Save enablement, no admin UI change, no root function edit.

---

## Prerequisites (must be satisfied before deploy execution)

| Prerequisite | Status |
| --- | --- |
| G-20u36d readBack root placement | **complete** — root `index.ts` + `handler.ts` with readBack |
| G-20u36b initial Edge deploy + live verify | **complete** — endpoint live on staging |
| G-20u36a permissions remediation | **complete** — anon SELECT on `discography` + `discography_tracks` · authenticated UPDATE **0** |
| G-20u36c admin fetch POST + STG QA | **complete** — dry-run **200 / ok=true** (schema-only baseline) |
| Save / First controlled write | **blocked** |
| Deployed staging Edge | **pre-readBack** until redeploy execution phase |

**Prior docs:** `gosaki-discography-g20u36d-readback-root-placement.md` · `gosaki-discography-g20u36b-edge-dry-run-endpoint-live-verify.md`

---

## Deploy target

| Item | Value |
| --- | --- |
| **Function name** | `gosaki-discography-save-dry-run` |
| **Project ref** | **`kmjqppxjdnwwrtaeqjta`** (staging / `static-to-astro-cms-staging`) |
| **Production STOP** | `vsbvndwuajjhnzpohghh` — **forbidden** |
| **Root source** | `supabase/functions/gosaki-discography-save-dry-run/index.ts` + `handler.ts` |
| **Deploy executor** | **Human operator** — separate explicit approval per deploy |
| **Deploy type** | **Redeploy** — replace pre-readBack staging function with readBack-enabled source |

---

## Deploy command (draft — NOT EXECUTED in this phase)

Run from repo root after operator approval in **G-20u36d-readback-edge-deploy** phase only:

```bash
cd ~/sariswing-astro
supabase functions deploy gosaki-discography-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta
```

| Rule | Value |
| --- | --- |
| Execute in this phase | **no** |
| `--project-ref` must be | **`kmjqppxjdnwwrtaeqjta` only** |
| Production ref in command | **STOP** |
| Deploy other functions | **no** |
| Deploy + SQL / DB write in same step | **STOP** |

---

## Env / secrets check policy (names / existence only — values NEVER printed)

**This phase and plan do not display secret values.** Cursor must not read, log, or paste secrets.

| Env / secret name | Purpose | Required for readBack |
| --- | --- | --- |
| `SUPABASE_URL` | Staging project URL (ref `kmjqppxjdnwwrtaeqjta`) | **yes** when readBack armed |
| `SUPABASE_ANON_KEY` | anon SELECT for readBack PostgREST GET | **yes** when readBack armed |
| `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` | Opt-in readBack arm | **set to `true` for DB-grounded diff** |
| `SUPABASE_SERVICE_ROLE_KEY` | — | **not used in G-20u36d readBack** |

### `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` behavior

| Value | Runtime behavior |
| --- | --- |
| **unset / not `true`** | Schema-only fallback · `readBack: null` · backward compatible |
| **`true`** + valid `SUPABASE_URL` + `SUPABASE_ANON_KEY` | anon SELECT readBack · DB snapshot diff · sanitized readBack summary |
| **`true`** + missing/invalid env | Graceful fallback to schema-only (index.ts catch) |

**Deploy recommendation:** Operator sets `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED=true` on staging **only after** confirming `SUPABASE_URL` + `SUPABASE_ANON_KEY` exist (names/existence — not values). Live verify phase validates DB-grounded diff.

| Rule | Value |
| --- | --- |
| Print secret values | **Forbidden** |
| Paste secrets to ChatGPT/Cursor | **Forbidden** |
| Use `SUPABASE_SERVICE_ROLE_KEY` for readBack | **Forbidden** — STOP → separate approval phase |
| Set secrets during this plan phase | **no** |

---

## readBack / safety policy (post-deploy expectation)

| Item | Expected |
| --- | --- |
| readBack auth | **anon SELECT** only · no service_role |
| readBack summary | **sanitized** — no raw rows · no UUID · no secrets |
| `operation` | **`dryRun` only** — reject `save` |
| Write flags | `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` = **false** |
| Mutations in handler | **none** |
| Matching payload vs DB | `wouldWrite: false` · `tracksAdded: 0` (live verify phase) |
| Admin UI | **unchanged** — sanitizer may block readBack display until separate phase |

---

## Pre-deploy verifier checklist (operator — before deploy execution)

Run from `tools/static-to-astro`:

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-root-placement
npm run verify:g20u36d-readback-implementation-in-tools-draft
npm run verify:g20u36d-readback-root-placement-plan
npm run verify:g20u36d-readback-edge-deploy-plan
```

Optional historical:

```bash
npm run verify:g20u36b-edge-dry-run-endpoint-root-placement
```

| Pre-deploy gate | Expected |
| --- | --- |
| `git status` | **clean** (or only documented deploy artifacts) |
| `HEAD` | matches `origin/main` at documented commit |
| Root readBack source | `resolveReadBackSnapshot` present in root handler |
| Permissions baseline | anon SELECT intact · authenticated UPDATE **0** (no new SQL in deploy phase) |

---

## Operator procedure (deploy execution phase — NOT THIS PHASE)

**Phase name:** `G-20u36d-readback-edge-deploy`

| Step | Action |
| --- | --- |
| 1 | Confirm this deploy plan doc + pre-deploy verifiers **PASS** |
| 2 | Confirm `git status` clean · `HEAD` = `origin/main` |
| 3 | Confirm env/secret **names** exist on staging (Dashboard / CLI — **no values logged**) |
| 4 | Confirm `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` strategy (arm `true` for live verify, or deploy first then arm) |
| 5 | Run deploy command (staging ref only) |
| 6 | Confirm `git status` after deploy — Supabase CLI may touch `.temp/` etc. |
| 7 | If CLI modified tracked files unintentionally, review and restore |
| 8 | Record result in deploy result doc |
| 9 | Proceed to **G-20u36d-readback-live-verify** (direct endpoint — not admin UI first) |

**NOT in deploy execution without separate approval:**

- SQL mutation / DB write
- Save enablement
- Admin UI sanitizer update
- FTP upload
- Production deploy

---

## Post-deploy expectations (live verify phase preview)

| Scenario | Expected (readBack armed) |
| --- | --- |
| Valid dryRun · payload matches DB (`discography-002`) | `ok: true` · `wouldWrite: false` · `tracksAdded: 0` |
| readBack summary | `{ enabled: true, source: "supabase-select", releaseFound: true, trackCount: 8, ... }` |
| Write flags | all **false** |
| `operation=save` | **400 reject** |
| readBack disabled (env unset) | schema-only · `readBack: null` · may show `wouldWrite: true` (STG QA class) |

**Live verify note:** Admin UI sanitizer may still treat non-null `readBack` as blocked. **First live verify uses direct HTTP to Edge endpoint**, not admin browser UI.

---

## STOP conditions

Stop and ask human operator if:

| Condition | Action |
| --- | --- |
| Project ref ≠ `kmjqppxjdnwwrtaeqjta` | **STOP** |
| Production ref `vsbvndwuajjhnzpohghh` in deploy target or env | **STOP** |
| `SUPABASE_SERVICE_ROLE_KEY` required for readBack | **STOP** → separate approval phase |
| anon SELECT returns 403 / RLS block | **STOP** → grant/RLS investigation; **no silent service_role fallback** |
| Secret values appear in logs / doc / response | **STOP** |
| `operation=save` must be accepted | **STOP** |
| Write flags become true | **STOP** |
| DB write / mutation required | **STOP** |
| Save button enablement required | **STOP** |
| Admin UI change required before deploy | **STOP** — sanitizer is separate phase |
| FTP upload required | **STOP** |
| Deploy + SQL / DB write requested together | **STOP** |
| Root source missing readBack (`resolveReadBackSnapshot`) | **STOP** — re-run root placement |
| Permissions baseline degraded (authenticated UPDATE > 0) | **STOP** |

---

## Not executed in this phase

| Item | Status |
| --- | --- |
| Edge Function deploy / Supabase CLI deploy | **not executed** |
| Root `supabase/functions/**` edit | **not executed** |
| SQL execution | **not executed** |
| DB write | **not executed** |
| Save enablement | **not executed** |
| Admin UI change | **not executed** |
| FTP upload | **not executed** |
| Live HTTP verify | **not executed** |
| Env/secret value read or display | **not executed** |
| `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` arm on staging | **not executed** |

---

## Next phases

| Phase | Scope |
| --- | --- |
| **G-20u36d-readback-edge-deploy-preflight** | Deploy preflight verifier · env names · command lock |
| **G-20u36d-readback-edge-deploy** | Operator staging Edge redeploy |
| **G-20u36d-readback-live-verify** | Direct endpoint · DB-grounded diff accuracy |
| **G-20u36d-admin-sanitizer-readback-summary-update** | Admin UI readBack summary display (if needed) |
| **G-20u36e-controlled-save-planning** | First controlled Save — **only after readBack stable** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-edge-deploy-plan
npm run verify:g20u36d-readback-root-placement
npm run verify:g20u36d-readback-implementation-in-tools-draft
```

Historical verifiers — not in active regression suite.
