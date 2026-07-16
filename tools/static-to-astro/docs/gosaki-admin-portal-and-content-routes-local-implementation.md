# G-20u39b3 — Gosaki admin portal and content routes (local implementation)

Phase: `G-20u39b3-gosaki-admin-portal-and-content-routes-local-implementation`  
Date: 2026-07-16  
Planning basis: `gosaki-admin-operational-ui-information-architecture-planning.md` (G-20u39b2)  
HEAD at start: `3b1e305` (= `origin/main`, clean)

## Scope

Local implementation only:

- Operator shell portal cleanup (`/__admin-staging-shell/musician-basic/admin/`)
- Shared nav + safety chips on content routes
- Developer-facing content moved into `<details>` (local + STG read-only template display cleanup)
- **No** package generation · public-dist · FTP · STG upload · Save enable · DB write · Edge · `src/pages/admin/**`

## Routes (local shell)

| Route | Role |
| --- | --- |
| `/__admin-staging-shell/musician-basic/admin/` | Portal only — cards + status + public preview link |
| `…/admin/schedule/` | Schedule operator UI (existing) |
| `…/admin/discography/` | Discography operator UI (existing) |
| `…/admin/youtube/` | YouTube operator UI (existing) |
| `…/admin/about/` | About operator UI (existing) |

Contact / Link / Settings: **not** added this phase.

Relative IA mirrors target `/admin/…` (STG package multi-route inject = **G-20u39b4**).

## Portal changes

- Title: **Gosaki Piano CMS**
- Compact chips: テスト環境 · 閲覧のみ
- Portal cards with status: 閲覧可能 / dry-run可能 / 準備中
- Shared `AdminGosakiStagingNav`
- Public preview link
- Minimal operator hint (公開反映は管理者が行う)
- No content lists/forms on home

## Content pages

Each of Schedule / Discography / YouTube / About:

- Page title
- `← 管理トップへ`
- Shared nav
- Safety chips including Save disabled
- Existing read / dry-run / auth / Save-disabled behavior preserved

## Developer content cleanup

**Retained on main UI:** テスト環境 · 閲覧のみ · Save disabled · short “公開反映は管理者” note

**Moved to `<details>`:** siteSlug · build snapshot · phase IDs · PoC / dry-run notes · FTP / production STOP essays · HubSpot IDs (STG Contact section)

**Removed from main UI:** large disabled Save/Publish/Deploy/FTP button row · upload-safety dashboard card · long FTP/STOP banners

**Unchanged:** production package policy (`includesAdmin: false` for production profile) · Save gates remain disabled by default · safety gates kept (display-only cleanup)

## STG package template note

`GosakiStagingReadOnlyAdminPage.astro` remains a **single-page** inject for STG until G-20u39b4. This phase only cleans operator-facing copy/layout on that template. Multi-route `/admin/schedule/` etc. on the online package is **not** implemented here.

## Gates

```txt
ADMIN_PORTAL_LOCAL_IMPLEMENTED: true
INDIVIDUAL_ADMIN_ROUTES_LOCAL_IMPLEMENTED: true
DEVELOPER_CONTENT_CLEANUP_IMPLEMENTED: true
SAVE_REMAINS_DISABLED: true
STG_PACKAGE_AND_BROWSER_QA_REQUIRED: true
packageGenerationExecuted: false
ftpUploadExecuted: false
saveEnabled: false
srcPagesAdminModified: false
serviceRoleUsed: false
```

## Files touched (implementation)

- `templates/admin-cms/gosaki/components/AdminGosakiStagingNav.astro` (new)
- `templates/admin-cms/gosaki/components/AdminGosakiStagingSafetyChips.astro` (new)
- `templates/admin-cms/gosaki/components/AdminGosakiStagingOperatorHome.astro`
- `templates/admin-cms/gosaki/components/AdminGosakiStagingShellLayout.astro`
- `templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro`
- `templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro`
- `templates/admin-cms/gosaki/components/AdminGosakiStagingYoutubeOperatorPage.astro`
- `templates/admin-cms/gosaki/components/AdminGosakiStagingAboutOperatorPage.astro`
- `templates/admin-cms/styles/admin.css`
- `templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro`
- `templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.css`

## Verifier

```bash
npm run verify:g20u39b3-gosaki-admin-portal-and-content-routes-local-implementation
```

## Recommended next

`G-20u39b4-gosaki-admin-multi-route-staging-package-and-manual-upload-prep`
