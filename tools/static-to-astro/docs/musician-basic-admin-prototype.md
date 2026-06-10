# Musician Basic Admin Prototype

**Phase:** G-5p — musician-basic admin prototype (scaffold integration)  
**Status:** prototype only — not connected to runtime

---

## 1. Purpose

G-5p combines the Admin CMS scaffolds from G-5l〜G-5o into a single **static prototype** for the `musician-basic` template. The goal is to preview the finished admin experience before any runtime integration.

This is **not** a production admin. It demonstrates how Dashboard, Profile, Schedule, Discography, Links, News, Media, and Publish modules compose together using CMS Kit scaffold components.

---

## 2. Scope

**In scope:**

- musician-basic admin prototype
- Dashboard / Profile / Schedule / Discography / Links / News / Media / Publish
- Auth / permission UI state (mock)
- Production readiness warning panel
- Scaffold integration from G-5l〜G-5o

**Out of scope:**

- Runtime admin routes (`src/pages/admin/` not used)
- Supabase Auth connection
- Supabase query / DB update
- Supabase Storage upload
- GitHub Actions dispatch
- Edge Function call
- FTP deploy
- Astro build / deploy
- Production admin

---

## 3. Prototype files

| File | Purpose |
| --- | --- |
| `templates/admin-cms/prototypes/musician-basic-admin-prototype.astro` | Full prototype page |
| `templates/admin-cms/prototypes/musician-basic-props.example.json` | Site / module metadata mock |
| `templates/admin-cms/prototypes/musician-basic-admin-sections.example.json` | Nav sections mock |
| `templates/admin-cms/modules/DiscographyAdminUi.astro` | Discography module scaffold (G-5p) |
| `templates/admin-cms/prototypes/README.md` | Prototype index |

---

## 4. Component composition

| Section | Components / modules |
| --- | --- |
| Header / status | `AdminLayout`, `AdminNav`, `AdminStatusMessage` |
| Dashboard | `AdminPageHeader`, `AdminCard`, `AdminPermissionBadge` |
| Auth / permissions | `AdminAuthStatus`, `AdminPermissionBadge`, `AdminAccessDenied` |
| Profile | `ProfileAdminUi` |
| Schedule | `ScheduleAdminUi` |
| Discography | `DiscographyAdminUi` |
| Links | `LinksAdminUi` |
| News | `NewsAdminUi` |
| Media | `AdminImageUploader`, `AdminMediaLibrary`, `AdminMediaPreview`, `AdminMediaRightsNotice`, `AdminStorageMappingBadge` |
| Publish | `AdminPublishButton`, `AdminDeployStatus`, `AdminPublishApprovalGate`, `AdminPublishHistory`, `AdminPublishEnvironmentBadge` |
| Readiness | `AdminStatusMessage` + safety checklist |

---

## 5. Data assumptions

Props and navigation are defined in example JSON files:

- `musician-basic-props.example.json` — site slug, template ID, schema adapter ID, module tables, safety flags
- `musician-basic-admin-sections.example.json` — section IDs, labels, required roles

**Future:** these will be generated from site config + template registry + schema adapter. The prototype currently inlines mock data in the Astro file for visual review.

---

## 6. Safety

| Item | Status |
| --- | --- |
| Existing Sariswing admin modified | **false** |
| Placed under `src/pages/admin/` | **false** |
| Connected to runtime | **false** |
| Supabase Auth | **not connected** |
| Supabase query | **not performed** |
| DB update | **not performed** |
| Storage upload | **not performed** |
| GitHub dispatch | **not performed** |
| FTP deploy | **not performed** |
| `productionReady` | **false** |
| `connectedToRuntime` | **false** |

---

## 7. Future integration plan

| Phase | Focus |
| --- | --- |
| **G-5q（完了）** | [Customer admin manual](./customer-admin-manual-musician-basic.md) — 顧客向け運用説明 |
| **G-5r（完了）** | [Admin prototype preview harness](./admin-prototype-preview-harness.md) — manifest + safety checklist |
| **G-5s（完了）** | [Site-config driven admin scaffold generator](./site-config-driven-admin-scaffold-generator.md) — dry-run package |
| **G-5t（完了）** | [Runtime integration plan](./admin-runtime-integration-plan.md) — planning only |
| **G-5u（完了）** | [Local-only preview route](./local-only-admin-preview-route.md) |
| **Later** | Runtime integration with explicit approval |

---

## 8. Customer manual（G-5q）

G-5p prototype は **開発者向け** の scaffold 統合見本です。G-5q で **顧客・運用者向け** の説明を追加しました。

| Doc | 対象 |
| --- | --- |
| [customer-admin-manual-musician-basic.md](./customer-admin-manual-musician-basic.md) | 顧客向け Admin Manual（本マニュアル） |
| [customer-admin-quick-checklist-musician-basic.md](./customer-admin-quick-checklist-musician-basic.md) | 1ページ Quick Checklist |

---

## 9. Preview harness（G-5r）

Registered in [preview-manifest.json](../templates/admin-cms/preview/preview-manifest.json):

| Field | Value |
| --- | --- |
| `prototypeId` | `musician-basic-admin-prototype` |
| `previewStatus` | `scaffold-ready` |
| `customerDemoReady` | **false** |

```bash
node tools/static-to-astro/scripts/inspect-admin-preview-harness.mjs
node tools/static-to-astro/scripts/inspect-admin-preview-harness.mjs --prototype musician-basic-admin-prototype
```

See [admin-prototype-preview-harness.md](./admin-prototype-preview-harness.md) and [preview-safety-checklist.md](../templates/admin-cms/preview/preview-safety-checklist.md).

---

## 10. Admin scaffold dry-run（G-5s）

Generate required Admin configuration from site config:

```bash
node tools/static-to-astro/scripts/generate-admin-scaffold-dry-run.mjs \
  --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json \
  --out-dir tools/static-to-astro/output/admin-scaffold-packages/gosaki
```

Output: sections, required components, permissions, storage mappings, publish policy, preview plan. **`output/` not committed.**

---

## 11. Local preview route（G-5u）

```bash
ENABLE_ADMIN_PREVIEW=true npm run dev
```

Open: `http://localhost:4321/__admin-preview/musician-basic/`

See [local-only-admin-preview-route.md](./local-only-admin-preview-route.md). **Not** `/admin/`. Default `ENABLE_ADMIN_PREVIEW=false`.

---

See [admin-runtime-integration-plan.md](./admin-runtime-integration-plan.md) for when runtime connection is allowed (G-5x+).

---

## Inspect

```bash
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --phase G-5p
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --category prototype
```

---

*G-5p: musician-basic admin prototype. Scaffold only. Sariswing untouched.*
