# G-20u36d — Gosaki Discography Edge dry-run readBack release id SELECT fix edge deploy preflight

**Phase:** `G-20u36d-readback-release-id-select-fix-edge-deploy-preflight`  
**Status:** **complete** — deploy preflight doc only · **no Edge deploy / SQL execution / Save enablement**  
**Date:** 2026-07-13  
**Base commit:** `ae4175b`  
**Prior:** G-20u36d readBack release-id select fix root placement · live endpoint still pre-fix (trackCount=0)

| Check | Status |
| --- | --- |
| Deploy preflight doc | **yes** (this file) |
| Edge Function redeployed | **no** — Cursor did not deploy |
| Supabase CLI deploy | **no** |
| Root `supabase/functions/**` edited | **no** (this phase) |
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
gosakiDiscographyEdgeDryRunReadBackReleaseIdSelectFixEdgeDeployPreflightReady: true
phase: G-20u36d-readback-release-id-select-fix-edge-deploy-preflight
preflightOnly: true
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
proceedToEdgeDeploy: true
proceedToLiveVerifyRetry: false
proceedToG20u36eSavePlanning: false
```

**G-20u36d readBack release-id-select-fix edge-deploy-preflight scope:** preflight doc + verifier only. No deploy, no SQL, no Save enablement, no admin UI change, no root function edit.

---

## Why a new preflight (old preflight FAIL context)

After release-id fix root placement, operator ran deploy前 verifiers:

| Verifier | Result |
| --- | --- |
| `verify:g20u36d-readback-release-id-select-fix-root-placement` | **PASS** |
| `verify:g20u36d-readback-release-id-select-fix-tools-draft` | **PASS** |
| `verify:g20u36d-readback-edge-deploy-preflight` (historical) | **64/65 FAIL** |

**FAIL cause (not dangerous):** historical `verify:g20u36d-readback-edge-deploy-preflight` runs **`verify:g20u36d-readback-root-placement`**, which expects pre-release-id-fix root handler logic. After release-id fix, root handler includes `RELEASE_SELECT_FIELDS` + internal `id` and updated `resolveReadBackSnapshot()` — historical root-placement verifier reports **root handler mismatch**.

**Deploy gate decision:** use **this release-id fix preflight** instead of the old readBack edge-deploy-preflight for the release-id fix redeploy. Old preflight remains historical for the first readBack deploy.

---

## Deploy target (locked)

| Item | Value |
| --- | --- |
| **Function name** | `gosaki-discography-save-dry-run` |
| **Project ref** | **`kmjqppxjdnwwrtaeqjta`** (staging / `static-to-astro-cms-staging`) |
| **Production STOP** | `vsbvndwuajjhnzpohghh` — **forbidden** |
| **Deploy type** | **Redeploy** — pre-release-id-fix deployed Edge → release-id fix root source |
| **Deploy executor** | **Human operator** — separate explicit approval in deploy phase |

---

## Deploy command (locked — NOT EXECUTED in this phase)

```bash
cd ~/sariswing-astro
supabase functions deploy gosaki-discography-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta
```

| Rule | Value |
| --- | --- |
| Execute in this phase | **no** |
| `--project-ref` must be | **`kmjqppxjdnwwrtaeqjta` only** |
| Deploy other functions | **no** |
| Production ref in command | **STOP** |

---

## Root source safety (release-id fix — read-only review)

| Check | Expected |
| --- | --- |
| `RELEASE_SELECT_FIELDS` includes internal `id` | **yes** |
| `resolveReadBackSnapshot` uses `releaseRow.id` for tracks SELECT | **yes** |
| `mapReleaseRowToCurrentSnapshotRelease` omits `id` | **yes** |
| `buildSanitizedReadBackSummary` omits UUID / raw rows | **yes** |
| `createAnonSelectReadBackAdapter` | **present** · GET-only |
| `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` env gate | **present** |
| `SUPABASE_SERVICE_ROLE_KEY` reference | **absent** |
| `createClient` / mutation methods | **absent** |
| `operation=save` | **rejected** |
| Write flags | `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` = **false** |
| Staging ref guard | `kmjqppxjdnwwrtaeqjta` only |
| Production ref | **STOP** if in URL guard |

---

## Env / secrets (names / existence only — values not recorded)

| Env / secret name | Status | Required for readBack |
| --- | --- | --- |
| `SUPABASE_URL` | **exists** (staging ref `kmjqppxjdnwwrtaeqjta`) | **yes** when readBack armed |
| `SUPABASE_ANON_KEY` | **exists** | **yes** when readBack armed |
| `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` | **added** (operator · G-20u36d env-secret-setting-result) | **set `true` for DB-grounded live verify** |
| `SUPABASE_SERVICE_ROLE_KEY` | — | **not used in G-20u36d readBack** |

**This phase does NOT display secret values.** Cursor must not read, log, or paste secrets.

---

## Targeted verifiers (deploy前 — operator / Cursor preflight phase)

Run from repo root:

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-release-id-select-fix-edge-deploy-preflight
npm run verify:g20u36d-readback-release-id-select-fix-root-placement
npm run verify:g20u36d-readback-release-id-select-fix-tools-draft
npm run verify:g20u36d-readback-release-id-select-fix-plan
npm run verify:g20u36d-readback-env-secret-setting-result
```

| Verifier | Purpose |
| --- | --- |
| `verify:g20u36d-readback-release-id-select-fix-edge-deploy-preflight` | This preflight doc + gates |
| `verify:g20u36d-readback-release-id-select-fix-root-placement` | Release-id fix root source placed |
| `verify:g20u36d-readback-release-id-select-fix-tools-draft` | Tools draft / mock baseline |
| `verify:g20u36d-readback-release-id-select-fix-plan` | Fix plan completeness |
| `verify:g20u36d-readback-env-secret-setting-result` | readBack env secret added |

**Do not use** historical `verify:g20u36d-readback-edge-deploy-preflight` as the release-id fix deploy gate — it references pre-fix root-placement expectations.

All targeted verifiers above must **PASS** before operator proceeds to **G-20u36d-readback-release-id-select-fix-edge-deploy**.

---

## Deploy execution readiness decision

**Proceed to G-20u36d-readback-release-id-select-fix-edge-deploy when ALL are true:**

| # | Criterion |
| --- | --- |
| 1 | Targeted verifiers (section above) **PASS** |
| 2 | `git status` **clean** · `HEAD` = `origin/main` |
| 3 | Deploy command uses **`kmjqppxjdnwwrtaeqjta` only** |
| 4 | Function name is **`gosaki-discography-save-dry-run` only** |
| 5 | Env/secret **names** confirmed (not values) |
| 6 | `service_role` **not required** for readBack |
| 7 | Save **disabled** · SQL/DB write **not required** |
| 8 | Admin UI change **not required** before deploy |
| 9 | FTP upload **not required** |

**If any criterion fails → STOP** (see STOP conditions below).

---

## Post-deploy expectations (live verify retry — NOT this phase)

| Scenario | Expected (readBack armed · release-id fix deployed) |
| --- | --- |
| Valid dryRun · payload matches DB (`discography-002`) | `readBack.trackCount: 8` · `wouldWrite: false` · `tracksAdded: 0` |
| readBack summary | sanitized · `source: "supabase-select"` · **no UUID** |
| Write flags | all **false** |
| `operation=save` | **400 reject** |

**Live verify retry:** **G-20u36d-readback-live-verify-retry** — direct HTTP to Edge endpoint.  
**Save planning:** **G-20u36e** — only after live verify retry **PASS**.

---

## STOP conditions

Stop and ask human operator if:

| Condition | Action |
| --- | --- |
| Project ref ≠ `kmjqppxjdnwwrtaeqjta` | **STOP** |
| Production ref `vsbvndwuajjhnzpohghh` in deploy target or env | **STOP** |
| Deploy function ≠ `gosaki-discography-save-dry-run` | **STOP** |
| `SUPABASE_SERVICE_ROLE_KEY` required for readBack | **STOP** → separate approval phase |
| Secret values in logs / doc / response | **STOP** |
| `operation=save` must be accepted | **STOP** |
| Write flags become true (`didWrite` / `dbWrite` / `networkWrite` / `saveEnabled`) | **STOP** |
| DB write / mutation (`insert` / `update` / `delete` / `upsert` / `rpc`) required | **STOP** |
| Save enablement required | **STOP** |
| Admin UI change required before deploy | **STOP** |
| SQL / DB write / FTP required | **STOP** |
| Targeted verifiers FAIL | **STOP** |
| Root source missing release-id fix (`id` in `RELEASE_SELECT_FIELDS`) | **STOP** |

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

---

## Next phases

| Phase | Scope |
| --- | --- |
| **G-20u36d-readback-release-id-select-fix-edge-deploy** | Operator staging Edge redeploy |
| **G-20u36d-readback-live-verify-retry** | Direct endpoint · expect trackCount=8 · matching PASS |
| **G-20u36e-controlled-save-planning** | First controlled Save — **after live verify retry PASS** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-release-id-select-fix-edge-deploy-preflight
npm run verify:g20u36d-readback-release-id-select-fix-root-placement
npm run verify:g20u36d-readback-release-id-select-fix-tools-draft
npm run verify:g20u36d-readback-env-secret-setting-result
```

Historical verifiers — not in active regression suite.
