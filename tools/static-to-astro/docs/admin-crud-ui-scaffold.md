# Admin CRUD UI Scaffold

**Phase:** G-5m-a — CRUD primitives + module UI scaffold  
**Status:** scaffold created — not connected to runtime  
**Location:** `templates/admin-cms/components/`, `modules/`, `examples/crud-example.astro`

関連:

- [admin-ui-shell-scaffold.md](./admin-ui-shell-scaffold.md) — G-5l shell components
- [admin-ui-components-registry.md](./admin-ui-components-registry.md) — G-5k registry
- Registry: [`config/admin/admin-ui-components-registry.json`](../config/admin/admin-ui-components-registry.json)

---

## 1. Purpose

G-5l の low-risk Admin UI shell の上に、CMS Kit 標準 Admin 用の **CRUD primitives + module UI scaffold** を追加しました。

- DB 接続・Supabase query・Auth guard・Storage upload・Publish workflow は**未接続**
- 既存 Sariswing admin コードは**未変更**
- `src/pages/admin/` には配置していない

---

## 2. Scope

### 対象

| 種別 | 件数 | 内容 |
| --- | --- | --- |
| CRUD primitives | 5 | Edit form, publish toggle, sort order, duplicate, logical delete/restore |
| Module UI | 4 | News, Schedule, Profile, Links |

### 対象外

- Auth guard
- Supabase query / client import
- DB update
- Storage upload
- Publish workflow / GitHub dispatch
- production admin / runtime routes

---

## 3. CRUD primitives

| Component | Purpose | Key props | Risk | Future connection |
| --- | --- | --- | --- | --- |
| **AdminEditForm** | 編集フォーム外枠 | `mode`, `submitLabel`, `disabled`, `dangerZone`, slots | medium | Edge API save handler (G-5m-b+) |
| **AdminPublishToggle** | published / draft UI | `published`, `label`, `disabled`, `name` | medium | `is_published` field update |
| **AdminSortOrderControl** | 表示順入力 | `value`, `min`, `max`, `disabled` | medium | `sort_order` persist |
| **AdminDuplicateButton** | 複製ボタン | `label`, `confirmMessage`, `disabled` | medium | Edge duplicate action |
| **AdminLogicalDeleteRestore** | 論理削除 / 復元 | `deleted`, `deleteLabel`, `restoreLabel`, `disabled` | medium | `deleted_at` / restore |

すべて `type="button"` または `disabled` — 実 action は発火しません。

---

## 4. Module UI scaffolds

| Module | Expected table/model | Status | Future connection |
| --- | --- | --- | --- |
| **NewsAdminUi** | `news` | scaffold only | `musician-basic-supabase-v1` news model |
| **ScheduleAdminUi** | `schedule` / events | scaffold only | schema adapter schedule fields + human review |
| **ProfileAdminUi** | `site_page` / profile | scaffold only | revision + restore_revision |
| **LinksAdminUi** | `links` | scaffold only | music-school / dance-school templates |

各 module は G-5l components + G-5m-a primitives を組み合わせた静的 scaffold です。

---

## 5. Example usage

`templates/admin-cms/examples/crud-example.astro`

- AdminLayout + AdminNav + 4 module UIs
- 静的 sample data（news / schedule / profile / links）
- **Scaffold example only** — not connected to runtime

```astro
import NewsAdminUi from "../modules/NewsAdminUi.astro";
import ScheduleAdminUi from "../modules/ScheduleAdminUi.astro";
```

Inspect:

```bash
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --phase G-5m-a
```

---

## 6. Safety

| Flag | Value |
| --- | --- |
| Sariswing admin modified | **false** |
| Connected to runtime | **false** |
| Supabase query | **none** |
| DB update | **none** |
| Storage | **not connected** |
| Publish | **not connected** |
| `productionReady` | **false** |
| `connectedToRuntime` | **false** |

---

## 7. Directory layout

```txt
templates/admin-cms/
  components/
    AdminEditForm.astro
    AdminPublishToggle.astro
    AdminSortOrderControl.astro
    AdminDuplicateButton.astro
    AdminLogicalDeleteRestore.astro
  modules/
    NewsAdminUi.astro
    ScheduleAdminUi.astro
    ProfileAdminUi.astro
    LinksAdminUi.astro
  examples/
    crud-example.astro
  styles/admin.css          # extended for CRUD + modules
```

---

## 8. Next phases

| Phase | 内容 |
| --- | --- |
| **G-5m-b（完了）** | [admin-auth-abstraction-scaffold.md](./admin-auth-abstraction-scaffold.md) |
| **G-5n（完了）** | [admin-media-upload-abstraction.md](./admin-media-upload-abstraction.md) |
| **G-5o** | Publish workflow abstraction |
| **G-5o** | Publish workflow abstraction |
| **G-5p** | musician-basic admin prototype（staging only） |

---

*G-5m-a: CRUD UI scaffold only. Sariswing admin untouched.*
