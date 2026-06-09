# Admin UI Components Registry

**Phase:** G-5k registry + **G-5l shell scaffold**  
**Status:** 10 low-risk components scaffolded — not connected to runtime

関連:

- [admin-cms-code-inventory.md](./admin-cms-code-inventory.md) — G-5j Sariswing admin inventory
- [admin-ui-shell-scaffold.md](./admin-ui-shell-scaffold.md) — **G-5l** UI shell scaffold
- [admin-crud-ui-scaffold.md](./admin-crud-ui-scaffold.md) — **G-5m-a** CRUD UI scaffold
- [admin-auth-abstraction-scaffold.md](./admin-auth-abstraction-scaffold.md) — **G-5m-b** Auth abstraction
- [admin-media-upload-abstraction.md](./admin-media-upload-abstraction.md) — **G-5n** Media upload abstraction
- [admin-publish-workflow-abstraction.md](./admin-publish-workflow-abstraction.md) — **G-5o** Publish workflow abstraction
- [admin-cms-template-extraction-plan.md](./admin-cms-template-extraction-plan.md) — G-5i extraction plan
- Registry JSON: [`config/admin/admin-ui-components-registry.json`](../config/admin/admin-ui-components-registry.json)
- Inspect CLI: [`scripts/inspect-admin-ui-components.mjs`](../scripts/inspect-admin-ui-components.mjs)

---

## 1. Purpose

CMS Kit 標準 Admin へ抽出する **reusable admin UI components** 候補を整理し、抽出優先順位・リスク・依存関係を registry として固定します。

G-5k では **コード抽出・移動・共通化は行いません**。G-5j inventory の観察結果を設計入力に registry 化するのみです。

---

## 2. Source

| 入力 | 内容 |
| --- | --- |
| **G-5j inventory** | 55 admin-related files、reusable 33 / site-specific 10 / risky 12 |
| **Proven site** | Sariswing（本番運用中の参照実装） |
| **Sariswing 構成** | client auth、`admin-*` Edge CRUD、`AdminDeployBar` publish、`image-upload.ts` |

Inventory CLI（再実行）:

```bash
node tools/static-to-astro/scripts/inventory-admin-cms.mjs --root .
```

---

## 3. Component categories

| Category | 用途 |
| --- | --- |
| `layout` | ページシェル、カード、ヘッダー |
| `navigation` | ダッシュボードメニュー、戻るリンク |
| `feedback` | ステータス、空状態、ローディング、確認 |
| `form` | フィールド、編集フォーム |
| `table` | リスト / テーブル、ページネーション |
| `crud` | 公開トグル、並び順、複製、論理削除 |
| `media` | 画像アップロード、メディアライブラリ |
| `auth` | ガード、ログイン、パスワードリセット |
| `publish` | サイト公開ボタン、デプロイ状態、GitHub dispatch |
| `module` | News / Schedule / Links / Profile モジュール UI |
| `utility` | Edge Function クライアント等 |

---

## 4. Early extraction candidates

低リスク候補（`doNotExtractYet: false`、`suggestedPhase: G-5l`）:

| componentId | 説明 |
| --- | --- |
| `admin-layout` | Admin ページシェル |
| `admin-nav` | ダッシュボードナビ |
| `admin-page-header` | タイトル + 戻る + アクション |
| `admin-card` | セクションカード |
| `admin-status-message` | 成功 / エラー表示 |
| `admin-confirm-dialog` | 破壊的操作の確認 |
| `admin-empty-state` | データなし表示 |
| `admin-loading-state` | 読み込み中表示 |
| `admin-form-field` | ラベル + 入力 + ヒント |
| `admin-data-table` | リスト / ページネーション |

**なぜ先に抽出できるか:**

- DB / Storage / Publish に直接触れない
- 見た目と構造の共通化が容易
- `cms-template-registry` / site config との連携がしやすい
- Sariswing 既存挙動を壊さず、CMS Kit `templates/admin-cms/` に **新規 scaffold** として作れる

---

## 5. Later extraction candidates

高リスク候補（`doNotExtractYet: true`）:

| componentId | suggestedPhase | 理由 |
| --- | --- | --- |
| `admin-auth-guard` | G-5m | RLS / `ADMIN_EMAILS` 設定ミスで全 admin 停止 |
| `admin-login-form` | G-5m | Supabase Auth 連携 |
| `admin-password-reset` | G-5m | リダイレクト URL / staging vs prod |
| `admin-image-uploader` | G-5n | Storage path + RLS + resize 規約 |
| `admin-media-library` | G-5n | Storage 一覧・再利用 |
| `admin-publish-button` | G-5o | 本番 GHA dispatch 即実行リスク |
| `admin-deploy-status` | G-5o | GitHub polling |
| `admin-github-dispatch-client` | G-5o | GitHub token / production FTP |
| `admin-edge-function-client` | G-5m | service role 隔離前提の API 層 |

**方針:** Auth / Storage / Publish は分離し、安全 gate 設計後に抽出する。

---

## 6. Component registry

Registry: [`config/admin/admin-ui-components-registry.json`](../config/admin/admin-ui-components-registry.json)

### 主要フィールド

| フィールド | 意味 |
| --- | --- |
| `componentId` | 安定 ID（抽出フェーズで参照） |
| `category` | 上記カテゴリ |
| `status` | `candidate`（draft registry） |
| `reusablePotential` | `low` / `medium` / `high` |
| `extractionDifficulty` | `low` / `medium` / `high` |
| `risk` | `low` / `medium` / `high` |
| `suggestedPhase` | 推奨実装フェーズ |
| `targetSiteTypes` | 対象 siteType 配列 |
| `sourceHints` | Sariswing 上の参照パス（移動しない） |
| `dependencies` | 他 componentId への依存 |
| `siteSpecificConcerns` | Sariswing 固有の注意点 |
| `doNotExtractYet` | `true` なら今は抽出禁止 |
| `notes` | 設計メモ |

### Inspect CLI

```bash
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --risk high
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --category layout
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --extractable-only
```

Safety flags（常に false）: `uploadPerformed`, `dbUpdatePerformed`, `ftpDeployPerformed`, `githubDispatchPerformed`

---

## 7. Extraction readiness matrix

| Component | Category | Reusable potential | Difficulty | Risk | Suggested phase | Extract now? |
| --- | --- | --- | --- | --- | --- | --- |
| admin-layout | layout | high | low | low | G-5l | yes |
| admin-nav | navigation | high | low | low | G-5l | yes |
| admin-page-header | layout | high | low | low | G-5l | yes |
| admin-card | layout | high | low | low | G-5l | yes |
| admin-status-message | feedback | high | low | low | G-5l | yes |
| admin-confirm-dialog | feedback | high | low | low | G-5l | yes |
| admin-empty-state | feedback | high | low | low | G-5l | yes |
| admin-loading-state | feedback | high | low | low | G-5l | yes |
| admin-form-field | form | high | low | low | G-5l | yes |
| admin-data-table | table | high | low | low | G-5l | yes |
| admin-edit-form | form | high | medium | medium | G-5m | no |
| admin-publish-toggle | crud | high | medium | medium | G-5m | no |
| news-admin-ui | module | high | medium | medium | G-5m | no |
| schedule-admin-ui | module | high | high | medium | G-5m | no |
| profile-admin-ui | module | high | medium | medium | G-5m | no |
| admin-auth-guard | auth | high | medium | high | G-5m | no |
| admin-login-form | auth | high | medium | high | G-5m | no |
| admin-image-uploader | media | high | high | high | G-5n | no |
| admin-publish-button | publish | high | high | high | G-5o | no |
| admin-github-dispatch-client | publish | high | high | high | G-5o | no |

**Extract now?** = G-5k 完了後、次フェーズで抽出してよいか（G-5k 自体では抽出しない）。

Registry 全 28 件の詳細は inspect CLI または JSON を参照。

---

## 8. Recommended extraction order

```txt
G-5k: registry / plan（本フェーズ・完了）
G-5l: low-risk UI shell components scaffold
G-5m: form/table CRUD primitives + module UIs + auth abstraction
G-5n: media upload abstraction
G-5o: publish workflow abstraction
G-5p: musician-basic admin prototype（staging only）
G-5q: customer admin manual（doc）
```

| Phase | 内容 | Write |
| --- | --- | --- |
| G-5k | Admin UI components registry（**本書**） | doc + registry JSON のみ |
| G-5l | AdminLayout / AdminNav / PageHeader / Card / StatusMessage / FormField / DataTable | CMS Kit scaffold のみ |
| G-5m | Edit form、CRUD controls、News / Schedule / Profile module UI、Auth | write-local |
| G-5n | Image uploader + schema adapter storageMappings | staging（承認後） |
| G-5o | Publish button + deploy status + workflow 分離 | staging dispatch（承認後） |
| G-5p | musician-basic prototype | staging only |

---

## 9. Safety gates before extraction

抽出実装（G-5l 以降）の前に必ず確認:

1. **Sariswing admin の既存挙動を壊さない** — 移動・rename 禁止。copy-based または greenfield scaffold
2. **production publish 系は最後** — `admin-publish-button` / `admin-github-dispatch-client` は `doNotExtractYet: true`
3. **Auth / RLS / Storage / Publish を分離** — 一括抽出しない
4. **visual / UX 差分を確認** — 日本語ラベルは site config 化
5. **GitHub dispatch は実行しない** — 設計・read-only inspect のみ
6. **secrets を registry / report に出さない** — env 変数名のみ
7. **G-4 / G-5c〜j の成功フローを壊さない** — upload / DB / FTP CLI は既存のまま

---

## 10. G-5l scaffold（完了）

**Low-risk UI shell components** — [admin-ui-shell-scaffold.md](./admin-ui-shell-scaffold.md)

| componentId | scaffoldPath |
| --- | --- |
| admin-layout | `templates/admin-cms/components/AdminLayout.astro` |
| admin-nav | `templates/admin-cms/components/AdminNav.astro` |
| admin-page-header | `templates/admin-cms/components/AdminPageHeader.astro` |
| admin-card | `templates/admin-cms/components/AdminCard.astro` |
| admin-status-message | `templates/admin-cms/components/AdminStatusMessage.astro` |
| admin-confirm-dialog | `templates/admin-cms/components/AdminConfirmDialog.astro` |
| admin-empty-state | `templates/admin-cms/components/AdminEmptyState.astro` |
| admin-loading-state | `templates/admin-cms/components/AdminLoadingState.astro` |
| admin-form-field | `templates/admin-cms/components/AdminFormField.astro` |
| admin-data-table | `templates/admin-cms/components/AdminDataTable.astro` |

- `scaffoldStatus: created`, `productionReady: false`, `connectedToRuntime: false`
- Sariswing admin **未変更**
- Auth / Storage / Publish **未接続**

## 11. G-5m-a scaffold（完了）

**CRUD primitives + module UI** — [admin-crud-ui-scaffold.md](./admin-crud-ui-scaffold.md)

| componentId | scaffoldPath |
| --- | --- |
| admin-edit-form | `templates/admin-cms/components/AdminEditForm.astro` |
| admin-publish-toggle | `templates/admin-cms/components/AdminPublishToggle.astro` |
| admin-sort-order-control | `templates/admin-cms/components/AdminSortOrderControl.astro` |
| admin-duplicate-button | `templates/admin-cms/components/AdminDuplicateButton.astro` |
| admin-logical-delete-restore | `templates/admin-cms/components/AdminLogicalDeleteRestore.astro` |
| news-admin-ui | `templates/admin-cms/modules/NewsAdminUi.astro` |
| schedule-admin-ui | `templates/admin-cms/modules/ScheduleAdminUi.astro` |
| profile-admin-ui | `templates/admin-cms/modules/ProfileAdminUi.astro` |
| links-admin-ui | `templates/admin-cms/modules/LinksAdminUi.astro` |

- `implementedInPhase: G-5m-a`, `productionReady: false`, `connectedToRuntime: false`
- No Supabase query / DB update / Auth / Storage / Publish

## 12. G-5m-b scaffold（完了）

**Auth UI + permissions model** — [admin-auth-abstraction-scaffold.md](./admin-auth-abstraction-scaffold.md)

| componentId | scaffoldStatus | notes |
| --- | --- | --- |
| admin-login-form | created | UI only — no Supabase Auth |
| admin-password-reset | created | UI only |
| admin-auth-status | created | Display scaffold |
| admin-permission-badge | created | Role badge |
| admin-access-denied | created | 403 panel |
| admin-auth-guard | **planned** | Not implemented — requires RLS design |

## 13. G-5n scaffold（完了）

**Media upload UI + policy** — [admin-media-upload-abstraction.md](./admin-media-upload-abstraction.md)

| componentId | scaffoldStatus |
| --- | --- |
| admin-image-uploader | created |
| admin-media-library | created |
| admin-media-preview | created |
| admin-media-rights-notice | created |
| admin-storage-mapping-badge | created |

- Aligns with schema adapter `storageMappings`
- Supabase Storage upload **not implemented**

## 14. G-5o scaffold（完了）

**Publish workflow UI + policy** — [admin-publish-workflow-abstraction.md](./admin-publish-workflow-abstraction.md)

| componentId | scaffoldStatus |
| --- | --- |
| admin-publish-button | created |
| admin-deploy-status | created |
| admin-publish-approval-gate | created |
| admin-publish-history | created |
| admin-publish-environment-badge | created |
| admin-github-dispatch-client | **planned** |
| admin-edge-function-client | **planned** |

## 15. Next phase — G-5p

**musician-basic admin prototype** — staging only

---

## Registry summary（G-5k〜G-5o）

| Metric | Count |
| --- | --- |
| Total components | **37** |
| Extractable now (`doNotExtractYet=false`) | **19** |
| Deferred (`doNotExtractYet=true`) | **9** |
| Low risk | **11** |
| Medium risk | **8** |
| High risk | **9** |
| G-5l scaffolded | **10** |
| G-5m-a scaffolded | **9** |
| G-5m-b scaffolded | **5** |
| G-5n scaffolded | **5** |
| G-5o scaffolded | **5** |
| G-5m-b planned (auth-guard) | **1** |
| G-5m phase (remaining) | **4** |
| G-5n phase | **2** |
| G-5o phase | **3** |

---

*G-5k: registry. G-5l: shell. G-5m-a: CRUD. G-5m-b: Auth. G-5n: Media. G-5o: Publish. Sariswing untouched.*
