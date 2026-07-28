# CMS Core v2 — About Supabase public build-read local implementation

- **Phase:** `cms-core-v2-about-supabase-public-build-read-local-implementation`
- **Status:** **COMPLETE (local only at implementation time)** — package/FTP later executed · see [staging FTP post-QA PASS](./cms-core-v2-about-supabase-public-build-read-staging-ftp-post-qa-result.md)
- **Date:** 2026-07-28
- **Planning:** [public build-read planning](./cms-core-v2-about-supabase-public-build-read-planning.md)
- **Verifier:** `scripts/verify-cms-core-v2-about-supabase-public-build-read-local-implementation.mjs`
- **Staging:** `kmjqppxjdnwwrtaeqjta` · **Production:** `vsbvndwuajjhnzpohghh` **STOP**
- **Executed package `sourceCommit` (post-impl):** `95ada81c8a408125370f089fb653660c702589ff` · `overlayOutcome=noop_equal` · FTP post-QA **PASS**

```txt
phase: cms-core-v2-about-supabase-public-build-read-local-implementation
ABOUT_SUPABASE_PUBLIC_BUILD_READ_LOCAL_IMPLEMENTATION_COMPLETE: true
IMPLEMENTATION_EXECUTED: true
readyForAboutSupabasePublicBuildReadPackageGenerate: true
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
REGISTRY_SITE_PAGE_FIELDS: false
CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: unset (default)
PUBLIC_ABOUT_JSON_SOT: true
SAVE_ARM_ENABLED: false
GOSAKI_ABOUT_SUPABASE_SAVE_ARMED: false
PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED: false
SERVICE_ROLE_USED: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

Historical gates above remain the **implementation-phase snapshot** (`PACKAGE_GENERATE_EXECUTED: false` etc.). Operator package/FTP/QA outcome is recorded only in the staging FTP post-QA result doc.

---

## What changed

| Area | Change |
| --- | --- |
| Loader | Exactly **1** published row required · `fieldCount` · multi-row → `error` / `multiple_profile_lede_rows` |
| Overlay | Unchanged first-`<p>` · bands/images untouched |
| Evidence | `ABOUT_PUBLIC_BUILD_READ_REPORT.json` at convert out + package root |
| Overlay outcomes | `applied` (DB≠JSON) · `noop_equal` (DB=JSON · **success, not fallback**) |
| Fields | `pageFieldDataSource` · `overlayOutcome` · `profileLedeOverlayApplied` · `fieldCount` · `fallbackReason` (failure only) |
| PACKAGE_RUN | Mirrors evidence · `publicAboutBuildRead` from env · **`sourceTreeClean:true` required** |
| Verifier | Default still `publicAboutBuildRead=false` · `--expect-public-about-build-read` accepts `applied`/`noop_equal` |
| Clean-tree gate | Package generate **FAIL** if git working tree dirty · no dirty override for FTP packages |
| Cross-check | PACKAGE_RUN ↔ report ↔ public HTML · report required (PACKAGE_RUN alone FAIL) |
| Registry | `sitePageFields` **still false** |
| Admin / Save | **unchanged** |

---

## Success vs fallback

| Path | `pageFieldDataSource` | `overlayOutcome` | Public About |
| --- | --- | --- | --- |
| Env/registry off | `json` | `skipped` | JSON SoT |
| Anon missing | `not-configured` | failed | JSON |
| Production ref | `blocked` | failed | JSON |
| Network/PostgREST error | `error` | failed | JSON |
| 0 rows | `supabase-empty` | failed | JSON |
| >1 rows | `error` (`multiple_profile_lede_rows`) | failed | JSON |
| Empty `value_text` | `supabase-empty` | failed | JSON |
| Exactly 1 · DB ≠ JSON | `supabase` | **`applied`** | DB lede rewritten |
| Exactly 1 · DB = JSON | `supabase` | **`noop_equal`** (success · **not** fallback) | JSON lede already correct |

`fallbackReason` is set only on failure paths above — **not** for `noop_equal`.

---

## Operator package generate (next · not this phase)

```bash
export PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED=true
export PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED=false
export PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED=false
export CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ=true
# registry.sitePageFields stays false
# then: build gosaki staging package
cd tools/static-to-astro
npm run verify:manual-upload:public-about-build-read
# default npm run verify:manual-upload must FAIL on that package
```

---

## This phase verification

```bash
cd ~/sariswing-astro
node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-public-build-read-local-implementation.mjs
git diff --check
```

**Not run:** package generate · FTP · Secret · DB write · Edge · Save arm · commit / push.
