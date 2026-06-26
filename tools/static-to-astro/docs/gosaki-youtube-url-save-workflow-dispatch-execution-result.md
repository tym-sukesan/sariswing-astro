# G-11c10c — Gosaki YouTube URL save workflow dispatch execution result

**Phase:** `G-11c10c-gosaki-youtube-url-save-workflow-dispatch-execution` (retry)  
**Status:** **success**  
**Pre-fix base:** `0173d4c`  
**Post-commit:** `9f58889` on `origin/main`  
**Approval:** received for retry (`承認します。この workflow_dispatch を1回だけ実行してください。`)

## Summary

After G-11c10c-fix (`permissions: contents: write`), retry `workflow_dispatch` **succeeded**. Single-file JSON commit on `main`. No FTP / deploy / DB / Save.

## Retry execution

| Field | Value |
|-------|-------|
| Run URL | https://github.com/tym-sukesan/sariswing-astro/actions/runs/28219010388 |
| Run ID | `28219010388` |
| Job | `patch-json` — **success** (~5s) |
| `saveReadiness` | `changed` |
| `changedFields` | `["embedCode"]` |
| `applied` | `true` (workflow with `commit_enabled=true`) |
| Commit | `9f58889` |
| `request_id` | `g11c10c-gosaki-youtube-url-save-workflow-dispatch-retry-001` |

## JSON change (origin/main @ 9f58889)

**File:** `tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json`  
**Item:** `yt-placeholder-01` only

| Field | Before (`0173d4c`) | After (`9f58889`) |
|-------|-------------------|-------------------|
| `embedCode` | `https://www.youtube.com/watch?v=Ke4F8JAQz-I` | `https://youtu.be/I-eY9YMq9GI` |
| `published` | `true` | `true` |
| `videoId` | (not in JSON) | (not in JSON) |
| Other items | none | none |

## Prior blocked attempts (history)

1. **Cursor** — `gh auth` missing (no run created)
2. **Operator** — HTTP 422 workflow YAML parse (`inputs.*` in `permissions`) — fixed in G-11c10c-fix

## Rollback

```bash
git revert 9f58889   # on main after fetch
```

Restores `embedCode: https://www.youtube.com/watch?v=Ke4F8JAQz-I`.

## Safety gates (retry execution)

| Gate | Value |
|------|-------|
| `workflowDispatchExecuted` | **true** (once) |
| `workflowRunCreated` | **true** |
| `workflowRunSucceeded` | **true** |
| `originJsonCommit` | **true** (`9f58889`) |
| `cursorJsonWriteExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `cursorFtpUploadExecuted` | **false** |
| `supabaseFunctionsDeployExecuted` | **false** |
| `supabaseSecretsSetExecuted` | **false** |

## Next

`G-11c11-gosaki-youtube-url-save-public-reflection` — staging/public site reflects new `embedCode` (FTP separate approval).
