# G-11c6c — Gosaki YouTube URL save Edge Function deploy execution result

**Phase:** `G-11c6c-gosaki-youtube-url-save-edge-function-deploy-execution-result`  
**Status:** **complete** — staging deploy succeeded once; unauthenticated access rejected (401)  
**Date:** 2026-06-25  
**Prior:** G-11c6b deploy preflight (commit `3cdf4f5`)

| Check | Status |
| --- | --- |
| Staging deploy executed | **yes** (once) |
| Production ref used | **no** |
| Unauthenticated POST | **401** `UNAUTHORIZED_NO_AUTH_HEADER` |
| `secrets set` | **no** |
| Save / JSON write | **no** |
| Additional deploy | **no** |

---

## Gates

```txt
gosakiYoutubeUrlSaveEdgeFunctionDeployExecutionResultComplete: true
phase: G-11c6c
supabaseEdgeFunctionDeployExecuted: true
supabaseEdgeFunctionDeployCount: 1
deployTargetFunction: gosaki-youtube-url-save
deployTargetProjectRef: kmjqppxjdnwwrtaeqjta
productionProjectRefTouched: false
supabaseSecretsSetExecuted: false
workflowDispatchExecuted: false
saveUiEnabled: false
serverSaveArmEnabled: false
cursorDbWriteExecuted: false
cursorJsonWriteExecuted: false
cursorFtpUploadExecuted: false
readyForG11c6dSaveEndpointSmokeOrPackageWiring: true
```

---

## 1. Operator approval

Received in thread:

```txt
承認します。この操作を1回だけ実行してください。
```

Target: **staging only** — `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta`  
Function: `gosaki-youtube-url-save`

---

## 2. Git state at execution

| Item | Value |
| --- | --- |
| Commit before deploy | `3cdf4f5` |
| `HEAD` | `3cdf4f5` |
| `origin/main` | `3cdf4f5` |
| `git status --short` (pre-deploy) | clean |

---

## 3. Deploy command (executed once)

```bash
supabase functions deploy gosaki-youtube-url-save \
  --project-ref kmjqppxjdnwwrtaeqjta
```

| Ref check | Result |
| --- | --- |
| `--project-ref kmjqppxjdnwwrtaeqjta` | **present** |
| production ref in deploy command | **absent** |
| Function count | **1** (`gosaki-youtube-url-save` only) |

---

## 4. Deploy result

CLI output (summary):

```txt
Deployed Functions on project kmjqppxjdnwwrtaeqjta: gosaki-youtube-url-save
```

Uploaded assets:

- `supabase/functions/gosaki-youtube-url-save/index.ts`
- `supabase/functions/_shared/gosaki-youtube-url-save.ts`
- `supabase/functions/_shared/gosaki-youtube-url-dry-run.ts`
- `supabase/functions/_shared/gosaki-youtube-staging-current.ts`
- `supabase/functions/_shared/admin-auth.ts`

**Function URL:**

```txt
https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-youtube-url-save
```

Dashboard: `https://supabase.com/dashboard/project/kmjqppxjdnwwrtaeqjta/functions`

---

## 5. Post-deploy smoke — unauthenticated access

```bash
curl -i -X POST \
  https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-youtube-url-save \
  -H "Content-Type: application/json" \
  -d '{}'
```

| Item | Value |
| --- | --- |
| HTTP status | **401** |
| error code | `UNAUTHORIZED_NO_AUTH_HEADER` |
| message | `Missing authorization header` |
| `sb-project-ref` (response header) | `kmjqppxjdnwwrtaeqjta` |

JWT gateway (`verify_jwt = true`) rejects requests without authorization header.

**Not tested in G-11c6c:** admin JWT + save payload POST (deferred — Save UI remains disabled; `GOSAKI_YOUTUBE_URL_SAVE_ARMED` not set).

---

## 6. Post-deploy safety state

| Item | Status |
| --- | --- |
| Save UI (`gra-youtube-save-btn`) | **disabled** (unchanged in repo) |
| `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` | **false** (default) |
| `GOSAKI_YOUTUBE_URL_SAVE_ARMED` (Edge secret/env) | **not set** / false |
| `workflow_dispatch` | **not executed** |
| JSON patch / FTP | **not executed** |
| `ADMIN_EMAILS` | **reused** from G-11c4d — **no** `secrets set` |

Even with function live, valid admin JWT + save payload would return **403** `save_not_armed` until server arm is explicitly enabled in a future phase.

---

## 7. Safety confirmations

| Item | Status |
| --- | --- |
| Production Supabase (`vsbvndwuajjhnzpohghh` / `sari-site`) | **not touched** |
| `supabase secrets set` / unset | **not executed** |
| DB write / SQL | **none** |
| JSON repo write | **none** |
| GitHub Actions / `workflow_dispatch` | **none** |
| FTP / upload | **none** |
| `src/pages/admin` changes | **none** |
| `.env` / `.env.local` changes | **none** |
| `service_role` usage | **none** |
| Additional `supabase functions deploy` | **none** |

---

## 8. Rollback (documented — not executed)

| Step | Action |
| --- | --- |
| 1 | Keep Save UI disabled |
| 2 | `supabase functions delete gosaki-youtube-url-save --project-ref kmjqppxjdnwwrtaeqjta` (operator approval) |
| 3 | Do not re-set `ADMIN_EMAILS` without new approval |

---

## 9. Local verification

```bash
node tools/static-to-astro/scripts/verify-g11c6c-gosaki-youtube-url-save-edge-function-deploy-execution-result.mjs
```

---

## 10. Next phase

`G-11c6d-gosaki-youtube-url-save-endpoint-smoke-or-admin-package-wiring` — optional admin package rebuild with save endpoint URL; authenticated smoke **without Save execution**; or proceed to workflow JSON patch planning.

---

## References

- G-11c6b: `gosaki-youtube-url-save-edge-function-deploy-preflight.md`
- G-11c6a: `gosaki-youtube-url-web-save-non-dry-run-slice-implementation.md`
- G-11c3b: `gosaki-youtube-url-dry-run-edge-function-deploy-execution-result.md`
