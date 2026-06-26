# G-11c12 — Gosaki YouTube URL save static-public and manual-upload package regeneration

**Phase:** `G-11c12-gosaki-youtube-url-save-static-public-and-manual-upload-package-regeneration`  
**Status:** regeneration complete  
**Base commit:** `f285786`  
**Generated at (UTC):** `2026-06-26T05:47:15Z`  
**Prior:** G-11c11 local reflection; G-11c10c JSON `embedCode` → `https://youtu.be/I-eY9YMq9GI`

## Summary

Regenerated Gosaki **staging** static-public artifact and manual-upload package from current `main` JSON. Home public HTML contains `youtube-nocookie.com/embed/I-eY9YMq9GI`. Old `Ke4F8JAQz-I` absent from public HTML.

**No FTP / upload / deploy / workflow_dispatch / Save / DB write in this phase.**

## 1. Package generation path

```txt
fixtures/gosaki-piano
  ↓ convert + build (--verify-build)
output/gosaki-piano-astro/dist/
  ↓ verify-static-public-artifact.mjs
output/static-public/gosaki-piano/public-dist/
  ↓ npm run manual-upload:package (local copy + zip — NO FTP)
output/manual-upload/gosaki-piano/public-dist/   ← operator upload root
```

| Step | Command (from `tools/static-to-astro/`) |
|------|----------------------------------------|
| Convert + build | `node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build` |
| Static-public | `node scripts/verify-static-public-artifact.mjs --astro-dir tools/static-to-astro/output/gosaki-piano-astro --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md` |
| Package | `npm run manual-upload:package` |
| Verify | `npm run verify:manual-upload` |

**Staging only:** `deployBase` `/cms-kit-staging/gosaki-piano/`, `stagingUrl` `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano`. Not Sariswing production.

**Scripts contain no FTP/upload/deploy** — `create-manual-upload-package.mjs` uses local `fs.cpSync` + zip only.

## 2. Package output

| Item | Path |
|------|------|
| Static-public | `output/static-public/gosaki-piano/public-dist/` |
| Manifest | `output/static-public/gosaki-piano/static-public-manifest.json` |
| Report | `output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md` |
| Manual-upload package | `output/manual-upload/gosaki-piano/` |
| Upload contents | `output/manual-upload/gosaki-piano/public-dist/` (27 files) |
| Zip | `output/manual-upload/gosaki-piano/gosaki-piano-manual-upload.zip` |
| Remote target | `/cms-kit-staging/gosaki-piano/` (operator FTP — G-11c14+) |

| Check | Result |
|-------|--------|
| `safeForStaticFtp` | `true` |
| `verify:manual-upload` | **PASS** |
| File count | **27** |
| `stagingPreviewOk` | `true` |
| `productionIndexable` | `false` |

All paths under `output/` are **gitignored** — not committed.

## 3. HTML / embed verification

**Artifacts checked:** `public-dist/index.html` (static-public + manual-upload copy — identical)

| Check | Result |
|-------|--------|
| `.gosaki-youtube-embed` section | **yes** |
| `youtube-nocookie.com/embed/I-eY9YMq9GI` | **yes** |
| `Ke4F8JAQz-I` in public HTML | **no** (entire `public-dist/`) |
| `I-eY9YMq9GI` in home | **yes** |
| Scope | Home YouTube section only — no unrelated page diffs from this JSON change |

**Admin path (separate):** `public-dist/admin/index.html` also reflects new JSON (`data-gosaki-youtube-current-embed` = `https://youtu.be/I-eY9YMq9GI`). This is staging read-only admin UI, not the public home embed path. `supabase/functions/_shared/gosaki-youtube-staging-current.ts` may still hold old baseline for Edge dry-run — **does not affect** generated public HTML.

## 4. Secrets / upload safety

- No `.env` / tokens / service keys in package (manifest key leak scan: OK)
- Upload **contents** of `public-dist/` only — not parent folders
- Do not upload raw `dist/client` directly

## 5. Phase split (unchanged)

| Phase | Scope |
|-------|-------|
| **G-11c12** | Package regeneration (this doc) |
| **G-11c13** | Staging upload preflight |
| **G-11c14** | Operator-approved manual upload ×1 |
| **G-11c15** | Staging public verification |

### G-11c14 approval gate

```txt
承認します。この手動アップロードを1回だけ実行してください。
```

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
| `packageRegenerationExecuted` | **true** (local gitignored output) |

## Verifier

```bash
node tools/static-to-astro/scripts/verify-g11c12-gosaki-youtube-url-save-static-public-and-manual-upload-package-regeneration.mjs
```

## Next

`G-11c13-gosaki-youtube-url-save-staging-upload-preflight`
