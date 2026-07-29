# CMS Core v2 — About Supabase public build-read staging FTP post-QA result

- **Phase:** `cms-core-v2-about-supabase-public-build-read-staging-ftp-post-qa-result`
- **Status:** **COMPLETE / PASS**
- **Date:** 2026-07-28
- **Baseline HEAD / package `sourceCommit`:** `95ada81c8a408125370f089fb653660c702589ff`
- **Checklist:** [ftp-post-qa §C](./cms-core-v2-about-supabase-ftp-post-qa.md)
- **Prior:** [public build-read local implementation](./cms-core-v2-about-supabase-public-build-read-local-implementation.md) · [Save roundtrip result](./cms-core-v2-about-supabase-profile-lede-save-roundtrip-result.md)
- **Staging:** `kmjqppxjdnwwrtaeqjta`
- **Production:** `vsbvndwuajjhnzpohghh` **STOP / untouched**
- **FTP:** operator **manual** FileZilla only · `readyForAnyFutureFtpApply: false`
- **This record phase (Cursor):** docs + AI context only · **no** package / FTP / Edge / DB / Save arm / commit

---

## Gates

```txt
phase: cms-core-v2-about-supabase-public-build-read-staging-ftp-post-qa-result
ABOUT_SUPABASE_PUBLIC_BUILD_READ_STAGING_FTP_POST_QA_COMPLETE: true
ABOUT_SUPABASE_PUBLIC_BUILD_READ_STAGING_FTP_POST_QA_PASSED: true
ABOUT_SUPABASE_VERTICAL_SLICE_COMPLETE: true
ABOUT_SUPABASE_VERTICAL_SLICE_PASSED: true
sourceCommit: 95ada81c8a408125370f089fb653660c702589ff
sourceTreeClean: true
publicAboutBuildRead: true
pageFieldDataSource: supabase
fieldCount: 1
overlayOutcome: noop_equal
fallbackReason: absent
profileLedeOverlayApplied: false
verifyManualUploadPublicAboutBuildRead: PASS
writeBackend: supabase
saveUiArmed: false
saveDisabled: true
GOSAKI_ABOUT_SUPABASE_SAVE_ARMED: false
DB_BASELINE: true
PUBLIC_ABOUT_BUILD_READ_LIVE: true
REGISTRY_SITE_PAGE_FIELDS: false
CONTENTS_ABOUT_PATH_RETAINED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
SERVICE_ROLE_USED: false
PRODUCTION_UNCHANGED: true
readyForGosakiStagingClientReadyAudit: true
```

---

## 1. Package / verifier (operator) — PASS

| Item | Result |
| --- | --- |
| Bake | path `true` · Save UI **false** · Contents Save **false** · `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ=true` · registry `sitePageFields=false` |
| Clean-tree | `sourceTreeClean: true` |
| `sourceCommit` | **`95ada81c8a408125370f089fb653660c702589ff`** |
| Dedicated verify | `npm run verify:manual-upload:public-about-build-read` **PASS** |
| Report | `pageFieldDataSource=supabase` · `fieldCount=1` · `overlayOutcome=noop_equal` · no `fallbackReason` |
| PACKAGE_RUN | mirrors report · `publicAboutBuildRead=true` · `aboutSaveUiArmed=false` |

**Note:** `noop_equal` is **success** (DB lede === JSON first `<p>` baseline) — not a fallback.

---

## 2. Operator manual FTP — PASS

| Item | Value |
| --- | --- |
| Local | `public-dist/` contents |
| Remote | `/cms-kit-staging/gosaki-piano/` |
| Method | FileZilla **full overwrite** |
| Auto FTP / mirror `--delete` | **not used** |
| production | **not touched** |

---

## 3. Public `/about/` browser QA — PASS (ftp-post-qa §C + operator visual)

Base: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`

| # | Check | Result |
| --- | --- | --- |
| 1 | Forced reload of staging public `/about/` | **PASS** |
| 2 | Baseline opening lede visible | **PASS** (`後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。`) |
| 3 | Profile body / images / Bands | **PASS** |
| 4 | Layout | **PASS** (no breakage) |
| 5 | Header / nav / other page links | **PASS** |
| 6 | Operator visual confirmation | **PASS** |

---

## 4. About vertical slice — CLOSED COMPLETE / PASS

| Slice step | Status |
| --- | --- |
| Staging SQL / RLS / seed | COMPLETE (prior) |
| Dual-path Admin + Edge dry-run/Save contract | COMPLETE |
| Admin read/hydrate | **PASS** |
| profile.lede dry-run | **PASS** |
| Forward Save → restore Save | **PASS** · DB **baseline** |
| Remote Save arm | **`false`** |
| Save UI | **false** · `writeBackend=supabase` |
| Public build-read package + FTP + visual QA | **PASS** (this doc) |
| Contents G-12a / JSON fallback | **retained** |
| production | **未操作** |

**Kit Core About Supabase vertical slice (`about` / `profile.lede`) is formally COMPLETE / PASS.**

Optional later (not blocking client-ready audit): registry `sitePageFields=true` persistence · Contents About retire · production hosting gate.

---

## 5. Recommended next (Primary)

**Gosaki staging client-ready audit** — full-site readiness review (not Schedule-only):

- Public: Home · Schedule · Discography · YouTube · About · Contact · mobile
- Admin: `/admin/` routes (About / Schedule / Discography / YouTube as applicable)
- Confirm Save arms remain false · production STOP · staging URL share readiness

---

## 5b. Claude audit follow-up (2026-07-29) — recorded

- Verdict: **READY WITH NON-BLOCKING ITEMS** · BLOCKER **none**
- Vertical slice remains **CLOSED / COMPLETE / PASS**
- Finding 1 (`sourceCommit` `95ada81…` vs close HEAD `6cbffda…`): **RESOLVED** — docs-only delta (8 files under `tools/static-to-astro/docs/`)
- Full record: [Claude audit result](./cms-core-v2-about-supabase-vertical-slice-claude-audit-result.md)

---

## 6. This record phase verification

```bash
cd ~/sariswing-astro
node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-public-build-read-local-implementation.mjs
node tools/static-to-astro/scripts/verify-cms-core-v2-about-supabase-profile-lede-save-roundtrip-planning.mjs
git diff --check
```

**Not run in this record phase:** package · FTP · Secret · DB write · Edge · Save arm · commit / push.
