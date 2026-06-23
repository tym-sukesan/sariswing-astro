# Gosaki YouTube embed public reflection verification (G-10d)

**Phase:** `G-10d-gosaki-youtube-embed-public-reflection-verification`  
**Status:** **complete** — local convert + build + home HTML embed verified; staging upload **not executed**  
**Date:** 2026-06-23  
**Prior:** G-10c2 operator Save (`commit 5d5b1f1`); JSON `published:true`, `embedCode` watch URL `Ke4F8JAQz-I`

| Check | Status |
| --- | --- |
| Public reflection path confirmed | **yes** |
| Local convert + build | **yes** (`output/gosaki-piano-g10d-verify`) |
| Home HTML embed verified | **yes** |
| Staging manual upload | **not executed** |
| FTP / deploy / workflow_dispatch | **not executed** |
| Cursor Save / JSON write / DB write | **no** |
| `src/pages/admin` changed | **no** |

Prior docs:

- [gosaki-youtube-embed-static-json-write-save-success-finalization.md](./gosaki-youtube-embed-static-json-write-save-success-finalization.md) (G-10c2)
- [gosaki-youtube-embed-read-and-write-planning.md](./gosaki-youtube-embed-read-and-write-planning.md) (G-10b)

---

## Gates

```txt
gosakiYoutubeEmbedPublicReflectionVerificationComplete: true
phase: G-10d
readyForGosakiYoutubeEmbedStagingManualUploadByOperator: true
readyForAnyDbWrite: false
cursorClickedSave: false
cursorExecutedJsonWrite: false
ftpDeployExecuted: false
workflowDispatchExecuted: false
```

**Do not re-click G-10c Save.**

---

## 1. Public reflection path (confirmed)

G-10b path remains correct. Actual file names / hooks:

```txt
tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json
  ↓ convert (gosaki-piano fixture only; isGosakiPianoFixture)
scripts/lib/astro-generator.mjs → applyGosakiHomeYouTubeEmbed(outDir, TOOL_ROOT)
  → outDir/src/data/gosaki-youtube-embed.json          (JSON copy)
  → outDir/src/lib/gosaki-youtube-embed.ts             (resolver copy)
  → outDir/src/components/YouTubeEmbedSection.astro    (template copy)
  → inject <YouTubeEmbedSection /> into outDir/src/pages/index.astro
     (after Wix block #comp-m8y53dj5 — THIS WEEK'S LIVE SCHEDULE)
  ↓ npm run build (in converted outDir; --verify-build on convert)
dist/index.html — .gosaki-youtube-embed section + youtube-nocookie iframe
  ↓ (separate operator step — not done in G-10d)
npm run manual-upload:package → operator upload to /cms-kit-staging/gosaki-piano/
```

**Resolver:** `resolvePublishedGosakiYoutubeItems()` — `published === true` + parseable `videoId` from `embedCode` / `sourceUrl` / `videoId` → `embedUrl = https://www.youtube-nocookie.com/embed/{videoId}`.

**Not runtime Supabase.** Static JSON baked at convert/build only.

---

## 2. Source JSON (G-10c2 committed state)

| Field | Value |
| --- | --- |
| File | `tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json` |
| Item | `yt-placeholder-01` |
| `published` | `true` |
| `embedCode` | `https://www.youtube.com/watch?v=Ke4F8JAQz-I` |
| `videoId` | `Ke4F8JAQz-I` |
| `embedUrl` (resolved) | `https://www.youtube-nocookie.com/embed/Ke4F8JAQz-I` |

---

## 3. Local convert / build commands (executed)

From `tools/static-to-astro/`:

```bash
rm -rf output/gosaki-piano-g10d-verify
node scripts/convert-static-to-astro.mjs \
  fixtures/gosaki-piano \
  output/gosaki-piano-g10d-verify \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ \
  --site-profile musician \
  --verify-build
```

**Result:** `CONVERSION_REPORT.md` — `npm run build`: **成功** (16 pages + sitemap).

**Converted data copy verified:** `output/gosaki-piano-g10d-verify/src/data/gosaki-youtube-embed.json` matches source (`published:true`, watch URL).

**Build output:** `output/gosaki-piano-g10d-verify/dist/index.html`

**Not executed:** `manual-upload:package`, FTP, deploy, workflow_dispatch, staging upload.

---

## 4. Home HTML verification

**Artifact:** `tools/static-to-astro/output/gosaki-piano-g10d-verify/dist/index.html`

| Check | Result |
| --- | --- |
| `.gosaki-youtube-embed` section present | **yes** |
| `youtube-nocookie.com/embed/Ke4F8JAQz-I` in iframe `src` | **yes** |
| `published:true` → section visible (not empty) | **yes** |
| `YouTubeEmbedSection` equivalent markup | **yes** (`gosaki-youtube-embed__iframe`, section title `YouTube`) |

**Conclusion:** G-10c2 JSON update **correctly reflects** to Gosaki home public HTML via convert/build pipeline.

**Staging URL** (`/cms-kit-staging/gosaki-piano/`) still shows **pre-upload** state until operator manual upload.

---

## 5. Blockers found and fixed during G-10d (convert tooling)

Two pre-existing issues blocked first convert/build attempt; fixed in `scripts/lib/gosaki-home-youtube-embed.mjs`:

| Issue | Symptom | Fix |
| --- | --- | --- |
| cheerio `createRequire` path | `Cannot find module 'cheerio'` | `../../package.json` (static-to-astro) not `../../../package.json` |
| Home import path | `Could not resolve "../../components/YouTubeEmbedSection.astro"` from `src/pages/index.astro` | Use `../components/YouTubeEmbedSection.astro` for home page |

Band profiles on `about/index.astro` correctly use `../../components/` (nested page).

---

## 6. Manual upload plan (plan only — not executed)

When operator is ready to reflect on staging:

```bash
cd tools/static-to-astro
# Re-use or regenerate from gosaki-piano-astro output via static-public pipeline if needed
npm run manual-upload:package
# Operator uploads output/manual-upload/gosaki-piano/public-dist/ to
# /cms-kit-staging/gosaki-piano/ on Lolipop (no FTP auto-deploy)
```

FTP auto-apply remains **suspended** (`readyForAnyFutureFtpApply: false`).

---

## 7. Next phase

| Phase | Goal |
| --- | --- |
| **G-10d1** | `gosaki-youtube-embed-manual-upload-package-prep` — **complete** — see [gosaki-youtube-embed-manual-upload-package-prep.md](./gosaki-youtube-embed-manual-upload-package-prep.md) |
| **G-10d2** | `gosaki-youtube-embed-staging-manual-upload-by-operator` — operator FTP upload + staging browser QA |

Deferred:

- `site_embeds` Supabase migration (was G-10e in G-10b planning)
- G-10c Save re-execution

---

## 8. Safety

- No Save click / JSON write / DB write by Cursor in G-10d
- No FTP / deploy / workflow_dispatch
- `src/pages/admin` unchanged
- Sariswing production / sari-site untouched
