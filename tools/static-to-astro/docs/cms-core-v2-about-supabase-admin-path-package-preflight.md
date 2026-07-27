# CMS Core v2 — About Supabase Admin-path staging package preflight

**Phase:** `cms-core-v2-about-supabase-admin-path-package-preflight`
**Status:** **preflight complete** — package bake / FTP **not executed**
**Date:** 2026-07-27
**Prior:** Edge post-deploy QA **PASS** ([result](./cms-core-v2-about-supabase-save-dry-run-edge-post-deploy-qa-result.md))
**FTP QA checklist:** [ftp-post-qa](./cms-core-v2-about-supabase-ftp-post-qa.md) §B
**Verifier:** `scripts/verify-cms-core-v2-about-supabase-admin-path-package-preflight.mjs`

| Check | Status |
| --- | --- |
| Edge remote QA PASS | **yes** |
| Admin path env scope locked | **yes** |
| Save arms stay false / unset | **yes** |
| Contents / JSON fallback retained | **yes** |
| Package generate executed | **no** |
| FTP executed | **no** |
| Production touched | **no** |

---

## Gates

```txt
phase: cms-core-v2-about-supabase-admin-path-package-preflight
ABOUT_SUPABASE_ADMIN_PATH_PACKAGE_PREFLIGHT_COMPLETE: true
readyForAboutSupabaseAdminPathPackageGenerate: true
ADMIN_ABOUT_SUPABASE_CUTOVER_EXECUTED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
SAVE_ARM_ENABLED: false
GOSAKI_ABOUT_SUPABASE_SAVE_ARMED_SET: false
PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED: false
REGISTRY_SITE_PAGE_FIELDS: false
CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: unset
CONTENTS_ABOUT_PATH_RETAINED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
SERVICE_ROLE_USED: false
PRODUCTION_UNCHANGED: true
```

**Do not generate package / FTP** until a separate execution phase with operator intent. This preflight only locks env + commands + QA.

---

## 1. Goal

Bake a **staging** Gosaki package where Admin About uses Supabase Edge (`gosaki-about-supabase-save-dry-run`) for live-read / dry-run, while:

- Client Save UI stays **disarmed**
- Server Save arm stays **unset**
- Public About stays **JSON SoT** (no build-read cutover)
- Contents G-12a code path remains available as rollback (path flag off package)

---

## 2. Env scope (locked)

| Env | Value for this package | Scope / effect |
| --- | --- | --- |
| `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED` | **`true`** | Bake-time only · About admin `data-gosaki-about-write-backend=supabase` · dry-run/save endpoints → `…/gosaki-about-supabase-save-dry-run` |
| `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED` | **`false`** (explicit) | About Save button stays disabled |
| `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` | **unset** (do not set Secret) | Edge Save stays `save_not_armed` |
| `PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED` | **`false`** / unset | Contents About Save stays off (single-arm) |
| `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ` | **unset** | Public About remains JSON |
| `registry.supabaseFeatures.sitePageFields` | **false** (unchanged) | No registry persistence cutover |

### What path flag does **not** change

- Schedule / Discography / YouTube / Contact admin routes (separate flags)
- Public `/about/` HTML SoT (JSON until build-read phase)
- Edge Secrets · RLS · seed · production Supabase

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

Equivalent npm (same env exports required):

```bash
cd tools/static-to-astro
# with the same exports in the shell
npm run build:gosaki:staging
npm run verify:manual-upload
```

| Item | Value |
| --- | --- |
| Output | `tools/static-to-astro/output/manual-upload/gosaki-piano/` |
| Upload contents | **contents** of `public-dist/` |
| Remote target (later FTP) | `/cms-kit-staging/gosaki-piano/` |
| Preview base | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |

**STOP:** production profile · `vsbvndwuajjhnzpohghh` · Save arm true · build-read env on · auto FTP.

---

## 4. Local package QA (after generate — future execution)

Inspect baked HTML (no FTP yet):

| Check | Expect |
| --- | --- |
| `public-dist/admin/about/index.html` (or admin shell about) | `data-gosaki-about-write-backend="supabase"` |
| Dry-run / save endpoint attrs | host `kmjqppxjdnwwrtaeqjta` · path `/functions/v1/gosaki-about-supabase-save-dry-run` |
| Contents About endpoints | not used as live About dry-run/save when path on |
| `data-gosaki-about-save-armed` | `"false"` |
| Save UI | disabled / not allowed |
| Other admin pages | Schedule / Discography / YouTube unchanged behavior |
| Public `/about/` in package | JSON lede still present (no sitePageFields build-read) |
| production ref | only as STOP constant · not live API host |

---

## 5. FTP + browser QA (after generate — operator · not this phase)

Manual overwrite-only · no `mirror --delete` · staging path only · see [ftp-post-qa](./cms-core-v2-about-supabase-ftp-post-qa.md) §B.

| # | Check | Expect |
| --- | --- | --- |
| 1 | `/admin/about/` login | OK |
| 2 | write-backend | `supabase` (DOM / data attr) |
| 3 | owner dry-run | 200 · `ok:true` · `didWrite:false` · `profile.lede` plan |
| 4 | Save button | disabled |
| 5 | optional Save probe | 403 `save_not_armed` · `ok:false` (do not arm) |
| 6 | `/admin/` Schedule / Discography / YouTube | still OK |
| 7 | Public `/about/` | lede visible · no blank |
| 8 | production | untouched |

**Rollback:** re-upload prior package with path flag **off** (Contents backend).

---

## 6. Deploy readiness decision

| Question | Answer |
| --- | --- |
| Admin-path package へ進めるか | **YES** — preflight PASS · Edge QA PASS |
| Generate now in this phase? | **NO** |
| Save arm? | **NO** |
| FTP now? | **NO** |

```txt
readyForAboutSupabaseAdminPathPackageGenerate: true
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
```

**Next phase:** `cms-core-v2-about-supabase-admin-path-package-generate` (env stack above · verify:manual-upload · no FTP until operator).
