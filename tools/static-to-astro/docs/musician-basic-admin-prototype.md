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
| **G-5q** | Customer admin manual |
| **G-5r** | Prototype preview harness |
| **G-5s** | Site-config driven admin scaffold generator |
| **Later** | Runtime integration with explicit approval |

---

## Inspect

```bash
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --phase G-5p
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --category prototype
```

---

*G-5p: musician-basic admin prototype. Scaffold only. Sariswing untouched.*
