# gosaki Admin Handoff Checklist（Phase G-3）

**目的:** 将来、クライアントまたは運用者に Admin を渡す前の確認リスト。  
**現状:** gosaki は **Local Admin + エンジニア運用** が正式。本人 handoff は中期（Node host Admin）以降を想定。

関連: [gosaki-admin-operations.md](./gosaki-admin-operations.md)

---

## A. Admin 利用前チェック

### インフラ・セキュリティ

- [ ] Supabase **staging** と **production** が区別されている
- [ ] admin user が意図したメールアドレスで存在する（`admin_users` テーブル）
- [ ] RLS が anon / authenticated で verifier PASS（`verify-anon-rls.mjs`）
- [ ] ログイン（Bearer トークン取得）が成功する
- [ ] Schedule / Discography / Tracks の**保存テスト**が成功する
- [ ] `verify-cms-minimal-loop.mjs` が PASS
- [ ] `verify-static-public-artifact.mjs` が PASS（`safeForStaticFtp: true`）

### 運用理解

- [ ] 担当者が「保存 ≠ 公開」を理解している
- [ ] export → build → public-dist → deploy の Runbook を共有済み
- [ ] rollback 手順（manifest / tarball）を説明済み

---

## B. 編集可能項目（musician profile）

### Schedule（`schedules`）

| フィールド | 説明 |
| --- | --- |
| `title` | 公演タイトル |
| `venue` | 会場 |
| `open_time` | 開場 |
| `start_time` | 開演 |
| `price` | 料金 |
| `description` | 説明文 |
| `show_on_home` | トップ掲載（最大 3 件） |
| `home_order` | トップ掲載順 |
| `published` | 公開フラグ |

### Discography（`discography`）

| フィールド | 説明 |
| --- | --- |
| `title` | 作品名 |
| `artist` | アーティスト |
| `release_date` | 発売日 |
| `year` | 年 |
| `label` | レーベル |
| `catalog_number` | カタログ番号 |
| `description` | 説明 |
| `purchase_url` | 購入 URL |
| `streaming_url` | ストリーミング URL |
| `published` | 公開フラグ |
| `sort_order` | 並び順 |

### Tracks（`discography_tracks`）

| フィールド | 説明 |
| --- | --- |
| `title` | トラック名 |
| `sort_order` | トラック順 |

**注意:** 既存トラックの**更新**のみ。追加・削除は未実装。

---

## C. 編集不可・注意項目

| 項目 | 理由 |
| --- | --- |
| `legacy_id` | ルーティング・seed 整合のキー |
| `date` / `month` / route | 月別ページ・URL 構造と連動 |
| `source_file` / `source_route` | 静的変換由来のメタデータ |
| 画像 URL（`image_url` 等） | Storage upload 未実装。手動 URL 変更は非推奨 |
| トラック追加・削除 | UI / API 未対応 |
| Storage upload | Phase G-4 以降 |
| News | musician profile では未実装 |
| About | 未実装 |
| Instagram | 未実装（Sariswing にはあるが CMS Kit 未対応） |

---

## D. 公開手順（短期運用）

**Admin で保存しただけでは公開サイトに反映されない。**

```text
1. Admin 保存          → Supabase に書き込み
2. export-supabase-json → src/data/*.json 更新
3. npm run build        → dist/ 生成
4. verify-static-public-artifact → public-dist/ 生成
5. deploy-public-dist-ftp       → staging FTP（dry-run / apply）
```

担当者がエンジニアの場合: 上記を Runbook に沿って実行。  
クライアント本人運用の場合: 中期で Node host Admin + 「公開ボタン」UX を検討（未実装）。

---

## E. よくある事故と対策

| 事故 | 原因 | 対策 |
| --- | --- | --- |
| Home 掲載を 4 件以上にしようとして拒否 | `HOME_FEATURED_LIMIT = 3` | 3 件以内にする。不要な `show_on_home` を off |
| `published=false` でサイトに出ない | 意図した非公開 | `published` を true にする |
| 保存したが公開サイトに変化なし | export/build/deploy 未実施 | セクション D の公開手順を実行 |
| FTP 上の `/admin/` が動かない | 静的ホストでは API 不可 | Local Admin または Node host を使う |
| 画像を変えられない | upload 未実装 | G-4 Storage 方針まで現状維持 |
| トラックを増やせない | 追加 UI 未実装 | DB / seed で対応（エンジニアのみ） |

---

## F. 引き渡し前チェック

### アカウント

- [ ] クライアント用 admin user を作成（staging または production）
- [ ] パスワードを secrets manager で共有（チャット・メール平文禁止）
- [ ] 開発用 admin と本番 admin を分離

### 説明資料

- [ ] 編集可能フィールド一覧（セクション B）を共有
- [ ] 編集不可項目（セクション C）を共有
- [ ] 公開フロー（セクション D）を図解または Runbook で共有
- [ ] rollback 方法（manifest / 前世代 public-dist）
- [ ] 問い合わせ先（障害時・仕様変更時）

### 運用モデル

- [ ] 短期（Local Admin + 運用代行）か中期（Node host + 本人運用）かを合意
- [ ] 更新頻度と担当者（誰が export/deploy するか）を文書化

---

Phase G-3: handoff checklist。本番 handoff・Node deploy は未実施。
