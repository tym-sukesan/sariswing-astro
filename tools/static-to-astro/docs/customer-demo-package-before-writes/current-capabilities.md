# Current Capabilities（現時点でできること）

G-5z-f 時点の CMS Kit **staging shell** で確認できる機能です。いずれも **read-only / 確認用** です。

## ルート・シェル

- staging shell を表示できる（`/__admin-staging-shell/musician-basic/`）
- 開発モード + env gate 外では安全に無効化される
- 本番 `/admin/` には接続していない

## 認証（Auth）

- ログイン UI を確認できる
- Supabase Auth **staging** 接続ができる（env 有効時・staging project のみ）
- mock Auth モードでデモできる（デフォルト推奨）

## ロール・許可リスト

- mock role / allowlist **表示** ができる（G-5y-e-a）
- ブラウザ上のロールは **情報表示** — 本番の厳密な権限 enforcement は未接続

## データ（read-only）

- read-only data preview ができる
- **profile / schedule / discography / links / news** を表示対象にできる
- mock provider（仮データ）と Supabase read-only provider を切り替え可能
- mock fallback がある（env で即 mock に戻せる）
- module 別 **ok / empty / error / rls-denied / fallback** 表示
- `canWrite: false` を UI で明示

## Write actions（G-6-c — disabled scaffold）

- module 別に **Save / Create / Delete / Publish** 等の将来操作を **disabled** 状態で表示できる
- approval gate ラベル（例: G-6-d-staging-profile-update-poc）を確認できる
- staging shell に write action overview セクションがある
- `writeOperationsEnabled: false` / `writeAdapterImplemented: false` を明示
- **実際の保存・削除・公開は行わない**（UI scaffold only）

## Profile update PoC（G-6-d — gated）

- staging shell で **profile テキスト更新 PoC** の UI がある（env gate + approval ID 必須）
- デフォルトは **disabled**（`ENABLE_ADMIN_STAGING_WRITE=false`）
- dry-run デフォルト（`PUBLIC_ADMIN_WRITE_DRY_RUN=true`）— update payload のみ、DB update なし
- gate 成立時のみ profile Save が有効化（他 module の write は無効のまま）
- before / after / rollback summary 表示
- `/admin` 未接続、本番データ未接続

## 安全・状態表示

- Storage 未接続、Publish 無効を表示できる
- `productionReady: false` を表示できる
- staging safety バナーで「本番管理画面ではない」ことを示せる

## ドキュメント・QA

- G-5z read-only phase の設計・QA レポートが揃っている
- 本パッケージで顧客デモ・QA が可能

## デモ起動（mock）

```bash
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_DATA_READ=false \
PUBLIC_ADMIN_DATA_PROVIDER=mock \
npm run dev
```
