# G-11c10c — Gosaki YouTube URL save workflow dispatch execution result

**Phase:** `G-11c10c-gosaki-youtube-url-save-workflow-dispatch-execution`  
**Status:** **blocked — no workflow run created**  
**Base commit:** `e7db19c`  
**Approval:** received (`承認します。この workflow_dispatch を1回だけ実行してください。`)  
**Fix:** `G-11c10c-fix-gosaki-youtube-url-save-workflow-yaml-permissions-syntax` (YAML permissions syntax)

## Summary

Operator explicit approval was received. Dispatch was attempted but **no GitHub Actions run was created**. No JSON write, no commit on `origin/main`.

**Next dispatch requires a new explicit approval** (G-11c10c approval was consumed by blocked attempt; fix does not re-arm dispatch).

## Block history

### Attempt 1 — Cursor (gh not authenticated)

Cursor ran `gh workflow run` once; failed locally:

```txt
gh auth login required — no GH_TOKEN in Cursor environment
```

No API call reached GitHub.

### Attempt 2 — Operator manual `gh workflow run`

Operator ran the dispatch command once with authenticated `gh`. GitHub API rejected workflow creation:

```txt
HTTP 422: Invalid Argument - failed to parse workflow:
(Line: 67, Col: 17): Unrecognized named-value: 'inputs'.
Located at position 1 within expression: inputs.commit_enabled == true && 'write' || 'read'
```

**Root cause:** `permissions` block used `inputs.commit_enabled` — workflow_dispatch inputs are not valid in `permissions` context.

**Result:** dispatch event not created; no workflow run; no JSON change; no commit.

## Fix applied (G-11c10c-fix)

**File:** `.github/workflows/gosaki-youtube-url-save-staging.yml`

| Before | After |
|--------|-------|
| `permissions: contents: read` (workflow) | `permissions: contents: write` (workflow, fixed) |
| Job: `contents: ${{ inputs.commit_enabled == true && 'write' \|\| 'read' }}` | **removed** — no `inputs.*` in permissions |

**Rationale:** `workflow_dispatch` only; `commit_enabled` gates `--apply` and commit step in patch script / `if:` conditions; allowlist + expected_before guards remain.

## Planned dispatch inputs (not executed — for next approved run)

```txt
site_slug=gosaki-piano
module=youtube-embed
item_id=yt-placeholder-01
youtube_url=https://youtu.be/I-eY9YMq9GI
expected_before_embed_code=https://www.youtube.com/watch?v=Ke4F8JAQz-I
expected_before_video_id=Ke4F8JAQz-I
approval_id=G-11c10-gosaki-youtube-url-save-workflow-dispatch-001
operation_id=gosaki-youtube-url-save-workflow-dispatch-001
request_id=g11c10c-gosaki-youtube-url-save-workflow-dispatch-001
actor_id_hash=<hash only>
commit_enabled=true
```

Use a **new** `request_id` on retry (e.g. `g11c10c-dispatch-retry-001`; original blocked attempt: `g11c10c-gosaki-youtube-url-save-workflow-dispatch-001`).

## Pre-execution check-only (still valid at e7db19c)

| Field | Value |
|-------|-------|
| `saveReadiness` | `changed` |
| `changedFields` | `["embedCode"]` |
| Expected after commit | `embedCode: https://youtu.be/I-eY9YMq9GI` |
| `published` | unchanged (`true`) |

## Expected success criteria (after fix + new approval)

| Check | Expected |
|-------|----------|
| `gh workflow run` | HTTP 204 / run created |
| Actions job | success |
| Commit files | `gosaki-piano-youtube-embed.json` only |

## Rollback (if commit occurs)

```bash
git revert <commit-sha>
```

## G-11c10c retry approval gate

```txt
承認します。この workflow_dispatch を1回だけ実行してください。
```

Required again before next dispatch.

## Safety gates

| Gate | Value |
|------|-------|
| `workflowDispatchExecuted` | **false** (422 blocked — no run) |
| `ghWorkflowRunExecuted` | **false** |
| `workflowRunCreated` | **false** |
| `cursorJsonWriteExecuted` | **false** |
| `patchScriptApplyExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `cursorFtpUploadExecuted` | **false** |
| `supabaseFunctionsDeployExecuted` | **false** |
| `supabaseSecretsSetExecuted` | **false** |
| `yamlPermissionsFixApplied` | **true** (G-11c10c-fix, local uncommitted) |

## Next

1. Commit G-11c10c-fix (workflow YAML + docs).
2. Push to `origin/main`.
3. New explicit approval → one `workflow_dispatch` (G-11c10c-retry or continuation).
