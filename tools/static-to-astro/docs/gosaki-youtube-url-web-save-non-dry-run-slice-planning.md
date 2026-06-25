# G-11c5 — Gosaki YouTube URL web-save non-dry-run slice planning

**Phase:** `G-11c5-gosaki-youtube-url-web-save-non-dry-run-slice-planning`  
**Status:** **planning complete** — non-dry-run save architecture + minimal slice recommendation; **no implementation / Save / deploy**  
**Date:** 2026-06-25  
**Prior:** G-11c4d E2E PASS (commit `a0e8be3`); G-11a hybrid architecture; G-10c static JSON write guards

| Check | Status |
| --- | --- |
| Save path options compared | **yes** |
| Minimal slice recommended | **yes** |
| Staging / production separation documented | **yes** |
| Cursor Save / DB / JSON / deploy | **no** |

---

## Gates

```txt
gosakiYoutubeUrlWebSaveNonDryRunSlicePlanningComplete: true
phase: G-11c5
readyForG11c6YoutubeUrlWebSaveNonDryRunSliceImplementation: true
readyForG11c6SaveExecution: false
readyForAnyDbWrite: false
cursorDbWriteExecuted: false
cursorJsonWriteExecuted: false
supabaseFunctionsDeployExecuted: false
workflowDispatchExecuted: false
cursorFtpUploadExecuted: false
```

---

## 1. Background

Gosaki staging online admin (`/cms-kit-staging/gosaki-piano/admin/`) can log in via Supabase Auth, pass `ADMIN_EMAILS` authorization, and run **YouTube URL dry-run** against Edge Function `gosaki-youtube-url-dry-run` on staging (`kmjqppxjdnwwrtaeqjta`).

YouTube is the **first practical module** for proving a reusable **web save** pattern for Static-to-Astro CMS / Musician CMS Kit — not because YouTube is the end goal, but because it is the smallest field-level slice with existing guards (G-10c local, G-11c1 Edge dry-run).

---

## 2. Position in Gosaki CMS practicalization

| Layer | Status | G-11c5 role |
| --- | --- | --- |
| Public static site | Live on Lolipop staging | Unchanged |
| Staging admin UI | Static HTML/JS + Auth | Add **Save** design only (implement G-11c6+) |
| Dry-run | Edge `gosaki-youtube-url-dry-run` — **E2E PASS** (G-11c4d) | Baseline for preview |
| Non-dry-run save | **Not implemented** | Define minimal slice |
| Publish (FTP) | Manual / G-7f1 suspended | **Out of first save slice** |
| Schedule CMS | Supabase DB path (G-9k) | Separate module — do not mix guards |

**Kit generalization target:** module registry pattern (`siteSlug`, `module`, `field`, `operationId`, `approvalId`, dry-run → save → publish) reusable for About HTML, Contact config, etc.

---

## 3. G-11c4d completed (input to G-11c5)

| Item | Result |
| --- | --- |
| `ADMIN_EMAILS` on staging | set once (operator) |
| Login + JWT | OK |
| Dry-run same URL | `200`, `no_change`, `wouldWrite: false` |
| Dry-run different URL | `200`, `changedFields: embedCode, videoId`, `wouldWrite: false` |
| DB / JSON write | **none** |
| Function redeploy | **none** |

Doc: `gosaki-staging-admin-emails-secret-and-youtube-dry-run-e2e-result.md`

---

## 4. Save target (this slice)

| Field | Value |
| --- | --- |
| `siteSlug` | `gosaki-piano` |
| `module` | `youtube-embed` |
| `field` | `embedCode` (derived `videoId`) |
| Human input | YouTube URL, embed URL, or 11-char `videoId` |
| Items affected | **1** (`itemsAffectedMustBeOne`) |

**Source of truth today:** `tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json` → convert → `gosaki-youtube-embed.json` in site extension → public home embed.

**Edge current snapshot:** `supabase/functions/_shared/gosaki-youtube-staging-current.ts` (build-time mirror; must stay in sync or use client `expectedBefore` for conflict detection).

---

## 5. Save destination options

| Option | Description | G-11c5 assessment |
| --- | --- | --- |
| **A. Static JSON in repo** | Patch allowlisted JSON via CI; convert + package | **Recommended** — matches G-11a Option C, G-10c guards, git audit trail |
| **B. Supabase DB** (`site_embeds`) | Row per site/module | **Deferred** — G-9a migration not done; adds DB write + RLS scope |
| **C. Edge direct JSON write** | Edge writes file to repo/storage | **Rejected** — browser-hosted admin cannot write repo; Edge must not hold broad repo credentials without workflow gate |
| **D. Browser → local Astro API (G-10c)** | Dev-server executor | **Rejected for staging admin** — static Lolipop host has no Node executor |
| **E. Module registry (future)** | Declarative module → store + publish adapters | **Target shape** — G-11c6 implements first concrete module entry |

---

## 6. Recommended minimal slice (G-11c5)

### 6.1 Architecture

**Hybrid path (G-11a):** Static admin → **new Edge save function** → **new Gosaki-only GitHub workflow** → server-side JSON patch (reuse G-10c / G-11c1 validation) → verifiers + convert + `manual-upload:package` → **stop before FTP** in first execution phase.

```txt
Browser (staging admin, JWT)
  → POST gosaki-youtube-url-save (new function, staging deploy)
  → requireAdminUser (ADMIN_EMAILS / role)
  → validate: siteSlug, module, field, approvalId, operationId, dryRun=false
  → validate: nextValue guards (reuse gosaki-youtube-url-dry-run.ts logic)
  → validate: expectedBefore (embedCode/videoId) optimistic lock
  → if no_change → 200, no dispatch
  → else workflow_dispatch (gosaki-staging-youtube-json-save.yml — name TBD)
  → return runId / status URL (pattern: trigger-deploy + deploy-status)
```

**Do not reuse** production `deploy.yml` or Sariswing production FTP secrets.

### 6.2 Why separate function from dry-run

| Reason | Detail |
| --- | --- |
| Slice isolation | Dry-run function frozen at G-11c4d E2E baseline |
| Approval IDs | Distinct `operationId` / `approvalId` for non-dry-run |
| Deploy risk | Save deploy is separate gate from dry-run deploy |
| Kit pattern | `*-dry-run` and `*-save` module pair |

### 6.3 First execution scope (G-11c6+ — not G-11c5)

| In scope | Out of scope (later) |
| --- | --- |
| JSON patch in repo via Actions | FTP upload to Lolipop |
| Single YouTube field | About / Contact modules |
| Staging Edge + staging workflow | Production Supabase / `vsbvndwuajjhnzpohghh` |
| Operator manual Save once | Auto-click Save |

---

## 7. Staging-only guards

| Guard | Rule |
| --- | --- |
| Supabase project | **`kmjqppxjdnwwrtaeqjta` only** — stop if `vsbvndwuajjhnzpohghh` appears |
| Admin UI host | `yskcreate.weblike.jp` staging deployBase `/cms-kit-staging/gosaki-piano/` |
| Auth | Supabase Auth JWT + `requireAdminUser` |
| Authorization | `ADMIN_EMAILS` allowlist (already set — **do not re-set** without new approval) |
| `service_role` | **Forbidden** in browser and routine Edge paths |
| Sariswing `/admin` | **Do not modify** `src/pages/admin` |
| Env arms | New env gate e.g. `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` — default **false** |

---

## 8. Production mix-up prevention

| Check | Mechanism |
| --- | --- |
| Project ref in deploy | Explicit `--project-ref kmjqppxjdnwwrtaeqjta` only |
| Workflow file | New YAML under `.github/workflows/` — name prefix `gosaki-staging-` |
| FTP path | Allowlist `/cms-kit-staging/gosaki-piano/` only when FTP phase added |
| JSON path allowlist | Only `tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json` |
| GitHub `ref` | `main` or dedicated staging branch — document in preflight; never production site branch without approval |

---

## 9. ADMIN_EMAILS and secrets

| Item | G-11c5 policy |
| --- | --- |
| `ADMIN_EMAILS` | Already on staging — **reuse**; no additional `secrets set` in G-11c5/G-11c6 implementation |
| New secrets | GitHub token for workflow dispatch (Edge) — **plan only**; set in G-11c6-preflight with operator approval |
| Documentation | Placeholders only — **no real emails, tokens, or secret values** in docs/commits/logs |
| Auth metadata | **Do not** mutate `app_metadata.role` for this slice |

---

## 10. dry-run / preview / save / publish boundaries

| Step | Endpoint / actor | Side effects |
| --- | --- | --- |
| **Preview (UI)** | Client-side display of input | None |
| **Dry-run** | `gosaki-youtube-url-dry-run` — `dryRun: true` | None — `wouldWrite: false` always |
| **Save** | `gosaki-youtube-url-save` — `dryRun: false` | Dispatches workflow; JSON patch in git — **no FTP in v1** |
| **Publish** | Workflow FTP step or operator manual upload | Staging site update — **G-11c9+** with G-7f1 FTP gates |

**Normative UX flow:**

1. Login (JWT).
2. Edit URL.
3. **Dry-run** (required before Save enabled).
4. Review diff (`current` / `next` / `changedFields`).
5. **Save** (gated off by default; explicit approval ID + env arm).
6. Poll deploy status (optional G-11c6 UI).
7. **Publish** — operator manual `public-dist` upload or approved FTP phase.

---

## 11. Response semantics (save function)

| Case | HTTP | Body hints | Action |
| --- | --- | --- | --- |
| **no_change** | 200 | `ok: true`, `noChange: true`, `wouldWrite: false` | No workflow dispatch |
| **changed** | 200 | `ok: true`, `changedFields`, `workflowRunId` | Dispatch allowed patch |
| **invalid input** | 400 | `ok: false`, `error` (guard message) | No dispatch |
| **unauthorized** | 401 / 403 | Same as `admin-auth.ts` | No dispatch |
| **conflict** | 409 | `error: stale_current`, `expectedBefore` mismatch | No dispatch; client re-dry-run |
| **misconfigured server** | 500 | No secret leakage | No dispatch |

Dry-run function keeps **rejecting** `dryRun !== true`. Save function keeps **rejecting** `dryRun !== false`.

---

## 12. Rollback policy

| Layer | Rollback |
| --- | --- |
| Bad JSON commit | Revert git commit via Actions or manual `git revert` (operator) |
| Workflow mis-dispatch | Cancel GitHub run; no FTP if v1 excludes FTP |
| Edge function regression | Redeploy previous function version (operator approval) |
| `ADMIN_EMAILS` mistake | `secrets unset` (operator approval) — doc only |
| Staging site | Re-upload prior `manual-upload` package (operator) |

**If outcome unclear after Save:** stop; do not retry Save; record incident; ask human (G-7f1 pattern).

---

## 13. Reuse from existing code

| Asset | Reuse |
| --- | --- |
| `gosaki-youtube-url-dry-run.ts` | `parseYoutubeVideoId`, `assertG11c1NextValueAllowed`, diff logic |
| `admin-auth.ts` | `requireAdminUser` |
| G-10c `gosaki-youtube-embed-static-json-write-*` | Field allowlist, approvalId pattern, env arm stack |
| `trigger-deploy` / `deploy-status` | Workflow dispatch + poll pattern (new workflow file name) |
| `GosakiStagingReadOnlyAdminPage.astro` | Dry-run UI — add Save section in G-11c6 (disabled) |

---

## 14. Proposed IDs (implementation phase — not active)

```txt
operationId: G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice
approvalId:  G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice
function:    gosaki-youtube-url-save
workflow:    gosaki-staging-youtube-json-save.yml (TBD)
env arm:     PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED=false (default)
```

---

## 15. Verifier (local)

```bash
node tools/static-to-astro/scripts/verify-g11c5-gosaki-youtube-url-web-save-non-dry-run-slice-planning.mjs
```

---

## 16. Next phases (recommended)

| Phase | Scope |
| --- | --- |
| **G-11c6** | Implementation — Edge save function + admin Save UI (disabled), workflow YAML skeleton, verifiers — **no Save execution** |
| **G-11c6-preflight** | GitHub token secret, workflow inputs, rollback SQL/doc — operator checklist |
| **G-11c6-final-preflight** | before/after JSON snapshot, arm stack |
| **G-11c7** | First non-dry-run Save execution (operator manual Save once) |
| **G-11c8+** | Publish pipeline (FTP) with G-7f1 explicit approval |

---

## 17. Not in G-11c5 (explicit)

| Item | Status |
| --- | --- |
| Implementation / Save click | **no** |
| `supabase functions deploy` | **no** |
| `supabase secrets set` | **no** |
| DB write / SQL | **no** |
| JSON file mutation | **no** |
| `workflow_dispatch` execution | **no** |
| FTP / upload | **no** |
| Production Supabase / `vsbvndwuajjhnzpohghh` | **no** |
| `src/pages/admin` changes | **no** |
| `service_role` | **no** |
| commit / push | **no** (doc phase) |

---

## References

- G-11c4d: `gosaki-staging-admin-emails-secret-and-youtube-dry-run-e2e-result.md`
- G-11a: `gosaki-staging-online-cms-architecture-planning.md`
- G-11c1: `gosaki-youtube-url-web-save-dry-run-poc-local-prep.md`
- G-10c: `gosaki-youtube-embed-static-json-write-slice-implementation.md`
- G-10b: `gosaki-youtube-embed-read-and-write-planning.md`
- `supabase/functions/_shared/gosaki-youtube-url-dry-run.ts`
- `supabase/functions/trigger-deploy/index.ts`
