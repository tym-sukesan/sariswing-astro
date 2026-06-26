# G-11c10a — Gosaki YouTube URL save workflow dispatch allowlist registration

**Phase:** `G-11c10a-gosaki-youtube-url-save-workflow-dispatch-allowlist-registration`  
**Status:** implementation complete  
**Base commit:** `1182419`  
**Preflight:** `gosaki-youtube-url-save-workflow-dispatch-preflight.md` (G-11c9)

## Summary

Registered G-11c10 workflow_dispatch `approval_id` / `operation_id` in the patch lib allowlist. G-11c6 IDs remain valid. No workflow dispatch, no JSON write, no `--apply`.

## Registered IDs

| Field | Value |
|-------|-------|
| `approval_id` | `G-11c10-gosaki-youtube-url-save-workflow-dispatch-001` |
| `operation_id` | `gosaki-youtube-url-save-workflow-dispatch-001` |

Constants: `tools/static-to-astro/scripts/lib/gosaki-youtube-url-save-constants.mjs`

```txt
GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_APPROVAL_IDS = [G-11c6…, G-11c10…]
GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_OPERATION_IDS = [G-11c6…, G-11c10…]
```

Validation: `parseG11c8WorkflowPatchInput` in `gosaki-youtube-url-save-workflow-json-patch-lib.mjs`

## Unchanged guards

- `site_slug`: `gosaki-piano` only
- `module`: `youtube-embed` only
- `item_id`: `yt-placeholder-01` only
- Patch field: `embedCode` only
- `published`: not modified

## Local check-only (G-11c10a)

Both G-11c6 and G-11c10 ID pairs pass input validation. JSON file unchanged (no `--apply`).

| ID pair | Case | saveReadiness | Exit |
|---------|------|---------------|------|
| G-11c10 | no_change | `no_change` | 0 |
| G-11c10 | changed | `changed` | 0 |
| G-11c10 | conflict | `conflict` | 2 |
| G-11c10 | invalid URL | `invalid_input` | 1 |
| G-11c6 | no_change (regression) | `no_change` | 0 |

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

## Verifier

```bash
node tools/static-to-astro/scripts/verify-g11c10a-gosaki-youtube-url-save-workflow-dispatch-allowlist-registration.mjs
```

## Next

`G-11c10-gosaki-youtube-url-save-workflow-dispatch-execution` — operator-approved `workflow_dispatch` ×1.
