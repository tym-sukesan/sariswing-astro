# Not-yet Capabilities（まだできないこと / 意図的に無効）

G-5z-f 時点では **write・本番接続・デプロイ** はすべて無効です。

| 機能 | 状態 | なぜまだ無効か |
| --- | --- | --- |
| **保存** | 無効 | RLS と rollback 設計を確認してから有効化します |
| **新規作成** | 無効 | write adapter と approval gate が G-6 以降の対象です |
| **更新** | 無効 | 誤上書き防止のため、staging QA 後に段階導入します |
| **削除** | 無効 | 復元手順と RLS write policy レビュー後に扱います |
| **復元** | 無効 | バックアップ・履歴設計が未実装です |
| **画像アップロード** | 無効 | Storage 接続と virus scan / サイズ制限の設計が先です |
| **公開サイト更新** | 無効 | 誤公開を防ぐため、approval gate と staging QA 後に扱います |
| **GitHub dispatch** | 無効 | CI/CD 連携は本番提供判断後に設計します |
| **FTP deploy** | 無効 | 本番デプロイ経路は staging 完了後に限定します |
| **`/admin` 本番接続** | 無効 | staging shell での検証が完了するまで接続しません |
| **production publish** | 無効 | `productionReady: false` — 本番データは触りません |

## 顧客への一言

「今は **見る・試す・要望を出す** 段階です。**触って本番が変わる** 操作は意図的に付けていません。」

## G-6-c で見えるがまだ無効な操作

G-6-c では各 module 下部に **Write actions — disabled** セクションがあり、将来の操作が **ボタン無効** で表示されます。クリックしても何も起きません。

## 次に有効化する際の前提

- G-6-a: write operation safety plan（完了）
- G-6-b: RLS write policy review（完了）
- G-6-c: disabled write action scaffold（完了 — UI only）
- G-6-d: staging profile update PoC（approval 後）
- 顧客ごとの schema / 項目の確定
- 明示的な approval ID（G-5z-c と同様のゲート）
