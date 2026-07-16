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

## Discography operational edit UI (G-20u40 local)

STG / local Discography was browse-first with prototype dry-run on every album card.

Fix (source + dry-run verify only — **no** Save · package · FTP):

- Shared `AdminGosakiStagingDiscographyContentPanel` — **view mode** (album list + 編集する) → **edit mode** (1 album)
- Editable: title / artist / release_date / label / purchase_url / description / tracks（1行=1曲 textarea）
- Unsaved banner · cancel confirm · album switch confirm
- Dry-run: existing STG Edge endpoint + `expectedBeforeUpdatedAt` preserved · Save disabled
- Jacket: display only · 「画像変更は後続フェーズ」
- Shared chrome: `AdminGosakiStagingEditToolbar` · `AdminGosakiStagingSaveDisabledStatus`
- Client: `gosaki-staging-discography-operational-edit.ts`

```txt
DISCOGRAPHY_VIEW_EDIT_MODE_IMPLEMENTED: true
DISCOGRAPHY_TRACKLIST_MULTILINE_IMPLEMENTED: true
DISCOGRAPHY_UNSAVED_GUARD_IMPLEMENTED: true
DISCOGRAPHY_DRY_RUN_CONNECTED: true
DISCOGRAPHY_OPTIMISTIC_LOCK_PRESERVED: true
DISCOGRAPHY_SAVE_REMAINS_DISABLED: true
DISCOGRAPHY_IMAGE_EDIT_DEFERRED: true
FRESH_PACKAGE_REUPLOAD_REQUIRED: true
```

## Discography STG browser QA (G-20u40 operator)

Operator manual FTP + STG browser QA on package `sourceCommit: 82cec1508a793c0d4367358960b39c0a1c865a96`.

STG URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/discography/`

- View mode: 4 albums · thumbnails/meta · 編集する · public Discography link · Save disabled · forms collapsed by default
- Edit mode: 1 album · scalar fields · tracklist textarea (1 line = 1 track)
- Unsaved guards · dry-run UI · Save disabled
- Mobile / desktop layout OK · no obvious UI errors

```txt
DISCOGRAPHY_STG_BROWSER_QA_PASSED: true
DISCOGRAPHY_OPERATIONAL_EDIT_UI_STG_READY: true
DISCOGRAPHY_SAVE_REMAINS_DISABLED: true
DISCOGRAPHY_DB_WRITE_EXECUTED: false
P1-DISCOGRAPHY-EDIT-UI: resolved
operatorManualFtpUpload: true
uploadedPackageSourceCommit: 82cec1508a793c0d4367358960b39c0a1c865a96
```

**No** Save execution · **no** DB write · **no** Cursor FTP in this recording phase.

## Discography gated Save UI wiring (G-20u41 local)

Operational edit UI now wires **gated Save** to the existing staging Edge Function (`gosaki-discography-save-dry-run`).

- **Dry-run:** `operation=dryRun` · approval `G-20u31-gosaki-discography-save-dry-run-endpoint`
- **Save:** same endpoint URL · `operation=save` · approval `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice`
- **Payload:** same field values as dry-run (`release` · `tracksText` · `expectedBeforeUpdatedAt` from snapshot)
- **Gates (all required):** authenticated · dry-run success · no post-dry-run mutation · `expectedBeforeUpdatedAt` present · env arm `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED` · approval match (candidate from `data-g20u41-discography-save-approval-id` vs expected `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` — not the same binding) · not `saveInFlight`
- **UI:** dry-run ok banner · **single** Save card（disabled reason / env arm / dry-run 必須）· Save in-flight · success · validation · conflict (no auto-retry)
- **Default STG package:** Save button **disabled** (`PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED` unset/false)
- **G-20u41 STG QA follow-up (UI only):** fieldset `legend` float regression → **section + heading** form groups · duplicate Save disabled status removed · toolbar flex-wrap · **Save gate logic unchanged**

```txt
DISCOGRAPHY_GATED_SAVE_UI_WIRED: true
DISCOGRAPHY_SAVE_DEFAULT_DISABLED: true
DISCOGRAPHY_DRY_RUN_REQUIRED_BEFORE_SAVE: true
DISCOGRAPHY_POST_DRY_RUN_MUTATION_RELOCKS_SAVE: true
DISCOGRAPHY_OPTIMISTIC_LOCK_SAVE_PRESERVED: true
DISCOGRAPHY_SAVE_IN_FLIGHT_GUARD: true
DISCOGRAPHY_CONFLICT_UI_IMPLEMENTED: true
DISCOGRAPHY_FIELDSET_HEADING_MOBILE_FIXED: true
DISCOGRAPHY_FIELD_GROUP_LAYOUT_REGRESSION_FIXED: true
DISCOGRAPHY_SAVE_UI_DEDUPLICATED: true
DISCOGRAPHY_SAVE_BUTTON_COUNT: 1
DISCOGRAPHY_SAVE_REMAINS_DISABLED: true
SAVE_GATE_LOGIC_UNCHANGED: true
DISCOGRAPHY_DB_WRITE_EXECUTED: false
FRESH_PACKAGE_REUPLOAD_REQUIRED: true
```

## Discography form layout + gated Save STG browser QA (G-20u41 operator final)

Operator manual FTP + STG browser QA on package `sourceCommit: 930a2fb9569d510e185813e91631ab6512854c82`.

STG URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/discography/`

- **desktop:** PASS · **mobile:** PASS
- Form groups: 基本情報 / リンク・説明 / 収録曲 headings OK · section + heading（fieldset/legend 崩れなし）
- Controls full-width: タイトル · 購入URL · 説明文 · 曲名（1行=1曲）· 巨大空白なし · 右端潰れなし · 横スクロールなし
- Save: card ×1 · button ×1 · **disabled** · Save request **not** executed · DB write **not** executed · obvious UI error: none

```txt
DISCOGRAPHY_STG_FORM_LAYOUT_QA_PASSED: true
DISCOGRAPHY_FIELD_GROUP_LAYOUT_REGRESSION_RESOLVED: true
DISCOGRAPHY_GATED_SAVE_UI_STG_QA_PASSED: true
DISCOGRAPHY_SAVE_REMAINS_DISABLED: true
SAVE_NETWORK_REQUEST_EXECUTED: false
DB_WRITE_EXECUTED: false
G-20u41: completed
operatorManualFtpUpload: true
uploadedPackageSourceCommit: 930a2fb9569d510e185813e91631ab6512854c82
```

**No** Save enablement · **no** Save click · **no** DB write · **no** Cursor FTP in this recording phase.

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
DISCOGRAPHY_STG_BROWSER_QA_PASSED: true
DISCOGRAPHY_OPERATIONAL_EDIT_UI_STG_READY: true
DISCOGRAPHY_DB_WRITE_EXECUTED: false
P1-DISCOGRAPHY-EDIT-UI: resolved
DISCOGRAPHY_GATED_SAVE_UI_WIRED: true
DISCOGRAPHY_SAVE_DEFAULT_DISABLED: true
DISCOGRAPHY_DRY_RUN_REQUIRED_BEFORE_SAVE: true
DISCOGRAPHY_POST_DRY_RUN_MUTATION_RELOCKS_SAVE: true
DISCOGRAPHY_OPTIMISTIC_LOCK_SAVE_PRESERVED: true
DISCOGRAPHY_SAVE_IN_FLIGHT_GUARD: true
DISCOGRAPHY_CONFLICT_UI_IMPLEMENTED: true
DISCOGRAPHY_STG_FORM_LAYOUT_QA_PASSED: true
DISCOGRAPHY_FIELD_GROUP_LAYOUT_REGRESSION_RESOLVED: true
DISCOGRAPHY_GATED_SAVE_UI_STG_QA_PASSED: true
DISCOGRAPHY_SAVE_REMAINS_DISABLED: true
SAVE_NETWORK_REQUEST_EXECUTED: false
DISCOGRAPHY_DB_WRITE_EXECUTED: false
G-20u41: completed
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

G-20u42-gosaki-discography-controlled-save-enablement-preflight
