# Site profile system (Phase 3-W)

## 目的

static-to-astro / CMS Kit を **サイト種別ごとに切り替え可能** にするための設計土台です。  
現状は gosaki（musician 型）に最適化されていますが、商品化・複数案件対応では profile による module 切り替えが必要です。

## なぜ profile が必要か

- Schedule / Discography / Tracks は musician には合うが、dance school や restaurant では不要または別形
- Home featured は schedules だけでなく NEWS / Events / Works / Lessons などに広げたい
- Admin pages / API routes / seed extractor / Storage fields / deploy 方針を案件ごとに変えたい
- 変換 CLI 1 本で複数 vertical を扱うには、**宣言的な profile JSON** が必要

## サイト種別の違い（概要）

| Profile | 想定案件 | 主な CMS modules | Home featured |
| --- | --- | --- | --- |
| `musician` | 演奏家・バンド（gosaki） | schedule, discography, tracks | schedules / `show_on_home` |
| `dance-school` | ダンススクール・レッスン | classes, instructors, news, schedule | news / `featured_on_home` |
| `generic` | 小規模店舗・個人 | news, profile | news / `featured_on_home` |

将来候補: `restaurant`, `personal`, `lesson-studio` など。

## Profile が制御するもの

| 領域 | 内容 |
| --- | --- |
| CMS modules | 有効化する seed / Admin / API モジュール |
| seed extractor | どのテーブル・フィールドを抽出するか |
| Admin pages | ダッシュボード配下のページ一覧 |
| API routes | profile 有効 module に対応する REST ルート（将来） |
| Supabase tables | schema / seed の対象テーブル（将来） |
| Home featured | トップ掲載の module / field / limit |
| Storage fields | Storage plan の対象フィールド |
| deploy strategy | static public artifact / Admin 別ホスト推奨など |

Phase 3-W では **JSON 定義 + loader + CLI オプション + レポート** のみ。生成内容の大規模分岐は未実装です。

## gosaki musician profile の現在地

- `--with-admin-cms --site-profile musician`（または profile 未指定時のデフォルト）で既存 gosaki 挙動を維持
- Admin: dashboard / schedules / discography
- Home featured: schedules + `show_on_home`
- Storage plan 対象: schedule flyer / home image / discography cover
- public-dist + Admin 別ホスト推奨（Phase 3-T / 3-V）

## Sariswing への将来適用方針

1. Sariswing 用 profile（例: `dance-school` または専用 `sariswing`）を定義
2. 既存 root `src/` は触らず、`tools/static-to-astro` で変換・検証
3. profile に応じて CMS template のコピー対象を絞る（Phase 4 以降）
4. Storage / deploy / seed を profile 経由で統一

## Profile 追加手順

1. `config/site-profiles/{id}.json` を追加
2. `validateSiteProfile` の必須フィールドを満たす
3. `verify-site-profiles.mjs` に ID を期待リストへ追加（必要時）
4. 該当 module の template / extractor を実装（別フェーズ）
5. README / 本 doc を更新

## 設定ファイル

```txt
tools/static-to-astro/config/site-profiles/
  musician.json
  dance-school.json
  generic.json
```

## CLI

```bash
node tools/static-to-astro/scripts/convert-static-to-astro.mjs \
  tools/static-to-astro/fixtures/gosaki-static-site \
  tools/static-to-astro/output/generated-astro \
  --base-url https://www.gosaki-piano.com \
  --verify-build \
  --with-admin-cms \
  --site-profile musician
```

**デフォルト:**

- `--with-admin-cms` 使用時、profile 未指定 → `musician`
- `--with-admin-cms` なし → profile 未使用（従来 convert と同じ）

## Storage RLS（参考・未適用）

```sql
-- do not apply yet
-- bucket: site-assets
-- public read or signed URL strategy TBD
-- profile.storage.fields に応じて path 設計
```

## 未決定事項

- DB に path vs public URL を保存する最終方針
- `restaurant` / `personal` profile の module 定義
- profile ごとの Supabase schema 差分を 1 repo でどう管理するか
- Admin UI の動的 menu 生成タイミング
- Sariswing 専用 profile を fork するか `dance-school` を拡張するか

---

Phase 3-W: 設計・設定・dry-run 検証のみ。CMS 本実装・Storage upload・deploy 実行は行いません。

**G-5 以降:** profile は schema adapter / template registry の一部として [cms-kit-generalization-roadmap.md](./cms-kit-generalization-roadmap.md) で拡張予定。案件単位の slug / deploy / FTP は **site config**（`config/sites/*.example.json`）へ。
