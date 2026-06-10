# Musician Basic Customer Demo Package

**Phase:** G-5v — customer demo package  
**対象:** ミュージシャン、音楽教室、小規模スタジオ、Wix / Studio / Jimdo 等から乗り換えを検討している方

---

## Purpose

このフォルダは、**見込み顧客・既存 Wix 利用者・ミュージシャン本人** に対して、CMS Kit の管理画面イメージを **安全に説明・確認** するための資料一式です。

今回のデモは **完成版の管理画面ではありません**。画面の見た目と導線を確認するための **試作（scaffold）** です。実際のデータ保存・画像アップロード・本番公開は行いません。

開発者は G-5u の [local-only preview route](../local-only-admin-preview-route.md) と組み合わせて、この資料を使ってください。

---

## Included files

| ファイル | 内容 |
| --- | --- |
| [demo-script.md](./demo-script.md) | 顧客デモの進行台本（何をどの順番で見せるか） |
| [demo-checklist.md](./demo-checklist.md) | デモ前・デモ中・デモ後のチェックリスト |
| [customer-explanation.md](./customer-explanation.md) | 顧客向け説明文（CMS Kit とは何か、できること・まだできないこと） |
| [customer-feedback-form.md](./customer-feedback-form.md) | デモ後に顧客から聞く項目（ヒアリング用） |
| [screenshot-guide.md](./screenshot-guide.md) | スクリーンショット取得手順（資料作成・共有用） |
| [demo-safety-notes.md](./demo-safety-notes.md) | 安全注意（本番に影響しないこと、開発者向け注意） |
| [post-demo-next-steps.md](./post-demo-next-steps.md) | デモ後の次の進め方 |

---

## Related technical materials

| 資料 | 用途 |
| --- | --- |
| [local-only-admin-preview-route.md](../local-only-admin-preview-route.md) | 開発者向け — ローカルで preview を開く手順 |
| [musician-basic-admin-prototype.md](../musician-basic-admin-prototype.md) | 開発者向け — prototype の技術説明 |
| [customer-admin-manual-musician-basic.md](../customer-admin-manual-musician-basic.md) | 顧客向け — 導入後の運用マニュアル（将来用） |
| [customer-admin-quick-checklist-musician-basic.md](../customer-admin-quick-checklist-musician-basic.md) | 顧客向け — 更新前後の1ページチェックリスト |
| [admin-prototype-preview-harness.md](../admin-prototype-preview-harness.md) | 開発者向け — preview harness と safety checklist |

---

## How to use this package

1. **デモ前:** [demo-checklist.md](./demo-checklist.md) と [demo-safety-notes.md](./demo-safety-notes.md) を確認する。
2. **preview 起動:** `ENABLE_ADMIN_PREVIEW=true npm run dev` で [local preview route](../local-only-admin-preview-route.md) を開く。
3. **デモ中:** [demo-script.md](./demo-script.md) に沿って画面を見せ、[customer-explanation.md](./customer-explanation.md) で補足説明する。
4. **デモ後:** [customer-feedback-form.md](./customer-feedback-form.md) でヒアリングし、[post-demo-next-steps.md](./post-demo-next-steps.md) で次の段階を整理する。
5. **資料作成:** 必要なら [screenshot-guide.md](./screenshot-guide.md) に従って画面キャプチャを用意する。

---

## Safety status

| 項目 | 状態 |
| --- | --- |
| Local preview only | **Yes** — `import.meta.env.DEV` + `ENABLE_ADMIN_PREVIEW=true` |
| Scaffold only | **Yes** — 試作画面、完成版ではない |
| Mock data only | **Yes** — サンプルデータ、実データではない |
| `customerDemoReady` | **limited** — 資料は揃ったが、実ログイン・保存・公開は未接続 |
| Real login | **No** |
| Save | **No** |
| Upload | **No** |
| Publish | **No** |
| Production disabled | **Yes** |
| Supabase Auth / DB / Storage | **not connected** |
| GitHub dispatch / FTP deploy | **not performed** |

---

## Next phases

| Phase | 内容 |
| --- | --- |
| **G-5w** | Explicit opt-in admin scaffold writer |
| **G-5x** | Staging runtime shell integration |
| **G-5y** | Supabase Auth staging integration |

---

*G-5v: customer demo package. Docs only. No runtime / Auth / DB / Storage / Publish connection.*
