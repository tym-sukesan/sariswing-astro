# G-11c11 — Gosaki YouTube URL save public reflection planning and local verification

**Phase:** `G-11c11-gosaki-youtube-url-save-public-reflection-planning-and-local-verification`  
**Status:** planning + local verification complete  
**Base commit:** `d2dd35c`  
**JSON commit (G-11c10c):** `9f58889` — `embedCode` → `https://youtu.be/I-eY9YMq9GI`

## Summary

G-11c10c updated repo JSON on `main`. Public staging site (`/cms-kit-staging/gosaki-piano/`) still serves **pre-upload** HTML until operator manual upload (G-11c14+). Local convert + build confirms the new `embedCode` reflects to home `dist/index.html` via the existing G-9j / G-10d pipeline.

**No FTP / upload / deploy / workflow_dispatch / Save / DB write in this phase.**

## 1. Source JSON (current)

| Field | Value |
|-------|-------|
| File | `tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json` |
| Item | `yt-placeholder-01` |
| `embedCode` | `https://youtu.be/I-eY9YMq9GI` |
| `published` | `true` |
| derived `videoId` | `I-eY9YMq9GI` |

## 2. Public reflection path

```txt
config/sites/gosaki-piano-youtube-embed.json
  ↓ convert (gosaki-piano fixture only)
scripts/lib/gosaki-home-youtube-embed.mjs → applyGosakiHomeYouTubeEmbed()
  → outDir/src/data/gosaki-youtube-embed.json
  → outDir/src/lib/gosaki-youtube-embed.ts
  → outDir/src/components/YouTubeEmbedSection.astro
  → inject <YouTubeEmbedSection /> into outDir/src/pages/index.astro
     (after Wix #comp-m8y53dj5 — schedule block)
  ↓ npm run build (--verify-build on convert)
dist/index.html — .gosaki-youtube-embed + youtube-nocookie iframe
  ↓ (operator — not G-11c11)
static-public / manual-upload package → FTP to /cms-kit-staging/gosaki-piano/
```

### Resolver behavior

| Question | Answer |
|----------|--------|
| Where read? | `loadGosakiYoutubeEmbedConfig()` at convert time |
| Which page? | Home only (`src/pages/index.astro`) |
| `embedCode` in HTML? | **No** — derived to `embedUrl` |
| iframe `src` | `https://www.youtube-nocookie.com/embed/{videoId}` |
| `watchUrl` link | `https://www.youtube.com/watch?v={videoId}` |
| `published` gate | `published === true` required (`resolveGosakiYoutubeItem`) |
| `videoId` source | parse from `embedCode` / `sourceUrl` / `videoId` field |
| Scope | YouTube section only — no schedule/about/contact changes |

**Not runtime Supabase** for YouTube embed. Static JSON baked at convert/build.

### Staging URL gap

Live staging home may still show `Ke4F8JAQz-I` until upload. Repo JSON and local build output are authoritative for G-11c11.

### Admin dry-run baseline note (out of scope G-11c11)

`supabase/functions/_shared/gosaki-youtube-staging-current.ts` still mirrors **old** `Ke4F8JAQz-I`. Update in a future admin/dry-run phase if optimistic-lock E2E is needed; **does not block** public HTML reflection.

## 3. Local verification (executed)

From `tools/static-to-astro/`:

```bash
rm -rf output/gosaki-piano-g11c11-verify
node scripts/convert-static-to-astro.mjs \
  fixtures/gosaki-piano \
  output/gosaki-piano-g11c11-verify \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ \
  --site-profile musician \
  --verify-build
```

**Result:** build **success** (16 pages + sitemap).

### Artifacts checked

| Artifact | Check |
|----------|-------|
| `src/data/gosaki-youtube-embed.json` | `embedCode` = `https://youtu.be/I-eY9YMq9GI`, `published: true` |
| `dist/index.html` | `.gosaki-youtube-embed` present |
| iframe embed | `youtube-nocookie.com/embed/I-eY9YMq9GI` |
| Old video | `Ke4F8JAQz-I` **absent** from home HTML |
| Other pages | No YouTube embed injection (home only) |

**Not executed:** `manual-upload:package`, `static-public` regen from this outDir, FTP, deploy.

## 4. Phase split (recommended)

| Phase | Scope | FTP |
|-------|-------|-----|
| **G-11c11** | Planning + local verify (this doc) | no |
| **G-11c12** | Regenerate `static-public` + `manual-upload` package from current `main` | no |
| **G-11c13** | Staging upload preflight (paths, file list, rollback) | no |
| **G-11c14** | Operator-approved manual upload ×1 | **yes** (explicit approval) |
| **G-11c15** | Staging public verification (HTTP + home embed QA) | no |

FTP / `--delete` remain suspended per G-7f1 unless operator re-approves with full preflight.

### G-11c14 approval gate (future)

```txt
承認します。この手動アップロードを1回だけ実行してください。
```

(Separate from workflow_dispatch approval.)

## 5. Rollback

| Layer | Action |
|-------|--------|
| Repo JSON | `git revert 9f58889` (already documented G-11c10c) |
| Staging site after upload | Re-upload package built from reverted JSON |

## Safety gates (this phase)

| Gate | Value |
|------|-------|
| `ftpUploadExecuted` | **false** |
| `deployExecuted` | **false** |
| `workflowDispatchExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `cursorJsonWriteExecuted` | **false** |
| `supabaseSecretsSetExecuted` | **false** |
| `localConvertBuildExecuted` | **true** (gitignored `output/gosaki-piano-g11c11-verify`) |

## Verifier

```bash
node tools/static-to-astro/scripts/verify-g11c11-gosaki-youtube-url-save-public-reflection-planning-and-local-verification.mjs
```

## Next

`G-11c12-gosaki-youtube-url-save-staging-package-build-artifact-preparation`
