# Gosaki YouTube embed section layout reupload QA finalization (G-10e1)

**Phase:** `G-10e1-gosaki-youtube-embed-section-layout-reupload-qa-finalization`  
**Status:** **complete** — operator manual staging re-upload **succeeded**; layout improvement browser QA **PASS**; documentation only (no additional FTP by Cursor)  
**Date:** 2026-06-23  
**Prior:** G-10e layout improvement (commit `9dabcb4`); G-10d2a initial YouTube staging upload

| Check | Status |
| --- | --- |
| Operator manual FTP re-upload | **yes** (operator — FileZilla / ロリポップFTP) |
| Cursor / AI FTP upload | **no** |
| Staging browser QA | **PASS** (operator) |
| Layout improvement reflected on staging | **yes** |
| Blocking failure | **none** |
| Additional upload / delete / mirror | **no** |
| `src/pages/admin` changed | **no** |

Prior docs:

- [gosaki-youtube-embed-section-layout-improvement.md](./gosaki-youtube-embed-section-layout-improvement.md) (G-10e)
- [gosaki-youtube-embed-staging-upload-qa-finalization.md](./gosaki-youtube-embed-staging-upload-qa-finalization.md) (G-10d2a)

---

## Gates

```txt
gosakiYoutubeEmbedSectionLayoutReuploadQaFinalizationComplete: true
gosakiYoutubeEmbedSectionLayoutStagingReflected: true
gosakiYoutubeEmbedSectionLayoutOperatorReuploadExecuted: true
gosakiYoutubeEmbedSectionLayoutQaPassed: true
phase: G-10e1
readyForG10fDiscographyAlbumImagesPlanning: true
readyForG10gContactHubspotFormPlanning: true
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

## 1. Operator manual re-upload (executed)

| Item | Value |
| --- | --- |
| Method | Operator manual — FileZilla / ロリポップFTP |
| **Local source** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` |
| **Upload rule** | **`public-dist/` の中身のみ**（フォルダ自体ではない） |
| **Remote destination** | `cms-kit-staging/gosaki-piano/` (`/cms-kit-staging/gosaki-piano/`) |
| **Staging URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| Prior commit (G-10e package) | `9dabcb4` |

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

## 2. G-10e layout improvement (reflected on staging)

Operator confirmed the following G-10e fixes are **live on staging**:

```txt
- YouTube セクションが Wix mesh / grid の親カラム幅に押し込まれていた問題を改善
- grid-column: 1 / -1 によりセクションを全幅スパン
- max-width: 720px
- aspect-ratio: 16 / 9
- mobile max-width: 100%
- Wix breakout override により実効幅が改善
```

| Selector / rule | Value |
| --- | --- |
| `.gosaki-youtube-embed` | `max-width: 720px`, centered, `grid-column: 1 / -1` |
| `.gosaki-youtube-embed__media` | `aspect-ratio: 16 / 9` |
| Mobile | `max-width: 100%`, no horizontal overflow |
| Wix override | G-10e block in `gosaki-piano-overrides.mjs` |

**G-10d2a → G-10e → G-10e1 arc:** initial YouTube embed live → layout too small → local CSS fix → operator re-upload → **staging reflects larger natural YouTube section**.

---

## 3. Staging browser QA (operator — PASS)

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

| # | Check | Result |
| --- | --- | --- |
| 1 | Top page displays | **OK** |
| 2 | YouTube section visible | **OK** |
| 3 | Video plays / embed visible | **OK** |
| 4 | YouTube section size improvement | **OK** |
| 5 | Larger, natural display vs G-10d2a | **OK** |
| 6 | No major layout breakage | **OK** |

### Screenshot / visual confirmation (operator)

```txt
- YouTube セクションが中央配置されている
- iframe が大きく表示されている
- 動画 Ke4F8JAQz-I が表示されている
- footer との位置関係も大きく崩れていない
```

### YouTube content

| Field | Value |
| --- | --- |
| **videoId** | `Ke4F8JAQz-I` |
| **expected embed** | `youtube-nocookie.com/embed/Ke4F8JAQz-I` |
| **staging home** | YouTube section **visible**; video **displays**; layout **improved** |

**G-10c → G-10e1 arc closed:** YouTube embed CMS JSON Save → public HTML → staging → layout fix → **operator QA PASS**.

---

## 4. Not executed (G-10e1 documentation phase)

- Cursor FTP / upload / delete
- Additional staging upload beyond operator re-upload
- `lftp` / `mirror` / `--delete` / `rsync` / `scp` / `sftp`
- `deploy` / `workflow_dispatch`
- Save / JSON write / DB write by Cursor
- Re-click G-10c Save

---

## 5. Next phase candidates

YouTube embed public + layout arc **closed**. Recommended next Gosaki work (pick one for planning):

| Priority | Phase (proposed) | Goal | Rationale |
| --- | --- | --- | --- |
| **A (recommended)** | `G-10f-gosaki-discography-album-images-planning` | Replace NO PHOTO placeholders with real album artwork on staging | Client-preview visible gap; static JSON + `public/images/` path proven (G-8a bands pattern) |
| **B (alternate)** | `G-10g-gosaki-contact-hubspot-form-planning` | Replace non-functional Wix contact form with HubSpot embed or mailto-first | G-8f noted HubSpot deferred; client feedback item §20 |
| Parallel | `G-9h1` client preview feedback closure | Operator checklist from `gosaki-client-preview-feedback-closure.md` | Cross-cutting QA |

Deferred (unchanged from G-10a):

- Discography admin Save (M4)
- `site_embeds` Supabase migration
- Bands/Projects CMS (M5)
- Production cutover

---

## 6. Safety

- G-10e1 operator re-upload: scoped path only; overwrite only; no mirror/delete
- Cursor did not connect to FTP in G-10e1
- `src/pages/admin` unchanged
- Sariswing production untouched
