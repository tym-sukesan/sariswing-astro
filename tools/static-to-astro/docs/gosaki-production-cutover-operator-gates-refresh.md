# Gosaki production cutover — operator gates refresh

- **Phase:** `gosaki-production-cutover-operator-gates-refresh`
- **Date:** 2026-08-18
- **Status:** **COMPLETE (read-only docs / operator checklist)**
- **HEAD:** `dcb9e012cd825b7c748ec30f51a4e489f941ef5d` (= `origin/main`)
- **Prior:** `gosaki-launch-critical-path-repo-verification.md`
- **This phase:** update operator-side gates to **current facts** · **no** remote write · **no** FTP · **no** DNS · **no** SQL · **no** Secret · **no** Edge · **no** package regen · **no** commit/push

Operator statement (2026-08-18): Gosaki-piano **Lolipop production server is available and operator can connect.** Do **not** treat 2026-07-15 `HOSTING_READY: false` (uncontracted) as current fact.

`readyForAnyFutureFtpApply: false` remains the **G-7f auto FTP `--apply` stop**. Manual FileZilla upload is the production method. Auto FTP is **not** resumed. Auto-FTP stop ≠ “cannot publish”.

---

## 0. Gates

```txt
phase: gosaki-production-cutover-operator-gates-refresh
GOSAKI_PRODUCTION_CUTOVER_OPERATOR_GATES_REFRESH_COMPLETE: true
HEAD: dcb9e012cd825b7c748ec30f51a4e489f941ef5d
PUBLIC_CUTOVER_CLIENT_CMS_HANDOFF_SEPARATED: true
HOSTING_CONTRACT_UNAVAILABLE_SO_T: STALE
HOSTING_SERVER_AVAILABLE_OPERATOR_STATED: true
HOSTING_DOCUMENT_ROOT_CONFIRMED: false
PRODUCTION_REMOTE_PATH: TBD_G-20i
MANUAL_FILEZILLA_UPLOAD_IS_PRODUCTION_METHOD: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
AUTO_FTP_STOP_DOES_NOT_BLOCK_PUBLIC_CUTOVER: true
PRODUCTION_UPLOAD_READY: false
PRODUCTION_UPLOAD_READY_DECOMPOSED: true
GO_LIVE_READY: false
SCHEDULE_UPDATE_PUBLIC_CUTOVER: NON_BLOCKER
SCHEDULE_UPDATE_CLIENT_CMS_HANDOFF: CONDITIONAL_BLOCKER
OPTION_A_STAGING_BUILD_TIME_SOT: current_profile
VSBVNDWU_NO_APPLY: true
OPERATOR_READ_ONLY_CHECKLIST_READY: true
REMOTE_WRITE_EXECUTED: false
FTP_UPLOAD_EXECUTED: false
DNS_CHANGE_EXECUTED: false
DB_WRITE_EXECUTED: false
PACKAGE_REGEN_EXECUTED: false
COMMIT_EXECUTED: false
RECOMMENDED_NEXT_PRIMARY: gosaki-production-package-preflight-at-current-head
OPERATOR_PARALLEL: execute OPERATOR_READ_ONLY_CHECKLIST
```

---

## 1. PUBLIC_CUTOVER vs CLIENT_CMS_HANDOFF

| Gate | Meaning | In scope |
| --- | --- | --- |
| **PUBLIC_CUTOVER** | Wix → Astro **static** site on `https://www.gosaki-piano.com/` | hosting path, package, FileZilla overwrite (no delete), DNS/SSL/MX, SEO, Contact |
| **CLIENT_CMS_HANDOFF** | 本人が production 相当 Admin から安全に更新 | hosted Admin, authz, Supabase SoT for **runtime** writes, Save→reflect |

Do not mix. First public launch in repo (G-20f/G-20i2) is **operator-driven CMS** after static cutover. Hosted Admin is deferred.

### 1.1 Schedule UPDATE (checked against repo)

Provisional classification **stands**. No contradiction.

```txt
Schedule UPDATE:
PUBLIC_CUTOVER = NON_BLOCKER
CLIENT_CMS_HANDOFF = CONDITIONAL_BLOCKER
```

| Evidence | Why |
| --- | --- |
| Production package **excludes** `/admin/` | Client cannot reach UPDATE UI on the public host |
| Staging shell is `DEV && ENABLE_ADMIN_STAGING_SHELL` | Not in production build |
| G-20f: “Production hosted admin **deferred** — operator-driven CMS updates for launch” | Cutover design does not require owner UPDATE |
| UPDATE still `is_admin` / `schedules_admin_all` | Blocks **本人** edit of existing rows, not static HTML go-live |

CREATE owner path is staging-proven and also **not** a PUBLIC_CUTOVER requirement.

---

## 2. STALE_GATES — 2026-07 hosting-unready STOP

Classification of the **July compound gates**, not “delete the flags”.

| Gate / claim (2026-07) | Class | Now |
| --- | --- | --- |
| `HOSTING_READY: false` because **replacement hosting 未契約** | **STALE** | Operator: client Lolipop **本番サーバー利用可・接続可** (2026-08-18) |
| `HOSTING_READY: false` as “document root / DNS / SSL all unknown” | **NEEDS_OPERATOR_CHECK** | Contract is not the remaining question; **path / DNS / SSL / MX** still are |
| `futureReplacementHosting: not_contracted` (G-20u38d) | **STALE** | Do not quote as current fact |
| `productionFtpRemotePath: not_available` because no host | **STALE** (reason) | Path string in repo is still `TBD_G-20i` → **NEEDS_OPERATOR_CHECK** |
| `TBD_G-20i` document root placeholder | **NEEDS_OPERATOR_CHECK** | Repo has never recorded a confirmed web root |
| `GO_LIVE_READY: false` | **STILL_VALID** | DNS still on Wix until cutover; SSL/MX unverified |
| `readyForAnyFutureFtpApply: false` | **STILL_VALID** | Auto `--apply` stop only. **Does not** mean FileZilla 不可 |
| Treating auto-FTP stop as PUBLIC_CUTOVER blocker | **STALE** (misread) | Manual FileZilla is the intended method |
| `PRODUCTION_UPLOAD_READY: false` (compound) | **STILL_VALID** as overall flag — **see §3 decomposition** | Not because hosting is uncontracted |
| G-20j STOP: remote path screenshot missing | **NEEDS_OPERATOR_CHECK** | Still required before first upload |
| G-20j STOP: SSL / DNS / MX | **NEEDS_OPERATOR_CHECK** | These are **go-live**, not “hosting contract” |
| G-20j STOP: client sign-off | **NEEDS_OPERATOR_CHECK** | Staging `CLIENT_SHARE_READY: true` ≠ production cutover OK |
| On-disk production package at `1c1fb97` (2026-07-15) | **STALE** artifact | Do not upload. Regen at current HEAD in a later phase |
| “Do not request remote path until hosting exists” (G-20u38d) | **STALE** | Host exists — **now request path confirmation** |

---

## 3. `PRODUCTION_UPLOAD_READY: false` — decomposed

The July flag mixed five different things. Split:

| Reason | Still a reason? | Class | Notes |
| --- | --- | --- | --- |
| Hosting 未契約 | **no** | **STALE** | Operator: server available |
| Auto FTP `--apply` 停止 | **no** (for this flag) | **STALE as upload blocker** | FileZilla manual is allowed; auto remains off |
| Document root 不明 (`TBD_G-20i`) | **yes** | **OPERATOR_GATE** | Blocks **first FileZilla target**, not the existence of hosting |
| Fresh package at current HEAD なし | **yes** | **CONFIRMED_BLOCKER** (repo) | Last prod package `1c1fb97`; HEAD `dcb9e012`. Do not upload stale tree |
| DNS / SSL / MX 未確認 | **yes for go-live** | **OPERATOR_GATE** | G-20i: FileZilla upload may be **preparatory** while Wix still serves DNS. Do not conflate with `GO_LIVE_READY` |
| Client sign-off | **yes for go-live** | **OPERATOR_GATE** | Optional to delay until after hidden Lolipop preview |

**Working definitions (this refresh):**

```txt
HOSTING_SERVER_AVAILABLE: true          # operator 2026-08-18
MANUAL_UPLOAD_TARGET_CONFIRMED: false   # needs FileZilla screenshot
PRODUCTION_PACKAGE_FRESH_AT_HEAD: false
PRODUCTION_UPLOAD_READY: false          # target + fresh package both required
GO_LIVE_READY: false                    # upload success + DNS/SSL/MX + verify
READY_FOR_ANY_FUTURE_FTP_APPLY: false   # auto only; not a cutover blocker
```

Remote delete is **not** required to publish: overwrite/add files only (`public-dist/` **contents**). `mirror --delete` remains forbidden.

---

## 4. PRODUCTION_HOSTING_KNOWN (repo vs operator)

### 4.1 Repo-only (do not guess paths)

| Item | Known |
| --- | --- |
| Public URL (target) | `https://www.gosaki-piano.com/` |
| Live today | Wix (until DNS moves) |
| Staging (operator Lolipop) | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` · remote `/cms-kit-staging/gosaki-piano/` |
| Production profile `remotePath` | `TBD_G-20i` |
| Upload method | FileZilla / Lolipop GUI · contents of `public-dist/` · **no** folder named `public-dist` |
| Admin in production package | **excluded** |
| Auto FTP | suspended |
| `.ftpaccess` | never edit/delete |
| G-7f lesson | never upload to FTP login `/` when other sites live there |
| Backup assumption | G-7f: Lolipop account backup was **not** available then — **do not assume** it exists now |
| Rollback until DNS | Wix stays live; Lolipop files are not public |
| Rollback after DNS | revert DNS to Wix first; do **not** remote-delete to “undo” |

### 4.2 Operator must confirm (not in repo)

Document root, FTP cwd vs web root, existing files, `.ftpaccess` presence, backup product, MX, SSL panel, DNS owner, whether `www` vhost is attached.

Candidate path **examples only** (verify; do not use as SoT): `/public_html/`, `/www.gosaki-piano.com/`, domain-specific folder. **Never** operator staging `/cms-kit-staging/gosaki-piano/` as production root.

---

## 5. Production Admin / Supabase (facts only — no apply)

Reconfirmed:

| Fact | Evidence |
| --- | --- |
| Production hosted Admin **does not exist** | No production Admin route; `/admin` (Sariswing) forbidden |
| Staging shell is DEV-only | `import.meta.env.DEV && ENABLE_ADMIN_STAGING_SHELL=true` |
| Production package excludes Admin | `includeReadOnlyAdmin: false` · G-20i3 Option B |
| Public production build SoT | Profile `supabaseProjectRef: kmjqppxjdnwwrtaeqjta` (**build-time**). Public HTML must **not** embed anon keys (P0). Data is baked at generate time |

Do **not** migrate into `vsbvndwuajjhnzpohghh`.

### 5.1 Options (compare only)

```txt
A. staging Supabase を当面 build-time SoT
B. Gosaki 専用 production Supabase
C. その他 repo 上の想定 = G-20f「Aで公開し、後でBへ」
```

Forbidden extra: Sariswing production project as Gosaki SoT.

| | A | B | C (A then B) |
| --- | --- | --- | --- |
| **PUBLIC_CUTOVER** | **Compatible now.** Profile already A. Fastest static bake. | Extra project + seed before first bake — **slows cutover** unless required | Same as A for day-1 |
| **CLIENT_CMS_HANDOFF** | Writes stay on Kit staging; env name is “staging”; shared with Kit work | Cleaner isolation + client ownership; needs Auth, RLS, Edge, secrets on **new** ref | Handoff can wait until B |
| **環境分離** | Weak (dev + live content same project, `site_slug` only) | Strong | Planned split |
| **追加作業** | Content hygiene on staging before bake; keep public pages key-free | New project, schema/RLS/RPC/Edge, owner membership, rebuild | Doc a freeze + later export |

**This phase does not choose.** Default **profile** is still A. Choosing B is a CLIENT_CMS_HANDOFF / isolation decision, not a PUBLIC_CUTOVER prerequisite.

---

## 6. PUBLIC_CUTOVER reclassification (hosting available)

| Item | Class |
| --- | --- |
| Hosting 未契約 | **NON_BLOCKER** (STALE) |
| Auto FTP stop | **NON_BLOCKER** for cutover (manual FileZilla) |
| Schedule UPDATE owner authz | **NON_BLOCKER** |
| Hosted Admin | **NON_BLOCKER** |
| Dedicated production Supabase | **NON_BLOCKER** (A is enough for bake) |
| Document root / FTP cwd vs web root | **OPERATOR_GATE** |
| Existing remote files / overwrite risk | **OPERATOR_GATE** |
| Backup before upload | **OPERATOR_GATE** |
| DNS / SSL / MX | **OPERATOR_GATE** (`GO_LIVE`) |
| Client production sign-off | **OPERATOR_GATE** |
| HubSpot production domain allowlist | **OPERATOR_GATE** / **CONDITIONAL_BLOCKER** (form at cutover) |
| Fresh production package at HEAD | **CONFIRMED_BLOCKER** |
| Staging URL / noindex / deployBase spec | **NON_BLOCKER** as *spec* (locked in profile); **CONFIRMED** that **current on-disk prod package is stale** and must not be used |
| G-6 PoC row `schedule-2026-07-010` (`published: true`, PoC title/venue/times/description) last recorded on staging | **CONFIRMED_BLOCKER** for any bake that reads staging SoT — live SELECT not re-run this phase; do not bake until unpublished or restored |
| `.ftpaccess` / `mirror --delete` | **NON_BLOCKER** if operator follows checklist (must not touch/delete) |

`CLIENT_CMS_HANDOFF` (not PUBLIC_CUTOVER): hosted Admin missing = **CONFIRMED**; Schedule UPDATE = **CONDITIONAL_BLOCKER**; Discography live-read wiring = deferred; Contents vs Supabase default = later.

---

## 7. What to place on the server (when upload is later approved)

**Local source (after a future regen — not this phase):**

```txt
tools/static-to-astro/output/manual-upload/gosaki-piano-production/public-dist/
```

Upload **contents**, preserving directories:

- `index.html`, `about/`, `contact/`, `discography/`, `schedule/`, `link/`
- month pages (`schedule/YYYY-MM/` and legacy `YYYY-MM/` stubs)
- `_astro/` (required on first full publish)
- `assets/about/bands/*.jpg`
- `robots.txt`, `sitemap-index.xml`, `sitemap-0.xml`

**Do not upload:** `admin/`, `MANIFEST.json`, README/CHECKLIST/zip, a folder named `public-dist`.

**Do not delete** remote extras. Overwrite same paths only.

Historical 26-file list (G-20i3, 2026-07-01) is **illustrative**. File hashes (`index.YcHrHZH4.css` etc.) **will change** after regen.

---

## 8. OPERATOR_READ_ONLY_CHECKLIST

**目的:** ロリポップ管理画面と FileZilla で **見るだけ**。アップロード・削除・DNS変更・`.ftpaccess` 編集はしない。

**返してほしいもの:** 各項目のパス / 有無 / スクリーンショットファイル名（チャット添付可）。秘密（FTPパスワード）は repo に書かない。

### やってはいけないこと（全項目共通）

- ファイルのアップロード / 上書き / 削除
- `mirror` / 同期 / リモート削除
- `.ftpaccess` の編集・削除
- DNS / SSL の「発行・変更」ボタン
- 本番 `www.gosaki-piano.com` の Wix 側設定変更
- Cursor に FTP 実行を依頼すること

---

**1. 契約・ドメイン（ロリポップ管理画面）**
見る: 契約情報 / 独自ドメイン一覧。
確認: 後藤沙紀さんの本番契約であること。`gosaki-piano.com` / `www.gosaki-piano.com` がこの契約に付いているか。オペレーター検証用 `yskcreate.weblike.jp` と **別**か。
返す: ドメインが付いているか yes/no。付いていないなら「未設定」。

**2. 公開ディレクトリ表示（ロリポップ）**
見る: 独自ドメイン → 公開フォルダ / ドキュメントルート。
確認: `www.gosaki-piano.com` の公開フォルダの **正確なパス文字列**。
返す: パス全文（例: `public_html/gosaki-piano.com/`）。推測で埋めない。

**3. FileZilla 接続（read-only）**
見る: 接続後のリモート左/右ペイン。
確認: ログイン直後のカレントディレクトリ。
返す: 接続直後の remote path（例: `/`）。パスワードは返さない。

**4. ログイン root ≠ 公開ディレクトリ**
見る: FileZilla で上の階層へ移動した一覧。
確認: `/` に他サイト（`cms-kit-staging`、他クライアント）が見えるか。見えるなら **その `/` には絶対に置かない**。
返す: 「他サイトが root に見える / 見えない」+ 公開フォルダへ cd したパス。

**5. document root の中身**
見る: 項目2のフォルダを開いた一覧。
確認: `index.html`、`about/`、Wix由来ファイル、空、のどれか。
返す: 主要ファイル/フォルダ名のリスト（20個程度まで）。変更しない。

**6. 現行サイトの有無**
確認: そのフォルダが **今** `www.gosaki-piano.com` を配信しているか、まだ DNS が Wix のまま空/別物か。ブラウザで www が Wix なら、Lolipop 側は「準備用」の可能性。
返す: 「www はまだ Wix」または「すでにこのフォルダが www を出している」。

**7. `.ftpaccess`**
見る: document root と FTP ログイン root。
確認: ファイルがあるか。
返す: 有/無。中身は読んでも **編集・削除しない**。

**8. ロリポップバックアップ機能**
見る: サーバー管理のバックアップ / 自動バックアップ。
確認: 有効か、直近取得日、リストアできるか。
返す: 有/無、最終バックアップ日（分かる範囲）。G-7f 時は「無い」だった。今回有無を更新する。

**9. アップロード前に取るローカル backup**
確認: FileZilla で document root を **ローカルへダウンロード**できること（実行は許可後の別作業でも、手順の可否だけ今確認してよい）。
返す: 「ダウンロード可能そう」/「フォルダが巨大で要相談」。**今はダウンロードしなくてよい**（容量・誤操作防止）。実行するなら別承認。

**10. rollback の理解**
確認: DNS 切替 **前**は Wix が本番。切替 **後**の第一ロールバックは **DNS を Wix に戻す**。リモート削除で戻さない。
返す: この理解でよいか yes。

**11. upload target**
確認: 項目2のパス = FileZilla で開く先。置くのは `public-dist` フォルダではなく `index.html` がルートに来る配置。
返す: 「upload target = （パス）」の一文。

**12. 削除なしで公開できるか**
確認: 既存ファイルがあっても、同じパスを上書きし、余分な旧ファイルは残してよい（今回削除しない）。公開に **remote delete は不要**。
返す: 既存と衝突しそうな名前（`index.html` 等）があるか。

**13. SSL（見るだけ）**
見る: ロリポップ SSL / 独自SSL。
確認: `www.gosaki-piano.com` 用の設定が「未設定 / 発行済 / Wix側」のどれか。**発行ボタンは押さない。**
返す: 状態一文。

**14. DNS 管理者**
見る: ドメインのネームサーバー（レジストラ / Wix / ロリポップ）。
確認: 誰が A/CNAME を切るか。**レコードは変えない。**
返す: 管理画面の場所（Wix / お名前.com 等）と、www の現在の向き先が分かる範囲。

**15. MX / メール**
見る: 同じ DNS の MX レコード（レジストラまたは Wix）。
確認: `@gosaki-piano.com` のメールを使っているか。使っているなら DNS 切替で MX を触らない計画が必要。
返す: メール利用 yes/no。MX のホスト名（分かる範囲）。値の改変はしない。

**16. staging と本番の取り違え**
確認: FileZilla のサイトマネージャが **本番契約**であること。オペレーター staging（`/cms-kit-staging/gosaki-piano/`）を開いていないこと。
返す: 「本番契約に接続した」と断言できるか。

**17. スクリーンショット**
取る: (a) ロリポップの公開フォルダ設定 (b) FileZilla で document root を開いた一覧 (c) 接続直後の remote path。
返す: 3枚。パス文字列が読めること。

---

## 9. REVISED_CRITICAL_PATH (provisional)

Hosting contract is **not** on the path. Auto FTP is **not** on the path.

| Step | Who | Grain |
| --- | --- | --- |
| OPERATOR_READ_ONLY_CHECKLIST | operator | **不明**（接続済みなら **<数時間**） |
| PoC schedule row hygiene (unpublished or restore) before bake | operator + later approved SELECT/write | **<数時間** after approval |
| Production package preflight / regen at HEAD | Cursor/operator | **0.5日程度** |
| FileZilla first upload (no delete; DNS may still be Wix) | operator after explicit 承認 | **0.5日程度** after target confirmed |
| HTTP verify on Lolipop (by IP/hosts or after DNS) | operator | **<数時間** |
| DNS / SSL / MX cutover | operator + client | **不明** |
| CLIENT_CMS_HANDOFF (hosted Admin, Schedule UPDATE, …) | later | **不明** · not on PUBLIC_CUTOVER |

Do **not** quote a calendar “N days to go live”. DNS/MX owner and HubSpot allowlist are still unknown.

---

## 10. NEXT_PRIMARY

```txt
gosaki-production-package-preflight-at-current-head
```

**Why:** Hosting availability is no longer the question. Operator can run §8 in parallel. Repo-side PUBLIC_CUTOVER **CONFIRMED_BLOCKER** is the **stale/missing production package** (and PoC bake risk). Preflight is local/read-only: profile, SEO gates, freshness, **do not bake** until PoC row is handled. **No upload.**

Operator parallel: execute **OPERATOR_READ_ONLY_CHECKLIST** and return screenshots/paths.

Not next: `schedule-update-site-writer-rls-planning` (CLIENT_CMS_HANDOFF). Not: auto FTP resume.

---

## 11. Explicit non-actions

- No FileZilla / lftp / `--apply` / delete / DNS / SSL click
- No SQL / Secret / Edge / package regen / `.env.local`
- No Discography / Schedule write re-proof
- No commit / push
