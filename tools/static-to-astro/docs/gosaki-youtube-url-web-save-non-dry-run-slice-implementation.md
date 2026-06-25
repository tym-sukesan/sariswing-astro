# G-11c6a — Gosaki YouTube URL web-save non-dry-run slice implementation (local-only)

**Phase:** `G-11c6a-gosaki-youtube-url-web-save-non-dry-run-slice-implementation-local-only`  
**Status:** **implementation complete (local-only)** — Edge save function + workflow skeleton + disabled Save UI; **no deploy / Save / dispatch**  
**Date:** 2026-06-25  
**Prior:** G-11c5 planning (commit `2f0f88d`); G-11c4d dry-run E2E PASS

| Check | Status |
| --- | --- |
| Edge save function source | **added** |
| `config.toml` registration | **added** (`verify_jwt = true`) |
| GitHub workflow skeleton | **added** (`workflow_dispatch` only) |
| Admin Save UI | **disabled** |
| Deploy / Save execution | **no** |

---

## Gates

```txt
gosakiYoutubeUrlWebSaveNonDryRunSliceImplementationLocalOnlyComplete: true
phase: G-11c6a
supabaseFunctionsDeployExecuted: false
workflowDispatchExecuted: false
cursorDbWriteExecuted: false
cursorJsonWriteExecuted: false
cursorFtpUploadExecuted: false
saveUiEnabled: false
readyForG11c6bEdgeSaveFunctionDeployPreflight: true
```

---

## 1. Git state at implementation

| Item | Value |
| --- | --- |
| Base commit | `2f0f88d` |
| G-11c6a changes | uncommitted |

---

## 2. Edge Function — `gosaki-youtube-url-save`

| Item | Value |
| --- | --- |
| Entry | `supabase/functions/gosaki-youtube-url-save/index.ts` |
| Shared | `supabase/functions/_shared/gosaki-youtube-url-save.ts` |
| Auth | `requireAdminUser` (`ADMIN_EMAILS` / `app_metadata.role`) |
| JWT | `verify_jwt = true` in `config.toml` |
| `service_role` | **not used** |
| Staging ref | `kmjqppxjdnwwrtaeqjta` required in `SUPABASE_URL` |
| Production block | `vsbvndwuajjhnzpohghh` → **403** |

### Request gates

| Field | Rule |
| --- | --- |
| `dryRun` | must be `false` |
| `saveEnabled` | must be `true` |
| `operationId` | `G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice` |
| `approvalId` | `G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice` |
| `expectedBefore` | optimistic lock vs `gosaki-youtube-staging-current.ts` |

### Response semantics

| Case | HTTP | `saveReadiness` |
| --- | --- | --- |
| no_change | 200 | `no_change` |
| changed, server not armed | 403 | `save_not_armed` |
| changed, armed (future) | 200 | `dispatch_deferred_g11c6a` — **no workflow_dispatch in G-11c6a** |
| conflict | 409 | `conflict` |
| invalid input | 400 | `invalid_input` |
| unauthorized | 401/403 | via `admin-auth.ts` |

Server arm env: `GOSAKI_YOUTUBE_URL_SAVE_ARMED=false` (default).

---

## 3. GitHub workflow skeleton

| Item | Value |
| --- | --- |
| File | `.github/workflows/gosaki-youtube-url-save-staging.yml` |
| Trigger | `workflow_dispatch` **only** |
| Forbidden triggers | `push`, `pull_request`, `schedule` — **absent** |
| FTP / upload / mirror / `--delete` | **absent** |
| JSON patch | **deferred** (validate inputs only) |

---

## 4. Admin UI (static template)

| Item | Value |
| --- | --- |
| Template | `GosakiStagingReadOnlyAdminPage.astro` |
| Phase marker | `G-11c6a` |
| Save endpoint attr | `data-gosaki-youtube-save-endpoint` |
| Save button | **disabled** — `gra-youtube-save-btn` |
| Client `saveEnabled` | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` — default **false** |
| Dry-run path | **unchanged** (G-11c1 frozen) |

---

## 5. Safety — G-11c6a phase

| Item | Status |
| --- | --- |
| `supabase functions deploy` | **not executed** |
| `workflow_dispatch` | **not executed** |
| JSON file write | **not executed** |
| DB write | **not executed** |
| FTP / upload | **not executed** |
| `secrets set` | **not executed** |
| Save click / auto-click | **not executed** |
| `src/pages/admin` | **unchanged** |
| Production ref operation | **not executed** |

---

## 6. Local verification

```bash
node tools/static-to-astro/scripts/verify-g11c6a-gosaki-youtube-url-web-save-non-dry-run-slice-implementation.mjs
```

---

## 7. Next phase

`G-11c6b-gosaki-youtube-url-save-edge-function-deploy-preflight` — staging deploy once for `gosaki-youtube-url-save`; still **no Save execution** until G-11c7+.

---

## References

- G-11c5: `gosaki-youtube-url-web-save-non-dry-run-slice-planning.md`
- G-11c4d: `gosaki-staging-admin-emails-secret-and-youtube-dry-run-e2e-result.md`
- G-11c1: `gosaki-youtube-url-web-save-dry-run-poc-local-prep.md`
