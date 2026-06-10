# Post-demo Next Steps

**用途:** 顧客デモ後の進め方（制作側・顧客双方）  
**前提:** [customer-feedback-form.md](./customer-feedback-form.md) のヒアリング完了

---

## 1. フィードバック整理

デモ直後に、次の観点でメモを整理してください。

| カテゴリ | 整理内容 |
| --- | --- |
| 必須機能 | これがないと導入できない項目 |
| 不要機能 | 削除・非表示でよい項目 |
| 追加項目 | テンプレートにないが欲しい機能 |
| デザイン要望 | 色・レイアウト・文言の希望 |
| 運用不安 | ログイン、画像、公開、サポートなど |

優先度を **必須 / あると良い / 後回し** の3段階に分けます。

---

## 2. 実データ接続前に決めること

技術作業の前に、顧客と合意しておく項目です。

| 項目 | 確認内容 |
| --- | --- |
| 管理者 | 誰が admin 権限を持つか |
| 更新担当者 | editor 権限を誰に渡すか |
| 画像素材 | どの写真を使うか、権利はクリアか |
| ドメイン | 既存ドメインの継続か、新規取得か |
| サーバー / ホスティング | 運用形態の合意 |
| 支払い方法 | 初期費用・月額の合意 |
| 公開タイミング | ざっくりの希望時期 |

---

## 3. 技術ステップ（制作側）

顧客デモ（G-5v）の次は、段階的に runtime 接続へ進みます。**いきなり本番には接続しません。**

| 順序 | ステップ | Phase 参考 |
| --- | --- | --- |
| 1 | Staging 環境の準備 | G-5x 以降 |
| 2 | Site config の確定 | G-5s dry-run ベース |
| 3 | Schema adapter の確認 | G-5e |
| 4 | Admin scaffold generation（opt-in） | G-5w |
| 5 | Local preview で再確認 | G-5u |
| 6 | Staging runtime shell 接続 | G-5x |
| 7 | Read-only data 接続 | G-5z |
| 8 | CRUD staging 接続 | G-6a |
| 9 | Media upload（staging） | G-6b |
| 10 | Publish workflow（staging） | G-6c |
| 11 | Production readiness review | G-6d |
| 12 | Production integration（明示承認後） | G-6e |

各段階で **approval gate** を通過してから次へ進みます。詳細は [admin-runtime-integration-plan.md](../admin-runtime-integration-plan.md) を参照してください。

---

## 4. 顧客確認が必要なもの

実データ接続・本番公開の前に、顧客から確認・承認を得る項目です。

| 項目 | タイミング |
| --- | --- |
| 画像権利 | 素材提出時・公開前 |
| プロフィール文・文言 | staging 確認時 |
| 公開範囲（どのページを出すか） | staging 確認時 |
| 本番公開承認 | production 反映の直前 |
| 月額運用内容 | 契約時・更新時 |

---

## 5. 顧客への次回連絡

デモ後、顧客には次のような流れを伝えると分かりやすいです。

1. **今日のフィードバックを整理してお返しします**（数日以内）
2. **必要な機能と優先順位を一緒に確定します**
3. **staging（確認用サイト）を用意し、そこで実際の更新を試していただきます**
4. **問題なければ、本番公開の日程を相談します**（必ず承認後）

---

## 6. 制作側の内部チェック

- [ ] フィードバックを [customer-feedback-form.md](./customer-feedback-form.md) 形式で記録した
- [ ] 必須 / 後回しを分類した
- [ ] site config 変更が必要か判断した
- [ ] staging 作成の見積もり・スケジュールを共有した
- [ ] 本番 deploy・実 DB 接続はまだ行っていない

---

## 関連資料

- [demo-script.md](./demo-script.md)
- [customer-explanation.md](./customer-explanation.md)
- [admin-runtime-integration-plan.md](../admin-runtime-integration-plan.md)
- [customer-admin-manual-musician-basic.md](../customer-admin-manual-musician-basic.md)

---

*G-5v: post-demo next steps. Planning doc only.*
