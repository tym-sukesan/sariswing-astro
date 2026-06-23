# Gosaki YouTube embed staging upload QA finalization (G-10d2a)

**Phase:** `G-10d2a-gosaki-youtube-embed-staging-upload-qa-finalization`  
**Status:** **complete** — operator manual staging upload **succeeded**; browser QA **PASS**; documentation only (no re-upload, no additional FTP by Cursor)  
**Date:** 2026-06-23  
**Prior:** G-10d2 preflight (commit `5598777`); G-10d1 package; G-10c2 JSON Save; G-10d local HTML verified

| Check | Status |
| --- | --- |
| Operator manual FTP upload | **yes** (operator — FileZilla / ロリポップFTP) |
| Cursor / AI FTP upload | **no** |
| Staging browser QA | **PASS** (operator) |
| Blocking failure | **none** |
| Known UI issue (non-blocking) | YouTube section too small → G-10e |
| Additional upload / delete / mirror | **no** |
| `src/pages/admin` changed | **no** |

Prior docs:

- [gosaki-youtube-embed-staging-manual-upload-by-operator.md](./gosaki-youtube-embed-staging-manual-upload-by-operator.md) (G-10d2)
- [gosaki-youtube-embed-manual-upload-package-prep.md](./gosaki-youtube-embed-manual-upload-package-prep.md) (G-10d1)

---

## Gates

```txt
gosakiYoutubeEmbedStagingUploadQaFinalizationComplete: true
gosakiYoutubeEmbedStagingManualUploadExecuted: true
gosakiYoutubeEmbedStagingUploadQaPassed: true
phase: G-10d2a
readyForG10eYoutubeEmbedSectionLayoutImprovement: true
readyForAnyFutureFtpApply: false
ftpAutoDeployUsed: false
workflowDispatchExecuted: false
cursorFtpUploadExecuted: false
cursorClickedSave: false
rollbackNeeded: false
```

**Do not re-click G-10c Save.**

**Routine dev:** `G10C_YOUTUBE_EMBED_SAVE_ENABLED=false`; `PUBLIC_ADMIN_WRITE_DRY_RUN=true`.

---

## 1. Operator manual upload (executed)

| Item | Value |
| --- | --- |
| Method | Operator manual — FileZilla / ロリポップFTP |
| **Local source** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` |
| **Upload rule** | **`public-dist/` の中身のみ**（フォルダ自体ではない） |
| **Remote destination** | `cms-kit-staging/gosaki-piano/` (`/cms-kit-staging/gosaki-piano/`) |
| **Staging URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| Approval ID | `G-10d2-gosaki-youtube-embed-staging-manual-upload` |

### Upload policy (operator confirmed)

| Policy | Result |
| --- | --- |
| Overwrite upload only | **yes** |
| Delete remote files | **no** |
| Sync / mirror | **no** |
| `--delete` | **no** |
| FTP auto-deploy | **no** |
| `workflow_dispatch` | **no** |
| Production / Sariswing touched | **no** |

---

## 2. Staging browser QA (operator — PASS)

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

| # | Check | Result |
| --- | --- | --- |
| 1 | Top page displays | **OK** |
| 2 | YouTube section visible | **OK** |
| 3 | Video plays / embed visible | **OK** |
| 4 | About / Schedule / Contact open | **OK** |
| 5 | No major layout breakage | **OK** |
| 6 | Viewing staging URL (not production) | **OK** |

### YouTube content

| Field | Value |
| --- | --- |
| **videoId** | `Ke4F8JAQz-I` |
| **expected embed** | `youtube-nocookie.com/embed/Ke4F8JAQz-I` |
| **staging home** | YouTube section **visible**; video **displays** |

**G-10c → G-10d2a arc:** static JSON Save → local build → package → operator staging upload → **live staging reflects YouTube embed**.

---

## 3. Known UI issue (non-blocking)

Operator feedback during QA:

```txt
YouTube セクションが小さすぎる
```

| Item | Value |
| --- | --- |
| Severity | **non-blocking** — does not fail G-10d2a |
| Next phase | `G-10e-gosaki-youtube-embed-section-layout-improvement` |
| Goal | Improve YouTube section display size, spacing, responsive width |

No rollback required for G-10d2a.

---

## 4. Not executed (G-10d2a documentation phase)

- Cursor FTP / upload / delete
- Additional staging upload
- `lftp` / `mirror` / `--delete` / `rsync` / `scp` / `sftp`
- `deploy` / `workflow_dispatch`
- Save / JSON write / DB write by Cursor
- Re-click G-10c Save

---

## 5. Next phase

| Phase | Goal |
| --- | --- |
| **G-10e** | `gosaki-youtube-embed-section-layout-improvement` — YouTube section size / margin / responsive width on staging home |

Deferred:

- `site_embeds` Supabase migration (long-term; was G-10e in G-10b planning — rename conflict resolved: layout = G-10e, Supabase deferred further)

---

## 6. Safety

- G-10d2 operator upload: scoped path only; no mirror/delete
- Cursor did not connect to FTP in G-10d2a
- `src/pages/admin` unchanged
- Sariswing production untouched
