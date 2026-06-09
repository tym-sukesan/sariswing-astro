# Admin UI Shell Scaffold

**Phase:** G-5l — low-risk Admin UI shell components  
**Status:** scaffold created — not connected to runtime  
**Location:** `templates/admin-cms/components/`, `styles/`, `examples/`

関連:

- [admin-ui-components-registry.md](./admin-ui-components-registry.md) — G-5k registry
- [admin-cms-code-inventory.md](./admin-cms-code-inventory.md) — G-5j inventory
- Registry: [`config/admin/admin-ui-components-registry.json`](../config/admin/admin-ui-components-registry.json)

---

## 1. Purpose

G-5k の Admin UI Components Registry に基づき、CMS Kit 用の **low-risk Admin UI shell scaffold** を新規作成しました。

- 既存 Sariswing admin コードは**変更・移動・抽出していない**
- `src/pages/admin/` には配置していない
- 実プロジェクトの admin ルートには**接続していない**

---

## 2. Scope

### 対象

- layout / navigation / feedback / form / table の土台（10 components）
- 共有 CSS（`templates/admin-cms/styles/admin.css`）
- 組み合わせ例（`examples/dashboard-example.astro`）

### 対象外

- Auth / session guard
- Supabase query
- Storage upload
- Publish workflow / GitHub dispatch
- production admin
- Astro build / deploy への接続

---

## 3. Component list

| Component | Purpose | Key props | Risk | Future connection |
| --- | --- | --- | --- | --- |
| **AdminLayout** | Admin 画面の外枠 | `title`, `siteName`, `stagingLabel`, slots: `nav`, `status`, default | low | G-5m module pages、site config の siteName |
| **AdminNav** | モジュールナビ | `items[]`, `currentSection` | low | `cms-template-registry` adminModules |
| **AdminPageHeader** | ページタイトル + actions | `title`, `description`, slot `actions` | low | 各 CRUD ページヘッダー |
| **AdminCard** | 汎用カード | `title`, `description`, default slot | low | フォーム / リストのグループ化 |
| **AdminStatusMessage** | success / error / warning / info | `type`, `title`, `message` | low | Edge API レスポンス表示 |
| **AdminConfirmDialog** | 確認 UI（confirm 無効） | `id`, `title`, `message` | low | G-5m logical delete / publish confirm |
| **AdminEmptyState** | データなし | `title`, `message`, slot `action` | low | 空リスト時 |
| **AdminLoadingState** | 読み込み中 | `message` | low | API fetch 中 |
| **AdminFormField** | label + help + error + slot | `label`, `help`, `error`, default slot | low | schema adapter 駆動フィールド |
| **AdminDataTable** | 汎用テーブル | `columns`, `rows`, `showActionsColumn` | low | G-5m CRUD リスト（pagination は後） |

Registry 上はすべて `scaffoldStatus: created`, `productionReady: false`, `connectedToRuntime: false`。

---

## 4. Example usage

`templates/admin-cms/examples/dashboard-example.astro` は 10 コンポーネントの組み合わせ見本です。

- **Scaffold example only** — ルート未接続
- 静的 table rows、disabled ボタン
- Confirm dialog の destructive ボタンは `disabled`
- No DB update / No Storage upload / No publish dispatch

```astro
import AdminLayout from "../components/AdminLayout.astro";
import AdminNav from "../components/AdminNav.astro";
// …
```

Astro build への接続は G-5p（musician-basic prototype）以降で行う想定です。

---

## 5. Safety

| Flag | Value |
| --- | --- |
| Sariswing admin modified | **false** |
| Connected to runtime | **false** |
| Auth | **not included** |
| DB | **not connected** |
| Storage | **not connected** |
| Publish | **not connected** |
| `productionReady` | **false** |
| `connectedToRuntime` | **false** |

Inspect:

```bash
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --risk low
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --category layout
```

---

## 6. Directory layout

```txt
tools/static-to-astro/templates/admin-cms/
  README.md
  components/
    AdminLayout.astro
    AdminNav.astro
    AdminPageHeader.astro
    AdminCard.astro
    AdminStatusMessage.astro
    AdminConfirmDialog.astro
    AdminEmptyState.astro
    AdminLoadingState.astro
    AdminFormField.astro
    AdminDataTable.astro
  styles/
    admin.css
  examples/
    dashboard-example.astro
  src/                    # Phase 3-S runtime prototype (unchanged)
```

`src/` 配下の Phase 3-S prototype とは**独立**しています。

---

## 7. Next phases

| Phase | 内容 |
| --- | --- |
| **G-5m-a（完了）** | [admin-crud-ui-scaffold.md](./admin-crud-ui-scaffold.md) — CRUD primitives + module UI |
| **G-5m-b** | Auth abstraction plan or scaffold |
| **G-5n** | Media upload abstraction |
| **G-5o** | Publish workflow abstraction |
| **G-5p** | musician-basic admin prototype（staging only） |

---

*G-5l: shell scaffold. G-5m-a: CRUD UI scaffold. Sariswing admin untouched.*
