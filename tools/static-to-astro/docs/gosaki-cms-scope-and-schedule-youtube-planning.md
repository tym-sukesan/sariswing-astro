# Gosaki CMS scope and Schedule / YouTube planning (G-9a)

**Phase:** `G-9a-gosaki-cms-scope-and-schedule-youtube-planning`  
**Date:** 2026-06-16  
**Prior commit:** `77b57b8` — Finalize G-8g gosaki staging preview fixes  
**Status:** planning only — no implementation, no DB write, no FTP, no `/admin` changes

---

## 1. Purpose

Gosaki staging preview（静的 Wix 由来 HTML + manual upload）が client preview ready になった。次は **Sariswing と同様の CMS 運用**へ移行するための **最小 MVP スコープ**を固定する。

本フェーズは **planning / docs / AI context のみ**。実装・SQL 実行・FTP・workflow_dispatch は行わない。

---

## 2. Current staging preview state (post G-8g)

| Area | State |
| --- | --- |
| **Staging URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| **Latest commit** | `77b57b8` |
| **Deploy** | Manual upload package only (`output/manual-upload/gosaki-piano/`, gitignored) |
| **FTP auto deploy** | Disabled — not resumed by this phase |
| **DB / Supabase** | Untouched in G-7/G-8 staging preview work |
| **Production** | Untouched |
| **Client preview** | `readyForGosakiClientPreview: true` (operator visual QA passed G-8g2〜G-8g8) |

### Completed static preview capabilities

```txt
URL crawl → Astro conversion → static-public → manual upload package
PC/SP visual polish (G-8f〜G-8g8)
Schedule nav restored (G-8g2) — hub link /schedule/
/schedule/ hub generated with deployBase month links (G-8g3)
Month pages /YYYY-MM/ — Wix repeater body visible (G-8g4)
Footer SNS centered (G-8g6/G-8g7)
Discography spacing + subheading style (G-8g5/G-8g8)
About Bands / Projects — static JSON injection (G-8a)
```

### Current schedule data flow (static)

```txt
fixtures/gosaki-piano/2026-XX.html (live crawl, gitignored)
  → convert-static-to-astro.mjs
  → src/pages/2026-XX/index.astro (Wix HTML fragment + gosaki-schedule-month CSS)
  → schedule/index.astro (hub from detectScheduleMonthPages + generateScheduleIndexPage)
```

**Not yet data-driven:** month event lists come from frozen Wix HTML, not Supabase.

---

## 3. CMS MVP scope (priority order)

| Priority | Module | MVP goal | Phase 1 (read) | Phase 2 (write) | Phase 3+ |
| --- | --- | --- | --- | --- | --- |
| **1** | Schedule CMS | 本人がライブ情報を追加・編集・公開 | Supabase read + static fallback | Staging shell write UI | INSERT, image upload, home featured |
| **2** | Top YouTube embed CMS | トップに YouTube を CMS 反映 | Supabase read + static fallback | Staging shell URL input UI | Multiple embeds, playlist |
| **3** | About Bands / Projects | バンド紹介の更新 | **Static JSON 継続** | Defer | CMS + Storage images |

**Out of MVP (later):** News, Discography CMS, Contact/HubSpot, Link page CMS, Publish/FTP from Gosaki admin, production `/admin` connection.

---

## 4. Schedule CMS plan

### 4.1 Goal

```txt
Gosaki 本人がライブ情報を追加・編集・公開できる
/schedule/ hub と /YYYY-MM/ 月別ページへ反映
既存 gosaki ルート規約を維持（Sariswing の /schedule/2026-06/ とは別）
```

### 4.2 Wix 由来 HTML から抽出できる項目

Live crawl fixture（`2026-03.html` … `2026-07.html`）の `fluid-columns-repeater` 各 item から、目視・DOM 解析で以下が取得可能:

| Field | Wix DOM パターン | 備考 |
| --- | --- | --- |
| **date** | 先頭 `h1` / 日付行 `2026.07.03 (Fri)` | `parseScheduleDateText()` で ISO 化可能 |
| **title** | サブタイトル行（`＜…＞` 等） | 明示 title が無い場合 subtitle を title に |
| **venue** | `会場：…` | |
| **open_time / start_time** | `OPEN 18:00` / `START 19:30` または `開場`/`開演` | Gosaki は OPEN/START 表記が多い — parser 拡張要 |
| **price** | `料金：…` / `CHARGE …` | |
| **description** | `出演：…`, Special Guest, その他メタ行 | 複数行を `\n` 結合 |
| **image_url** | フライヤー img（あれば） | Wix CDN URL — Storage 移行は後フェーズ |
| **month** | ファイル名 `2026-07.html` | `YYYY-MM` |
| **legacy_id** | 生成 | `schedule-2026-07-001` 形式（既存 seed extractor 規約） |

**Gap:** 現行 `schedule-seed-extractor.mjs` は **manual fixture の `.schedule-card` マークアップ専用**。Wix repeater（`wixui-repeater__item`）用パーサーは **G-9b で追加計画**が必要。

### 4.3 既存 Sariswing / Musician CMS Kit schema 流用

**Staging project `static-to-astro-cms-staging` の `public.schedules` は G-6-e1 監査済み — MVP 互換:**

```txt
id, legacy_id, date, year, month, title, venue,
open_time, start_time, price, description,
image_url, home_image_url, source_file, source_route,
show_on_home, home_order, published, sort_order,
created_at, updated_at
```

| Aspect | Sariswing 本番 | Staging (Kit) | Gosaki 方針 |
| --- | --- | --- | --- |
| Published flag | `is_published` + `deleted_at` | `published` | **Staging schema に合わせる** |
| Month route | `/schedule/2026-06/` | N/A (Sariswing data) | **`/2026-06/`**（gosaki 既存） |
| Hub route | `/schedule/` | 同上 | **`/schedule/`**（G-8g3 で生成済み） |
| `schedule_months` | derived | read-only | **書き込み禁止**（G-6 方針継続） |
| `venues` table | Sariswing 本番あり | staging 要確認 | Gosaki MVP は **venue テキストのみ**（venue_id 不要） |

**Schema adapter:** `musician-basic-supabase-v1`（`cms-schema-adapters.md`）— `legacy_id` = `schedule-YYYY-MM-NNN` は gosaki seed と一致。

### 4.4 Multi-site gap — `site_slug`

現行 `public.schedules` / `instagram_posts` に **`site_slug` カラムは無い**（Sariswing 単一サイト前提）。

**G-9b 推奨（migration 計画のみ、G-9a では実行しない）:**

```sql
-- Planning proposal — NOT executed in G-9a
alter table public.schedules add column if not exists site_slug text;
create index if not exists schedules_site_slug_date_idx on public.schedules (site_slug, date);
-- unique legacy_id remains global OR migrate to (site_slug, legacy_id)
```

| Approach | Pros | Cons |
| --- | --- | --- |
| **A. Add `site_slug`** (推奨) | Kit 一般化、RLS で site 分離可能 | Migration + RLS 更新が必要 |
| **B. legacy_id prefix only** | Migration 最小 | クエリ・RLS が脆い、本番 Sariswing と混在リスク |
| **C. Separate DB project** | 完全分離 | 運用コスト増、Kit 一般化と逆行 |

**Gosaki データ:** `site_slug = 'gosaki-piano'` を staging に追加。Sariswing 本番データとは **同一 staging project 内で site_slug フィルタ**（本番 project には触れない）。

### 4.5 Hub と month pages の生成方針

#### Phase 1 — Read from Supabase（static fallback 保持）

```txt
Build time (Astro SSG):
  1. Try supabase.from('schedules').select(...).eq('site_slug', 'gosaki-piano').eq('published', true)
  2. On error / empty / no env → fallback to static Wix HTML pages (current behavior)
  3. Hub: derive month list from schedule dates (getPublishedMonthsFromSchedules pattern)
  4. Month page: /YYYY-MM/index.astro — dynamic route or getStaticPaths from Supabase months
```

**Hub markup:** 既存 `.gosaki-schedule-hub` / `.gosaki-schedule-month-link` を維持（G-8g3 CSS 流用）。

**Month list markup:** 新規 `GosakiScheduleList.astro`（または `ScheduleList.astro` の gosaki variant）:

- データ: Supabase rows
- 見た目: G-8g4 `.gosaki-schedule-event-card` クラス（Wix HTML 置換後と同じ CSS）
- `withBase()` で deployBase 対応

#### Route convention（固定）

| Page | Gosaki route | Sariswing route |
| --- | --- | --- |
| Hub | `/schedule/` | `/schedule/` |
| Month | `/2026-07/` | `/schedule/2026-07/` |

`schedule-pages.mjs` の `LIVE_CRAWL_MONTH_FILENAME` / `isScheduleSectionPath()` はこの規約を既にサポート。

#### `schedule_months` テーブル

- **MVP:** `schedules.date` から hub 月一覧を導出（Sariswing `schedule/index.astro` と同型）
- **`schedule_months`:** seed 可能だが **CMS からは書かない**。将来キャッシュ用。
- Seed: `scheduleMonthsFromDetected()` または Supabase 集計 — G-9b で seed JSON / SQL テンプレート化

### 4.6 Supabase seed 方針

```txt
1. G-9b: Wix repeater extractor 実装 → schedules.json + schedule-months.json
2. G-9c: seed SQL 生成（INSERT only, site_slug = gosaki-piano）— operator 手動 SQL Editor 実行
3. 重複防止: legacy_id UNIQUE（schedule-2026-07-001 …）
4. image_url: 初期は Wix CDN URL のまま可（human review 後に Storage 移行 — G-4 パターン参照）
5. PoC 行と混在しないよう legacy_id プレフィックス規約を文書化
```

**Seed 実行者:** 戸山（operator）が Supabase SQL Editor で **staging project のみ**手動実行。Cursor / CI は SQL を実行しない。

### 4.7 Staging DB での安全な検証手順（将来フェーズ）

```txt
1. プロジェクト確認: static-to-astro-cms-staging のみ
2. SELECT で seed 結果確認（published 件数、月別件数）
3. Generated Astro build で readSource: supabase 確認
4. staging shell で Schedule read UI（loadSchedulesForDryRunUi + site_slug filter）
5. Write: PUBLIC_ADMIN_WRITE_DRY_RUN=true デフォルト
6. Non-dry-run: 新 approval ID + 手動確認（G-6 パターン）
7. schedule_months: SELECT only — 書き込み禁止
8. rollback SQL をフェーズ doc に記録
```

### 4.8 流用する G-6 Schedule write 資産

| Asset | Reuse for Gosaki |
| --- | --- |
| `staging-schedule-read.ts` | Yes — extend with `site_slug` filter |
| `schedule-write-adapter.ts` + guards | Yes — same allowlist |
| `schedule-general-update-trigger.ts` | Yes — optimistic lock + `updated_at` |
| `schedules_set_updated_at` trigger (G-6-f8) | Yes — already on staging |
| Dry-run adapters | Yes — default path |
| Approval ID slices (G-6-g1/g2) | Pattern only — **new Gosaki-specific IDs** |
| Hidden G-6-e5 / G-6-f6 PoC triggers | Do not reuse — keep disarmed |
| Staging shell route | `/__admin-staging-shell/musician-basic/` only |

**Gosaki 専用に分けるもの:**

- Public site components（`GosakiScheduleList`, hub generator, route `/YYYY-MM/`）
- Seed extractor（Wix repeater parser）
- `site_slug` filter on all queries
- Write approval IDs（例: `G-9f-gosaki-schedule-title-slice`）
- Env gate: `PUBLIC_ADMIN_SITE_SLUG=gosaki-piano`（提案）

---

## 5. Top YouTube embed CMS plan

### 5.1 Goal

```txt
CMS で YouTube URL を入力
→ embed URL に正規化
→ トップページに responsive iframe 表示
（Sariswing Instagram 埋め込み CMS の Gosaki 版）
```

### 5.2 Sariswing Instagram CMS — 流用可否

| Layer | Sariswing implementation | Kit reuse | Gosaki adaptation |
| --- | --- | --- | --- |
| **Public read** | `InstagramFeed.astro` — anon SELECT | Pattern yes | New `YouTubeEmbedSection.astro` |
| **Sort** | `compareInstagramPosts` / `sort_order` | Logic yes | Same compare pattern |
| **Admin UI** | `/admin/instagram` + `instagram-api.ts` | Pattern only | **Staging shell only** — not `/admin` |
| **Admin writes** | Edge `admin-instagram` + **service_role** | **No** for Kit | Authenticated client + RLS（Schedule/Profile パターン） |
| **Storage** | `embed_code` HTML blob | Partial | URL + normalized `embed_url`（HTML 不要） |
| **Table** | `instagram_posts` | Extend vs new table | See §5.3 |

**結論:** UI/UX 思想（一覧・sort_order・published toggle）は流用。**write path は Edge + service_role ではなく、Kit staging write パターン**（anon authenticated + RLS + dry-run）を採用。

### 5.3 Schema 案

**推奨: `site_embeds`（multi-provider, multi-site）**

Instagram 専用テーブルを YouTube 用に複製するより、CMS Kit 一般化に適合。

```sql
-- Planning proposal — NOT executed in G-9a
create table public.site_embeds (
  id uuid primary key default gen_random_uuid(),
  site_slug text not null,
  provider text not null check (provider in ('youtube', 'instagram')),
  title text,
  source_url text not null,
  embed_url text not null,
  published boolean not null default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index site_embeds_site_provider_sort_idx
  on public.site_embeds (site_slug, provider, sort_order);
```

| Field | Purpose |
| --- | --- |
| `site_slug` | `gosaki-piano` |
| `provider` | `youtube`（将来 `instagram` 移行も可） |
| `source_url` | ユーザー入力の生 URL |
| `embed_url` | 正規化済み iframe src |
| `title` | 任意（a11y `iframe title`） |
| `published` | 公開 toggle |
| `sort_order` | 複数時の順序 |

**代替案（非推奨）:**

- `youtube_embeds` only — シンプルだが Instagram 一般化時にテーブル増殖
- `instagram_posts` に `provider` 追加 — Sariswing 本番互換リスク

### 5.4 URL 入力形式と正規化

**Accepted input:**

```txt
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://www.youtube.com/embed/VIDEO_ID
https://www.youtube.com/watch?v=VIDEO_ID&t=120s  (t param optional, strip for embed)
```

**Normalization (MVP):**

```txt
1. Parse video ID (regex / URL parser)
2. embed_url = https://www.youtube-nocookie.com/embed/{VIDEO_ID}
3. Reject: playlist-only URLs, /channel/, /@handle without video ID
4. Store source_url as entered (trimmed)
```

**no-cookie embed:** **Yes** — `youtube-nocookie.com` を MVP デフォルト（GDPR / クッキー軽減）。問題があれば `youtube.com/embed` に fallback 設定を将来追加。

### 5.5 表示仕様

| Topic | MVP decision |
| --- | --- |
| **件数** | **1 件**（`sort_order` 最小の published）。複数は Phase 2+ |
| **位置** | トップページ既存 YouTube iframe 領域（Wix comp — G-9b で fixture から comp-id 特定） |
| **Fallback** | Supabase 失敗時は現行 Wix 静的 iframe を維持 |
| **Responsive** | `aspect-ratio: 16 / 9` wrapper + `width: 100%` iframe |
| **a11y** | `title` 属性 = CMS `title` or default `YouTube video` |

**実装スケッチ（public）:**

```astro
---
const { data } = await supabase
  .from('site_embeds')
  .select('embed_url, title')
  .eq('site_slug', 'gosaki-piano')
  .eq('provider', 'youtube')
  .eq('published', true)
  .order('sort_order')
  .limit(1);
---
<div class="gosaki-youtube-embed">
  <iframe src={embed_url} title={title} loading="lazy" allowfullscreen />
</div>
```

### 5.6 CMS UI 最小構成（staging shell, Phase 2）

```txt
Section: YouTube Embed (gosaki-piano)
- YouTube URL 入力（source_url）
- Title（任意）
- Published toggle
- Sort order（将来複数用 — MVP は 1 件でも field 保持）
- Preview: normalized embed_url 表示
- Save: dry-run default → non-dry-run with approval ID
```

**新規モジュール候補:** `src/lib/admin/staging-write/youtube-embed-*`（Schedule write の slice 構造を踏襲）。

---

## 6. About Bands / Projects CMS plan

### 6.1 Current state (G-8a)

```txt
Data: config/sites/gosaki-piano-band-profiles.json
Component: templates/site-extensions/gosaki-piano/BandProfilesSection.astro
Images: public/images/bands/*.jpg (local static)
Injection: astro-generator convert hook on About page
```

### 6.2 MVP recommendation

| Question | Answer |
| --- | --- |
| 当面 static JSON でよいか | **Yes** — Schedule + YouTube が安定するまで継続 |
| CMS 化 priority | **After Schedule + YouTube write** (Phase 3) |
| Schema 案 | `band_profiles` table or `site_content_blocks` JSON — G-9j で計画 |
| 画像管理 | 初期は `public/` 静的。CMS 化時に Supabase Storage（G-4 パターン） |
| Storage 必須か | No for MVP |

**理由:** 5 バンド分の更新頻度は低く、JSON + git deploy でも運用可能。クライアント preview は既に成立。

---

## 7. Existing assets to reuse (summary)

### Reuse directly

```txt
public.schedules schema (staging) + musician-basic-supabase-v1 adapter
schedule-seed-extractor patterns (legacy_id, months JSON)
schedule-pages.mjs (hub, live-crawl routes)
generateScheduleIndexPage + gosaki-schedule-hub CSS (G-8g3)
path-transform gosaki-schedule-month classes (G-8g4)
src/lib/schedule.ts (groupSchedulesByMonth, getPublishedMonthsFromSchedules)
G-6 staging write stack (read, dry-run, write adapter, optimistic lock, updated_at trigger)
/__admin-staging-shell/musician-basic/ route
InstagramFeed sort/compare pattern → YouTube sort
```

### Reuse pattern only (not copy-paste)

```txt
Sariswing /admin/schedule UI — reference for field labels
Sariswing /admin/instagram — reference for embed list UX
admin-instagram Edge Function — NOT for Kit writes (service_role)
```

### Gosaki-specific (new work)

```txt
Wix repeater schedule extractor
site_slug column + RLS policy design
GosakiScheduleList.astro + Supabase-driven /YYYY-MM/ pages
YouTube embed read/write modules
site_embeds table
PUBLIC_ADMIN_SITE_SLUG=gosaki-piano gates
```

---

## 8. Supabase staging design

### 8.1 Project

| Item | Value |
| --- | --- |
| **Project** | `static-to-astro-cms-staging` only |
| **Production** | Do not touch Sariswing production Supabase |
| **Auth** | Existing Supabase Auth + `admin_users` + `is_admin()` |
| **service_role** | Not used in Kit staging write path |

### 8.2 Data isolation

```txt
site_slug = 'gosaki-piano' for all Gosaki rows
Sariswing Kit test rows: site_slug IS NULL or 'sariswing' (migration で整理)
Public read: RLS — published = true AND site_slug match (or anon broad read + app filter for MVP)
Admin write: authenticated + admin_users (existing pattern)
```

### 8.3 RLS / admin_users

- **MVP read (public site build):** anon SELECT where `published = true` — app 側で `site_slug` フィルタ（RLS に site_slug を入れるのは G-9b migration フェーズ）
- **Admin write:** authenticated UPDATE on `schedules`（GRANT 済み）— INSERT は別フェーズで explicit approval
- **Do not change** RLS/GRANT in G-9a

### 8.4 Seed SQL 作成・実行タイミング

| Step | Phase | Who | Action |
| --- | --- | --- | --- |
| Wix extractor | G-9b | Cursor | Generate `schedules.json` |
| Migration doc (`site_slug`) | G-9b | Cursor | SQL template only |
| Seed SQL generation | G-9c | Cursor | INSERT script from JSON |
| SQL execution | G-9c | **Operator manual** | Supabase SQL Editor |
| Verify SELECT | G-9c | Cursor + operator | Read integration |

---

## 9. Implementation phases (G-9b onward)

| Phase | ID | Scope | DB write | FTP |
| --- | --- | --- | --- | --- |
| **G-9b** | `gosaki-schedule-data-seed-planning` | Wix repeater extractor設計、`site_slug` migration doc、seed JSON 生成 | No | No |
| **G-9c** | `gosaki-schedule-seed-sql-and-read-integration` | Seed SQL template、operator 手動 seed、Astro read + static fallback | Operator manual INSERT only | No |
| **G-9d** | `gosaki-schedule-hub-month-supabase-pages` | Hub + `/YYYY-MM/` を Supabase 駆動に切替（fallback 付き） | No | No |
| **G-9e** | `gosaki-schedule-write-ui-staging-shell` | Schedule write UI（dry-run → slice non-dry-run） | Staging UPDATE only | No |
| **G-9f** | `gosaki-youtube-embed-schema-planning` | `site_embeds` migration doc + RLS 案 | No | No |
| **G-9g** | `gosaki-youtube-embed-read-integration` | Top page YouTube read + fallback | Operator manual INSERT | No |
| **G-9h** | `gosaki-youtube-embed-write-ui` | Staging shell URL input + dry-run write | Staging INSERT/UPDATE | No |
| **G-9i** | `gosaki-bands-projects-cms-planning` | Bands CMS schema + Storage 方針 | No | No |
| **G-9j+** | Publish / INSERT schedules / image upload | Explicit approval each | TBD | Manual upload only until FTP re-approved |

**Recommended immediate next:** `G-9b-gosaki-schedule-data-seed-planning`

---

## 10. Safety rules (G-9 series)

```txt
production / Sariswing 本番: 触らない
Supabase production project: 触らない
service_role: 使わない（Kit staging write）
src/pages/admin: 変更しない（staging shell のみ）
schedule_months: CMS から書かない
INSERT / DELETE: 明示フェーズまで禁止（seed フェーズは operator 手動のみ）
PUBLIC_ADMIN_WRITE_DRY_RUN=true: デフォルト維持
FTP / workflow_dispatch: 禁止（manual upload のみ）
.env / secrets: commit しない
output / generated fixtures: commit しない
Playwright 自動クリック: 禁止
```

---

## 11. Risks

| Risk | Mitigation |
| --- | --- |
| **No `site_slug` on schedules** | G-9b migration 計画を先に固定；暫定 legacy_id prefix は避ける |
| **Wix repeater parse 漏れ** | 手動 review checklist + seed 後に件数 compare（fixture vs DB） |
| **OPEN/START vs 開場/開演** | Parser に両方言語サポート |
| **Route 混同** (`/2026-07/` vs `/schedule/2026-07/`) | Gosaki 専用 path 関数を convert 出力に固定 |
| **Sariswing staging 行との混在** | site_slug + legacy_id 監査 |
| **YouTube URL バリデーション** | 厳格な video ID extract；不正 URL は save 拒否 |
| **Build-time Supabase 依存** | env 無し / error 時は static fallback（preview 継続） |
| **Instagram Edge の service_role 混同** | Gosaki YouTube は Kit write パターンを明記 |
| **FTP 再開と CMS 実装の混同** | CMS commit は FTP apply 承認ではない |

---

## 12. Gates (G-9a)

```txt
gosakiCmsScopeAndScheduleYoutubePlanningComplete: true
readyForG9bGosakiScheduleDataSeedPlanning: true
readyForG9bGosakiYoutubeEmbedCmsPlanning: true
readyForGosakiClientPreview: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
commitDeferredForVisualBatch: false
```

---

## 13. Recommended next phase

```txt
G-9b-gosaki-schedule-data-seed-planning
```

**Deliverables:**

1. Wix `fluid-columns-repeater` schedule extractor implementation
2. `schedules.json` / `schedule-months.json` from `fixtures/gosaki-piano`
3. `site_slug` migration + seed SQL **template** (not executed)
4. Manual review checklist (event count per month)

**Parallel track (after G-9b or G-9f):** `gosaki-youtube-embed-schema-planning` — can start after schedule seed path is clear; no hard dependency on schedule data.

---

## 14. References

- `tools/static-to-astro/docs/gosaki-staging-browser-qa-and-client-preview-readiness.md`
- `tools/static-to-astro/docs/gosaki-schedule-hub-design-and-link-fix.md`
- `tools/static-to-astro/docs/gosaki-schedule-month-content-fix.md`
- `tools/static-to-astro/docs/schedule-cms-generalization-planning.md`
- `tools/static-to-astro/docs/schedule-schema-read-audit-result.md`
- `tools/static-to-astro/docs/cms-schema-adapters.md`
- `tools/static-to-astro/docs/admin-cms-code-inventory.md`
- `tools/static-to-astro/scripts/lib/schedule-seed-extractor.mjs`
- `tools/static-to-astro/scripts/lib/schedule-pages.mjs`
- `src/components/InstagramFeed.astro`
- `src/lib/admin/staging-write/` (Schedule write modules)
