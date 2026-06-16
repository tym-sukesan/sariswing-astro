# Gosaki Supabase schedule read verification / preview package (G-9d1)

**Phase:** `G-9d1-gosaki-supabase-schedule-read-verification-preview-package`  
**Date:** 2026-06-17  
**Prior:** G-9d commit `6103250`  
**Type:** read-only verification + local preview package generation (no FTP)

---

## 1. Background

G-9d added Supabase anon read + static fallback for Gosaki schedule generation. G-9d1 verifies:

- env-less static-fallback convert/build
- Supabase read (when operator `.env.local` present)
- manual-upload preview package structure
- canonical routes, legacy stubs, sitemap

**No DB writes, no FTP, no manual upload.**

---

## 2. envなし static-fallback 確認

**Method:** Clear all Supabase env keys, run full pipeline:

```bash
cd tools/static-to-astro
PUBLIC_SUPABASE_URL= PUBLIC_SUPABASE_ANON_KEY= SUPABASE_URL= SUPABASE_ANON_KEY= \
node scripts/url-to-staging-pipeline.mjs \
  --config config/sites/gosaki-piano.url-to-staging.json \
  --no-dry-run --run-convert --run-build --prepare-public
```

**Result:** PASS

| Check | Result |
| --- | --- |
| `scheduleDataSource` | `static-fallback` (log + HTML comment) |
| Hub links | `/cms-kit-staging/gosaki-piano/schedule/YYYY-MM/` (5 months) |
| Month event counts | 13 / 10 / 12 / 11 / 14 |
| Legacy stubs | `/2026-XX/` thin stub, `noindex`, canonical → `/schedule/YYYY-MM/` |
| Build | convert + `--verify-build` + prepare-public PASS |

---

## 3. envあり Supabase read 確認

**Method:** `loadGosakiScheduleDataForBuild()` with operator `.env.local` (read-only).

**Result:** PASS (not deferred)

| Check | Result |
| --- | --- |
| `scheduleDataSource` | `supabase` |
| Row count | 60 |
| `site_slug` | `gosaki-piano` |
| Month counts | 13 / 10 / 12 / 11 / 14 |
| `source_route` | `/schedule/YYYY-MM/` (canonical) |
| `service_role` | not used |

Preview package was built with static-fallback (env cleared for reproducible offline package). Supabase read verified separately via read-only API test.

---

## 4. manual-upload package

**Generated:**

```bash
npm run manual-upload:package
npm run verify:manual-upload
```

**Package:** `output/manual-upload/gosaki-piano/` (gitignored)

**public-dist structure (20 files):**

```txt
public-dist/
├── index.html
├── schedule/
│   ├── index.html
│   ├── 2026-03/index.html
│   ├── 2026-04/index.html
│   ├── 2026-05/index.html
│   ├── 2026-06/index.html
│   └── 2026-07/index.html
├── 2026-03/index.html   (legacy stub)
├── 2026-04/index.html   (legacy stub)
├── 2026-05/index.html   (legacy stub)
├── 2026-06/index.html   (legacy stub)
├── 2026-07/index.html   (legacy stub)
├── _astro/index.*.css
├── robots.txt
├── sitemap-0.xml
└── sitemap-index.xml
```

`verify:manual-upload` PASS (`safeForStaticFtp: true`, `fileCount: 20`)

**Verifier update:** `verify-manual-upload-package.mjs` aligned to G-9c0 canonical routes (checks `schedule/YYYY-MM/` not legacy `/YYYY-MM/` for full content).

---

## 5. Spot-check summary

| Route | Check | Result |
| --- | --- | --- |
| `/schedule/` | 5 month links | PASS |
| `/schedule/2026-07/` | 14 event cards, `会場` text | PASS |
| `/schedule/2026-07/` | canonical self | PASS |
| `/2026-07/` | canonical → `/schedule/2026-07/` | PASS |
| `/2026-07/` | `noindex` | PASS |
| sitemap-0.xml | includes `/schedule/2026-07/` | PASS |
| sitemap-0.xml | excludes bare `/2026-07/` | PASS |

---

## 6. Safety

| Rule | Status |
| --- | --- |
| DB write / SQL | none |
| `service_role` | not used |
| FTP / upload | not executed |
| `.env.local` | not committed |
| `output/` | not committed |

---

## 7. Verification commands

```bash
node scripts/verify-gosaki-schedule-seed-extractor.mjs   # 61 passed
node scripts/verify-url-to-staging-pipeline.mjs          # 182 passed
node scripts/verify-crawl-static-site.mjs              # 30 passed
node scripts/verify-gosaki-font-safety.mjs               # 37 passed
npm run verify:manual-upload                             # PASS
```

---

## 8. Gates

```txt
gosakiSupabaseScheduleReadVerificationPreviewPackageComplete: true
gosakiScheduleStaticFallbackVerified: true
gosakiScheduleSupabaseReadVerified: true
gosakiManualUploadPackageGenerated: true
gosakiScheduleRoutesVerified: true
gosakiLegacyStubsVerified: true
gosakiScheduleSitemapCanonicalOnlyVerified: true
readyForG9d2ManualPreviewUpload: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

---

## 9. Next

- **G-9d2:** Operator manual preview upload to `/cms-kit-staging/gosaki-piano/` (separate approval)
- Optional: convert with Supabase env for `scheduleDataSource=supabase` in deployed HTML
