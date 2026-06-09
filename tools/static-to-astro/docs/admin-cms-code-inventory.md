# Sariswing Admin CMS Code Inventory (G-5j)

**Status:** read-only inventory — no code extraction, moves, or production operations  
**Input:** Sariswing repo `src/` + `supabase/functions/` + `.github/workflows/`  
**Detail report (local):** `output/admin-inventory/sariswing/ADMIN_CMS_INVENTORY_REPORT.md` (not committed)

関連:

- [admin-cms-template-extraction-plan.md](./admin-cms-template-extraction-plan.md) — G-5i extraction plan
- [admin-ui-components-registry.md](./admin-ui-components-registry.md) — **G-5k** Admin UI components registry
- [sariswing-vs-cms-kit-gap-analysis.md](./sariswing-vs-cms-kit-gap-analysis.md)
- Scanner: [`scripts/lib/admin-cms-inventory-scanner.mjs`](../scripts/lib/admin-cms-inventory-scanner.mjs)
- CLI: [`scripts/inventory-admin-cms.mjs`](../scripts/inventory-admin-cms.mjs)

---

## Purpose

G-5j は G-5i の extraction plan に基づき、**既存 Sariswing admin 実装を read-only で棚卸し**します。

- コード移動・共通化・rename は行わない
- secrets / env values は report に出さない（変数名のみ）

---

## How to run inventory

```bash
node tools/static-to-astro/scripts/inventory-admin-cms.mjs --root .
```

出力（gitignore）:

```txt
tools/static-to-astro/output/admin-inventory/sariswing/ADMIN_CMS_INVENTORY_REPORT.md
tools/static-to-astro/output/admin-inventory/sariswing/admin-cms-inventory.json
```

---

## Classification criteria

| Tag | 意味 |
| --- | --- |
| **reusable** | CMS Kit 標準 Admin に再利用できそう |
| **site-specific** | Sariswing 固有（schema / Instagram / 文言等） |
| **risky** | 抽出・変更時に壊れやすい（Auth / publish / Storage / service role） |
| **deprecated** | 将来整理候補（今回 0 件） |
| **unknown** | 追加調査が必要 |

---

## Inventory summary（最新スキャン）

| Metric | Count |
| --- | --- |
| Admin-related files | **55** |
| Admin pages | **8** |
| Admin components | **3** |
| lib + scripts | **29** |
| Edge functions (in scan) | 12 |
| **reusable** | **33** |
| **site-specific** | **10** |
| **risky** | **12** |
| **unknown** | **0** |
| Publish workflow refs | **6** |

Safety: `codeModified: false`, `githubDispatchPerformed: false`, `productionTouched: false`

---

## Admin routes

| Route | Path | Module | Classification |
| --- | --- | --- | --- |
| `/admin` | `src/pages/admin/index.astro` | dashboard | reusable |
| `/admin/login` | `src/pages/admin/login/index.astro` | auth | reusable |
| `/admin/forgot-password` | `src/pages/admin/forgot-password/index.astro` | auth | reusable |
| `/admin/reset-password` | `src/pages/admin/reset-password/index.astro` | auth | reusable |
| `/admin/news` | `src/pages/admin/news/index.astro` | news | reusable |
| `/admin/schedule` | `src/pages/admin/schedule/index.astro` | schedule | reusable |
| `/admin/instagram` | `src/pages/admin/instagram/index.astro` | instagram | site-specific |
| `/admin/about` | `src/pages/admin/about/index.astro` | about | reusable |

**Not found:** `/admin/sitemap` — sitemap は別経路または手動の可能性（要確認）

---

## Proven Sariswing modules（inventory 観点）

### Auth

- Client: `supabase-admin.ts`, `require-admin-session.ts`, login / reset scripts
- Edge: `admin-auth.ts` — `ADMIN_EMAILS` + `app_metadata.role`
- **Risk:** misconfiguration blocks all admin access

### News / Schedule

- Edge: `admin-news`, `admin-schedule` — CRUD + duplicate + logical delete + restore
- Client: `*-api.ts`, `create-*-list-item.ts`, page scripts
- **Schedule site-specific:** `venues`, `time_type`, `image_urls[]` schema

### Instagram

- Edge: `admin-instagram` + client list builders
- **Site-specific** — not in `musician-basic` template

### About / Site page

- Edge: `admin-site-page` — revisions + restore_revision
- Maps to CMS Kit **Profile / About**

### Publish workflow

- `AdminDeployBar.astro` → `trigger-deploy` Edge → GitHub `workflow_dispatch` → `deploy.yml` → FTP
- **Risky:** production workflow only（staging 分離なし）

### Media / Storage

- `image-upload.ts` — resize 1600px, WebP/JPEG/PNG, bucket `images`
- Prefixes: `news` / `schedule` / `discography`
- **Risky:** path conventions + client-side upload

---

## Extraction readiness matrix

| Module | Reusable potential | Extraction difficulty | Risk | Suggested phase |
| --- | --- | --- | --- | --- |
| UI shell (layout/nav/card) | high | low | low | G-5l |
| Auth | high | medium | high | G-5m |
| Dashboard | high | low | low | G-5l |
| News CRUD | high | medium | medium | G-5m |
| Schedule CRUD | high | high | medium | G-5m |
| About / Site page | high | medium | medium | G-5m |
| Instagram | low | medium | low | Later |
| Image upload | high | high | high | G-5n |
| Publish workflow | high | high | high | G-5o |
| musician-basic prototype | high | high | medium | G-5p |

---

## Key risks

1. **Sariswing を壊さない** — 移動前に inventory レビュー必須
2. **Publish** — `trigger-deploy` は本番 GHA を即 dispatch
3. **RLS / service role** — Edge のみ。ブラウザに service role を出さない
4. **Schema 差分** — Sariswing schedule ≠ musician-basic adapter
5. **Instagram** — CMS Kit 標準に含めない（Later）

---

## Recommendations

1. **G-5k（完了）:** reusable UI 候補を [admin-ui-components-registry.md](./admin-ui-components-registry.md) に registry 化（28 components）
2. **G-5l:** low-risk UI shell — AdminLayout / AdminNav / PageHeader / Card / StatusMessage / FormField / DataTable
3. **G-5m:** CRUD primitives + News / Schedule / Profile module UI + Auth abstraction
4. **G-5n:** `image-upload.ts` を schema adapter `storageMappings` に接続してから汎用化
5. **G-5o:** staging / production workflow 分離 + publish abstraction
6. **G-5p:** musician-basic prototype — News + Schedule + About + Publish（staging only）、Instagram 除外

---

## Next phase — G-5l

**Low-risk UI shell components scaffold**

- G-5k registry の `doNotExtractYet=false` + `suggestedPhase=G-5l` 候補（10 件）から開始
- Sariswing ファイルを移動せず、CMS Kit `templates/admin-cms/` に新規 scaffold
- Auth / Storage / Publish は触らない

---

*G-5j: read-only inventory. G-5k: registry / plan. Detail manifest in `output/` (not committed).*
