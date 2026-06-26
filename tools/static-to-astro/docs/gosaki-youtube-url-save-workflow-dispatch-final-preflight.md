# G-11c10b — Gosaki YouTube URL save workflow dispatch final preflight

**Phase:** `G-11c10b-gosaki-youtube-url-save-workflow-dispatch-final-preflight`  
**Status:** final preflight complete  
**Base commit:** `282e762`  
**Prior:** `gosaki-youtube-url-save-workflow-dispatch-preflight.md` (G-11c9), `gosaki-youtube-url-save-workflow-dispatch-allowlist-registration.md` (G-11c10a)

## Summary

Final read-only preflight before **G-11c10c** — one operator-approved `workflow_dispatch`. G-11c10 approval/operation IDs are registered (G-11c10a). Local check-only reconfirmed all outcomes; JSON unchanged.

**No workflow_dispatch, no JSON write, no `--apply`, no Save/DB/FTP/deploy/secrets in this phase.**

## 1. Current JSON snapshot

**Target JSON:** `tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json`  
**Target item:** `yt-placeholder-01`  
**Recorded at:** commit `282e762` (local read)

| Field | Current value |
|-------|---------------|
| `siteSlug` | `gosaki-piano` |
| `items.length` | **1** |
| `items[0].id` | `yt-placeholder-01` |
| `embedCode` | `https://www.youtube.com/watch?v=Ke4F8JAQz-I` |
| derived `videoId` | `Ke4F8JAQz-I` |
| `published` | `true` |
| `sortOrder` | `10` |

**Scope:** Only `yt-placeholder-01` exists in `items[]`. Patch must not add/remove items or modify `published` / `sortOrder` / `sectionTitle` / `$comment`.

## 2. G-11c10c dispatch inputs — final plan

**Workflow:** `Gosaki YouTube URL save (staging JSON patch)`  
**File:** `.github/workflows/gosaki-youtube-url-save-staging.yml`

### Shared inputs (all scenarios)

```txt
site_slug=gosaki-piano
module=youtube-embed
item_id=yt-placeholder-01
expected_before_embed_code=https://www.youtube.com/watch?v=Ke4F8JAQz-I
expected_before_video_id=Ke4F8JAQz-I
approval_id=G-11c10-gosaki-youtube-url-save-workflow-dispatch-001
operation_id=gosaki-youtube-url-save-workflow-dispatch-001
request_id=g11c10c-dispatch-20260619-001
actor_id_hash=<SHA-256 hash only — no email>
```

`commit_enabled` is documented below per scenario. **Not executed in G-11c10b.**

### Option A — no_change (minimal risk)

```txt
youtube_url=https://www.youtube.com/watch?v=Ke4F8JAQz-I
commit_enabled=false
```

**Expected:** `saveReadiness: no_change`, job success, **no commit**, JSON unchanged on `main`.

### Option B — changed (recommended for G-11c10c)

```txt
youtube_url=https://youtu.be/I-eY9YMq9GI
commit_enabled=true
```

**Expected:** `saveReadiness: changed`, `changedFields: ["embedCode"]`, single-file commit on `main`:

```txt
tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json
```

After commit, `embedCode` → `https://youtu.be/I-eY9YMq9GI`; `published` stays `true`; no `videoId` field added.

## 3. Scenario comparison and recommendation

| | Option A (no_change) | Option B (changed) |
|--|----------------------|-------------------|
| Purpose | Validate workflow plumbing only | Validate full patch + commit path |
| Repo change | None | Single JSON `embedCode` update |
| Risk | Lowest | Low — isolated file, `git revert` rollback |
| Proves commit step | No | **Yes** |
| Public / FTP impact | None | None until G-11c11+ |

**Recommendation: Option B (changed)** for G-11c10c.

Rationale: G-11c9, G-11c10a, and G-11c10b already validated check-only paths repeatedly. The remaining unknown is workflow → `--apply` → git commit on GitHub Actions. Option A consumes the one allowed dispatch without proving that path. Rollback is a single `git revert`; no FTP or production exposure.

**If minimal repo risk is required:** use Option A with `commit_enabled=false`, then plan a separate future dispatch for Option B (requires new approval phase).

## 4. Changed URL candidate validation

Candidate: `https://youtu.be/I-eY9YMq9GI`

| Check | Result |
|-------|--------|
| G-11c1 URL validation | PASS |
| Derived `videoId` | `I-eY9YMq9GI` |
| Differs from current | Yes |
| `changedFields` | `["embedCode"]` only |
| `published` unchanged in plan | Yes |
| check-only (G-11c10b) | PASS — exit 0, `applied: false` |

## 5. Local check-only results (G-11c10b)

G-11c10 `approval_id` / `operation_id`. **No `--apply`.** JSON byte-identical before/after.

| Case | `saveReadiness` | Exit | `applied` |
|------|-----------------|------|-----------|
| no_change | `no_change` | 0 | false |
| changed (`I-eY9YMq9GI`) | `changed` | 0 | false |
| conflict | `conflict` | 2 | false |
| invalid (`javascript:…`) | `invalid_input` | 1 | false |

## 6. G-11c10c execution gate

Explicit operator approval (exact form):

```txt
承認します。この workflow_dispatch を1回だけ実行してください。
```

**Permitted once:**

- One `workflow_dispatch` on `gosaki-youtube-url-save-staging.yml`
- Inputs per Option A or B above (recommend Option B)

**Not permitted without separate approval:**

- Additional workflow_dispatch
- FTP / upload / mirror / `--delete`
- deploy (Supabase functions or static)
- Supabase secrets set / unset
- DB write
- production / Sariswing production operations
- Changes to files other than target JSON
- Save endpoint live call

## 7. G-11c10c execution procedure (operator — not run in G-11c10b)

1. Confirm `main` at `282e762` (or later commit including G-11c10a allowlist).
2. GitHub → Actions → **Gosaki YouTube URL save (staging JSON patch)** → Run workflow.
3. Enter inputs from §2 (Option B recommended).
4. Monitor job: patch step → commit step (Option B only).
5. Post-check (read-only):
   - Job `saveReadiness` output matches expectation
   - `main` has one new commit touching only `gosaki-piano-youtube-embed.json`
   - Commit message contains `request_id`, `approval`, `operation`
   - `embedCode` updated (Option B) or unchanged (Option A)
   - `published` still `true`

## 8. Rollback

| Situation | Action |
|-----------|--------|
| Option B commit succeeded | `git revert <commit-sha>` on `main` — restores `embedCode: https://www.youtube.com/watch?v=Ke4F8JAQz-I` |
| Option A (no_change) | No commit — no rollback |
| conflict / invalid_input | Job fails — no commit |
| Workflow fails before commit | No repo change |
| Wrong URL committed | Revert; future dispatch needs new approval phase |

**Out of scope for G-11c10c:** public site reflection, FTP upload (G-11c11+). Staging/production sites unaffected until separate phase.

## Safety gates (this phase)

| Gate | Value |
|------|-------|
| `workflowDispatchExecuted` | **false** |
| `ghWorkflowRunExecuted` | **false** |
| `cursorJsonWriteExecuted` | **false** |
| `patchScriptApplyExecuted` | **false** |
| `commitEnabledTrueExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `cursorFtpUploadExecuted` | **false** |
| `supabaseFunctionsDeployExecuted` | **false** |
| `supabaseSecretsSetExecuted` | **false** |

## Verifier

```bash
node tools/static-to-astro/scripts/verify-g11c10b-gosaki-youtube-url-save-workflow-dispatch-final-preflight.mjs
```

## Next

`G-11c10c-gosaki-youtube-url-save-workflow-dispatch-execution` — operator-approved `workflow_dispatch` ×1 (recommend Option B).
