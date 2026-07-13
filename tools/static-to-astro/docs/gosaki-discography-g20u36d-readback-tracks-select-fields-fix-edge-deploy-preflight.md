# G-20u36d — Gosaki Discography Edge dry-run readBack tracks SELECT fields fix edge deploy preflight

**Phase:** `G-20u36d-readback-tracks-select-fields-fix-edge-deploy-preflight`  
**Status:** **complete** — deploy preflight doc only · **no Edge deploy / SQL execution / Save enablement**  
**Date:** 2026-07-13  
**Base commit:** `cd6b0d5`  
**Prior:** G-20u36d readBack tracks SELECT fields fix root placement · live endpoint still pre-fix (duration in deployed Edge)

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
gosakiDiscographyEdgeDryRunReadBackTracksSelectFieldsFixEdgeDeployPreflightReady: true
phase: G-20u36d-readback-tracks-select-fields-fix-edge-deploy-preflight
preflightOnly: true
edgeDeployExecuted: false
cursorEdgeDeployExecuted: false
cursorSqlExecuted: false
cursorDbWriteExecuted: false
saveEnabled: false
adminUiChanged: false
ftpUploadExecuted: false
rootSupabaseFunctionsChanged: false
rootPlacementComplete: true
serviceRoleUsedForReadBack: false
anonSelectPreferred: true
proceedToEdgeDeploy: true
proceedToLiveVerifyRetry2: false
proceedToG20u36eSavePlanning: false
```

**G-20u36d readBack tracks-select-fields-fix edge-deploy-preflight scope:** preflight doc + verifier only. No deploy, no SQL, no Save enablement, no admin UI change, no root function edit.

---

## Why a new preflight (context)

After tracks SELECT fields fix root placement:

| Verifier | Result |
| --- | --- |
| `verify:g20u36d-readback-tracks-select-fields-fix-root-placement` | **PASS** |
| `verify:g20u36d-readback-tracks-select-fields-fix-tools-draft` | **PASS** |
| `verify:g20u36d-readback-tracks-select-fields-fix-plan` | **PASS** |
| `verify:g20u36d-readback-release-id-select-fix-edge-deploy-preflight` (historical) | **PASS** — release-id fix deploy gate only |

**Deploy gate decision:** use **this tracks-select-fields fix preflight** for the tracks SELECT fields fix redeploy. Release-id fix preflight remains historical for the prior release-id redeploy. Live verify retry (PARTIAL STOP) showed deployed Edge still selects **`duration`** → PostgREST **42703** → `trackCount=0`.

---

## Deploy target (locked)

| Item | Value |
| --- | --- |
| **Function name** | `gosaki-discography-save-dry-run` |
| **Project ref** | **`kmjqppxjdnwwrtaeqjta`** (staging / `static-to-astro-cms-staging`) |
| **Production STOP** | `vsbvndwuajjhnzpohghh` — **forbidden** |
| **Deploy type** | **Redeploy** — duration-included deployed Edge → tracks SELECT fields fix root source |
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

### Operator deploy notes (non-blocking warnings)

| Observation | Action |
| --- | --- |
| Docker warning during deploy | **non-blocking** if output includes **`Deployed Functions`** |
| Supabase CLI update notice | **non-blocking** |
| After deploy: `git status -sb` | **required** — confirm working tree |
| Only `supabase/.temp/cli-latest` changed | **restore** that file before commit (same as prior G-20u36d deploy-result phase) |

---

## Root source safety (tracks SELECT fields fix — read-only review)

| Check | Expected |
| --- | --- |
| `TRACK_SELECT_FIELDS` | **`track_number, title, sort_order, site_slug`** — **no `duration`** |
| `duration` | **optional / absent** — not in PostgREST SELECT |
| `RELEASE_SELECT_FIELDS` includes internal `id` | **yes** (release-id fix retained) |
| `resolveReadBackSnapshot` uses `releaseRow.id` for tracks SELECT | **yes** |
| `mapTrackRowsToTracksText` | **title only** |
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
npm run verify:g20u36d-readback-tracks-select-fields-fix-edge-deploy-preflight
npm run verify:g20u36d-readback-tracks-select-fields-fix-root-placement
npm run verify:g20u36d-readback-tracks-select-fields-fix-tools-draft
npm run verify:g20u36d-readback-tracks-select-fields-fix-plan
npm run verify:g20u36d-readback-env-secret-setting-result
```

| Verifier | Purpose |
| --- | --- |
| `verify:g20u36d-readback-tracks-select-fields-fix-edge-deploy-preflight` | This preflight doc + gates |
| `verify:g20u36d-readback-tracks-select-fields-fix-root-placement` | Tracks SELECT fix root source placed |
| `verify:g20u36d-readback-tracks-select-fields-fix-tools-draft` | Tools draft / mock baseline |
| `verify:g20u36d-readback-tracks-select-fields-fix-plan` | Fix plan completeness |
| `verify:g20u36d-readback-env-secret-setting-result` | readBack env secret added |

All targeted verifiers above must **PASS** before operator proceeds to **G-20u36d-readback-tracks-select-fields-fix-edge-deploy**.

---

## Deploy execution readiness decision

**Proceed to G-20u36d-readback-tracks-select-fields-fix-edge-deploy when ALL are true:**

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
| 10 | Root `TRACK_SELECT_FIELDS` **excludes `duration`** |

**If any criterion fails → STOP** (see STOP conditions below).

---

## Post-deploy expectations (live verify retry-2 — NOT this phase)

| Scenario | Expected (readBack armed · tracks SELECT fields fix deployed) |
| --- | --- |
| Valid dryRun · payload matches DB (`discography-002`) | `readBack.trackCount: 8` · `wouldWrite: false` · `tracksAdded: 0` · **200** |
| readBack summary | sanitized · `source: "supabase-select"` · **no UUID** |
| Write flags | all **false** |
| `operation=save` | **400 reject** |

**Live verify retry-2:** **G-20u36d-readback-live-verify-retry-2** — direct HTTP to Edge endpoint · **not executed in this phase**.  
**Save planning:** **G-20u36e-controlled-save-planning** — only after live verify retry-2 **PASS**.

---

## STOP conditions

Stop and ask human operator if:

| Condition | Action |
| --- | --- |
| Project ref ≠ `kmjqppxjdnwwrtaeqjta` | **STOP** |
| Production ref `vsbvndwuajjhnzpohghh` in deploy target or env | **STOP** |
| Deploy function ≠ `gosaki-discography-save-dry-run` | **STOP** |
| Root `TRACK_SELECT_FIELDS` still includes `duration` | **STOP** |
| `SUPABASE_SERVICE_ROLE_KEY` required for readBack | **STOP** → separate approval phase |
| Secret values in logs / doc / response | **STOP** |
| `operation=save` must be accepted | **STOP** |
| Write flags become true (`didWrite` / `dbWrite` / `networkWrite` / `saveEnabled`) | **STOP** |
| DB write / mutation (`insert` / `update` / `delete` / `upsert` / `rpc`) required | **STOP** |
| Save enablement required | **STOP** |
| Admin UI change required before deploy | **STOP** |
| SQL / DB write / FTP required | **STOP** |
| Targeted verifiers FAIL | **STOP** |

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
| Live HTTP verify retry-2 | **not executed** |
| G-20u36e controlled Save planning | **not executed** |
| Env/secret value read or display | **not executed** |

---

## Next phases

| Phase | Scope |
| --- | --- |
| **G-20u36d-readback-tracks-select-fields-fix-edge-deploy** | Operator staging Edge redeploy |
| **G-20u36d-readback-tracks-select-fields-fix-edge-deploy-result-record** | Deploy result doc |
| **G-20u36d-readback-live-verify-retry-2** | Direct endpoint · expect trackCount=8 · matching **200** |
| **G-20u36e-controlled-save-planning** | First controlled Save — **after live verify retry-2 PASS** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-tracks-select-fields-fix-edge-deploy-preflight
npm run verify:g20u36d-readback-tracks-select-fields-fix-root-placement
npm run verify:g20u36d-readback-tracks-select-fields-fix-tools-draft
npm run verify:g20u36d-readback-env-secret-setting-result
```

Historical verifiers — not in active regression suite.
