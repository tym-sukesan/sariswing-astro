# G-11c3b — Gosaki YouTube URL dry-run Edge Function deploy execution result

**Phase:** `G-11c3b-gosaki-youtube-url-dry-run-edge-function-deploy-execution-result`  
**Status:** **complete** — staging deploy succeeded once; unauthenticated access rejected (401)  
**Date:** 2026-06-25  
**Prior:** G-11c3a deploy readiness config prep (commit `537e5e6`)

| Check | Status |
| --- | --- |
| Staging deploy executed | **yes** (once) |
| Production ref used | **no** |
| Unauthenticated curl | **401** `UNAUTHORIZED_NO_AUTH_HEADER` |
| DB / JSON write | **no** |
| Additional deploy | **no** |

---

## Gates

```txt
gosakiYoutubeUrlDryRunEdgeFunctionDeployExecutionResultComplete: true
phase: G-11c3b
supabaseEdgeFunctionDeployExecuted: true
supabaseEdgeFunctionDeployCount: 1
deployTargetProjectRef: kmjqppxjdnwwrtaeqjta
productionProjectRefTouched: false
cursorDbWriteExecuted: false
cursorJsonWriteExecuted: false
cursorFtpUploadExecuted: false
workflowDispatchExecuted: false
readyForG11c4YoutubeUrlDryRunEndpointWiring: true
```

---

## 1. Operator approval

Received in thread:

```txt
承認します。この操作を1回だけ実行してください。
```

Target: **staging only** — `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta`  
Function: `gosaki-youtube-url-dry-run`

---

## 2. Git state at execution

| Item | Value |
| --- | --- |
| Commit before deploy | `537e5e6` |
| `HEAD` | `537e5e6` |
| `origin/main` | `537e5e6` |
| `git status --short` (pre-deploy) | clean |

---

## 3. Deploy command (executed once)

```bash
supabase functions deploy gosaki-youtube-url-dry-run --project-ref kmjqppxjdnwwrtaeqjta
```

| Ref check | Result |
| --- | --- |
| `--project-ref kmjqppxjdnwwrtaeqjta` | **present** |
| production ref in deploy command | **absent** |

---

## 4. Deploy result

CLI output (summary):

```txt
Deployed Functions on project kmjqppxjdnwwrtaeqjta: gosaki-youtube-url-dry-run
```

Uploaded assets:

- `supabase/functions/gosaki-youtube-url-dry-run/index.ts`
- `supabase/functions/_shared/gosaki-youtube-url-dry-run.ts`
- `supabase/functions/_shared/gosaki-youtube-staging-current.ts`
- `supabase/functions/_shared/admin-auth.ts`

**Function URL:**

```txt
https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-youtube-url-dry-run
```

Dashboard: `https://supabase.com/dashboard/project/kmjqppxjdnwwrtaeqjta/functions`

---

## 5. Post-deploy smoke — unauthenticated access

```bash
curl -i https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-youtube-url-dry-run
```

| Item | Value |
| --- | --- |
| HTTP status | **401** |
| error code | `UNAUTHORIZED_NO_AUTH_HEADER` |
| message | `Missing authorization header` |

JWT gateway (`verify_jwt = true` in `config.toml`) rejects requests without authorization header.

**Not tested in G-11c3b:** admin JWT + valid dry-run POST (deferred to G-11c4 endpoint wiring).

---

## 6. Safety confirmations

| Item | Status |
| --- | --- |
| Production Supabase (`vsbvndwuajjhnzpohghh` / `sari-site`) | **not touched** |
| DB write / SQL | **none** |
| JSON repo write | **none** |
| GitHub Actions / `workflow_dispatch` | **none** |
| FTP / FileZilla / remote upload | **none** |
| `src/pages/admin` changes | **none** |
| `.env` / `.env.local` changes | **none** |
| `service_role` usage | **none** |
| Additional `supabase functions deploy` | **none** |

---

## 7. Local CLI side effect (not for commit)

After deploy, Supabase CLI may update:

```txt
supabase/.temp/cli-latest
```

This is a local CLI working file. **Do not commit.** Exclude from staging when committing G-11c3b docs.

---

## 8. Preflight verifiers (at execution time)

| Verifier | Result |
| --- | --- |
| G-11c1 | 37/37 PASS |
| G-11c2 | 38/38 PASS |
| G-11c3a | 25/25 PASS |

---

## 9. Rollback (documented — not executed)

| Step | Action |
| --- | --- |
| 1 | Clear `PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT` from admin build if set |
| 2 | `supabase functions delete gosaki-youtube-url-dry-run --project-ref kmjqppxjdnwwrtaeqjta` (Operator approval) |
| 3 | Revert `config.toml` registration only if removing function permanently |
| 4 | No DB rollback — function does not write DB |

**If outcome unclear:** stop; do not retry deploy; record incident; ask human.

---

## 10. Local verification (G-11c3b)

```bash
node tools/static-to-astro/scripts/verify-g11c1-gosaki-youtube-url-web-save-dry-run-poc-local-prep.mjs
node tools/static-to-astro/scripts/verify-g11c2-gosaki-youtube-url-dry-run-edge-function-deploy-preflight.mjs
node tools/static-to-astro/scripts/verify-g11c3a-gosaki-youtube-url-dry-run-edge-function-deploy-readiness-config-prep.mjs
node tools/static-to-astro/scripts/verify-g11c3b-gosaki-youtube-url-dry-run-edge-function-deploy-execution-result.mjs
```

---

## 11. Next phase

`G-11c4-gosaki-youtube-url-dry-run-endpoint-wiring` — wire staging read-only admin to deployed function URL; JWT-authenticated dry-run POST end-to-end test. Save / Publish / Deploy remain disabled.

---

## References

- G-11c3a: `gosaki-youtube-url-dry-run-edge-function-deploy-readiness-config-prep.md`
- G-11c2: `gosaki-youtube-url-dry-run-edge-function-deploy-preflight.md`
- G-11c1: `gosaki-youtube-url-web-save-dry-run-poc-local-prep.md`
- `supabase/config.toml`
- `supabase/functions/gosaki-youtube-url-dry-run/index.ts`
