# G-11c14 — Gosaki YouTube URL save staging manual upload execution result

**Phase:** `G-11c14-gosaki-youtube-url-save-staging-manual-upload-execution`  
**Status:** operator upload complete — **record only**  
**Base commit:** `1d29158`  
**Prior:** G-11c13 preflight (`gosaki-youtube-url-save-staging-upload-preflight.md`)  
**Package:** G-11c12 regeneration (27 files)

## Summary

Operator (戸山) manually uploaded G-11c12 manual-upload package to Gosaki staging via FileZilla / Lolipop FTP GUI. **Cursor / AI did not execute FTP, upload, delete, or mirror.**

**Next:** `G-11c15-gosaki-youtube-url-save-staging-public-verification` — HTTP QA on staging home embed.

---

## 1. Executor

| Item | Value |
|------|-------|
| **Executor** | Operator (戸山) — manual |
| **Cursor / AI** | Did **not** connect to FTP, upload, delete, or mirror |
| **Approval** | `承認します。この手動アップロードを1回だけ実行してください。` (operator-provided) |
| **Rollback** | Not executed |

---

## 2. Upload details

### Source (local)

```txt
tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/
```

Uploaded **contents of `public-dist/` only** — not the `public-dist` folder itself, not the zip.

| Check (pre-upload, G-11c13/G-11c14) | Result |
|---------------------------------------|--------|
| File count | 27 |
| Home embed | `youtube-nocookie.com/embed/I-eY9YMq9GI` |
| Old `Ke4F8JAQz-I` | absent from package |

### Destination (remote)

| Item | Value |
|------|-------|
| **Host** | `yskcreate.weblike.jp` (Lolipop) |
| **FTP path** | `/cms-kit-staging/gosaki-piano/` |
| **Public URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |

### Upload method

| Item | Value |
|------|-------|
| **Method** | Manual overwrite upload (FileZilla / Lolipop FTP GUI) |
| **Delete / remote cleanup** | **no** |
| `mirror --delete` | **no** |
| `sync --delete` | **no** |

### Out of scope / not touched

| Target | Status |
|--------|--------|
| Sariswing production | **not touched** |
| gosaki-piano.com production | **not touched** |
| Server FTP root `/` | **not touched** |
| TLHA / other site areas | **not touched** |

---

## 3. Prohibited operations — not performed (Cursor)

| Operation | Executed |
|-----------|----------|
| FTP / upload (Cursor) | **no** |
| remote delete | **no** |
| `mirror --delete` | **no** |
| `sync --delete` | **no** |
| deploy | **no** |
| `workflow_dispatch` | **no** |
| Save | **no** |
| DB write | **no** |
| JSON write | **no** |
| Supabase secrets set | **no** |
| production / Sariswing ops | **no** |

---

## 4. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `operatorManualUploadExecuted` | **true** |
| `cursorFtpUploadExecuted` | **false** |
| `mirrorDeleteUsed` | **false** |
| `syncDeleteUsed` | **false** |
| `remoteDeleteUsed` | **false** |
| `deployExecuted` | **false** |
| `workflowDispatchExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `cursorJsonWriteExecuted` | **false** |
| `supabaseSecretsSetExecuted` | **false** |
| `productionTouched` | **false** |

---

## 5. Verifier

```bash
node tools/static-to-astro/scripts/verify-g11c14-gosaki-youtube-url-save-staging-manual-upload-execution-result.mjs
```

---

## 6. Next

`G-11c15-gosaki-youtube-url-save-staging-public-verification` — confirm staging home serves `youtube-nocookie.com/embed/I-eY9YMq9GI` (HTTP / browser QA).
