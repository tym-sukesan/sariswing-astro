# generated-astro Integration Plan（generator テンプレート化計画）

Phase 3-S の実装前設計。`output/generated-astro` に手追加された CMS 機能を `tools/static-to-astro` generator へ統合する手順。

---

## 1. 現状ギャップ

| 機能 | generator (`astro-generator.mjs`) | generated-astro |
| --- | --- | --- |
| 公開 pages / layouts / Header / Footer | ✅ 生成 | ✅ 存在 |
| SEO / sitemap / robots | ✅ `--base-url` | ✅ 存在 |
| data-driven Schedule / Discography 表示 | △ 一部手追加 | ✅ JSON import components |
| Admin UI | ✗ | ✅ 手追加 |
| API routes | ✗ | ✅ 手追加 |
| `@astrojs/node` | ✗（SEO 時 sitemap のみ） | ✅ 手追加 |
| `@supabase/supabase-js` | ✗ | ✅ 手追加 |
| `src/lib/admin-*.ts` | ✗ | ✅ 手追加 |

**リスク:** `convert-static-to-astro.mjs` 再実行で Admin 層が失われる。

---

## 2. 統合対象ファイル一覧

### 2.1 必須（cms-core）

```text
src/lib/admin-auth.ts
src/pages/api/admin/me.json.ts
```

### 2.2 schedule module

```text
src/lib/admin-schedule-update.ts
src/lib/home-featured-limit.ts
src/lib/supabase-admin-read.ts                    # schedule 部分含む
src/pages/api/admin/schedules/update.json.ts
src/pages/admin/schedules.astro
src/pages/admin/index.astro                       # ナビ骨格
src/components/admin/ScheduleEditorMock.astro
src/components/admin/AdminLayout.astro
src/components/ScheduleList.astro
src/components/HomeSchedule.astro
src/pages/schedule-*/index.astro                  # 月別（profile 設定）
```

### 2.3 discography module

```text
src/lib/admin-discography-update.ts
src/lib/admin-discography-tracks-update.ts
src/pages/api/admin/discography/update.json.ts
src/pages/api/admin/discography/tracks/update.json.ts
src/pages/admin/discography.astro
src/components/admin/DiscographyEditorMock.astro
src/components/DiscographyList.astro
src/pages/discography/index.astro                 # data-driven 化済み
```

### 2.4 スタイル・設定

```text
src/styles/admin.css
astro.config.mjs                                  # node adapter 条件付き
package.json                                      # @astrojs/node, @supabase/supabase-js 条件付き
.env.example                                      # Supabase keys テンプレート
```

### 2.5 生成しない（運用時生成）

```text
src/data/schedules.json
src/data/schedule-months.json
src/data/discography.json
```

→ `export-supabase-json.mjs` のみが書き込む。

---

## 3. generator 変更案

### 3.1 新ディレクトリ

```text
tools/static-to-astro/templates/
  cms-core/
  modules/schedule/
  modules/discography/
  profiles/musician-gosaki.json
```

### 3.2 CLI フラグ（案）

```bash
node scripts/convert-static-to-astro.mjs \
  fixtures/gosaki-static-site \
  output/generated-astro \
  --base-url https://www.gosaki-piano.com \
  --cms-profile musician-gosaki \
  --cms-admin-host hybrid
```

| フラグ | 値 | 効果 |
| --- | --- | --- |
| `--cms-profile` | `musician-gosaki` | 有効 module セット |
| `--cms-admin-host` | `none` / `hybrid` / `separate` | adapter / admin pages の有無 |
| `--home-featured-limit` | `3` | profile 上書き |

### 3.3 merge ルール

1. static base を生成（既存ロジック）
2. profile の module テンプレートを **上書き merge**（同名ファイルは CMS template 優先）
3. `astro.config.mjs` は fragment 合成（static vs node adapter）
4. `CONVERSION_REPORT.md` に CMS template version と profile を記録

---

## 4. adapter 分岐（Phase 3-T 連携）

| `--cms-admin-host` | astro.config | package.json deps | 公開 deploy |
| --- | --- | --- | --- |
| `none` | static, sitemap only | 現状 | `dist/` FTP OK |
| `hybrid` | `@astrojs/node` | + node, supabase | `dist/client/` FTP + server 別 deploy |
| `separate` | static（公開 build） | 公開側 supabase なし | Admin は別 repo / 別 output |

**gosaki / Sariswing 推奨:** 公開 `none`、Admin `separate`（サブドメイン or ローカル運用）。

---

## 5. 検証ゲート（Phase 3-S 完了条件）

再生成後、以下が **追加作業なし** で PASS:

```bash
node scripts/verify-cms-minimal-loop.mjs \
  --astro-dir output/generated-astro \
  --report output/rls/gosaki/CMS_MINIMAL_LOOP_VERIFY_REPORT.md
```

および既存:

- `verify-admin-api-auth.mjs`
- `verify-admin-schedule-update.mjs`
- `verify-admin-schedule-ui-save.mjs`
- `verify-admin-discography-ui-save.mjs`
- `verify-admin-discography-tracks-ui-save.mjs`
- `verify-anon-rls.mjs`

---

## 6. 作業順序（推奨）

| Step | 内容 | 成果物 |
| --- | --- | --- |
| S-1 | generated-astro → `templates/` へファイル抽出 | templates ディレクトリ |
| S-2 | `copyCmsTemplates(profile, outDir)` 関数 | astro-generator patch |
| S-3 | `--cms-profile` CLI | convert-static-to-astro.mjs |
| S-4 | 再生成 diff ゼロ確認 | gosaki fixture 回帰 |
| S-5 | README / design 更新 | ドキュメント |

**触らない:** root `src/`, root `supabase/`, 本番 Supabase。

---

## 7. Sariswing 本体移植（Phase 3-X 前提）

root `sariswing-astro` へ移植する前に:

1. Phase 3-S で templates 化完了
2. Phase 3-T で static-only 公開 build 確立
3. Phase 3-U で Storage URL 本番化
4. Phase 3-V で export+build+FTP を CI 化

移植単位:

```text
templates/site-static     → sariswing src/pages, components
export workflow           → sariswing CI or manual runbook
Admin                     → admin.sariswing.example.com（別 deploy）
```

---

*関連: [phase3-r-productization-review.md](./phase3-r-productization-review.md), [cms-kit-architecture.md](./cms-kit-architecture.md)*
