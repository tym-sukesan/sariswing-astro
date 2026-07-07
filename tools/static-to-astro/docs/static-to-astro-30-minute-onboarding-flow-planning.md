# G-23a — Static-to-Astro CMS 30-minute onboarding flow planning

**Phase:** `G-23a-static-to-astro-30-minute-onboarding-flow-planning`  
**Status:** **complete** — strategic planning only; **no implementation / Save / DB write / package regen / FTP / deploy**  
**Date:** 2026-07-08  
**Base commit:** `5fa7fdb` (G-22j2 Schedule CMS P0 release note committed)  
**Prior:** [gosaki-schedule-cms-p0-release-note.md](./gosaki-schedule-cms-p0-release-note.md) · [url-to-staging-automation-sprint-planning.md](./url-to-staging-automation-sprint-planning.md) (G-7)

| Check | Status |
| --- | --- |
| 30-minute flow designed | **yes** |
| Gosaki safety gates incorporated | **yes** |
| CMS presets defined | **yes** |
| Implementation / deploy | **not executed** |

---

## Gates

```txt
staticToAstro30MinuteOnboardingFlowPlanningComplete: true
phase: G-23a-static-to-astro-30-minute-onboarding-flow-planning
readyForG23bOnboardingConfigSchema: false
readyForG23cSampleSiteDryRun: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorSqlMutationExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
deployExecuted: false
workflowDispatchExecuted: false
productionDeployExecuted: false
rollbackSqlExecuted: false
rlsGrantChangeExecuted: false
serviceRoleUsed: false
```

**Supabase target:** staging projects only (`kmjqppxjdnwwrtaeqjta` for Kit development). **Never** `vsbvndwuajjhnzpohghh`.

**G-23a = planning only.** No implementation, no DB write, no package regen, no FTP.

---

## 1. Purpose — 30-minute onboarding flow

### 1.1 Product vision

**最終目標:** 既存サイト URL を入力するだけで、軽量な Astro 静的サイトと、専門知識なしで更新できる CMS を**短時間**で立ち上げられる仕組みを作る。

| Principle | Meaning |
| --- | --- |
| **80点の初期版** | 完成品ではなく、公開前レビュー可能な初期版を短時間で生成 |
| **標準テンプレート** | 顧客別の個別対応を減らし、プリセットで高速化 |
| **人間が仕上げる** | デザイン調整・QA・公開判断はオペレーター/顧客が行う |
| **Gosaki 知見の標準化** | Schedule P0 で得た安全ゲートを全サイトに適用 |

### 1.2 Relationship to Gosaki Schedule P0

Gosaki Schedule CMS P0（G-22d→G-22j2）は、この標準工程の**最初の実用スライス**:

- `musician-basic` プリセットの Schedule モジュール
- crawl → convert → package → CMS write → public reflection の実証
- 安全ゲート（dry-run · optimistic lock · FTP 分離）のテンプレート

### 1.3 Existing foundation (G-7+)

| Layer | Exists today | Gap for 30-min |
| --- | --- | --- |
| Crawl CLI | `crawl-static-site.mjs` (G-7a) | Orchestrator integration |
| Pipeline | `url-to-staging-pipeline.mjs` (G-7b) | CMS + admin wiring |
| Convert / build | `convert-static-to-astro.mjs` | Preset auto-selection |
| Package | `build-gosaki-staging-admin-package.mjs` | Generic per-site builder |
| CMS seed | `extract-schedule-seed.mjs` etc. | Standardized extractor registry |
| Admin UI | `templates/admin-cms/` | Preset-driven generator |
| Onboarding runbook | `cms-kit-onboarding-runbook.md` | 30-min timed runbook |

---

## 2. Target sites

### 2.1 Priority targets (Phase 3–4)

| Category | Examples | CMS preset |
| --- | --- | --- |
| **ミュージシャン個人サイト** | gosaki-piano.com | `musician-basic` |
| **ダンス / 音楽教室** | スタジオ・教室サイト | `lesson-studio-basic` |
| **小規模店舗** | カフェ・サロン・工房 | `shop-basic` |
| **個人事業サイト** | フリーランス・士業ライト | `shop-basic` or `musician-basic` |
| **Wix / Studio / Jimdo** | 既存静的化候補 | per classifier |
| **WordPress 静的化候補** | 小規模ブログ・紹介サイト | per classifier |

### 2.2 Out of scope (initial)

| Category | Reason |
| --- | --- |
| EC（通販） | 在庫・決済・カート — 別プロダクト |
| 会員制サイト | 認証・課金 — 高複雑度 |
| 複雑な予約システム | リアルタイム空き管理 — 別スコープ |
| 大規模メディア | ページ数・CDN・編集ワークフロー |
| 独自 JS アプリ | SPA / WebApp — Astro 静的化対象外 |
| 法的 / 金融 / 医療 | コンプライアンス・高リスク |

---

## 3. 30-minute operation timeline

**Target:** operator-driven semi-automation · **30 minutes wall-clock** for initial site + CMS (Phase 3 goal).

```txt
┌─────────────────────────────────────────────────────────────────┐
│  0–3 min   INTAKE                                               │
│  URL入力 · site_slug · サイト種別 · CMSプリセット選択            │
├─────────────────────────────────────────────────────────────────┤
│  3–8 min   CRAWL                                                │
│  ページ一覧 · 画像/CSS/assets · title/description/OGP           │
├─────────────────────────────────────────────────────────────────┤
│  8–12 min  CLASSIFY + LAYOUT                                    │
│  ページ分類 · header/footer/nav · Astro layout/template 適用     │
├─────────────────────────────────────────────────────────────────┤
│ 12–17 min  CMS EXTRACT                                          │
│  Schedule/News/Profile/Discography seed · site_slug 付与        │
├─────────────────────────────────────────────────────────────────┤
│ 17–22 min  STAGING CMS SETUP                                    │
│  Supabase staging · table/seed/RLS 確認 · admin UI プリセット     │
├─────────────────────────────────────────────────────────────────┤
│ 22–26 min  PACKAGE BUILD                                        │
│  local package · published=true のみ public output · manual-upload│
├─────────────────────────────────────────────────────────────────┤
│ 26–30 min  REPORT + HANDOFF                                     │
│  diff report · QA report · upload候補 · 人間の公開判断へ         │
└─────────────────────────────────────────────────────────────────┘
```

### 3.1 Step detail

| Window | Step | Output |
| --- | --- | --- |
| **0–3 min** | URL入力 · `site_slug` 生成 · 種別選択 · CMSプリセット | `config/sites/{slug}.onboarding.json` |
| **3–8 min** | crawl · manifest · assets | `fixtures/{slug}/` + `manifest.json` |
| **8–12 min** | page classifier · layout apply | `output/{slug}-astro/` scaffold |
| **12–17 min** | CMS seed extractor · normalize | `src/data/*.json` + Supabase seed SQL draft |
| **17–22 min** | staging DB seed (operator-approved) · admin bind | staging rows · admin shell wired |
| **22–26 min** | `build-*-staging-admin-package.mjs` | `output/manual-upload/{slug}/` |
| **26–30 min** | diff · QA · upload plan · release note draft | reports + handoff doc |

**FTP / production deploy:** **not in 30-minute window** — separate high-risk gate after human review.

---

## 4. Standard module design

| Module | Role | Exists / Planned |
| --- | --- | --- |
| **crawler module** | URL → fixture HTML + manifest | **exists** (`crawl-static-site.mjs`) |
| **site classifier** | page type detection (home/schedule/about/contact) | partial · **planned** |
| **Astro template generator** | layout + page scaffold from fixture | **exists** (`convert-static-to-astro.mjs`) |
| **CMS schema registry** | table/column definitions per preset | partial (`inspect-schema-adapter.mjs`) |
| **seed extractor** | Wix HTML → CMS rows | partial (schedule/discography) |
| **Supabase staging setup** | project ref · seed · RLS verify | manual + scripts |
| **admin UI generator** | preset → operator shell sections | partial (`templates/admin-cms/`) |
| **package builder** | convert + verify + manual-upload | **exists** (gosaki-specific) |
| **diff reporter** | local vs live / before vs after | partial (G-22i3/i4 pattern) |
| **FTP safety planner** | preflight · file list · root-delete block | **exists** (G-7f1 hardening) |
| **handoff / release note generator** | operator + client summary | partial (G-22j2 pattern) |
| **onboarding orchestrator** | single CLI chaining all steps | partial (`url-to-staging-pipeline.mjs`) |

---

## 5. CMS presets

### 5.1 `musician-basic` (proven — Gosaki)

| Module | CMS table / source | P0 status |
| --- | --- | --- |
| **Schedule** | `public.schedules` | **P0 complete** (G-22) |
| **News** | TBD | planned |
| **Profile** | static JSON / future table | partial |
| **Discography** | `public.discography` | read + partial write |
| **Video / YouTube** | `site_embeds` / JSON | proven (G-10d) |
| **Contact** | static / HubSpot | static only |

### 5.2 `lesson-studio-basic` (planned)

| Module | Content |
| --- | --- |
| Schedule | レッスン日程・発表会 |
| Classes | コース一覧 |
| Instructors | 講師紹介 |
| News | お知らせ |
| Pricing | 料金表 |
| Contact | 問い合わせ |

### 5.3 `shop-basic` (planned)

| Module | Content |
| --- | --- |
| News | お知らせ |
| Menu / Service | メニュー・サービス |
| Access | アクセス・地図 |
| Gallery | ギャラリー |
| Contact | 問い合わせ |

**Preset selection:** intake step (0–3 min) maps site classifier output → preset ID.

---

## 6. Safety gates — standardized from Gosaki

All onboarding sites **must** inherit these gates (from G-22 Schedule P0 + G-14c + G-7f1):

| Gate | Rule |
| --- | --- |
| **staging first** | All CMS work on staging Supabase only |
| **site_slug separation** | Every row filtered by `site_slug` |
| **Save前 preview** | dry-run required before any write |
| **target 確認** | id / legacy_id / field list visible before Save |
| **optimistic lock** | `updated_at` check on UPDATE |
| **actualWrite 明示** | Save result shows DB write success/failure |
| **published=false 除外** | public build: `.eq("published", true)` only |
| **DB write ≠ public reflection** | CMS Save and static output are separate phases |
| **package / diff dry-run** | local regen before any upload decision |
| **local vs live review** | MD5 / content compare before upload |
| **FTP 別高リスクゲート** | manual upload · explicit operator approval |
| **`--delete` / mirror 禁止** | G-7f incident — auto FTP suspended |
| **root 誤消去防止** | remote path allowlist · `cd` fail = abort |
| **service_role 不使用** | anon + authenticated only |
| **production ref 混入防止** | block `vsbvndwuajjhnzpohghh` in env validation |
| **commit / push 手動** | no auto-deploy from onboarding CLI |

---

## 7. Success criteria (30-minute version)

At end of 30-minute run, **all** of the following must be true:

| # | Criterion |
| --- | --- |
| 1 | Initial Astro site generated under `output/{site_slug}-astro/` |
| 2 | Primary pages render (home · about · contact · preset-specific) |
| 3 | CMS target data seeded to **staging** DB (operator-approved step) |
| 4 | Admin shell shows list view for at least one CMS module |
| 5 | `published=true` rows only in public output |
| 6 | Local package at `output/manual-upload/{site_slug}/` |
| 7 | Upload candidates listed in diff report |
| 8 | **FTP not executed** — human review gate next |

---

## 8. What 30 minutes does NOT include

| Out of scope | Notes |
| --- | --- |
| 完全なデザイン再現 | 80点初期版 — Wix pixel-perfect は後工程 |
| 細かいアニメーション再現 | Thunderbolt JS 依存アニメは静的化対象外 |
| 複雑な CMS 個別設計 | プリセット外フィールドは Phase 2+ |
| 本番 FTP 自動実行 | G-7f — manual only |
| production DB 適用 | staging only until cutover phase |
| 独自機能開発 | 標準モジュール外は別見積 |
| 大量ページの完全 QA | spot-check + report; full QA is human phase |
| 顧客確認なしの公開 | operator + client sign-off required |

---

## 9. Realistic phase roadmap

| Phase | Target duration | Scope |
| --- | --- | --- |
| **Phase 1** (current) | **半日〜1日 / site** | Manual Gosaki-style pipeline · proven |
| **Phase 2** | **2〜3 hours / site** | Orchestrator + preset auto-select · less manual |
| **Phase 3** | **30 min / site** | Timed runbook · parallel steps · auto reports |
| **Phase 4** | **URL input only** | Semi-auto: operator reviews at end only |

**G-23a plans Phase 3.** Phase 1–2 are operational today for Gosaki; generalization is the work ahead.

---

## 10. Next implementation candidates

| Priority | Item | Notes |
| --- | --- | --- |
| 1 | **onboarding config schema** | `config/sites/{slug}.onboarding.json` — URL, preset, deployBase |
| 2 | **site_slug generator** | URL → slug rules · collision check |
| 3 | **CMS preset registry** | `musician-basic` · `lesson-studio-basic` · `shop-basic` |
| 4 | **crawler result normalizer** | manifest → classifier input |
| 5 | **seed extractor standardizer** | unified interface per CMS module |
| 6 | **package / diff report generator** | G-22i3/i4 pattern generalized |
| 7 | **30-minute runbook** | timed checklist for operator |
| 8 | **sample target site dry-run** | 2nd customer or fixture-only pilot |

**Recommended next phase:** `G-23b-onboarding-config-schema` (planning or implementation per operator).

---

## 11. 顧客向け説明（Customer-facing explanation）

> **既存のホームページを、軽くて速い静的サイトに作り替えます。**
>
> - 更新が必要な部分（スケジュール・お知らせなど）だけを CMS 化します
> - 専門知識がなくても、管理画面から内容を更新できます
> - 公開サイトは静的 HTML なので**表示が速く、壊れにくい**です
> - Wix や Jimdo と比べて**運用費を抑えやすい**構成です
> - データベースの更新と公開サイトへの反映は**分けて行う**ため、安全です
> - 初期版は短時間で用意し、デザインや内容は一緒に仕上げていきます

---

## 12. Safety (G-23a phase)

| Item | Status |
| --- | --- |
| Implementation | **no** |
| Save / DB write / SQL mutation | **no** |
| Package regen / FTP / deploy | **no** |
| Rollback SQL | **no** |
| GRANT / REVOKE / RLS | **no** |
| `service_role` | **not used** |
| Production deploy | **no** |
| dev server | **not started** |
| commit / push (G-23a) | per operator instruction |

---

## 13. Verifier

```bash
node tools/static-to-astro/scripts/verify-g23a-static-to-astro-30-minute-onboarding-flow-planning.mjs
```
