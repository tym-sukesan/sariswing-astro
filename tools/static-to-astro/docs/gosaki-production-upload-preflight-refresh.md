# G-20j — Gosaki production upload preflight refresh

**Phase:** `G-20j-gosaki-production-upload-preflight-refresh`  
**Status:** **complete** — read-only / local preflight refresh only  
**Date:** 2026-07-08  
**Base commit:** `f5f038c`  
**Client:** 後藤沙紀さん（gosaki-piano）— **ピアニスト個人ミュージシャンサイト**（音楽教室サイトではない）  
**Prior:** [gosaki-production-package-staleness-review.md](./gosaki-production-package-staleness-review.md) (G-20p) · [gosaki-production-upload-preflight.md](./gosaki-production-upload-preflight.md) (G-20i) · [gosaki-production-upload-finalization-admin-and-remote-path.md](./gosaki-production-upload-finalization-admin-and-remote-path.md) (G-20i2)

| Check | Status |
| --- | --- |
| G-20p conclusions reflected | **yes** |
| 26-file manifest verified on disk | **yes** |
| Route / SEO checklist refreshed | **yes** |
| DNS / SSL / MX / remote path gates | **yes** |
| Client sign-off checklist | **yes** |
| FTP policy documented | **yes** |
| Build / regen / FTP / deploy | **not executed** |

---

## Gates

```txt
gosakiProductionUploadPreflightRefreshComplete: true
phase: G-20j-gosaki-production-upload-preflight-refresh
baseCommit: f5f038c
uploadContentVerdict: GO
uploadExecutionVerdict: HOLD
packageRegenRequired: false
uploadFileCount: 26
deployBase: /
safeForStaticFtp: true
adminExcludedFromPackage: true
g20jFullUploadExecution: HOLD
readyForClientSignOffOutreach: true
readyForG20jExecutionPlan: true
readyForG20jFtpUpload: false
ftpUploadByOperatorOnly: true
cursorFtpExecuted: false
buildExecuted: false
packageRegenExecuted: false
dbWriteExecuted: false
saveExecuted: false
deployExecuted: false
dnsChangeExecuted: false
sslChangeExecuted: false
mxChangeExecuted: false
productionChangeExecuted: false
serviceRoleUsed: false
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. G-20p 結論の反映

| Finding (G-20p) | Preflight implication |
| --- | --- |
| G-20i3 production package **content GO** | Use existing local package for first full upload |
| **Package regen 不要** | Do not block on `build:gosaki-production-package` |
| Schedule CMS P0 後も schedule content **stale ではない** | July 14 cards · `008` present · no PoC text |
| G-22j republish は **public HTML を変えていない** | G-22i4 byte-identical; no upload needed for P0 closure |
| Upload **execution HOLD** | G-20j FTP still blocked — see §4 |

### HOLD 理由（G-20j execution — unchanged）

| Gate | Status | Blocker |
| --- | --- | --- |
| DNS cutover (Wix → Lolipop) | **未解決** | **yes** |
| SSL (Let's Encrypt on Lolipop) | **未解決** | **yes** |
| MX / email records | **未確認** | **yes** |
| Remote path (Lolipop document root) | **未確認** | **yes** |
| Client sign-off | **未完了** | **yes** |

**Content is ready; infrastructure and approval are not.**

---

## 2. 26-file upload preflight

### 2.1 Package location (verified read-only)

| Item | Value |
| --- | --- |
| Package dir | `tools/static-to-astro/output/manual-upload/gosaki-piano-production/` |
| Upload source | `.../gosaki-piano-production/public-dist/` (**contents only**) |
| MANIFEST.json | **present** |
| `generatedAt` | `2026-07-01T17:16:34.661Z` |
| On-disk `public-dist` file count | **26** (verified) |

### 2.2 MANIFEST gates

| Field | Value | OK |
| --- | --- | --- |
| `fileCount` | **26** | ✓ |
| `deployBase` | **`/`** | ✓ |
| `safeForStaticFtp` | **`true`** | ✓ |
| `adminExcludedFromPackage` | **`true`** | ✓ |
| `includeGosakiReadOnlyAdmin` | **`false`** | ✓ |
| `ftpAutoDeployUsed` | **`false`** | ✓ |
| `stagingUrl` (canonical host) | `https://www.gosaki-piano.com/` | ✓ |

### 2.3 Route note

| Route | Status |
| --- | --- |
| `/profile/` | **does not exist** in Gosaki package |
| Profile / About | **`/about/`** (Wix About + Bands/Projects injection) |

### 2.4 `admin/` exclusion

| Check | Result |
| --- | --- |
| `public-dist/admin/` on disk | **absent** |
| Upload must include `admin/` | **no** — Option B (G-20i2) |
| Post-upload `/admin/` on prod | **must 404 or absent** (G-20k) |

### 2.5 Upload 対象 — 26 files (`public-dist/` relative)

```txt
index.html
robots.txt
sitemap-index.xml
sitemap-0.xml
about/index.html
contact/index.html
discography/index.html
link/index.html
schedule/index.html
schedule/2026-03/index.html
schedule/2026-04/index.html
schedule/2026-05/index.html
schedule/2026-06/index.html
schedule/2026-07/index.html
2026-03/index.html
2026-04/index.html
2026-05/index.html
2026-06/index.html
2026-07/index.html
_astro/index.YcHrHZH4.css
_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js
assets/about/bands/careless_hornets.jpg
assets/about/bands/caribbean_function.jpg
assets/about/bands/gosakirikako_trio.jpg
assets/about/bands/kikioto.jpg
assets/about/bands/onomatopoeia.jpg
```

### 2.6 Upload 対象外

| Item | Reason |
| --- | --- |
| `admin/` | Excluded by G-20i3 policy |
| Astro source / `src/` / convert output | Not static deploy artifacts |
| Package wrapper | `MANIFEST.json`, `README-UPLOAD.md`, `CHECKLIST.md`, `gosaki-piano-manual-upload.zip` — operator reference only |
| `public-dist/` folder name itself | Upload **contents** — remote must have `/index.html` not `/public-dist/index.html` |

### 2.7 Upload rule (critical)

```txt
LOCAL:  .../gosaki-piano-production/public-dist/*
REMOTE: <document-root>/index.html, /about/, /_astro/, ...

CORRECT:  /index.html
WRONG:    /public-dist/index.html
```

### 2.8 Package doc hygiene note (P1)

On-disk `CHECKLIST.md` / `README-UPLOAD.md` in the package still contain **staging-era** post-upload checks (noindex, staging host, optional `/admin/`). **This refresh doc supersedes those for production.** Operator should follow §3 post-upload checks below, not the stale package CHECKLIST verbatim.

---

## 3. Route / SEO / canonical / robots / sitemap checklist

**Verify on local package before upload; re-verify on `https://www.gosaki-piano.com/` after upload + DNS (G-20k).**

### 3.1 Primary routes

| Route | Pre-upload (local package) | Post-upload (production) |
| --- | --- | --- |
| `/` | canonical + og:url = `www.gosaki-piano.com` · **no noindex** | HTTP 200 · indexable |
| `/about/` | prod host · profile + bands | HTTP 200 |
| `/schedule/` | hub · month links `/schedule/YYYY-MM/` | HTTP 200 |
| `/schedule/2026-03/` | canonical month · Supabase cards | HTTP 200 |
| `/schedule/2026-04/` | same | HTTP 200 |
| `/schedule/2026-05/` | same | HTTP 200 |
| `/schedule/2026-06/` | same | HTTP 200 |
| `/schedule/2026-07/` | **14 event cards** · `2026.07.17` for `008` | HTTP 200 |
| `/discography/` | no `（テスト）` · 8+8 tracks | HTTP 200 |
| `/contact/` | HubSpot embed page | HTTP 200 · form E2E |
| `/link/` | external links page | HTTP 200 |

### 3.2 Legacy stubs

| Route | Expected |
| --- | --- |
| `/2026-03/` … `/2026-07/` | `noindex,follow` · canonical → `/schedule/YYYY-MM/` on **www.gosaki-piano.com** |
| Legacy body | Stub / redirect messaging · **0 event cards** |

### 3.3 SEO files

| File / meta | Expected (production package) |
| --- | --- |
| `robots.txt` | `Allow: /` · Sitemap → `https://www.gosaki-piano.com/sitemap-index.xml` |
| `sitemap-index.xml` | loc = `www.gosaki-piano.com` |
| `sitemap-0.xml` | all URLs on `www.gosaki-piano.com` · no staging leak |
| Primary routes | **indexable** — no `noindex` in `<head>` |
| Legacy stubs | **noindex,follow** |
| `canonical` | `https://www.gosaki-piano.com/...` |
| `og:url` | matches canonical host |
| Staging leak | `yskcreate`, `/cms-kit-staging/gosaki-piano` **absent** on primary HTML |

### 3.4 Assets

| Asset | Verify |
| --- | --- |
| `/_astro/index.YcHrHZH4.css` | included in upload · HTTP 200 post-upload |
| `/_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js` | included · HTTP 200 post-upload |
| `/assets/about/bands/*.jpg` (×5) | included · HTTP 200 post-upload |

---

## 4. DNS / SSL / MX / remote path gate

**G-20j FTP upload と DNS / SSL / MX は別フェーズ。** 今回は checklist のみ。rollback 手順の詳細は今回作り込まない — 高リスクとして別フェーズ扱い。

### 4.1 Who confirms what

| Item | Who | When | Record where |
| --- | --- | --- | --- |
| Lolipop remote document root | **Operator (戸山)** | Before FTP | G-20j execution doc (not repo) |
| FTP login root vs web root | **Operator** | Before FTP | Screenshot required |
| Remote path screenshot | **Operator** | Before FTP | Attach to execution doc |
| DNS records export (Wix/registrar) | **Operator + client** | Before DNS phase | Off-repo |
| MX / mail records | **Operator + client** | Before DNS phase | Off-repo |
| SSL enablement | **Operator** | Before or at DNS cutover | Lolipop panel |
| Client written OK | **Client (後藤さん)** | Before upload + DNS | Email / signed checklist |

### 4.2 Remote path gate

| # | Check | Action |
| --- | --- | --- |
| P1 | Lolipop **document root** for `www.gosaki-piano.com` identified | e.g. `public_html/` or domain folder |
| P2 | FTP **login root** ≠ upload destination confusion resolved | Login may land above web root |
| P3 | **Screenshot** of remote path before first file | Mandatory |
| P4 | Account root `/` shows **other domains** | **STOP** — do not upload until scoped |
| P5 | Upload rule: `public-dist/` **contents only** | Never create remote `public-dist/` folder |

### 4.3 DNS gate (separate phase: `G-20dns-gosaki-dns-cutover`)

| # | Check |
| --- | --- |
| D1 | DNS owner identified (Wix / registrar / Lolipop) |
| D2 | Current A/CNAME/AAAA records **recorded** before change |
| D3 | Target: `www.gosaki-piano.com` → Lolipop |
| D4 | Apex `gosaki-piano.com` redirect policy agreed |
| D5 | TTL shortened 24–48h before switch (if registrar DNS) |
| D6 | Wix fallback understood (revert DNS until TTL expires) |
| D7 | Low-traffic cutover window with client |

### 4.4 MX gate (separate phase — with DNS)

| # | Check |
| --- | --- |
| M1 | Current MX records **listed and saved** |
| M2 | Mail provider identified |
| M3 | Post-cutover send/receive test planned |
| M4 | **Do not** change DNS until MX impact reviewed |

### 4.5 SSL gate (separate phase: `G-20ssl-gosaki-lolipop-ssl`)

| # | Check |
| --- | --- |
| S1 | Lolipop free SSL (Let's Encrypt) available on plan |
| S2 | Enable before or immediately after DNS cutover |
| S3 | HTTPS valid on all primary routes post-cutover |

### 4.6 Phase separation

```txt
G-20j-preflight-refresh (this doc)  →  docs only
G-20j-execution-plan                →  operator runbook (next)
G-20j-ftp-upload                    →  operator manual FTP (explicit approval)
G-20dns                           →  DNS cutover (separate approval)
G-20ssl                           →  SSL (with or after DNS)
G-20k                             →  post-upload HTTP verify
```

---

## 5. Client sign-off checklist

**Staging preview:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

| # | Item | Client confirms |
| --- | --- | --- |
| C1 | **Home** — layout, KV, overall impression | ☐ |
| C2 | **About / Profile** — biography text, photos | ☐ |
| C3 | **Bands / Projects** — 5 band cards on About | ☐ |
| C4 | **Schedule** — dates, venues, titles accurate | ☐ |
| C5 | **Discography** — albums, track lists (no test titles) | ☐ |
| C6 | **Contact** — page layout acceptable | ☐ |
| C7 | **Link** — external links correct | ☐ |
| C8 | **Mobile** — MENU, schedule, footer SNS (spot-check) | ☐ |
| C9 | **表示文言** — Japanese copy, typos | ☐ |
| C10 | **YouTube embed** (home) — correct video | ☐ |
| C11 | **HubSpot Contact form** — understands submissions go to HubSpot inbox | ☐ |
| C12 | **本番公開タイミング** — agreed window | ☐ |
| C13 | **DNS切替タイミング** — downtime tolerance understood | ☐ |
| C14 | **Written OK** to proceed with production upload + DNS | ☐ **required** |

**Blocks G-20j execution until C14.**

---

## 6. High-risk separation — 今回未実行

| Operation | Executed this phase |
| --- | --- |
| build | **no** |
| Astro build | **no** |
| package regen | **no** |
| `npm run build:gosaki-production-package` | **no** |
| DB write | **no** |
| SQL INSERT / UPDATE / DELETE / UPSERT | **no** |
| Supabase Save | **no** |
| FTP upload | **no** |
| deploy | **no** |
| workflow_dispatch | **no** |
| DNS change | **no** |
| SSL change | **no** |
| MX change | **no** |
| secrets / env change | **no** |
| `service_role` | **no** |
| GRANT / REVOKE | **no** |
| RLS policy change | **no** |
| rollback SQL | **no** |
| production change | **no** |
| live crawl / network access | **no** |
| Sariswing production ref `vsbvndwuajjhnzpohghh` as active target | **no** |

---

## 7. FTP 方針

| Rule | Detail |
| --- | --- |
| **Who uploads** | **戸山さん** — human operator manual FTP (FileZilla / Lolipop panel) |
| **Who does NOT upload** | Cursor / Codex / AI — **never** execute FTP |
| **`mirror --delete`** | **Forbidden** (G-7f1) |
| **sync / delete-remote / rsync / scp / CLI FTP** | **Forbidden** for AI |
| **AI role** | File list · remote path checklist · upload procedure docs **only** |
| **Auto FTP apply** | **Suspended** — `readyForAnyFutureFtpApply: false` |
| **Approval** | G-20j execution requires explicit operator approval per G-7f1 form |

### Operator pre-upload (human)

1. Complete §4 gates (remote path screenshot, sign-off).
2. Open local `public-dist/` — confirm **26 files**.
3. Connect FTP — navigate to **document root** (not account `/` with unrelated sites).
4. Upload **contents** of `public-dist/` — overwrite OK; **no delete-sync**.
5. Include `_astro/` and `assets/` — first full upload requires CSS/JS.

---

## 8. 次に進むべき最小タスク

**G-20j execution はまだ行わない。** 優先候補:

| Priority | Phase | Type | Scope |
| --- | --- | --- | --- |
| **1** | `G-20j1-client-sign-off-outreach` | read-only doc | Staging URL + §5 checklist送付文面 |
| **2** | `G-20j2-dns-ssl-mx-operator-checklist` | operator | §4 D/M/S gates — off-repo record |
| **3** | `G-20j3-lolipop-remote-path-confirmation` | operator | R3/R4 screenshot |
| **4** | `G-20j4-gosaki-production-upload-execution-plan` | read-only doc | Step-by-step for 26-file manual FTP after gates lift |

**Recommended first (read-only):** `G-20j1-client-sign-off-outreach` — unblocks C14 without FTP/DNS.

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-production-upload-preflight-refresh.mjs
```
