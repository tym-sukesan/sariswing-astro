# G-11c9 — Gosaki YouTube URL save workflow dispatch preflight

**Phase:** `G-11c9-gosaki-youtube-url-save-workflow-dispatch-preflight`  
**Status:** preflight complete  
**Base commit:** `3cbcb9e`  
**Implementation:** `gosaki-youtube-url-save-workflow-json-patch-implementation.md` (G-11c8)  
**Planning:** `gosaki-youtube-url-save-workflow-json-patch-planning.md` (G-11c7)

## Summary

Read-only preflight before the first `workflow_dispatch` on `.github/workflows/gosaki-youtube-url-save-staging.yml`. Local check-only patch script runs confirm `no_change` / `changed` / `conflict` / `invalid_input` behavior without modifying JSON.

**No workflow_dispatch, no JSON write, no Save, no DB/FTP/deploy/secrets in this phase.**

## 1. Workflow trigger review

| Check | Result |
|-------|--------|
| Trigger | `workflow_dispatch` only ✅ |
| `push` / `pull_request` / `schedule` | absent ✅ |
| FTP / upload / deploy | absent ✅ |
| Patch target JSON | `tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json` only ✅ |
| Patch field | `embedCode` only ✅ |
| `published` | unchanged by design ✅ |
| Secrets / tokens / email in logs | not emitted by patch script log formatter ✅ |

Workflow file: `.github/workflows/gosaki-youtube-url-save-staging.yml`  
Patch script: `tools/static-to-astro/scripts/gosaki-youtube-url-save-workflow-json-patch.mjs`

`commit_enabled` defaults to `false`. When `true` and `saveReadiness == changed`, workflow runs patch script with `--apply`, then commits **only** the target JSON file.

## 2. Current JSON snapshot (read-only)

**Target JSON:** `tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json`  
**Target item:** `yt-placeholder-01`  
**Recorded at preflight:** commit `3cbcb9e` (local read)

| Field | Current value |
|-------|---------------|
| `siteSlug` | `gosaki-piano` |
| `items.length` | **1** |
| `items[0].id` | `yt-placeholder-01` |
| `embedCode` | `https://www.youtube.com/watch?v=Ke4F8JAQz-I` |
| derived `videoId` | `Ke4F8JAQz-I` |
| `published` | `true` |
| `sortOrder` | `10` |

**Scope guard:** Only `yt-placeholder-01` is in `items[]`. No other items exist; patch must not add/remove items or touch `sectionTitle` / `$comment`.

## 3. G-11c10 workflow_dispatch input plan

Workflow: `Gosaki YouTube URL save (staging JSON patch)`  
File: `.github/workflows/gosaki-youtube-url-save-staging.yml`

### Shared fields (both scenarios)

| Input | Value |
|-------|-------|
| `site_slug` | `gosaki-piano` |
| `module` | `youtube-embed` |
| `item_id` | `yt-placeholder-01` |
| `expected_before_embed_code` | `https://www.youtube.com/watch?v=Ke4F8JAQz-I` |
| `expected_before_video_id` | `Ke4F8JAQz-I` |
| `approval_id` | `G-11c10-gosaki-youtube-url-save-workflow-dispatch-001` |
| `operation_id` | `gosaki-youtube-url-save-workflow-dispatch-001` |
| `request_id` | `g11c10-dispatch-20260619-001` (example — use timestamped opaque id at execution) |
| `actor_id_hash` | SHA-256 hash only (no email) |
| `commit_enabled` | `true` (G-11c10 execution only) |

### Scenario A — `no_change` (smoke / lock verification)

| Input | Value |
|-------|-------|
| `youtube_url` | `https://www.youtube.com/watch?v=Ke4F8JAQz-I` (same as current) |

**Expected:** `saveReadiness: no_change`, exit 0, **no commit**, JSON unchanged.

### Scenario B — `changed` (first real embedCode update)

| Input | Value |
|-------|-------|
| `youtube_url` | `https://youtu.be/I-eY9YMq9GI` (example — confirm with operator before G-11c10) |

**Expected:** `saveReadiness: changed`, `changedFields: ["embedCode"]`, commit single JSON file, `published` stays `true`, no `videoId` field added.

### G-11c10 prerequisite — approval ID allowlist

As of commit `3cbcb9e`, patch lib `parseG11c8WorkflowPatchInput` accepts only:

- `approval_id`: `G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice`
- `operation_id`: `G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice`

**Before G-11c10 dispatch with G-11c10 IDs above**, register `G-11c10-gosaki-youtube-url-save-workflow-dispatch-001` and `gosaki-youtube-url-save-workflow-dispatch-001` in the patch lib allowlist (small code change — not done in G-11c9).

Local check-only tests in G-11c9 used G-11c6 IDs (current allowlist).

## 4. Local check-only results (G-11c9)

Patch script invoked **without** `--apply`. JSON file byte-identical before/after all runs.

| Case | `saveReadiness` | Exit | `applied` |
|------|-----------------|------|-----------|
| no_change (current URL) | `no_change` | 0 | false |
| changed (`I-eY9YMq9GI`) | `changed` | 0 | false (`checkOnly: true`) |
| conflict (wrong `expected_before_embed_code`) | `conflict` | 2 | false |
| invalid (`javascript:…`) | `invalid_input` | 1 | false |

Command template (check-only):

```bash
node tools/static-to-astro/scripts/gosaki-youtube-url-save-workflow-json-patch.mjs \
  --site-slug gosaki-piano \
  --module youtube-embed \
  --item-id yt-placeholder-01 \
  --youtube-url '<URL>' \
  --expected-before-embed-code 'https://www.youtube.com/watch?v=Ke4F8JAQz-I' \
  --expected-before-video-id Ke4F8JAQz-I \
  --approval-id G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice \
  --operation-id G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice \
  --request-id g11c9-preflight-<case> \
  --json
```

## 5. G-11c10 execution gate

Explicit operator approval required (exact form):

```txt
承認します。この workflow_dispatch を1回だけ実行してください。
```

**Permitted (one time only):**

- One `workflow_dispatch` on `gosaki-youtube-url-save-staging.yml`
- `commit_enabled: true` only if Scenario B (`changed`) is intended
- Single-file commit to `gosaki-piano-youtube-embed.json` on `main`

**Not permitted without separate approval:**

- FTP / upload / mirror / `--delete`
- deploy (Supabase functions or static)
- Supabase secrets set / unset
- DB write (SQL INSERT/UPDATE/DELETE/UPSERT)
- production / Sariswing production operations
- Additional workflow_dispatch reruns
- Changes to files other than the target JSON
- Save endpoint live call with `saveEnabled:true` (unless a future phase explicitly approves)

## 6. Rollback

| Situation | Action |
|-----------|--------|
| Workflow commits JSON (Scenario B) | `git revert <commit-sha>` on `main` — restores prior `embedCode` |
| `no_change` | No commit — no rollback needed |
| `conflict` / `invalid_input` | Job fails — no commit |
| Workflow job fails before commit step | No repo change |
| Wrong URL committed | Revert commit; re-dispatch with new `request_id` + approval (future phase) |

**Changed JSON only field:** `embedCode` on `yt-placeholder-01`. Revert restores:

```txt
embedCode: https://www.youtube.com/watch?v=Ke4F8JAQz-I
```

## Safety gates (this phase)

| Gate | Value |
|------|-------|
| `workflowDispatchExecuted` | **false** |
| `ghWorkflowRunExecuted` | **false** |
| `cursorJsonWriteExecuted` | **false** |
| `patchScriptApplyExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `cursorFtpUploadExecuted` | **false** |
| `supabaseFunctionsDeployExecuted` | **false** |
| `supabaseSecretsSetExecuted` | **false** |
| Staging project ref | `kmjqppxjdnwwrtaeqjta` (context only) |
| Production project ref | `vsbvndwuajjhnzpohghh` — **not targeted** |

## Verifier

```bash
node tools/static-to-astro/scripts/verify-g11c9-gosaki-youtube-url-save-workflow-dispatch-preflight.mjs
```

## Next

`G-11c10-gosaki-youtube-url-save-workflow-dispatch-execution` — register G-11c10 approval IDs in patch lib, then one operator-approved `workflow_dispatch`.
