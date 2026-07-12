# G-20u36d — Gosaki Discography Edge dry-run readBack edge deploy preflight

**Phase:** `G-20u36d-readback-edge-deploy-preflight`  
**Status:** **complete** — deploy preflight doc only · **no Edge deploy / SQL execution / Save enablement**  
**Date:** 2026-07-12  
**Base commit:** `edc27fc`  
**Prior:** G-20u36d readBack edge deploy plan · root placement complete · deployed staging Edge still pre-readBack

| Check | Status |
| --- | --- |
| Deploy preflight doc | **yes** (this file) |
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
gosakiDiscographyEdgeDryRunReadBackEdgeDeployPreflightReady: true
phase: G-20u36d-readback-edge-deploy-preflight
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
proceedToLiveVerify: false
proceedToSave: false
```

**G-20u36d readBack edge-deploy-preflight scope:** preflight doc + verifier only. No deploy, no SQL, no Save enablement, no admin UI change, no root function edit.

---

## Deploy target (locked)

| Item | Value |
| --- | --- |
| **Function name** | `gosaki-discography-save-dry-run` |
| **Project ref** | **`kmjqppxjdnwwrtaeqjta`** (staging / `static-to-astro-cms-staging`) |
| **Production STOP** | `vsbvndwuajjhnzpohghh` — **forbidden** |
| **Deploy type** | **Redeploy** — pre-readBack → readBack-enabled root source |
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

## A. Git / workspace preflight (operator — before deploy execution)

| # | Check | Block if fail |
| --- | --- | --- |
| 1 | `HEAD` = `origin/main` (documented commit `edc27fc` or post-preflight commit) | yes |
| 2 | Working tree **clean** before deploy | yes |
| 3 | Root `supabase/functions/gosaki-discography-save-dry-run/` has readBack source committed | yes |
| 4 | No uncommitted changes under `supabase/functions/**` at deploy time | yes |
| 5 | `src/**` / `public/**` unchanged | yes |
| 6 | Targeted verifiers PASS (section C) | yes |

**Note:** Preflight doc creation may leave uncommitted `tools/static-to-astro/**` files — operator commits preflight artifacts, then confirms clean tree immediately before deploy.

---

## B. Root source safety preflight (readBack)

| Check | Expected |
| --- | --- |
| `resolveReadBackSnapshot` in root handler | **present** |
| `buildSanitizedReadBackSummary` | **present** |
| `createAnonSelectReadBackAdapter` | **present** |
| `handleDiscographyEdgeDryRunHttpAsync` in root index | **present** |
| `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` env gate | **present** |
| `SUPABASE_SERVICE_ROLE_KEY` reference | **absent** |
| `createClient` / mutation methods | **absent** |
| `operation=save` | **rejected** |
| Write flags | `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` = **false** |
| Staging ref guard | `kmjqppxjdnwwrtaeqjta` only |
| Production ref | **STOP** if in URL guard |

---

## C. Targeted verifiers (deploy前 — operator / Cursor preflight phase)

Run from repo root:

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-edge-deploy-preflight
npm run verify:g20u36d-readback-edge-deploy-plan
npm run verify:g20u36d-readback-root-placement
npm run verify:g20u36d-readback-implementation-in-tools-draft
```

| Verifier | Purpose |
| --- | --- |
| `verify:g20u36d-readback-edge-deploy-preflight` | This preflight doc + gates |
| `verify:g20u36d-readback-edge-deploy-plan` | Deploy plan completeness |
| `verify:g20u36d-readback-root-placement` | Root readBack source placed |
| `verify:g20u36d-readback-implementation-in-tools-draft` | Tools draft / mock diff baseline |

All must **PASS** before operator proceeds to **G-20u36d-readback-edge-deploy**.

---

## D. Env / secrets confirmation policy (names / existence only)

**This phase does NOT display secret values.** Cursor must not read, log, or paste secrets. **Do not record values in this doc.**

| Env / secret name | Confirm existence | Required for readBack |
| --- | --- | --- |
| `SUPABASE_URL` | yes (staging ref `kmjqppxjdnwwrtaeqjta`) | **yes** when readBack armed |
| `SUPABASE_ANON_KEY` | yes | **yes** when readBack armed |
| `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` | yes (set strategy documented) | **set `true` for DB-grounded live verify** |
| `SUPABASE_SERVICE_ROLE_KEY` | — | **not used in G-20u36d readBack** |

### `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` behavior

| Value | Runtime behavior |
| --- | --- |
| **unset / not `true`** | Schema-only fallback · `readBack: null` |
| **`true`** + valid `SUPABASE_URL` + `SUPABASE_ANON_KEY` | anon SELECT readBack · DB snapshot diff |
| **`true`** + missing/invalid env | Graceful fallback to schema-only (index.ts catch) |

### Operator env check (optional — operator judgment · Cursor does NOT execute)

Confirm **names only** via Supabase Dashboard → Edge Functions → Secrets, or CLI secrets list **without printing values**:

```bash
# Operator only — do not paste output containing values to chat/logs
cd ~/sariswing-astro
supabase secrets list --project-ref kmjqppxjdnwwrtaeqjta
```

| Rule | Value |
| --- | --- |
| Print secret values | **Forbidden** |
| Cursor runs secrets list | **no** |
| Use `SUPABASE_SERVICE_ROLE_KEY` for readBack | **Forbidden** — STOP |

---

## E. Deploy execution readiness decision

**Proceed to G-20u36d-readback-edge-deploy when ALL are true:**

| # | Criterion |
| --- | --- |
| 1 | Targeted verifiers (section C) **PASS** |
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

## F. Post-deploy expectations (live verify phase — NOT this phase)

| Scenario | Expected (readBack armed) |
| --- | --- |
| Valid dryRun · payload matches DB (`discography-002`) | `wouldWrite: false` · `tracksAdded: 0` |
| readBack summary | sanitized · `source: "supabase-select"` |
| Write flags | all **false** |
| `operation=save` | **400 reject** |

**Live verify:** **G-20u36d-readback-live-verify** — direct HTTP to Edge endpoint (not admin UI first).  
**Admin sanitizer:** **G-20u36d-admin-sanitizer-readback-summary-update** — separate phase if needed.  
**Save planning:** **G-20u36e** — only after readBack live verify stable.

---

## STOP conditions

Stop and ask human operator if:

| Condition | Action |
| --- | --- |
| Project ref ≠ `kmjqppxjdnwwrtaeqjta` | **STOP** |
| Production ref `vsbvndwuajjhnzpohghh` in deploy target or env | **STOP** |
| Deploy function ≠ `gosaki-discography-save-dry-run` | **STOP** |
| `SUPABASE_SERVICE_ROLE_KEY` required for readBack | **STOP** → separate approval phase |
| anon SELECT 403 → service_role fallback desired | **STOP** — no silent fallback |
| Secret values in logs / doc / response | **STOP** |
| `operation=save` must be accepted | **STOP** |
| Write flags become true | **STOP** |
| DB write / mutation required | **STOP** |
| Save enablement required | **STOP** |
| Admin UI change required before deploy | **STOP** |
| FTP upload required | **STOP** |
| Deploy + SQL / DB write requested together | **STOP** |
| Targeted verifiers FAIL | **STOP** |
| Root source missing readBack | **STOP** |

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
| Operator secrets list CLI | **not executed by Cursor** |

---

## Next phases

| Phase | Scope |
| --- | --- |
| **G-20u36d-readback-edge-deploy** | Operator staging Edge redeploy |
| **G-20u36d-readback-edge-deploy-result-record** | Record deploy outcome |
| **G-20u36d-readback-live-verify** | Direct endpoint · DB-grounded diff |
| **G-20u36d-admin-sanitizer-readback-summary-update** | Admin UI readBack display (if needed) |
| **G-20u36e-controlled-save-planning** | First controlled Save — **after readBack stable** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-edge-deploy-preflight
npm run verify:g20u36d-readback-edge-deploy-plan
npm run verify:g20u36d-readback-root-placement
```

Historical verifiers — not in active regression suite.
