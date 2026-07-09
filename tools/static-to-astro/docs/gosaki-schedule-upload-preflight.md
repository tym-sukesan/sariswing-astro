# G-20r4d — Gosaki schedule August upload preflight

**Phase:** `G-20r4d-gosaki-schedule-upload-preflight`  
**Status:** **complete** — preflight doc only; **operator manual upload pending (G-20r4e)**  
**Date:** 2026-07-09  
**Base commit:** `ffca478`  
**Operator:** 戸山さん（FileZilla / Lolipop GUI · manual ×1 — **G-20r4e only**）  
**Prior:** [gosaki-schedule-public-output-review.md](./gosaki-schedule-public-output-review.md) (G-20r4c) · [gosaki-schedule-local-regen-dry-run-result.md](./gosaki-schedule-local-regen-dry-run-result.md) (G-20r4b)

| Check | Status |
| --- | --- |
| Upload scope documented | **yes** |
| Full file list (29) | **yes** |
| Remote path locked | **yes** |
| Manual procedure documented | **yes** |
| no delete / no mirror | **yes** |
| HTTP verify checklist | **yes** |
| P0 blockers | **none** |
| FTP / deploy executed | **no** |

---

## Gates

```txt
gosakiScheduleAugustUploadPreflightComplete: true
phase: G-20r4d-gosaki-schedule-upload-preflight
baseCommit: ffca478
priorPhase: G-20r4c-gosaki-schedule-public-output-review
targetProject: kmjqppxjdnwwrtaeqjta
packagePath: output/manual-upload/gosaki-piano/public-dist
fileCount: 29
deployBase: /cms-kit-staging/gosaki-piano/
stagingUrl: https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/
uploadScopeRecommended: full-public-dist-29-files
p0UploadBlockers: 0
readyForG20r4eOperatorManualUpload: true
ftpUploadExecuted: false
ftpAutoApply: forbidden
cursorFtpExecuted: false
commandLineFtpForbidden: true
mirrorDeleteForbidden: true
workflowDispatchForbidden: true
packageRegenExecuted: false
networkAccessInPhase: false
```

**Cursor / AI:** **must not** execute FTP, lftp, mirror, rsync, or `deploy-public-dist-ftp.mjs --apply`.

---

## 1. Purpose

G-20r4c で PASS した August 反映済み local package を、**Lolipop staging host** へ手動アップロードする前の preflight。本フェーズは **doc のみ** — upload は **G-20r4e** で operator が 1 回実行。

---

## 2. Prerequisites (all met)

| # | Gate | Status |
| --- | --- | --- |
| 1 | G-20r3a DB August INSERT closed | **met** |
| 2 | G-20r4a `expectedMonths` + legacy stub | **met** |
| 3 | G-20r4b local regen PASS | **met** |
| 4 | G-20r4c local output review PASS · P0 none | **met** |
| 5 | `safeForStaticFtp: true` | **met** |
| 6 | Live staging August | **stale** (upload required) |

---

## 3. Local source package

| Item | Value |
| --- | --- |
| **Local directory** | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` |
| **MANIFEST** | `tools/static-to-astro/output/manual-upload/gosaki-piano/MANIFEST.json` |
| **fileCount** | **29** |
| **generatedAt** | `2026-07-09T06:16:35.124Z` |
| **deployBase** | `/cms-kit-staging/gosaki-piano/` |
| **stagingUrl** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| **Zip backup (optional)** | `output/manual-upload/gosaki-piano/gosaki-piano-manual-upload.zip` |

**Upload rule:** `public-dist/` **の中身**を remote に配置する（`public-dist` フォルダ自体は作らない）。

```txt
Local:  …/public-dist/schedule/2026-08/index.html
Remote: /cms-kit-staging/gosaki-piano/schedule/2026-08/index.html
```

---

## 4. Remote destination (staging only)

| Item | Value |
| --- | --- |
| **Host** | `yskcreate.weblike.jp`（Lolipop · operator credentials · repo 外） |
| **FTP remote root for this upload** | `/cms-kit-staging/gosaki-piano/` |
| **Public base URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |

### Blocked targets — STOP if any match

| Target | Status |
| --- | --- |
| Account FTP root `/` | **blocked** (G-7f incident) |
| `.` / `./` / empty remote path | **blocked** |
| `www.gosaki-piano.com` production | **blocked** (G-20j HOLD) |
| Sariswing / TLHA / other site folders | **blocked** |
| `mirror --delete` / sync delete / remote `rm` | **forbidden** (G-7f1) |
| `deploy-public-dist-ftp.mjs --apply` | **suspended** |
| `workflow_dispatch` | **forbidden** |
| Command-line FTP / lftp / rsync | **forbidden** |

---

## 5. Upload scope decision

### 5.1 Recommended — **full `public-dist/` (29 files)**

| Option | Files | Decision |
| --- | --- | --- |
| **Full package** | **29** | **Recommended** — August 新規 + hub + sitemap + `_astro/` 同梱 |
| August minimal subset | **6** | Acceptable only if operator confirms `_astro/` already on host · **higher risk** |

**Rationale for full upload:**

- **New routes:** `schedule/2026-08/`, `2026-08/`（legacy stub）
- **Changed:** `schedule/index.html`（hub に 2026.08 リンク）
- **Changed:** `sitemap-0.xml`, `sitemap-index.xml`
- **`_astro/`:** `index.YcHrHZH4.css` + JS — layout 崩れ防止
- G-20r4c: P0 なし · 初回 August live 反映は full が安全

### 5.2 August-critical subset（参考 · minimal）

Operator が既存 `_astro/` が live と同一と確認できる場合のみ:

| # | Local → remote (under `/cms-kit-staging/gosaki-piano/`) |
| --- | --- |
| 1 | `schedule/index.html` |
| 2 | `schedule/2026-08/index.html` |
| 3 | `2026-08/index.html` |
| 4 | `sitemap-0.xml` |
| 5 | `sitemap-index.xml` |
| 6 | `_astro/index.YcHrHZH4.css` |
| 7 | `_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` |

**Out of scope for this slice:** `admin/` content change · production cutover

---

## 6. Full upload file list (29 files)

Paths relative to `public-dist/`:

| # | Path |
| --- | --- |
| 1 | `index.html` |
| 2 | `robots.txt` |
| 3 | `sitemap-0.xml` |
| 4 | `sitemap-index.xml` |
| 5 | `about/index.html` |
| 6 | `admin/index.html` |
| 7 | `contact/index.html` |
| 8 | `discography/index.html` |
| 9 | `link/index.html` |
| 10 | `schedule/index.html` |
| 11 | `schedule/2026-03/index.html` |
| 12 | `schedule/2026-04/index.html` |
| 13 | `schedule/2026-05/index.html` |
| 14 | `schedule/2026-06/index.html` |
| 15 | `schedule/2026-07/index.html` |
| 16 | **`schedule/2026-08/index.html`** |
| 17 | `2026-03/index.html` |
| 18 | `2026-04/index.html` |
| 19 | `2026-05/index.html` |
| 20 | `2026-06/index.html` |
| 21 | `2026-07/index.html` |
| 22 | **`2026-08/index.html`** |
| 23 | `_astro/index.YcHrHZH4.css` |
| 24 | `_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` |
| 25 | `assets/about/bands/careless_hornets.jpg` |
| 26 | `assets/about/bands/caribbean_function.jpg` |
| 27 | `assets/about/bands/gosakirikako_trio.jpg` |
| 28 | `assets/about/bands/kikioto.jpg` |
| 29 | `assets/about/bands/onomatopoeia.jpg` |

**August-new on host (expected after upload):** rows **16**, **22** · plus hub + sitemaps.

---

## 7. Operator manual upload procedure (G-20r4e — **not this phase**)

**Tool:** FileZilla または Lolipop ファイルマネージャ / FTP クライアント（**GUI 手動のみ**）

### 7.1 Pre-upload checklist（operator）

- [ ] Local package exists: `…/output/manual-upload/gosaki-piano/public-dist/`（29 files）
- [ ] G-20r4d preflight read · P0 none 確認済み
- [ ] FTP login OK · remote pane が **`/cms-kit-staging/gosaki-piano/`** — **not** `/` or account root
- [ ] Upload mode: **overwrite / merge** — **no delete** · **no mirror** · **no sync delete**
- [ ] Scope: **full public-dist contents**（推奨）または §5.2 minimal（自己責任）
- [ ] Production / `gosaki-piano.com` に接続していない
- [ ] `deploy-public-dist-ftp.mjs --apply` は使わない

### 7.2 Upload steps（FileZilla 例）

1. **Local pane:** `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` を開く
2. **Remote pane:** `/cms-kit-staging/gosaki-piano/` を開く（存在確認）
3. **Select:** `public-dist/` 内の全ファイル・フォルダ（29 files のツリー）
4. **Upload:** ドラッグまたは右クリック → アップロード（**上書き**）
5. **Do NOT:** リモートの兄弟ディレクトリ削除 · 「同期して削除」 · ミラー · ルートへの移動
6. **Verify remote paths exist:**
   - `schedule/2026-08/index.html`
   - `2026-08/index.html`
   - `schedule/index.html`（2026.08 リンク）
7. **Stop** — 1 セッション 1 回。失敗時は盲目リトライしない（§9）

### 7.3 Lolipop GUI 例

1. ロリポップ管理画面 → ファイル管理（または FTP）
2. `/cms-kit-staging/gosaki-piano/` に移動
3. ローカル `public-dist/` の中身をフォルダごとアップロード（`schedule/`, `2026-08/`, `_astro/` 等）
4. 新規フォルダ `schedule/2026-08/`, `2026-08/` が作成されることを確認
5. **削除操作は行わない**

---

## 8. HTTP verify checklist（G-20r4e — operator browser）

Base: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano`

| # | URL | Expected |
| --- | --- | --- |
| 1 | `/schedule/` | **200** · hub に **2026.08** リンク |
| 2 | `/schedule/2026-08/` | **200** · **14** event cards · `scheduleDataSource=supabase` |
| 3 | `/2026-08/` | **200** · legacy stub · **no** event cards · canonical → `/schedule/2026-08/` |
| 4 | `/schedule/2026-07/` | **200** · regression · 14 cards |
| 5 | View source `/schedule/2026-08/` | **absent:** `schedule-2026-08-007`, `009`, `013`, `008`, `018` |
| 6 | `/sitemap-0.xml` | contains `/schedule/2026-08/` · **no** legacy `/2026-08/` root URL |

### Success criteria

- All above **PASS**
- Layout/CSS loads（`_astro/index.YcHrHZH4.css` 200）
- No PoC / test markers on August page

### Failure criteria — **STOP · no blind retry**

| Symptom | Action |
| --- | --- |
| `/schedule/2026-08/` **404** | Stop · check remote path · do not delete remote |
| Card count ≠ **14** | Stop · compare local HTML · no second upload without review |
| `007`/`009`/`013` visible | Stop · DB/build issue — do not upload again |
| CSS broken / unstyled | Stop · confirm `_astro/` uploaded |
| Wrong remote directory | Stop · incident record · ask human |

---

## 9. Rollback note

| Item | Plan |
| --- | --- |
| Before upload | Optional: note current live `schedule/index.html` mtime or save remote copy |
| August rollback | Remove `schedule/2026-08/`, `2026-08/` on remote **only with explicit approval** — default **no remote delete** |
| Package rollback | Re-use prior MANIFEST / zip if exists · or regen from DB (separate phase) |
| DB rollback | G-20r3a rollback SQL documented · **not** part of upload |

**G-7f1:** remote delete は原則禁止。rollback も operator 明示承認なしに実行しない。

---

## 10. 今回（G-20r4d）実行していないこと

| Operation | Executed |
| --- | --- |
| FTP / deploy / lftp / mirror | **no** |
| Command-line FTP | **no** |
| `workflow_dispatch` | **no** |
| package regen | **no** |
| network / HTTP GET | **no** |
| DB write / SQL / Save | **no** |
| commit / push | **no** |

---

## 11. Next phase

| Phase | Scope |
| --- | --- |
| **G-20r4e-operator-manual-upload-execution** | Operator manual upload ×1 + HTTP verify + result doc |

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-schedule-upload-preflight.mjs
```
