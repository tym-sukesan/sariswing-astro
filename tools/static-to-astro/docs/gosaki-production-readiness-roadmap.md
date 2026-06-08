# gosaki 実用化ロードマップ（Phase 3-X-A）

**作成日:** 2026-06-05  
**目的:** gosaki を **CMS Kit の実用化プロトタイプ** としてどこまで仕上げるべきかを整理する。  
**前提:** Sariswing 本番には触れず、gosaki 本番公開・本番 FTP 接続も Phase 3-X-A では行わない。

関連: [sariswing-vs-cms-kit-gap-analysis.md](./sariswing-vs-cms-kit-gap-analysis.md)

---

## A. 現在できていること

| 領域 | 状態 | 備考 |
| --- | --- | --- |
| 静的 HTML → Astro 変換 | ◎ | `convert-static-to-astro.mjs` + visual diff 系 |
| Admin/API テンプレート | ◎ | `--with-admin-cms` で再生成可能（Phase 3-S） |
| musician profile | ◎ | `--site-profile musician`（Phase 3-W） |
| Schedule CMS | ◎ | Admin save + API + export |
| Discography CMS | ◎ | Admin save + API + export |
| Tracks CMS | ◎ | discography 子テーブル save |
| Auth / RLS | ◎ staging | bootstrap + anon RLS verifier |
| Supabase staging | ◎ | seed insert / staging プロジェクト |
| export → build | ◎ | `export-supabase-json.mjs` + CMS minimal loop PASS |
| public-dist | ◎ | static-public artifact verifier PASS |
| FTP deploy template | △ dry-run | workflow template + verifier（未実行） |
| Storage dry-run plan | ◎ | `plan-storage-assets.mjs`（upload 未実施） |
| CMS minimal loop | ◎ PASS | schedule / discography / tracks 一連 |

**まだないもの（Sariswing と比較）:** NEWS CMS、画像 upload 本実装、本人向け公開ボタン UX、本番 FTP deploy 実績、クライアント説明資料。

---

## B. 実用化に必要な残タスク

### Must have（実サイト公開前に必須）

| タスク | 内容 |
| --- | --- |
| staging 運用設計 | Supabase staging / 生成物 output の役割分担、更新頻度、担当者 |
| public-dist deploy staging FTP 検証 | template を **staging FTP のみ** で dry-run → apply 検証 |
| Admin 運用方法の確定 | **完了（G-3）** — Local Admin 短期正式 | [gosaki-admin-operations.md](./gosaki-admin-operations.md) |
| `.env` / secrets 運用ルール | service role / anon / admin 資格情報の保管・ローテーション |
| 画像 Storage 方針 | path vs URL、Wix 再ホスト、著作権確認フロー |
| バックアップ / rollback | seed JSON / Supabase export / public-dist の復旧手順 |
| クライアント編集項目の整理 | Schedule / Discography / Tracks の編集可能フィールド最終確定 |

### Should have（品質・運用性向上）

| タスク | 内容 |
| --- | --- |
| Admin UI UX 改善 | エラー表示、保存確認、フィールドラベル |
| エラーメッセージ改善 | API / Admin のユーザー向け文言 |
| preview 機能 | 公開前プレビュー URL または build preview |
| 変更履歴 / restore | export 世代管理、seed スナップショット |
| 画像アップロード | staging Storage + Admin 連携 |
| profile 別 module 切替 | dance-school / generic 向け template 分岐 |

### Later（商品化拡張）

| タスク | 内容 |
| --- | --- |
| 決済 / 継続課金 | SaaS 化時 |
| マルチテナント管理 | 複数クライアント 1 基盤 |
| ユーザーセルフオンボーディング | サインアップ → convert → deploy 自動化 |
| AI 自動移行 | Wix / Studio からのコンテンツ抽出 |
| News / Classes / Restaurant profile | vertical 拡張 |

---

## C. 推奨フェーズ

```text
Phase G-1: gosaki staging 運用設計（完了）
Phase G-2: public-dist deploy dry-run（完了）
Phase G-3: Admin 運用フロー確定（完了 — Local Admin 短期正式）
Phase G-2b: staging FTP apply 実接続（未実施）
Phase G-4: 画像 Storage 方針決定（+ Node host Admin 検討）
```

### Phase G-1: gosaki staging 運用設計

- staging Supabase プロジェクトの用途定義
- `output/generated-astro` vs 将来の専用 deploy repo
- 誰が Admin / export / build を実行するか
- Sariswing 本番との完全分離確認

**成果物:** staging 運用 doc、secrets 命名規則、更新チェックリスト

### Phase G-2: public-dist deploy を staging FTP で検証

- `verify-static-public-artifact.mjs` → `public-dist/` 生成
- FTP deploy workflow template を **staging 先のみ** で実行
- Admin / api が FTP 先に載らないことを再確認

**成果物:** staging deploy 手順書、deploy verifier レポート

### Phase G-3: Admin 運用フロー確定（完了）

- **短期正式:** Pattern A — Local Admin + export/build + public-dist
- **中期:** Pattern B — Node host Admin/API + static FTP
- **長期:** Pattern C — Separate Admin app + site profile
- 成果物: [gosaki-admin-operations.md](./gosaki-admin-operations.md), [gosaki-admin-handoff-checklist.md](./gosaki-admin-handoff-checklist.md)
- Runbook: Local Admin 起動・保存後の公開反映手順を追記

### Phase G-2b: staging FTP apply（未実施）

- `deploy-public-dist-ftp.mjs --apply --env staging`
- staging FTP tarball 退避

### Phase G-4: 画像 Storage 方針決定

- [storage-image-pipeline.md](./storage-image-pipeline.md) に沿った review-required フロー
- staging bucket（本番 Storage 禁止）
- `upload-storage-assets.mjs --apply` の staging 限定実装

### Phase G-5: クライアント向け編集項目整理

- musician profile の編集可能フィールド一覧
- 触ってはいけない項目（legacy_id、slug 等）
- クライアント向け説明資料（スクリーンショット付き）

### Phase G-6: 実サイト公開前チェック

- 下記チェックリストをすべて PASS
- SEO / OGP / sitemap / 問い合わせフォーム確認
- 著作権・画像権利の書面確認

### Phase G-7: 商品化テンプレートとして抽象化

- gosaki 固有部分と CMS Kit 共通部分の分離
- `--site-profile musician` + fixture 差し替えで再現可能か検証
- 料金・提供範囲のパッケージ化

---

## D. gosaki で検証する理由

| 理由 | 説明 |
| --- | --- |
| 本番影響が小さい | Sariswing 本番を壊さずに検証できる |
| musician profile との相性 | Schedule + Discography + Tracks が CMS Kit の強みと一致 |
| 乗り換え商品に近い | Wix 等からの musician サイト移行が想定ターゲット |
| CMS 検証に向く | 複数 module + home featured + Storage plan が揃っている |
| 失敗許容 | staging / generated-astro で試行錯誤可能 |
| 営業実績 | 完成後サンプルサイトとして提案資料に使える可能性 |

**Sariswing は比較対象・将来移植先。gosaki は商品化の実験場。**

---

## E. 実用化前チェックリスト

公開前（本番 gosaki ドメイン / 本番 FTP）に進む前に、以下をすべて確認する。

### インフラ・セキュリティ

- [ ] Supabase staging / production が分離されている
- [ ] service role key が Git / 公開 artifact に含まれていない
- [ ] anon key の公開範囲が RLS と一致している
- [ ] admin user の作成・削除手順が文書化されている
- [ ] RLS が anon / authenticated / service role それぞれで verifier PASS

### デプロイ

- [ ] `verify-static-public-artifact.mjs` が PASS
- [ ] public-dist に Admin / api パスが含まれていない
- [ ] FTP deploy 先が staging / production で取り違えていない
- [ ] rollback 手順（前世代 public-dist / seed）が用意されている

### コンテンツ・法務

- [ ] 画像の著作権・再ホスト許諾が確認済み（Wix / external は review-required 解消）
- [ ] Storage plan の action が keep / upload 済みで整合
- [ ] クライアントが編集する項目一覧が合意済み

### 公開品質

- [ ] SEO / canonical / OGP が本番 URL と一致
- [ ] sitemap / robots.txt が生成・配信されている
- [ ] 問い合わせフォーム等の外部連携（Formrun 等）が本番設定済み
- [ ] 主要ページの visual diff / 手動確認完了

### ビジネス

- [ ] クライアント説明資料（更新手順）が用意されている
- [ ] 料金設計・保守範囲が定義されている
- [ ] バックアップ頻度と復旧 RTO が合意済み

---

## F. 次にやるべきこと

### 推奨: Phase G-1（gosaki staging 運用設計）

Sariswing 本番に触れず、**staging 環境の役割・secrets・更新 Runbook** を文書化する。  
実装より先に「誰が・いつ・何を触るか」を固定すると、以降の G-2〜G-6 が安全に進む。

### 代替: Phase 3-Y（gosaki 実用化 readiness verifier）

実装前に自動チェックを追加する案:

```bash
# 将来案（Phase 3-Y）
node tools/static-to-astro/scripts/verify-gosaki-readiness.mjs \
  --report tools/static-to-astro/output/gosaki/GOSAKI_READINESS_REPORT.md
```

検証候補:

- profile = musician
- CMS minimal loop 設定が揃っている
- public-dist manifest が存在（または生成可能）
- Storage plan が生成済み
- CONVERSION_REPORT / secrets scan PASS
- **本番 URL / 本番 FTP への接続がない** こと

Phase 3-X-A 時点では **readiness verifier は未実装**。Phase G-1 完了後に 3-Y として追加するのが自然。

---

## 関連ドキュメント

| ドキュメント | 用途 |
| --- | --- |
| [sariswing-vs-cms-kit-gap-analysis.md](./sariswing-vs-cms-kit-gap-analysis.md) | Sariswing との差分 |
| [phase3-r-productization-review.md](./phase3-r-productization-review.md) | 商品化棚卸し |
| [admin-hosting-strategy.md](./admin-hosting-strategy.md) | Admin 分離 |
| [public-dist-ftp-deploy.md](./public-dist-ftp-deploy.md) | FTP deploy template |
| [storage-image-pipeline.md](./storage-image-pipeline.md) | 画像方針 |
| [gosaki-admin-operations.md](./gosaki-admin-operations.md) | Admin 運用方針（G-3） |
| [gosaki-admin-handoff-checklist.md](./gosaki-admin-handoff-checklist.md) | 引き渡しチェックリスト |

---

Phase 3-X-A: ロードマップ doc のみ。本番公開・deploy 実行・schema 変更は行っていません。
