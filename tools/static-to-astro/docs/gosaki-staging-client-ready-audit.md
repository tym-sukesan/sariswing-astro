# Gosaki staging client-ready audit（初回 read-only）

- **Phase:** `gosaki-staging-client-ready-audit-pass-1-read-only`
- **Date:** 2026-07-29
- **Status:** **IN PROGRESS** — pass-1 auto/static COMPLETE · About mobile order **local fixed** · YouTube multi gate **local verified** · **CLIENT_SHARE_READY = false**（package/FTP + 人間 QA 待ち）
- **Verdict (this pass):** **CONTINUE = YES** · **CLIENT_SHARE_READY = not yet**
- **Follow-up:** §11 About mobile + YouTube multi（2026-07-29）
- **Scope:** Home / Schedule / Discography / YouTube / About / Contact / Link / mobile / admin routes（**Schedule 偏重禁止**）
- **Audit package (SoT):** `sourceCommit` **`95ada81c8a408125370f089fb653660c702589ff`**
- **Repo HEAD at audit:** `ebb78fd63f8d1546864ad884a10a09368fb17e9c` (= `origin/main`)
- **About close HEAD:** `6cbffda8556434aa17761c474f1a3f78d0dbed92`（`95ada81`→`6cbffda` docs-only · non-docs **0** · Claude Finding 1 RESOLVED）
- **Staging URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- **Staging Supabase:** `kmjqppxjdnwwrtaeqjta`
- **Production:** `vsbvndwuajjhnzpohghh` **STOP / 未操作**
- **This phase (Cursor):** read-only inventory · static/HTTP · single audit doc · AI context · **no** implementation / package / FTP / DB / Save / commit / push

---

## Gates

```txt
phase: gosaki-staging-client-ready-audit-pass-1-read-only
GOSAKI_STAGING_CLIENT_READY_AUDIT_PASS1_READ_ONLY_COMPLETE: true
CLIENT_SHARE_READY: false
STAGING_READY_FOR_CLIENT_SHARE_2026_07_22: historical_only_do_not_reuse
auditPackageSourceCommit: 95ada81c8a408125370f089fb653660c702589ff
repoHeadAtAudit: ebb78fd63f8d1546864ad884a10a09368fb17e9c
originMainAtAudit: ebb78fd63f8d1546864ad884a10a09368fb17e9c
workingTreeCleanAtAudit: true
docsOnly95ada81To6cbffda: true
docsOnly95ada81ToHead: true
nonDocsDiffCount95ada81ToHead: 0
remotePublicRoutesHttp200: true
remoteAdminRoutesHttp200: true
packageNoindexAllHtml: true
packageRobotsDisallowAll: true
packageGosakiPianoComHtmlHits: 0
packageSaveArmsFalse: true
aboutWriteBackend: supabase
youtubeWriteBackend: contents
publicAboutBuildReadLive: true
verifyManualUploadPublicAboutBuildRead: FAIL_EXPECTED_HEAD_STALE
verifyPackageFreshnessStaging: STOP_EXPECTED_HEAD_STALE
verifyGosakiFontSafety: PASS
verifyFtpDeployerSafety: PASS
remoteSupabaseSelectNotRun: true
readyForMinimalHumanBrowserQa: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
SERVICE_ROLE_USED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
COMMIT_EXECUTED: false
PUSH_EXECUTED: false
```

---

## 1. 現在地

| Item | Value |
| --- | --- |
| Branch | `main` |
| HEAD | `ebb78fd63f8d1546864ad884a10a09368fb17e9c` |
| `origin/main` | `ebb78fd63f8d1546864ad884a10a09368fb17e9c`（一致） |
| Working tree | **clean**（未commit変更なし） |
| 監査基準 package | `tools/static-to-astro/output/manual-upload/gosaki-piano/` · `MANIFEST.sourceCommit` = **`95ada81…`** · `generatedAt` `2026-07-28T07:56:14.689Z` |
| Deployed staging | FileZilla full `public-dist/` @ `/cms-kit-staging/gosaki-piano/`（About FTP post-QA 記録） |
| Package ↔ HEAD | `95ada81`→`HEAD` は **docs-only 9 files**（AI docs + About slice docs）。実装差分 **0**。再 package / FTP **不要**（現行監査では） |
| 過去 READY | 2026-07-22 `STAGING_READY_FOR_CLIENT_SHARE: true`（`f284332` / `7797ece`）は **歴史情報のみ** — 現判定に流用しない |

---

## 2. Route inventory

Base: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

### 2.1 Public

| Route | Package | Remote HTTP (HEAD) | Desktop | Mobile |
| --- | --- | --- | --- | --- |
| `/` Home (+ YouTube) | yes | **200** | yes | yes |
| `/about/` | yes | **200** | yes | yes |
| `/discography/` | yes | **200** | yes | yes |
| `/contact/` | yes | **200** | yes | yes |
| `/link/` | yes | **200** | yes | yes |
| `/schedule/` hub | yes | **200** | yes | yes |
| `/schedule/2026-03/` … `/2026-08/` | yes | （hub + `/2026-07/` 代表確認） | yes | yes |
| `/2026-03/` … `/2026-08/`（flat month） | yes | `/2026-07/` **200** | yes | yes |
| `/robots.txt` | yes | **200** | n/a | n/a |

### 2.2 Admin（既存 deployed `/admin/*` — inventory / read-only QA 対象内）

| Route | Package | Remote HTTP (HEAD) | Desktop | Mobile |
| --- | --- | --- | --- | --- |
| `/admin/` portal | yes | **200** | yes | yes |
| `/admin/schedule/` | yes | **200** | yes | yes |
| `/admin/discography/` | yes | **200** | yes | yes |
| `/admin/youtube/` | yes | **200** | yes | yes |
| `/admin/about/` | yes | **200** | yes | yes |

**Note:** `AGENTS.md` の staging-shell 規則は **新規 route 変更禁止**として扱い、既存 `/admin/*` の閲覧・inventory は妨げない。

### 2.3 Package bake 要点

| Surface | Bake signal |
| --- | --- |
| About admin | `write-backend=supabase` · `save-armed=false` · Edge `gosaki-about-supabase-save-dry-run` @ staging |
| YouTube admin | `write-backend=contents` · `save-armed=false` · Contents dry-run/save endpoints @ staging |
| Schedule / Discography | `save-armed=false` · staging Edge endpoints |
| Public About | `publicAboutBuildRead=true` · `overlayOutcome=noop_equal` · lede baseline |
| Public Home YouTube | `I-eY9YMq9GI` + `youtube-nocookie` |
| CSS live | `_astro/index.YcHrHZH4.css`（local home 参照と remote 一致） |

---

## 3. 既存 QA 証跡の選別

### 3.1 現在も再利用可能（現行 package `95ada81` 前提で証拠として使える）

| Evidence | Why reusable |
| --- | --- |
| About vertical slice FTP post-QA · public `/about/` visual | **Same** `sourceCommit` `95ada81` · lede / Bands / nav PASS |
| About Claude audit | Finding 1 RESOLVED · slice CLOSED · NB only |
| About Admin read/hydrate · Save roundtrip · arms false · DB baseline | Behavior + remote arm state retained; package still disarmed |
| Package `ABOUT_PUBLIC_BUILD_READ_REPORT` / `PACKAGE_RUN` | On-disk matches post-QA (`noop_equal`, `fieldCount=1`) |
| Contact HubSpot E2E PASS (G-20u39a2) | Form still present (`hs-form` / hubspot); **no re-submit this audit** |
| Font safety + FTP deployer safety verifiers | Source/tooling still PASS (re-run this pass) |
| noindex / robots Disallow pattern | Confirmed again on package + remote |

### 3.2 現在の package では再確認が必要

| Evidence | Why recheck |
| --- | --- |
| 2026-07-22 full client-share smoke（4-feature sticky / desktop+375） | Different package (`f284332`) — patterns reusable, **verdict not** |
| G-7j early staging browser QA | Pre-CMS / old CSS hashes — structure only |
| Public mobile visual (G-8g / G-8f 系) | Many uploads since; need **spot** human mobile QA on live `95ada81` |
| Admin Save disabled after login | Static `save-armed=false` OK; **browser** confirm disabled buttons / no Save click |
| Schedule public counts (74) / admin (79) | Content may drift; spot-check hub + one month + admin list after login |
| Discography 4/34 | Spot visual only |
| YouTube Admin path / public embed | Home embed HTTP-confirmed; admin hydrate after login |
| Dual month URLs `/YYYY-MM/` vs `/schedule/YYYY-MM/` | Both in package; human nav sanity |

### 3.3 歴史情報のみ（現 client-ready 判定に使わない）

| Evidence | Note |
| --- | --- |
| `STAGING_READY_FOR_CLIENT_SHARE: true` (2026-07-22) | Package `f284332` / baseline `7797ece` |
| G-7j `readyForGosakiClientPreview: true` | Early preview gate |
| Older About packages (`84929cf`, `fe4732b`, armed roundtrip packages) | Superseded by `95ada81` disarmed build-read package |
| Production hosting / cutover gates | `HOSTING_READY: false` — out of staging share scope |

---

## 4. 自動・静的確認結果

### 4.1 実行コマンド

```bash
cd ~/sariswing-astro
git status --short
git rev-parse HEAD
git rev-parse origin/main

cd tools/static-to-astro
npm run verify:manual-upload:public-about-build-read
npm run verify:gosaki:staging
npm run verify:package-freshness:gosaki:staging
npm run verify:gosaki-font-safety
npm run verify:ftp-deployer-safety

# read-only HTTP (staging only)
# HEAD/GET on public + admin routes + robots.txt
```

### 4.2 Results

| Check | Result | Notes |
| --- | --- | --- |
| `git status` | **PASS** clean | |
| HEAD == origin/main | **PASS** `ebb78fd` | |
| `95ada81`→HEAD non-docs diff | **PASS** 0 | docs-only 9 paths |
| `verify:manual-upload:public-about-build-read` | **FAIL (expected)** | `PACKAGE_RUN.sourceCommit` stale vs HEAD — docs-only drift · **not** package corruption |
| `verify:gosaki:staging` (default) | **FAIL (expected)** | same stale + expects `publicAboutBuildRead=false` |
| `verify:package-freshness:gosaki:staging` | **STOP (expected)** | upload preflight vs HEAD — **do not** regen for this audit |
| `verify:gosaki-font-safety` | **PASS** 37/0 | |
| `verify:ftp-deployer-safety` | **PASS** 19/0 | |
| Package noindex all HTML | **PASS** 23/23 | |
| `robots.txt` Disallow `/` | **PASS** local + remote | |
| `gosaki-piano.com` in package HTML | **PASS** 0 | |
| `vsbv…` in admin JS | **PASS (guard)** | production ref **blocklist** constant, not live project URL bake |
| Staging project ref `kmjq…` in admin | **PASS** present | |
| Save arms in admin HTML | **PASS** all `*-save-armed="false"` | About/YouTube/Schedule/Discography |
| About `write-backend` | **PASS** `supabase` | |
| Remote HTTP 200 matrix | **PASS** | Home/About/Discography/Contact/Link/Schedule/`2026-07`/admin×5/robots |
| Remote About lede | **PASS** baseline string | |
| Remote Home YouTube | **PASS** `I-eY9YMq9GI` + nocookie | |
| Remote CSS hash | **PASS** `index.YcHrHZH4.css` | |
| Live RLS / GRANT SELECT | **未実行** | 初回は remote Supabase 接続なし（§8 に SQL 案のみ） |

### 4.3 未確認理由（人間 or 明示承認が必要）

- 実ブラウザ visual / mobile MENU / admin login 後 Save disabled
- Contact 再 submit（禁止 — 既存 E2E を再利用）
- Save / dry-run クリック（禁止）
- Live RLS catalog（任意 · SELECT-only SQL 案のみ）

---

## 5. 人間が行う最小ブラウザ QA（runbook）

**目的:** 自動確認で足りない視覚・操作確認だけを最小セットで埋める。Schedule だけ長く見ない。

**共通 STOP:** production / Wix を開いて変更しない · Save / dry-run / フォーム submit しない · arm を変えない · FTP しない · 結果が曖昧なら stop + ask。

### 5.1 Public desktop（1440×900 程度）

| # | URL | 操作 | 成功条件 | STOP |
| --- | --- | --- | --- | --- |
| P1 | `/` | 強制リロード | KV/ナビ/YouTube embed 表示 · 横溢れなし · noindex | レイアウト崩壊 / 本番ドメイン誘導 |
| P2 | `/about/` | 強制リロード | 冒頭 lede · Bands 5 · 画像 | lede 欠落 / 大幅崩れ |
| P3 | `/discography/` | スクロール | リリース一覧・Track List 可視 | 空/画像全滅 |
| P4 | `/contact/` | **表示のみ** | HubSpot 埋め込み可視 | submit **しない** |
| P5 | `/link/` | 表示 | リンク一覧可視 | |
| P6 | `/schedule/` | 月リンク 1 本クリック | hub → month 遷移 · イベントカード可視 | hub 空 / 月が全部死んでいる |
| P7 | `/2026-07/` | 表示 | flat month も内容あり | |

### 5.2 Public mobile（375×667 または 390×844）

| # | URL | 操作 | 成功条件 | STOP |
| --- | --- | --- | --- | --- |
| M1 | `/` | MENU 開閉 | 開閉できる · ロゴ大崩れなし · 横スクロールなし | MENU 不能 / 重大 overflow |
| M2 | `/about/` `/discography/` `/schedule/` 各 1 | スクロール | 1 カラム想定 · 文字切れ深刻でない | P1 級崩れ |

### 5.3 Admin（ログイン後 · **Save しない**）

| # | URL | 操作 | 成功条件 | STOP |
| --- | --- | --- | --- | --- |
| A1 | `/admin/` | ログイン | portal 表示 · ナビで各 content へ | 認証失敗が続く場合は記録して stop |
| A2 | `/admin/about/` | 表示のみ | hydrate/読取 UI · **Save disabled** · `writeBackend` supabase 想定 | Save が有効 / 本番 ref |
| A3 | `/admin/youtube/` | 表示のみ | current `I-eY9YMq9GI` · **Save disabled** | Save 有効 |
| A4 | `/admin/schedule/` | 表示のみ | 一覧読取 · **Save disabled** | Save 有効 / 公開に非公開が混入する疑い |
| A5 | `/admin/discography/` | 表示のみ | リリース読取 · **Save disabled** | Save 有効 |
| A6 | logout | ログアウト | セッション終了 | |

**Contact / Save / dry-run / 自動クリック: 禁止。**

---

## 6. P1 / P2 / P3 候補（監査中は修正しない）

| ID | Sev | Finding | 根拠 | 最小修正範囲（将来） |
| --- | --- | --- | --- | --- |
| — | **P1** | **なし（この pass）** | HTTP/静的/arms/noindex でブロッカー未検出 | — |
| CR-P2-1 | P2 | Verifier / freshness が HEAD 不一致で FAIL/STOP | docs-only 後の正当状態だが、オペレータが「壊れた package」と誤読しうる | docs 注記のみ、または freshness に docs-only 例外（別承認） |
| CR-P2-2 | P2 | YouTube admin `write-backend=contents` のまま（About は supabase） | 設計上の dual-path 残存 · Contents cutover 未完 | Contents YouTube 退役 planning（並行可） |
| CR-P2-3 | P2 | 人間ブラウザ未実施のため CLIENT_SHARE_READY 未確定 | 本 pass の意図どおり | §5 runbook 実行 |
| CR-P3-1 | P3 | package `_astro/` に未参照 CSS `index.B17c7c3y.css` | orphan asset · 参照は `YcHrHZH4` | 次回 package 生成時の掃除候補 |
| CR-P3-2 | P3 | Claude NB: suspended status / overlay_noop / FileZilla human risk / live RLS | About audit NON_BLOCKING | multi-client 前 or 一般化時 |
| CR-P3-3 | P3 | 歴史 non-blocking（G-22e 残置 · placeholder rename 等） | 2026-07-22 メモ | クライアント共有後でも可 |

---

## 7. client-ready audit を続行できるか

| Item | Value |
| --- | --- |
| Continue? | **YES** |
| CLIENT_SHARE_READY? | **false**（人間 QA 完了まで） |
| HOLD? | **no**（ブロッカーなし · 次は人間 QA） |
| 次に行う具体確認 | §5 最小ブラウザ QA（desktop + mobile + admin Save disabled）→ 結果を本 doc に追記 → READY 再判定 |
| まだしない | package 再生成 · FTP · Save arm · DB · commit/push · 実装修正 · Contact 再 submit |

---

## 8. Optional — staging SELECT-only SQL（未実行）

初回は remote Supabase に接続していない。live RLS/GRANT 確認が必要になったとき、オペレータが **staging SQL Editor のみ**で実行する案:

```sql
-- staging only (kmjqppxjdnwwrtaeqjta) · SELECT-only · one block · do not run on production
select
  n.nspname as schema,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'sites',
    'site_members',
    'site_page_fields',
    'site_embeds',
    'schedules',
    'discography_releases',
    'discography_tracks'
  )
order by c.relname;

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'sites',
    'site_members',
    'site_page_fields',
    'site_embeds',
    'schedules',
    'discography_releases',
    'discography_tracks'
  )
order by tablename, policyname;
```

**Do not:** GRANT/REVOKE · migration re-apply · production project.

---

## 9. 変更ファイル（pass-1）

- **New:** `tools/static-to-astro/docs/gosaki-staging-client-ready-audit.md`（本ファイルのみの audit doc）
- **Update:** AI context 3 files（`00-current-state` / `03-next-actions` / `handoff-to-chatgpt`）
- **既存未commit:** なし（clean）
- **実装 / package / FTP:** なし

---

## 10. 検証結果（安全 · pass-1）

| Check | Result |
| --- | --- |
| production 未操作 | **true** |
| DB write なし | **true** |
| Save arm 変更なし | **true** |
| package 生成なし | **true** |
| FTP なし | **true** |
| commit / push なし | **true** |
| Playwright 自動クリックなし | **true** |
| 無断修正なし | **true** |

---

## 11. Follow-up — About mobile order + YouTube multi-item (2026-07-29)

- **Phase:** `gosaki-staging-client-ready-audit-about-mobile-and-youtube-multi`
- **Status:** **LOCAL COMPLETE**（staging package 未再生成 · FTP 未実行）
- **CLIENT_SHARE_READY:** **false**（保留）

### 11.1 About mobile image order — **P2（local fixed）**

| Item | Value |
| --- | --- |
| Finding | SP で title → **text** → photo（望ましくは title → **photo** → text） |
| Fix | `gosaki-piano-overrides.mjs` G-8d About block · `#comp-lol1i5l0` 内 `order: 1/2/3`（title / photo / text） |
| PC | `@media (max-width: 768px)` のみ · desktop 変更なし |
| Markup | 変更なし（CSS order のみ） |
| Verifier | `verify:url-staging` + `verify:gosaki-youtube-public-multi` About order asserts **PASS** |
| Staging reflection | **要** package regen + FileZilla（CSS `_astro/*.css` 含む）後の 375px 目視 |

### 11.2 YouTube multi-item capability — **必須検証ゲート**

| # | Question | Answer |
| --- | --- | --- |
| 1 | DB / `site_embeds` は複数件対応か | **YES** — unique `(site_id, provider, legacy_item_id)` · `sort_order` · `published` · seed は現状 1 行 |
| 2 | public build-read は複数取得するか | **YES** — `loadSiteEmbedsDataForBuild` に limit 1 なし · mapper → `items[]` |
| 3 | public UI は複数表示できるか | **YES** — `YouTubeEmbedSection.astro` `items.map` · grid + 16:9 · mobile `overflow-x: clip` |
| 4 | Admin は既存 1 件編集だけか | **NO** — multi operational UI あり（list / edit） |
| 5 | Admin から 2 件目を追加できるか | **UI local YES** · **persist live NO**（Save disarmed · Contents single-URL は `yt-placeholder-01` 固定 · multi Save は G-11c7 / Supabase INSERT があるが未武装） |
| 6 | 順序変更・公開切替 | **YES**（UI + schema）· Soft-hide = `published=false`（DELETE なし） |

**Live SoT:** `config/sites/gosaki-piano-youtube-embed.json` は引き続き **1 件**（fixture のみ multi · SoT 未変更）。

**Local fixture verify:** `npm run verify:gosaki-youtube-public-multi` → **35 PASS**（1/2/3 件 HTML smoke · unpublished filter · mapper · Admin add source · live SoT 1 件維持）。

**Admin dirty verify:** `verify-gosaki-youtube-multi-dirty-state.mjs` → **PASS**（add / reorder / published / Save not-armed）。

### 11.3 P1 / P2 / P3（更新）

| ID | Sev | Item | Notes |
| --- | --- | --- | --- |
| — | P1 | **なし（local）** | multi-add Save 未ライブは client-share ブロッカーにしない（現状 1 件運用） |
| CR-P2-ABOUT-MOBILE | P2 | About SP photo/text order | **local fixed** · staging 反映待ち |
| CR-P2-1 | P2 | freshness HEAD stale | docs/実装差の誤読リスク（継続） |
| CR-P2-2 | P2 | YouTube `write-backend=contents` | dual-path 残存 · Contents 退役は並行可 |
| CR-P2-YT-MULTI-SAVE | P2 | 2 件目の **永続 Save** 未ライブ | 最小実装範囲: armed G-11c7 Contents `items[]` **または** Supabase path + INSERT · **別承認** · 本 audit では拡張しない |
| CR-P3-1 | P3 | orphan CSS in package | 継続 |
| CR-P3-2 | P3 | Claude NB items | 継続 |
| CR-P3-YT-SEED | P3 | seed / live JSON が 1 件のまま | multi 運用開始時に seed/JSON 追加 |

### 11.4 client-share 判定

```txt
CLIENT_SHARE_READY: false
reason: About mobile CSS not yet on staging package; human browser QA incomplete;
        YouTube multi public capability verified locally but live SoT remains 1 item (OK for share if 1-item is intended)
```

**共有可能になる条件（最小）:**

1. About mobile CSS を含む package 再生成 + FileZilla + 375px About 目視 PASS
2. §5 最小人間ブラウザ QA（pass-1）PASS
3. YouTube は **現状 1 件のまま共有可**（multi は能力ゲート PASS · 2 件運用は別フェーズ）

### 11.5 staging で必要な追加 QA

| QA | When |
| --- | --- |
| About `/about/` @375px: title → photo → text | After package+FTP of this CSS |
| About desktop unchanged | Same upload |
| Home YouTube 1 件見た目維持 | Same or current package |
| Admin YouTube Save disabled | Human QA（pass-1） |
| 2〜3 件 public on staging | **Not required for share** unless operator seeds/publishes multi |

### 11.6 package / FTP が必要になる条件

| Condition | Need package+FTP? |
| --- | --- |
| About mobile order を staging に反映 | **YES**（CSS 変更） |
| YouTube multi fixture のみ（repo local） | **NO** |
| live SoT を 2〜3 件に増やす | **YES**（JSON/build-read 反映）+ 別承認 |
| docs / verifier のみ | **NO** |

### 11.7 この follow-up の変更ファイル

- `scripts/lib/site-specific-overrides/gosaki-piano-overrides.mjs` — About mobile order
- `scripts/lib/gosaki-youtube-embed-utils.mjs` — multi resolve + HTML smoke helper
- `scripts/verify-gosaki-youtube-public-multi-item.mjs` + fixtures `fixtures/gosaki-youtube-public-multi/*`
- `scripts/verify-url-to-staging-pipeline.mjs` — About order assert
- `package.json` — `verify:gosaki-youtube-public-multi`
- 本 audit doc + AI context 3

### 11.8 Gates（follow-up）

```txt
ABOUT_MOBILE_TITLE_PHOTO_TEXT_ORDER_LOCAL_FIXED: true
YOUTUBE_MULTI_ITEM_CAPABILITY_GATE_VERIFIED_LOCAL: true
YOUTUBE_LIVE_SOT_ITEM_COUNT: 1
YOUTUBE_MULTI_SAVE_LIVE: false
CLIENT_SHARE_READY: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
DB_WRITE: false
SAVE_ARM_CHANGED: false
readyForAboutMobileStagingPackageAfterCommit: true
```
