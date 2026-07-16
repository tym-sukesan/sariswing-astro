# G-20u39b4 — Gosaki admin multi-route staging package prep

Phase: `G-20u39b4-gosaki-admin-multi-route-staging-package-and-manual-upload-prep`  
Date: 2026-07-16  
Basis: G-20u39b2 IA · G-20u39b3 local portal/routes  
HEAD at start: `ba286b1` (= `origin/main`, clean)

## Scope

Implement staging **static package generation wiring** so convert/apply emits multi-route `/admin/` pages that reuse G-20u39b3 portal / nav / safety chips.

- Dry-run / module verification only
- **No** real package generation · public-dist · FTP · STG upload · Save enable · SQL · Edge · `src/pages/admin/**` (repo production tree)

## STG browser QA follow-up (content UI restore)

STG QA after G-20u39b5 package: multi-route pages existed but content UI was incomplete (summary-only / auth-first).

Fix (source + dry-run only — no fresh package in this step):

- Shared panels under `templates/admin-cms/gosaki/components/`:
  - `AdminGosakiStagingScheduleContentPanel` (event list by month)
  - `AdminGosakiStagingAboutContentPanel` (Profile + Bands — see About form follow-up below)
  - `AdminGosakiStagingCompactAuthBar` (login compact · probe in details)
- `apply()` writes `gosaki-read-only-admin-schedule-events.json` and copies panels into package `gosaki-admin/`
- Discography / YouTube: content first, compact auth after (no 「YouTube dry-run用」 heading)
- Portal remains portal-only

```txt
STG_MULTI_ROUTE_UI_QA_PREVIOUS_RESULT: FAIL
SCHEDULE_CONTENT_UI_RESTORED: true
DISCOGRAPHY_CONTENT_UI_RESTORED: true
YOUTUBE_CONTENT_UI_RESTORED: true
ABOUT_CONTENT_UI_RESTORED: true
AUTH_UI_DEEMPHASIZED: true
DEVELOPER_DIAGNOSTICS_COLLAPSED: true
SAVE_REMAINS_DISABLED: true
FRESH_PACKAGE_REUPLOAD_REQUIRED: true
```

## About admin form + mobile preview follow-up (G-20u39b5 STG QA)

STG About QA: preview-only feel · Profile/Bands edit location unclear · iPhone SE 375px horizontal overflow / clipped right edge.

Fix (source + dry-run / local verify only — **no** fresh package / FTP / commit in this step):

- `AdminGosakiStagingAboutContentPanel` order: **About編集内容** (readonly labeled forms) → **公開時プレビュー** (responsive iframe `srcdoc`) → Save disabled note
- Profile / each Bands article: heading·body·image·alt from real snapshot HTML (no invented fields)
- `input`/`textarea` **readonly** + `aria-readonly` (not disabled-faded); Save button stays disabled
- Preview: iframe `width/max-width:100%` · `min-width:0` · viewport meta · srcdoc CSS resets fixed/min widths · **no** `overflow-x:hidden` / `transform:scale` clip hacks
- Public About CSS **unchanged**; admin preview wrapper / srcdoc only
- Local shell: `AdminGosakiStagingAboutOperatorPage` embeds the same ContentPanel; HTML dry-run stays in `<details>開発者情報`
- Verifier: `verify-g20u39b4-…` strengthened for form structure + preview CSS

```txt
ABOUT_ADMIN_FORM_AFFORDANCE_ADDED: true
ABOUT_PREVIEW_MOBILE_RESPONSIVE: true
ABOUT_FORM_BEFORE_PREVIEW: true
ABOUT_SAVE_REMAINS_DISABLED: true
PUBLIC_ABOUT_UNCHANGED: true
FRESH_PACKAGE_REUPLOAD_REQUIRED: true
```

## Routes prepared (generated under Astro outDir)

| Generated Astro page | Public route (with deployBase) |
| --- | --- |
| `src/pages/admin/index.astro` | `/cms-kit-staging/gosaki-piano/admin/` (portal only) |
| `src/pages/admin/schedule/index.astro` | `…/admin/schedule/` |
| `src/pages/admin/discography/index.astro` | `…/admin/discography/` |
| `src/pages/admin/youtube/index.astro` | `…/admin/youtube/` |
| `src/pages/admin/about/index.astro` | `…/admin/about/` |

Contact / Link / Settings: **not** generated.

## Reuse (no UI duplication)

- `AdminGosakiStagingOperatorHome` · `AdminGosakiStagingNav` · `AdminGosakiStagingSafetyChips` copied into package outDir as `src/components/gosaki-admin/*`
- Content panels above shared from the same `templates/admin-cms/gosaki/components/` tree
- Path imports rewritten to `gosaki-package-admin-paths.ts` (`BASE_URL` + `admin/…`)
- Shared chrome CSS: `templates/admin-cms/gosaki/styles/gosaki-admin-shell-chrome.css`

## Generation source

- `applyGosakiStagingReadOnlyAdmin()` writes component + 5 thin pages + chrome + content panels + paths + CSS + dashboard / discography / schedule-events JSON
- `GosakiStagingReadOnlyAdminPage.astro` is a multi-route component (`page` prop)

## Build-failure fix (multi-route anon allowlist)

`scanSupabaseKeyExposure` allowlists known staging anon only when:

1. `data-gosaki-read-only-admin="true"`
2. Path `admin/index.html` or `admin/**/index.html`
3. Exact `data-gosaki-supabase-anon-key="…"`
4. JWT payload `role === "anon"` (fail-closed)

## Gates

```txt
STAGING_ADMIN_MULTI_ROUTE_GENERATION_IMPLEMENTED: true
STAGING_ADMIN_MULTI_ROUTE_DRY_RUN_PASSED: true
MULTI_ROUTE_ANON_ALLOWLIST_FIXED: true
ALLOWLIST_IS_ATTRIBUTE_AND_VALUE_SCOPED: true
SERVICE_ROLE_REMAINS_BLOCKED: true
PUBLIC_HTML_KEY_EXPOSURE_REMAINS_BLOCKED: true
STG_MULTI_ROUTE_UI_QA_PREVIOUS_RESULT: FAIL
SCHEDULE_CONTENT_UI_RESTORED: true
DISCOGRAPHY_CONTENT_UI_RESTORED: true
YOUTUBE_CONTENT_UI_RESTORED: true
ABOUT_CONTENT_UI_RESTORED: true
AUTH_UI_DEEMPHASIZED: true
DEVELOPER_DIAGNOSTICS_COLLAPSED: true
SAVE_REMAINS_DISABLED: true
PRODUCTION_ADMIN_EXCLUSION_PRESERVED: true
FRESH_PACKAGE_GENERATION_REQUIRED_AFTER_COMMIT: true
FRESH_PACKAGE_REUPLOAD_REQUIRED: true
packageGenerationExecuted: false
ftpUploadExecuted: false
saveEnabled: false
srcPagesAdminModified: false
serviceRoleUsed: false
```

## Verifier

```bash
npm run verify:g20u39b4-gosaki-admin-multi-route-staging-package-prep
```

## Recommended next

Commit / Push後に fresh staging package 生成 · manual FTP · STG browser 再確認
(`G-20u39b5-gosaki-admin-multi-route-staging-package-generation-at-head`)
