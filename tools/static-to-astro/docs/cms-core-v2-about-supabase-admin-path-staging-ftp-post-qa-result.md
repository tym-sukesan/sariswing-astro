# CMS Core v2 — About Supabase Admin-path staging FTP post-QA result

- **Phase:** `cms-core-v2-about-supabase-admin-path-staging-ftp-post-qa-result`
- **Status:** **COMPLETE / PASS**
- **Date:** 2026-07-28
- **Checklist:** [ftp-post-qa §B](./cms-core-v2-about-supabase-ftp-post-qa.md)
- **Preflight:** [admin-path-package-preflight](./cms-core-v2-about-supabase-admin-path-package-preflight.md)
- **Prior Edge QA:** [post-deploy QA result](./cms-core-v2-about-supabase-save-dry-run-edge-post-deploy-qa-result.md)
- **UI leak fix (local):** `aboutValueTextRequiredUiLeakFixComplete: true` (hydrate skip + Japanese mapper)
- **Staging:** `kmjqppxjdnwwrtaeqjta`
- **Production:** `vsbvndwuajjhnzpohghh` **STOP / unchanged**
- **FTP:** operator **manual** FileZilla only · `readyForAnyFutureFtpApply: false`
- **Cursor this record phase:** docs only · no package / FTP / Edge / DB / Save arm / commit

---

## Gates

```txt
phase: cms-core-v2-about-supabase-admin-path-staging-ftp-post-qa-result
ABOUT_SUPABASE_ADMIN_PATH_STAGING_FTP_POST_QA_COMPLETE: true
ABOUT_SUPABASE_ADMIN_PATH_STAGING_FTP_POST_QA_PASSED: true
ADMIN_ABOUT_SUPABASE_PATH_LIVE: true
PACKAGE_GENERATE_EXECUTED: true
FTP_EXECUTED: true
sourceCommit: a876e1ebd4523d96b09d1ea46fd35748de27977e
writeBackend: supabase
saveDisabled: true
valueTextRequiredVisible: false
GOSAKI_ABOUT_SUPABASE_SAVE_ARMED_SET: false
SAVE_ARM_ENABLED: false
PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED: false
CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: unset / false
REGISTRY_SITE_PAGE_FIELDS: false
PUBLIC_ABOUT_JSON_SOT: true
DB_WRITE_EXECUTED: false
CONTENTS_ABOUT_PATH_RETAINED: true
packageStaleBackupAndRunMarkerWorkedThisGenerate: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
SERVICE_ROLE_USED: false
PRODUCTION_UNCHANGED: true
readyForAboutSupabaseAdminReadHydratePlanning: true
```

---

## 1. Package generate (operator) — PASS

| Item | Result |
| --- | --- |
| Bake env | `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED=true` · Save UI arm **false** · server arm **unset** · build-read **unset** |
| Astro build | **PASS** |
| static-public artifact | **PASS** |
| `verify:manual-upload` | **PASS** |
| `sourceCommit` | **`a876e1ebd4523d96b09d1ea46fd35748de27977e`** |
| External marker | `output/manual-upload/_package-runs/gosaki-piano/PACKAGE_RUN.json` (not in FTP payload) |
| Marker HEAD match | **PASS** (`sourceCommit` === package HEAD / verify freshness) |
| In-package `PACKAGE_RUN.json` | **absent** (fail-closed) |

### Stale package prevention (this generate) — PASS

| Step | Result |
| --- | --- |
| Pre-generate relocate | Prior live `output/manual-upload/gosaki-piano/` renamed to `_stale-backup/gosaki-piano/<timestamp>-<short-head>/` (same FS · no delete · no restore on failure) |
| Success path | New package written to live path + **external** `_package-runs` marker |
| Verify | Live package + external marker · `completed:true` · bake values · HEAD match |
| FTP payload | Operator uploaded **`public-dist/` only** (under `gosaki-piano/`) · `_package-runs` / `_stale-backup` **not** uploaded |

---

## 2. Operator manual FTP — PASS

| Item | Value |
| --- | --- |
| Local | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` |
| Remote | `/cms-kit-staging/gosaki-piano/` |
| Method | FileZilla **full overwrite** of `public-dist/` contents |
| Auto FTP / mirror / `--delete` | **not used** |
| production | **not touched** |

---

## 3. Browser / staging QA — PASS (ftp-post-qa §B)

| # | Check | Result |
| --- | --- | --- |
| 1 | `/admin/about/` display | **PASS** |
| 1b | `data-gosaki-about-write-backend` / writeBackend | **`"supabase"`** |
| 2 | Save disabled | **`saveDisabled: true`** |
| 2b | Client Save UI arm | **false** |
| 2c | Remote `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` | **unset** |
| 3 | `value_text_required` visible | **`false`** (raw code leak **resolved**) |
| 4 | Public pages display | **PASS** |
| 5 | Public About SoT | **JSON** · build-read **false** / unset |
| 6 | DB write | **none** |
| 7 | production | **unchanged** |

Notes:

- Dry-run against Supabase for `profile.lede` remains available (Edge post-deploy QA previously PASS; this FTP QA did not re-arm Save or write DB).
- Contents G-12a path retained in code (path-flag-off package rollback still possible).
- Schedule / Discography / YouTube not in scope of regression for this record; public pages overall **PASS**.

---

## 4. Not executed / still forbidden without new approval

- Cursor FTP / auto FTP apply
- Save arm enable (client or server)
- Secret change
- Edge redeploy
- SQL / DB write / seed re-run
- `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ` / `registry.sitePageFields` flip
- production / Wix
- commit / push (this docs phase)

---

## 5. Next

**Planning (docs only):** `cms-core-v2-about-supabase-admin-read-hydrate-planning`

Goal: Admin About initial values from latest `site_page_fields.profile.lede` (read-only hydrate), not bake-time JSON alone — without changing public About JSON path or enabling Save.
