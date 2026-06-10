# Screenshot Guide — Musician Basic Admin

**用途:** 顧客向け資料・社内共有用のスクリーンショット取得手順  
**前提:** local-only preview route で画面を表示していること

---

## 1. Local preview の起動

```bash
ENABLE_ADMIN_PREVIEW=true npm run dev
```

ブラウザで開く URL:

```txt
http://localhost:4321/__admin-preview/musician-basic/
```

詳細: [local-only-admin-preview-route.md](../local-only-admin-preview-route.md)

---

## 2. 撮るべき画面

顧客デモ資料として、次の画面をキャプチャすることを推奨します。

| # | 画面 | 備考 |
| --- | --- | --- |
| 1 | Dashboard | トップ・全体像 |
| 2 | Profile | プロフィール編集イメージ |
| 3 | Schedule / Live | 予定・ライブ一覧 |
| 4 | Discography | 作品情報 |
| 5 | Links | 外部リンク管理 |
| 6 | News | お知らせ一覧・編集 |
| 7 | Media | 画像管理（アップロードは試作表示のみ） |
| 8 | Publish | Staging / Production の説明用 |
| 9 | Access denied / Auth status | 権限・ログイン関連の説明用（表示される場合） |
| 10 | Production disabled warning | scaffold-only / production disabled のバナー |

---

## 3. 画面サイズ

### Desktop 幅

- 推奨: **1280px または 1440px** 幅
- ブラウザウィンドウを最大化、または開発者ツールで幅を固定

### Mobile 幅

- 推奨: **375px**（iPhone 相当）または **390px**
- ブラウザの開発者ツール → レスポンシブモードで撮影
- 主要画面（Dashboard、Profile、Schedule、News）はモバイル幅でも1枚ずつ

---

## 4. 顧客に見せる前の注意

- **実データや秘密情報を入れない** — mock data のまま撮影する
- **scaffold-only バナーが写っている状態** で撮る（「試作である」ことが分かるように）
- URL バーに `localhost` が写っていても構いませんが、顧客説明では **「開発用の確認画面」** と伝える
- 本番 URL・本番 admin・実顧客のメールアドレス・パスワードは写さない
- `.env` やターミナルに secret が表示されていないことを確認する

---

## 5. ファイル名ルール

保存先はプロジェクト外（顧客フォルダ、共有ドライブ等）を推奨。**`output/` は commit しない。**

ファイル名の例:

```txt
musician-basic-demo-dashboard-desktop.png
musician-basic-demo-profile-desktop.png
musician-basic-demo-schedule-desktop.png
musician-basic-demo-discography-desktop.png
musician-basic-demo-links-desktop.png
musician-basic-demo-news-desktop.png
musician-basic-demo-media-desktop.png
musician-basic-demo-publish-desktop.png
musician-basic-demo-dashboard-mobile.png
musician-basic-demo-scaffold-banner.png
```

ルール:

- 小文字・ハイフン区切り
- `musician-basic-demo-` で始める
- 画面名 + `desktop` または `mobile` を含める
- 日付を付ける場合: `-2026-06-05` のように末尾に

---

## 6. 資料への載せ方

- 各画像の下に **「管理画面イメージ（試作）」** とキャプションを付ける
- 「実際の保存・公開は正式導入後」と注記する
- 顧客の実サイト URL と混同しないよう、資料の表紙に **mock / scaffold** と明記する

---

## 関連資料

- [demo-safety-notes.md](./demo-safety-notes.md)
- [demo-checklist.md](./demo-checklist.md)

---

*G-5v: screenshot guide. Local preview only. No production deploy.*
