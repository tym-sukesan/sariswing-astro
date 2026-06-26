# G-11c8 — Gosaki YouTube URL save workflow JSON patch implementation

**Phase:** `G-11c8-gosaki-youtube-url-save-workflow-json-patch-implementation`  
**Status:** implementation complete  
**Planning:** `gosaki-youtube-url-save-workflow-json-patch-planning.md` (G-11c7)

## Summary

GitHub workflow `gosaki-youtube-url-save-staging.yml` now calls a local patch script that validates workflow_dispatch inputs and plans an **embedCode-only** patch on `tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json` item `yt-placeholder-01`.

Default behavior is **check-only** (no JSON write). `--apply` and workflow `commit_enabled: true` are reserved for G-11c10 dispatch execution.

## Patch scope (Option C — G-11c7)

| Field | Action |
|-------|--------|
| `embedCode` | Patch target |
| `videoId` | Derive for validation only — **not written** |
| `published` | **Untouched** |
| `sortOrder`, `id`, `sectionTitle` | Forbidden |

## Artifacts

| File | Role |
|------|------|
| `scripts/lib/gosaki-youtube-url-save-workflow-json-patch-lib.mjs` | Validation + plan logic |
| `scripts/gosaki-youtube-url-save-workflow-json-patch.mjs` | CLI (default check-only; `--apply` writes) |
| `.github/workflows/gosaki-youtube-url-save-staging.yml` | `workflow_dispatch` only; calls patch script |
| `scripts/verify-g11c8-gosaki-youtube-url-save-workflow-json-patch-implementation.mjs` | Local verifier |

## Workflow inputs

- `site_slug` — allowlist `gosaki-piano`
- `module` — allowlist `youtube-embed`
- `item_id` — allowlist `yt-placeholder-01`
- `youtube_url` — normalized via G-11c1 validation
- `expected_before_embed_code` / `expected_before_video_id` — optimistic lock
- `approval_id` / `operation_id` — `G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice`
- `request_id` — opaque audit id (no PII)
- `actor_id_hash` — optional hash (no email)
- `commit_enabled` — default `false`; G-11c10+ only

## Outcomes

| saveReadiness | CLI exit | Workflow |
|---------------|----------|----------|
| `invalid_input` | 1 | Fail job |
| `conflict` | 2 | Fail job |
| `no_change` | 0 | No commit |
| `changed` | 0 | Commit only if `commit_enabled: true` |

Commit message template:

```txt
cms-kit(gosaki-youtube): patch embedCode [request_id=…] [approval=…] [operation=…]
```

## Safety gates (this phase)

| Gate | Value |
|------|-------|
| `workflowDispatchExecuted` | **false** |
| `cursorJsonWriteExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `cursorFtpUploadExecuted` | **false** |
| `supabaseFunctionsDeployExecuted` | **false** |
| `supabaseSecretsSetExecuted` | **false** |
| Staging project ref | `kmjqppxjdnwwrtaeqjta` |
| Production project ref | `vsbvndwuajjhnzpohghh` — **not targeted** |

## Verifier

```bash
node tools/static-to-astro/scripts/verify-g11c8-gosaki-youtube-url-save-workflow-json-patch-implementation.mjs
```

Verifier runs patch CLI in check-only mode only (no `--apply`).

## Next

`G-11c9-gosaki-youtube-url-save-workflow-json-patch-preflight` — before first `workflow_dispatch` with `commit_enabled: true`.
