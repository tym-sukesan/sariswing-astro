# CMS Core v2 — About Supabase Admin read/hydrate Admin-path staging package preflight

**Phase:** `cms-core-v2-about-supabase-admin-read-hydrate-admin-path-package-preflight`
**Status:** **preflight complete** — package bake / FTP **not executed**
**Date:** 2026-07-28
**Prior:** Edge re-deploy + post-redeploy QA **PASS** ([result](./cms-core-v2-about-supabase-admin-read-hydrate-edge-post-deploy-qa-result.md))
**FTP checklist:** [ftp-post-qa](./cms-core-v2-about-supabase-ftp-post-qa.md) §D (read/hydrate)
**Verifier:** `scripts/verify-cms-core-v2-about-supabase-admin-read-hydrate-admin-path-package-preflight.mjs`

| Check | Status |
| --- | --- |
| Edge `operation:"read"` remote QA PASS | **yes** |
| Admin client read/hydrate local impl present | **yes** |
| Save arms stay false / unset | **yes** |
| Public About JSON / build-read=false | **yes** |
| Contents fallback retained | **yes** |
| Package generate executed | **no** |
| FTP executed | **no** |
| Production touched | **no** |

---

## Gates

```txt
phase: cms-core-v2-about-supabase-admin-read-hydrate-admin-path-package-preflight
ABOUT_SUPABASE_ADMIN_READ_HYDRATE_ADMIN_PATH_PACKAGE_PREFLIGHT_COMPLETE: true
readyForAboutSupabaseAdminReadHydrateAdminPathPackageGenerate: true
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
SAVE_ARM_ENABLED: false
GOSAKI_ABOUT_SUPABASE_SAVE_ARMED_SET: false
PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED: false
REGISTRY_SITE_PAGE_FIELDS: false
CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: unset
PUBLIC_ABOUT_JSON_SOT: true
CONTENTS_ABOUT_PATH_RETAINED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
SERVICE_ROLE_USED: false
PRODUCTION_UNCHANGED: true
```

**Do not generate package / FTP** until a separate execution phase. This preflight locks env + commands + QA only.

---

## 1. Goal

Bake a **staging** Gosaki package where Admin About:

- `writeBackend=supabase`
- After owner login, live-read calls Edge `operation:"read"`
- Overlays **only** `profile.lede` from `site_page_fields`
- Keeps heading / bands / images from bake-time JSON
- Falls back to baked JSON on read failure (no raw error codes)
- Save UI stays **disarmed**; remote Save arm stays **unset**
- Public `/about/` stays **JSON SoT** (no build-read)

---

## 2. Env scope (locked)

| Env | Value for this package | Effect |
| --- | --- | --- |
| `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED` | **`true`** | About admin `data-gosaki-about-write-backend=supabase` · endpoint → `…/gosaki-about-supabase-save-dry-run` |
| `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED` | **`false`** | Save button disabled |
| `PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED` | **`false`** | Contents About Save off (single-arm) |
| `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` | **unset** | Edge Save stays `save_not_armed` |
| `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ` | **unset** | Public About remains JSON |
| `registry.supabaseFeatures.sitePageFields` | **false** | No public build-read cutover |

### Out of scope for this bake

- Schedule / Discography / YouTube / Contact Admin flags
- Public About HTML SoT change
- Edge Secrets / RLS / seed / production

---

## 3. Package generate command (documented — NOT executed)

From repo root `~/sariswing-astro`:

```bash
cd ~/sariswing-astro
export PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED=true
export PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED=false
export PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED=false
unset CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ
# Do NOT set GOSAKI_ABOUT_SUPABASE_SAVE_ARMED
node tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs
cd tools/static-to-astro && npm run verify:manual-upload
```

Equivalent:

```bash
cd tools/static-to-astro
# same exports in the shell
npm run build:gosaki:staging
npm run verify:manual-upload
```

| Item | Value |
| --- | --- |
| Output | `tools/static-to-astro/output/manual-upload/gosaki-piano/` |
| External marker | `output/manual-upload/_package-runs/gosaki-piano/PACKAGE_RUN.json` (not FTP payload) |
| Upload | **contents** of `public-dist/` only |
| Remote (later FTP) | `/cms-kit-staging/gosaki-piano/` |
| Preview base | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |

**STOP:** production profile · `vsbvndwuajjhnzpohghh` · Save arm true · build-read on · auto FTP.

---

## 4. Local package QA (after generate — future)

| Check | Expect |
| --- | --- |
| Admin About HTML | `data-gosaki-about-write-backend="supabase"` |
| Endpoint attrs | staging host `kmjqppxjdnwwrtaeqjta` · `/functions/v1/gosaki-about-supabase-save-dry-run` |
| Save armed attr | `"false"` |
| Client source in package | includes `operation:"read"` / `buildAboutSupabaseReadEndpointRequest` path (via baked JS) |
| Public `/about/` | JSON lede present · no sitePageFields build-read |
| External `PACKAGE_RUN` | present · HEAD match · bake fields · not inside `gosaki-piano/` FTP tree |

---

## 5. FTP + browser QA plan (after generate — operator · not this phase)

Manual FileZilla overwrite of `public-dist/` · no `mirror --delete` · staging only.

| # | Check | Expect |
| --- | --- | --- |
| 1 | `/admin/about/` login | OK |
| 2 | `writeBackend` | `"supabase"` |
| 3 | After login | `operation:"read"` runs (network / status ready) |
| 4 | Form | **only** profile.lede overlays Supabase `valueText` |
| 5 | Heading / bands / images | still baked JSON |
| 6 | Forced read failure (optional) | JSON fallback · no raw codes |
| 7 | Save | `saveDisabled: true` |
| 8 | Public `/about/` | unchanged vs JSON SoT |
| 9 | Schedule / Discography / YouTube Admin | no regression |
| 10 | production | untouched |

**Rollback:** re-upload prior package (path flag off or previous `sourceCommit`).

---

## 6. Deploy readiness decision

| Question | Answer |
| --- | --- |
| read/hydrate Admin-path package へ進めるか | **YES** — Edge post-redeploy QA PASS · preflight PASS |
| Generate now in this phase? | **NO** |
| Save arm? | **NO** |
| FTP now? | **NO** |

```txt
readyForAboutSupabaseAdminReadHydrateAdminPathPackageGenerate: true
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
```

**Next:** `cms-core-v2-about-supabase-admin-read-hydrate-admin-path-package-generate` (env stack above · `verify:manual-upload` · operator FTP later).
