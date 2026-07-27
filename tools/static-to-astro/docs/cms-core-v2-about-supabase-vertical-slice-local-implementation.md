# CMS Core v2 — About Supabase Vertical Slice Local Implementation

- **Phase:** `cms-core-v2-about-supabase-vertical-slice-local-implementation`
- **Status:** **complete (local only)** — dual-path Admin + build wiring; **no Edge deploy / FTP / Save arm / SQL re-apply**
- **Date:** 2026-07-24
- **Staging DB:** migration / RLS / seed already applied (`kmjqppxjdnwwrtaeqjta`) — **do not re-run**
- **Production:** `vsbvndwuajjhnzpohghh` **STOP / unchanged**
- **Verifier:** `scripts/verify-cms-core-v2-about-supabase-vertical-slice.mjs`
- **FTP post QA:** [cms-core-v2-about-supabase-ftp-post-qa.md](./cms-core-v2-about-supabase-ftp-post-qa.md)

```txt
CMS_CORE_V2_ABOUT_SUPABASE_VERTICAL_SLICE_LOCAL_IMPLEMENTATION_COMPLETE: true
ABOUT_SUPABASE_IMPLEMENTATION_EXECUTED: true
ABOUT_SUPABASE_LOCAL_IMPLEMENTATION: true
EDGE_DEPLOY_EXECUTED: false
SAVE_ARM_ENABLED: false
CONTENTS_ABOUT_PATH_UNCHANGED: true
ADMIN_ABOUT_SUPABASE_CUTOVER_EXECUTED: false
BUILD_ABOUT_SUPABASE_CUTOVER_EXECUTED: false
REGISTRY_SITE_PAGE_FIELDS: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
SERVICE_ROLE_USED: false
PRODUCTION_UNCHANGED: true
```

---

## 1. Admin path

| Mode | Flag | Endpoints |
| --- | --- | --- |
| **Default** | `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED` unset/false | Contents: `gosaki-about-content-dry-run` / `gosaki-about-content-save` (G-12a) |
| **Opt-in Supabase** | `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED=true` | `gosaki-about-supabase-save-dry-run` (local stub · **undeployed**) |

- Slice field: `page_key=about` · `field_key=profile.lede` only
- Auth: user JWT + anon · `can_write_site` · optimistic lock `expectedBeforeUpdatedAt`
- Client Save arm: `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED` (default false)
- Server Save arm: `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` (default false → Save returns `save_not_armed`)
- Wire: `GosakiStagingReadOnlyAdminPage.astro` · `data-gosaki-about-write-backend`
- **G-12a Contents code retained** — not deleted

---

## 2. Public / build path

| Mode | Gate | Behavior |
| --- | --- | --- |
| **Default** | `registry.supabaseFeatures.sitePageFields=false` and env unset | JSON About SoT (`gosaki-piano-about-content.json`) via convert hook |
| **Opt-in DB** | `sitePageFields=true` **or** `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ=true` | anon SELECT published `profile.lede` → overlay first `<p>` in profile HTML |
| **Fallback** | empty / error / blocked production ref | keep JSON HTML (never blank About) |

Loader: `loadSitePageFieldsDataForBuild` · overlay: `applySitePageFieldsLedeToAboutConfig`

---

## 3. Flags / arms

| Flag | Default | Role |
| --- | --- | --- |
| `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED` | false | Admin opt-in |
| `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED` | false | Client Save UI |
| `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` | false | Server Save |
| `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ` | false | Build prefer DB |
| `registry.sitePageFields` | **false** | Persist gate (cutover later) |
| Contents G-12a arms | unchanged | Parallel path |

**Single-arm:** do not arm Contents About Save and Supabase About Save together.

---

## 4. Fallback

- Admin path flag off → Contents Edges (deployed)
- Supabase Edge undeployed → do **not** enable Admin path flag on staging until deploy + QA
- Build-read off / DB empty/error → JSON About content
- Save arms false → dry-run may work after Edge deploy; Save stays disabled

---

## 5. Approvals (reserved)

- Dry-run: `G-cms-v2-about-supabase-profile-lede-dry-run`
- Save: `G-cms-v2-about-supabase-profile-lede-web-save-non-dry-run-slice`
- Do **not** reuse `G-12a-*` or YouTube approvals

---

## 6. Package (local)

Default package (Contents/JSON path — no About Supabase cutover):

```bash
cd tools/static-to-astro
npm run manual-upload:package
npm run verify:manual-upload
```

Optional Admin-path package prep (later): bake with `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED=true` **only after** Edge deploy.

Optional build-read package prep (later): `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ=true` or registry `sitePageFields=true`.

---

## 7. Next gates

1. ~~Edge deploy preflight~~ → **COMPLETE**
2. ~~Edge post-deploy QA~~ → **PASS** ([result](./cms-core-v2-about-supabase-save-dry-run-edge-post-deploy-qa-result.md))
3. ~~Admin-path package preflight~~ → **COMPLETE** ([preflight](./cms-core-v2-about-supabase-admin-path-package-preflight.md))
4. Admin-path package generate (`PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED=true` · Save arms false) — **not executed**
5. Operator manual FTP + browser QA ([ftp-post-qa](./cms-core-v2-about-supabase-ftp-post-qa.md) §B)
6. Build-read package + public About QA (later)
7. Keep Save arms **false** until controlled Save round-trip phase

**Do not:** re-run migration/RLS/seed · production · auto FTP · Secret change · arm Save without approval
