# G-11c6b — Gosaki YouTube URL save Edge Function deploy preflight

**Phase:** `G-11c6b-gosaki-youtube-url-save-edge-function-deploy-preflight`  
**Status:** **preflight complete** — staging deploy readiness documented; **no deploy executed**  
**Date:** 2026-06-25  
**Prior:** G-11c6a local implementation (commit `e99f58f`); G-11c4d `ADMIN_EMAILS` on staging

| Check | Status |
| --- | --- |
| Function source static review | **PASS** |
| `config.toml` `verify_jwt` | **PASS** |
| Staging project target documented | **yes** |
| Production Supabase touched | **no** |
| `supabase functions deploy` executed | **no** |
| `supabase secrets set` executed | **no** |

---

## Gates

```txt
gosakiYoutubeUrlSaveEdgeFunctionDeployPreflightComplete: true
phase: G-11c6b
readyForG11c6cYoutubeUrlSaveEdgeFunctionDeployExecution: true
supabaseEdgeFunctionDeployExecuted: false
supabaseSecretsSetExecuted: false
workflowDispatchExecuted: false
cursorDbWriteExecuted: false
cursorJsonWriteExecuted: false
cursorFtpUploadExecuted: false
saveUiEnabled: false
```

**Do not deploy** until `G-11c6c-gosaki-youtube-url-save-edge-function-deploy-execution` with explicit operator approval.

---

## 1. Git state at preflight

| Item | Value |
| --- | --- |
| `HEAD` | `e99f58f` |
| `origin/main` | `e99f58f` |
| `git status --short` | clean |

---

## 2. Target Supabase project (staging only)

| Item | Value |
| --- | --- |
| **Allowed** project name | `static-to-astro-cms-staging` |
| **Allowed** project ref | `kmjqppxjdnwwrtaeqjta` |
| **Allowed** API host | `https://kmjqppxjdnwwrtaeqjta.supabase.co` |

### Blocked (must not deploy / link / write)

| Item | Value |
| --- | --- |
| Production project name | `sari-site` |
| Production project ref | `vsbvndwuajjhnzpohghh` |
| Production host | `https://vsbvndwuajjhnzpohghh.supabase.co` |

**Preflight confirmation:** deploy command uses **staging ref only**. No production ref in command. No `supabase link` change executed.

---

## 3. Deploy target (single function)

| Item | Value |
| --- | --- |
| Function name | `gosaki-youtube-url-save` |
| Entry | `supabase/functions/gosaki-youtube-url-save/index.ts` |
| Shared | `supabase/functions/_shared/gosaki-youtube-url-save.ts` |
| Reused | `admin-auth.ts`, `gosaki-youtube-url-dry-run.ts`, `gosaki-youtube-staging-current.ts` |

**Invoked URL (after deploy):**

```txt
https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-youtube-url-save
```

**Do not deploy** `gosaki-youtube-url-dry-run` again in G-11c6c (already live from G-11c3b).

---

## 4. Deploy command (documented — NOT executed in G-11c6b)

```bash
supabase functions deploy gosaki-youtube-url-save \
  --project-ref kmjqppxjdnwwrtaeqjta
```

| Ref check | Result |
| --- | --- |
| `--project-ref kmjqppxjdnwwrtaeqjta` | **required** |
| production ref in command | **absent** |
| Additional functions in same command | **none** |

### Operator approval required (G-11c6c)

```txt
承認します。この操作を1回だけ実行してください。
```

---

## 5. JWT / auth / `ADMIN_EMAILS`

| Item | Status |
| --- | --- |
| `config.toml` `[functions.gosaki-youtube-url-save] verify_jwt = true` | **yes** |
| `requireAdminUser` in index | **yes** |
| Auth client | anon key + JWT — **not** `service_role` |
| `ADMIN_EMAILS` on staging | **already set** (G-11c4d operator) |
| `supabase secrets set` for G-11c6b/c | **not required** |
| Re-run `ADMIN_EMAILS` set | **forbidden** without new approval |

**Do not record** real admin emails or secret values in docs, commits, or logs.

---

## 6. Save arm and side-effect safety (post-deploy)

Even after deploy, **no JSON / DB / FTP write** occurs without additional gates:

| Gate | Default (G-11c6c pre-deploy) |
| --- | --- |
| Admin Save UI | **disabled** (`gra-youtube-save-btn`) |
| Client `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` | **false** |
| Server `GOSAKI_YOUTUBE_URL_SAVE_ARMED` | **false** (unset = false) |
| `saveEnabled` in request body | must be `true` — UI does not send |
| `approvalId` | `G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice` |
| `dryRun: false` alone | **insufficient** — server arm + approval required |
| `workflowDispatchExecuted` in code | **always false** in G-11c6a (`dispatch_deferred_g11c6a`) |
| GitHub workflow JSON patch | **skeleton only** — not dispatched |

**Expected live behavior after deploy (unauthenticated):** **401** (JWT gateway).  
**Authenticated non-admin:** **403**.  
**Authenticated admin, valid save payload, server not armed:** **403** `save_not_armed`.  
**No accidental persistence** while arms remain off.

---

## 7. Workflow skeleton review

**File:** `.github/workflows/gosaki-youtube-url-save-staging.yml`

| Check | Result |
| --- | --- |
| Trigger | `workflow_dispatch` **only** |
| `push` / `pull_request` / `schedule` | **absent** |
| JSON patch step | **deferred** (input validation only) |
| FTP / upload / mirror / `--delete` | **absent** |
| `workflow_dispatch` executed in G-11c6b | **no** |

---

## 8. Static review checklist

| # | Check | Result |
| --- | --- | --- |
| 1 | `requireAdminUser` before handler body | **PASS** |
| 2 | Staging host guard in shared (`kmjqppxjdnwwrtaeqjta`) | **PASS** |
| 3 | Production ref block (`vsbvndwuajjhnzpohghh`) | **PASS** |
| 4 | No `service_role` | **PASS** |
| 5 | No DB `.from()` / insert / update | **PASS** |
| 6 | No `api.github.com` fetch (dispatch deferred) | **PASS** |
| 7 | `dryRun must be false` for save | **PASS** |
| 8 | Optimistic lock / 409 conflict | **PASS** |
| 9 | `src/pages/admin` unchanged | **PASS** |

---

## 9. Rollback / disable policy

| Scenario | Action |
| --- | --- |
| Deploy OK but want zero save exposure | Keep Save UI disabled + do not set `GOSAKI_YOUTUBE_URL_SAVE_ARMED` |
| Function misbehaves after deploy | Next safe commit: return static disabled response → **one** redeploy (G-11c6c+ rollback phase, operator approval) |
| Remove function entirely | `supabase functions delete gosaki-youtube-url-save --project-ref kmjqppxjdnwwrtaeqjta` — **separate approval** |
| `ADMIN_EMAILS` issue | **Do not** re-set in G-11c6b/c; unset only with documented rollback + approval |
| Workflow accidentally dispatched | Cancel run in GitHub UI; skeleton does not patch JSON today |
| Outcome unclear after deploy | **Stop** — do not retry deploy; record incident; ask human (G-7f1 pattern) |

**Risk note:** Deploying save function without server arm still exposes an authenticated endpoint; default responses are **403 save_not_armed** for valid change payloads — no JSON mutation.

---

## 10. Safety — G-11c6b phase

| Item | Status |
| --- | --- |
| `supabase functions deploy` | **not executed** |
| `supabase secrets set` / unset | **not executed** |
| `workflow_dispatch` | **not executed** |
| Save / auto-click | **not executed** |
| DB / SQL write | **not executed** |
| JSON file write | **not executed** |
| FTP / upload | **not executed** |
| `src/pages/admin` changed | **no** |
| `.env` / `.env.local` changed | **no** |

---

## 11. Local verification

```bash
node tools/static-to-astro/scripts/verify-g11c6b-gosaki-youtube-url-save-edge-function-deploy-preflight.mjs
```

---

## 12. Next phase

`G-11c6c-gosaki-youtube-url-save-edge-function-deploy-execution` — operator-approved **one-time** staging deploy of `gosaki-youtube-url-save` only; post-deploy unauth smoke **401**; **no Save execution**, **no secrets set**, **no workflow_dispatch**.

---

## References

- G-11c6a: `gosaki-youtube-url-web-save-non-dry-run-slice-implementation.md`
- G-11c5: `gosaki-youtube-url-web-save-non-dry-run-slice-planning.md`
- G-11c4d: `gosaki-staging-admin-emails-secret-and-youtube-dry-run-e2e-result.md`
- G-11c3b: `gosaki-youtube-url-dry-run-edge-function-deploy-execution-result.md`
- `supabase/config.toml`
- `supabase/functions/gosaki-youtube-url-save/index.ts`
