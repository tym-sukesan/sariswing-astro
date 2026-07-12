# G-20u36d — Gosaki Discography Edge dry-run readBack env secret setting plan

**Phase:** `G-20u36d-readback-env-secret-setting-plan`  
**Status:** **complete** — env secret setting plan only · **no secret set / Edge deploy / SQL / Save enablement**  
**Date:** 2026-07-12  
**Base commit:** `4be4bf1`  
**Prior:** G-20u36d readBack edge deploy preflight complete · operator Dashboard check · deployed staging Edge still pre-readBack

| Check | Status |
| --- | --- |
| Env secret setting plan doc | **yes** (this file) |
| Supabase secret set | **no** — Cursor did not set |
| Edge Function redeployed | **no** |
| Supabase CLI deploy | **no** |
| Root `supabase/functions/**` edited | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Save enablement | **no** |
| Admin UI change | **no** |
| FTP upload | **no** |
| Existing secret values printed | **no** |
| Production changed | **no** — **STOP** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunReadBackEnvSecretSettingPlanPrepared: true
phase: G-20u36d-readback-env-secret-setting-plan
planOnly: true
secretSettingExecuted: false
cursorSecretSettingExecuted: false
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
proceedToSecretSetting: true
proceedToEdgeDeploy: false
proceedToLiveVerify: false
proceedToSave: false
```

**G-20u36d readBack env-secret-setting-plan scope:** plan doc + verifier only. No secret set, no deploy, no SQL, no Save enablement, no admin UI change, no root function edit.

---

## Why this plan exists

After G-20u36d readBack edge deploy preflight, operator confirmed staging Edge Function secrets on Supabase Dashboard:

| Secret name | Dashboard status |
| --- | --- |
| `SUPABASE_URL` | **exists** |
| `SUPABASE_ANON_KEY` | **exists** |
| `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` | **missing** |

Without `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED=true`, deployed Edge (even after readBack code redeploy) stays on **schema-only fallback** (`readBack: null`). Anon SELECT readBack requires this env gate to be armed.

**Existing secret values (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) are not recorded in this doc — names / existence only.**

---

## Operator setting plan (locked — NOT EXECUTED in this phase)

| Item | Value |
| --- | --- |
| **Project** | `static-to-astro-cms-staging` |
| **Project ref** | **`kmjqppxjdnwwrtaeqjta`** (staging only) |
| **Production STOP** | `vsbvndwuajjhnzpohghh` — **forbidden** |
| **Secret name** | `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` |
| **Secret value** | `true` |
| **Executor** | **Human operator** — separate phase with explicit approval |
| **Execute in this phase** | **no** |

| Rule | Value |
| --- | --- |
| Set value other than `true` | **STOP** |
| Change `SUPABASE_SERVICE_ROLE_KEY` | **STOP** — not used for readBack |
| Set secrets on production ref | **STOP** |
| Combine with Edge deploy in same step | **STOP** — secret setting first, deploy in next phase |
| Combine with SQL / DB write / Save | **STOP** |

---

## A. Dashboard procedure (operator — preferred)

1. Open **Supabase Dashboard**
2. Select project **`static-to-astro-cms-staging`** / ref **`kmjqppxjdnwwrtaeqjta`**
3. Confirm **not** production (`vsbvndwuajjhnzpohghh`) — **STOP** if wrong project
4. Navigate **Edge Functions** → **Secrets**
5. Confirm existing secrets (names only — do not copy values into chat/logs):
   - `SUPABASE_URL` — **exists**
   - `SUPABASE_ANON_KEY` — **exists**
   - `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` — **missing** (expected before setting)
6. Click **Add secret**
7. **Name:** `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED`
8. **Value:** `true`
9. **Save**
10. Re-check secrets list — name `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` appears (value not displayed in docs)

**Do not** redeploy Edge Function in this step. Deploy is **`G-20u36d-readback-edge-deploy`** (separate phase after secret setting + result record).

---

## B. CLI alternative (operator — Dashboard preferred)

```bash
cd ~/sariswing-astro
supabase secrets set GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED=true --project-ref kmjqppxjdnwwrtaeqjta
```

| Rule | Value |
| --- | --- |
| `--project-ref` must be | **`kmjqppxjdnwwrtaeqjta` only** |
| Execute in this phase | **no** |
| List secrets with values in logs | **STOP** — use Dashboard or names-only list |

---

## C. readBack env gate behavior (after secret + deploy)

| `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED` | Behavior |
| --- | --- |
| unset / not `true` | schema-only fallback (`readBack: null`) |
| `true` + valid `SUPABASE_URL` / `SUPABASE_ANON_KEY` | anon SELECT readBack |
| `true` + invalid env | graceful fallback in root index catch |

**This plan only adds the missing gate secret.** Edge code redeploy still required in **`G-20u36d-readback-edge-deploy`** before live readBack works on staging.

---

## D. Safety constraints (unchanged)

| Check | Expected |
| --- | --- |
| `service_role` for readBack | **not used** |
| `SUPABASE_SERVICE_ROLE_KEY` change | **not required** — **STOP** if proposed |
| `operation=save` | **rejected** (unchanged) |
| Write flags | `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` = **false** |
| Mutations (insert/update/delete/upsert/rpc) | **none** |
| Admin UI change | **not required** for secret setting |

---

## E. STOP conditions

Stop and ask human if:

- project ref is not **`kmjqppxjdnwwrtaeqjta`**
- production ref **`vsbvndwuajjhnzpohghh`** appears in command or Dashboard target
- `service_role` becomes necessary
- `SUPABASE_SERVICE_ROLE_KEY` must be added or changed
- secret value other than **`true`** is proposed for `GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED`
- existing secret **values** must be logged, pasted, or recorded in docs
- Edge deploy is attempted in the same step as secret setting
- SQL execution, DB write, or Save enablement is requested simultaneously
- admin UI change is required before secret setting
- FTP / upload is required

---

## F. Recommended phase order (after this plan)

| # | Phase | Scope |
| --- | --- | --- |
| 1 | **`G-20u36d-readback-env-secret-setting`** | Operator adds staging secret via Dashboard |
| 2 | **`G-20u36d-readback-env-secret-setting-result-record`** | Record setting outcome (names only) |
| 3 | **`G-20u36d-readback-edge-deploy`** | Operator staging Edge redeploy (readBack code) |
| 4 | **`G-20u36d-readback-edge-deploy-result-record`** | Record deploy outcome |
| 5 | **`G-20u36d-readback-live-verify`** | Direct endpoint · DB-grounded readBack diff |
| 6 | **`G-20u36d-admin-sanitizer-readback-summary-update`** | Optional — if admin UI blocks readBack display |
| 7 | **`G-20u36e-controlled-save-planning`** | After readBack stable — Save still blocked until then |

---

## G. Verifier (this phase)

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-readback-env-secret-setting-plan
npm run verify:g20u36d-readback-edge-deploy-preflight
```

---

## H. Cursor execution record (this phase)

| Action | Executed |
| --- | --- |
| Plan doc created | **yes** |
| Verifier added | **yes** |
| AI context updated | **yes** |
| Supabase secret set | **no** |
| Edge deploy | **no** |
| SQL | **no** |
| DB write | **no** |
| Save enabled | **no** |
| Admin UI changed | **no** |
| FTP | **no** |
| `supabase/functions/**` edited | **no** |
