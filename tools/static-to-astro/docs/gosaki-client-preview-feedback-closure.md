# Gosaki client preview feedback closure (G-9h1 / G-12c refresh)

**Phase:** `G-9h1-gosaki-client-preview-feedback-closure` (checklist)  
**Planning refresh:** `G-12c-gosaki-client-preview-feedback-closure-planning` — commit `372b558`  
**Status:** checklist prepared — **client feedback not yet collected**  
**Prior:** G-11c15 YouTube staging verified; G-12b schedule `scheduleDataSource=supabase` verified  
**Type:** review checklist / feedback template only — **no implementation, no DB write, no FTP, no Preview/Save by Cursor**

| Check | Status |
| --- | --- |
| DB write | **no** |
| Preview / Save (Cursor/AI) | **no** |
| FTP / deploy | **no** |
| Client feedback collected | **pending** |

---

## 1. 比較対象

| 項目 | URL / 備考 |
| --- | --- |
| **新サイト（staging preview）** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| **旧サイト（Wix 本番・参照のみ）** | `https://www.gosaki-piano.com/` |
| **ホスト** | staging = `yskcreate.weblike.jp`（Lolipop）— **本番ドメインではない** |
| **robots** | staging は `noindex` + `robots.txt Disallow: /`（検索エンジン非公開 — 意図どおり） |

**クライアントへの説明ポイント:**

- 見ているのは「移行先の下書きプレビュー」であり、本番 URL はまだ Wix のまま
- スマホでも上記 staging URL を開いて確認してほしい
- 細かいピクセル一致より「運用に支障ないか」「本人が使いやすいか」を優先

---

## 2. クライアントに確認してもらう項目

チェック欄はクライアント / オペレータ記入用（`[ ]` = 未確認、`[x]` = OK、`[!]` = 要修正）。

### 2.1 トップページ印象

| # | 確認項目 | クライアント | メモ |
| --- | --- | --- | --- |
| 1 | 全体の雰囲気・色味が Wix 本番と近い | `[ ]` | KV（キービジュアル）サイズ・余白 |
| 2 | ヘッダーロゴ・サイト名の見え方 | `[ ]` | |
| 3 | PC ナビ（Home / About / Discography / Contact / Link / Schedule） | `[ ]` | Schedule は `/schedule/` へ |
| 4 | フッター（SNS リンク・コピーライト） | `[ ]` | Facebook / X / Instagram |
| 5 | **YouTube 埋め込み** — トップで動画が表示され、意図した内容か | `[ ]` | **G-11c15:** staging home に新 URL 反映済み。見た目・位置・別 URL 希望を確認 |

### 2.2 スケジュール表示

| # | 確認項目 | クライアント | メモ |
| --- | --- | --- | --- |
| 6 | `/schedule/` ハブ — 月リンク（2026-03〜2026-07） | `[ ]` | |
| 7 | 各月ページ `/schedule/YYYY-MM/` — イベント一覧の見え方 | `[ ]` | 日付・会場・OPEN/START・出演者 |
| 8 | 件数の体感（目安: 3月13 / 4月10 / 5月12 / 6月11 / 7月14） | `[ ]` | **G-12b:** 技術的件数 OK — 内容の正確さはクライアント確認 |
| 9 | 古い URL `/YYYY-MM/` から正しい月ページへ誘導されるか | `[ ]` | 任意 — ブックマーク利用者向け |
| 10 | スケジュール更新を **本人が CMS で編集**したい優先度 | `[ ]` | 高 / 中 / 低 |

### 2.3 スマホ表示

| # | 確認項目 | クライアント | メモ |
| --- | --- | --- | --- |
| 11 | MENU ボタンでナビが開閉する | `[ ]` | G-8g2 以降で修正済み — **クライアント実機確認推奨** |
| 12 | ヘッダー・ロゴの位置（メニュー開閉時も崩れないか） | `[ ]` | |
| 13 | 各ページの横スクロール・文字切れ | `[ ]` | |
| 14 | Discography（画像とテキストの順序・余白） | `[ ]` | |
| 15 | スケジュール月ページの 1 カラム表示 | `[ ]` | |

### 2.4 講師・教室情報（About）

| # | 確認項目 | クライアント | メモ |
| --- | --- | --- | --- |
| 16 | 既存 About 本文・プロフィール | `[ ]` | Wix 由来 HTML |
| 17 | **Bands / Projects** 追加セクション（5 件カード） | `[ ]` | 静的 JSON — 画像・文言の正確さ |
| 18 | バンド紹介を今後 CMS で更新したいか | `[ ]` | MVP 外 — 現状は JSON 手動更新 |

### 2.5 問い合わせ導線（Contact）

| # | 確認項目 | クライアント | メモ |
| --- | --- | --- | --- |
| 19 | 連絡先・案内文の表示 | `[ ]` | |
| 20 | **フォーム送信** — 現状は Wix バックエンドなしで **送信不可** | `[ ]` | HubSpot 等への差し替えは将来フェーズ |
| 21 | メールリンク・電話番号など代替導線で十分か | `[ ]` | |

### 2.6 画像・文言

| # | 確認項目 | クライアント | メモ |
| --- | --- | --- | --- |
| 22 | Discography アルバム画像・Track List / Personnel 見出し | `[ ]` | |
| 23 | Link ページの外部リンク | `[ ]` | |
| 24 | 誤字・古い公演情報・不要な Wix 表記 | `[ ]` | 自由記述欄へ |
| 25 | 差し替えたい画像・テキストの一覧 | `[ ]` | ファイル名 or ページ URL を添付 |

### 2.7 YouTube 埋め込み要望（G-12c 更新）

| # | 確認項目 | クライアント | メモ |
| --- | --- | --- | --- |
| 26 | トップの YouTube は必要か | `[ ]` | |
| 27 | 表示されている動画は正しいか（別 URL 希望があれば記載） | `[ ]` | Staging は CMS 反映済み（G-11c15） |
| 28 | 本人が URL だけ差し替えできれば十分か | `[ ]` | Staging admin で save 経路あり — 本番運用は別フェーズ |

---

## 3. 技術側で既に確認済みのこと

オペレータ / 自動チェック（G-7j, G-8g, G-9d2 等）。クライアント再確認は不要だが、差分があれば報告を。

| 領域 | 確認内容 | 参照 |
| --- | --- | --- |
| 主要ルート HTTP 200 | Home, About, Discography, Contact, Link, schedule 系 | G-9d2 |
| CSS 読み込み | `_astro/*.css` 配信 OK | G-7h |
| SEO（staging） | `noindex`, canonical / `og:url` が staging URL | G-9d2 |
| robots / sitemap | disallow-all; canonical schedule ルートのみ | G-9d2 |
| Schedule ハブ | `/schedule/` に 2026-03〜07 リンク | G-8g3, G-9d2 |
| 月ページ | `/schedule/YYYY-MM/` 表示 OK | G-8g4, G-9d2 |
| Legacy stub | `/YYYY-MM/` → 移動案内 + canonical リンク | G-9c0b |
| フッター SNS | Facebook / X / Instagram テキストリンク中央寄せ | G-8g6–G-8g7 |
| Discography 体裁 | SP 余白・下線見出し修正 | G-8g5, G-8g8 |
| About Bands | 5 カード静的注入 | G-8a |
| Schedule データ | staging DB 60 行 + **live HTML `scheduleDataSource=supabase`** | G-9b–G-9d, **G-12b** |
| YouTube トップ | **`youtube-nocookie.com/embed/I-eY9YMq9GI`** on staging home | **G-11c15** |
| Staging shell read | `site_slug=gosaki-piano` 行の読み取り UI | G-9f |
| FTP 安全 | auto-apply 停止中; 手動 scoped upload のみ実績 | G-7f, G-9d2 |

**既知の技術的制約（クライアント説明用）:**

- Wix のアニメーション・一部 JS 挙動は再現しない
- フォントは Wix CDN と完全一致しない場合がある
- Contact フォームは現プレビューでは送信できない
- ライブ schedule HTML は **`scheduleDataSource=supabase`**（G-12b 確認済み）
- 一部 DB 行に staging テスト文言が混ざっている場合がある（例: 7月の1件）— クライアントに見えたら報告を

---

## 4. 未確認・要クライアント確認のこと

| # | 項目 | 現状 |
| --- | --- | --- |
| 1 | **正式なクライアント目視サインオフ** | 未実施 |
| 2 | **スマホ実機**（iPhone / Android）での MENU・全ページ | G-7j で PENDING — クライアント確認推奨 |
| 3 | **全月のイベント件数・内容**の目視 | 2026-07 は operator OK; 他月は spot-check 推奨 |
| 4 | **Bands / Projects** の写真・文言の事実確認 | 静的 JSON — クライアント原稿確認要 |
| 5 | **Contact** — フォーム代替手段の合意 | HubSpot 等は未実装 |
| 6 | **YouTube** — 表示内容・位置・URL 変更希望 | G-11c15 で staging 反映済み — **見た目確認** |
| 7 | **文言・画像の最終版** | クライアント提供リスト待ち |
| 8 | **スケジュール更新頻度と CMS 優先度** | フィードバックで確定 |
| 9 | **本番切替の希望時期** | 今回対象外 — プレビュー承認後に別計画 |

---

## 5. 修正要望の分類（記入テンプレート）

フィードバック受領後、各項目を以下いずれかに分類する。

### A. すぐ直す（Phase 1 表示修正）

- CSS / 余白 / フォントサイズ / リンク先
- 誤字・明らかな表示崩れ
- 画像差し替え（静的アセット）
- **対応:** convert + `npm run manual-upload:package` → オペレータ手動 re-upload（scoped path のみ）
- **DB write / Save 不要**

### B. 後で CMS 化（Phase 2 以降）

- スケジュールの追加・編集を本人運用
- トップ YouTube URL の CMS 管理（G-9i）
- 公演情報の定期更新フロー
- **対応:** staging shell write slices + rebuild — **別承認・別フェーズ**

### C. 今回対象外

- News / Discography CMS
- Contact フォーム本格実装（HubSpot）
- Bands/Projects の CMS + Storage
- `gosaki-piano.com` 本番 DNS / 切替
- FTP 自動デプロイ復帰

### 分類記入欄（フィードバック後に使用）

```txt
[A すぐ直す]
- 

[B 後でCMS化]
- 

[C 今回対象外]
- 
```

---

## 6. 次に実装すべき候補（フィードバック後の想定順）

G-9h planning 準拠。クライアント確認**後**に優先度を確定する。

| 順 | フェーズ | 内容 | DB write |
| --- | --- | --- | --- |
| 1 | **G-12c-result** | クライアントフィードバック記録 + 分類 | No |
| 2 | **G-12d** / **G-9h3** | Schedule CMS Phase 1/2 境界の確定 | No |
| 3 | **表示修正（A 分類）** | G-8 系 overrides + manual re-upload | No |
| 4 | **Phase 2** | Schedule CMS write slices（明示承認後） | 別ゲート |

**NOT next:** `start_time-only manual non-dry-run execution` / 本番切替 / FTP auto-apply

---

## 7. 安全ゲート（本フェーズ）

```txt
gosakiClientPreviewFeedbackClosurePlanningComplete: true
gosakiClientPreviewFeedbackClosureComplete: false
gosakiPublicScheduleReadVerificationComplete: true
readyForG12dPhaseBoundaryPlanning: true
gosakiScheduleCmsPhaseBoundaryDocumented: true
readyForAnyDbWrite: false
readyForFtpAutoApply: false
readyForProductionCutover: false
```

---

## 8. 本フェーズで行わないこと

```txt
実装変更
DB write / SQL
staging shell Preview / Save
FTP / deploy / workflow_dispatch
本番 gosaki-piano.com 変更
/admin 変更
service_role
```

---

## 9. フィードバック受領後の成果物（次ステップ）

クライアント確認が終わったら、別 doc に結果をまとめる。

| 成果物 | 内容 |
| --- | --- |
| `gosaki-client-preview-feedback-closure-result.md`（予定） | 分類済み残差リスト、ゲート更新、G-12d 推奨 |
| Planning | `gosaki-client-preview-feedback-closure-planning.md` (G-12c) |
| Gate | `gosakiClientPreviewFeedbackClosureComplete: true` |

---

## 10. References

- `gosaki-client-preview-feedback-closure-planning.md` (G-12c)
- `gosaki-public-schedule-read-verification.md` (G-12b)
- `gosaki-youtube-url-save-staging-public-verification.md` (G-11c15)
- `gosaki-schedule-cms-practicalization-planning.md` (G-9h)
- `gosaki-preview-review-and-next-implementation-planning.md` (G-9d3)
- `gosaki-staging-browser-qa-and-client-preview-readiness.md` (G-7j)
- `gosaki-manual-preview-upload-execution-result.md` (G-9d2)
- `gosaki-cms-scope-and-schedule-youtube-planning.md` (G-9a)
