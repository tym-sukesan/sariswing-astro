# Demo Safety Notes — Musician Basic Admin

**対象:** デモを行う開発者・制作担当者  
**目的:** 顧客デモを安全に行うための注意事項

---

## 顧客向けに伝えること

デモの前後で、次を明確に伝えてください。

| 項目 | 説明 |
| --- | --- |
| Local-only preview | 開発用の確認画面であり、本番の管理画面ではありません |
| 本番サイトに影響しない | お客様の公開中サイトは一切変更されません |
| 実保存されない | ボタンを押しても、データは保存されません |
| 実アップロードされない | 画像を選んでも、サーバーに送られません |
| 実公開されない | 公開ボタンは試作表示であり、本番には反映されません |
| Production publish は無効 | 本番公開機能は無効化されています |
| 顧客承認なしで公開しない | 正式導入後も、本番反映は必ず承認後です |
| 画像権利確認が必要 | 導入時は、使用許可のある素材のみ使います |
| Staging 確認を必ず挟む | 本番前に、確認用サイトで必ずチェックします |

---

## 開発者向け注意

### やってはいけないこと

| 禁止事項 | 理由 |
| --- | --- |
| 本番 URL でデモする | 本番 admin・本番データに触れるリスク |
| 実 env や secret を画面共有する | 漏洩防止 |
| 実 DB に接続する | 顧客データ・本番データの保護 |
| Supabase Auth で実ログインする | runtime 未接続フェーズ |
| Storage upload を実行する | 意図しないファイル保存 |
| GitHub dispatch / FTP deploy を実行する | 意図しない公開 |
| `npm run build` + deploy をデモのついでに行う | production 混入防止 |
| 顧客の実 PII を無断で資料に載せる | プライバシー保護 |

### やるべきこと

| 推奨事項 | 詳細 |
| --- | --- |
| local preview route を使う | `/__admin-preview/musician-basic/` + `ENABLE_ADMIN_PREVIEW=true` |
| scaffold-only バナーを見せる | 試作であることを画面上で確認 |
| mock data であることを口頭でも伝える | 誤解防止 |
| [demo-checklist.md](./demo-checklist.md) を完了する | デモ前後の漏れ防止 |
| [preview-safety-checklist.md](../../templates/admin-cms/preview/preview-safety-checklist.md) を確認する | harness 側の安全チェック |

---

## 技術的な安全状態（G-5v 時点）

| 項目 | 状態 |
| --- | --- |
| Route | `/__admin-preview/musician-basic/`（`/admin/` ではない） |
| Gate | `ENABLE_ADMIN_PREVIEW=true` + `import.meta.env.DEV` |
| Supabase Auth | not connected |
| DB query / update | not performed |
| Storage upload | not performed |
| GitHub dispatch | not performed |
| FTP deploy | not performed |
| Production disabled | **Yes** |
| `customerDemoReady` | limited（資料は揃ったが runtime 未接続） |
| `productionReady` | false |
| `connectedToRuntime` | false |

---

## 万が一のとき

- 誤って本番操作しそうになったら、**デモを中断** して環境を確認する。
- 顧客に「本番には影響していない」ことを再度伝える。
- 不明点は [admin-runtime-integration-plan.md](../admin-runtime-integration-plan.md) と [local-only-admin-preview-route.md](../local-only-admin-preview-route.md) を参照する。

---

## 関連資料

- [demo-checklist.md](./demo-checklist.md)
- [local-only-admin-preview-route.md](../local-only-admin-preview-route.md)
- [admin-prototype-preview-harness.md](../admin-prototype-preview-harness.md)

---

*G-5v: demo safety notes. Docs only. No runtime connection.*
