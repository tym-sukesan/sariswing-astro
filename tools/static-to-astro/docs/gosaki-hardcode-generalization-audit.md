# G-20u1 — Gosaki hardcode generalization audit

**Phase:** `G-20u1-gosaki-hardcode-generalization-audit`  
**Status:** **complete** — audit / classification / roadmap only · **no large refactor**  
**Date:** 2026-07-09  
**Base commit:** `2c0dec3`  
**Prior:** G-20t1–t6 package safety + freshness gate

| Check | Status |
| --- | --- |
| Hardcode inventory | **yes** |
| Classification (4 tiers) | **yes** |
| Next-phase roadmap | **yes** |
| Implementation / FTP / DB | **not executed** |

---

## Gates

```txt
gosakiHardcodeGeneralizationAuditComplete: true
phase: G-20u1-gosaki-hardcode-generalization-audit
ftpUploadExecuted: false
deployExecuted: false
cursorDbWriteExecuted: false
largeRefactorExecuted: false
```

---

## 1. Purpose

Gosaki-piano を最初の実証サイトとして積み上げた結果、**スクリプト名・パス・verifier・lib フック・npm scripts** に Gosaki 固有のハードコードが散在している。Musician CMS Kit として 2 サイト目以降を追加する前に、変更箇所と一般化優先度を棚卸しする。

**本フェーズは調査のみ。** 大規模リネーム・実装変更は行わない。

---

## 2. Inventory scale (approx.)

| Category | Count | Notes |
| --- | ---: | --- |
| `docs/gosaki*.md` | ~343 | Phase history — retain as Gosaki archive |
| `scripts/verify-gosaki*.mjs` | 27 | Site-specific QA verifiers |
| `scripts/verify-g20*gosaki*.mjs` | 20 | Production/staging package phases |
| `scripts/lib/*gosaki*` | ~35 | Site hooks, overrides, env loaders |
| `config/sites/gosaki*` | 9 | Deploy + content + url-to-staging |
| `build-gosaki-*.mjs` | 2 | Staging admin + production package |

**Already generalized (G-23 series):**

| Artifact | Status |
| --- | --- |
| `onboarding.schema` + `onboarding.gosaki-piano.example.json` | G-23b |
| `validate-onboarding-config.mjs` | G-23c |
| `cms-preset-registry.mjs` (musician / lesson-studio / shop) | G-23f |
| `run-onboarding-orchestrator.mjs` | G-23e |
| `package-upload-safety.mjs` + freshness gate | G-20t3/t6 |
| `schedule-month-discovery.mjs` | G-20t2 |
| `sitemap-exclusions.mjs` | G-20t1 |
| `loadScheduleRowsFromSupabase(siteSlug)` | G-9e/G-20t2 (generic core exists) |

---

## 3. New site touch-point map (current state)

Adding a second site today would require changes in **at least** these areas:

| # | Area | Current Gosaki value | Generalization gap |
| --- | --- | --- | --- |
| 1 | Deploy profiles JSON | `config/sites/gosaki-piano.deploy-profiles.json` | Loader is `gosaki-package-build-profile.mjs` (Gosaki-named) |
| 2 | npm `package.json` scripts | Hardcoded `gosaki-piano` paths/URLs | No `--site` parameter |
| 3 | Build entrypoints | `build-gosaki-staging-admin-package.mjs` | Site name in filename |
| 4 | Manual upload CLI defaults | `siteSlug=gosaki-piano`, staging URL | Defaults in `create-manual-upload-package.mjs` |
| 5 | Package verifier | `verify-manual-upload-package.mjs` | Asserts `/cms-kit-staging/gosaki-piano/`, discography HTML, 2026-06/07 |
| 6 | Fixture dir | `fixtures/gosaki-piano` | Per-site crawl output |
| 7 | Astro convert hooks | `astro-generator.mjs` imports 6+ `gosaki-*` modules | No plugin registry |
| 8 | CSS overrides | `site-specific-overrides/gosaki-piano-overrides.mjs` | Pattern exists but manual wiring |
| 9 | Schedule Supabase read | `GOSAKI_SITE_SLUG` default | Generic `loadScheduleDataForBuild({ siteSlug })` exists |
| 10 | Discography read | `supabase-discography-read.mjs` Gosaki paths | site_slug filter present but Gosaki-coupled |
| 11 | Admin staging shell | `templates/admin-cms/gosaki/` | Per-site admin template |
| 12 | Content JSON configs | `gosaki-piano-band-profiles.json`, hubspot, youtube | Per-site `config/sites/{slug}.*.json` |
| 13 | Onboarding config | `onboarding.gosaki-piano.example.json` | Copy + edit — no site registry index |
| 14 | Output paths | `output/gosaki-piano-astro`, etc. | In deploy-profiles but enforced with Gosaki path checks |
| 15 | Env loader | `gosaki-staging-admin-public-env.mjs` | Named for Gosaki; reads repo `.env` |

**Estimated manual touch count for site #2:** **12–18 files** (+ new fixture + configs), excluding historical docs/verifiers.

---

## 4. Gosaki-specific hardcode list (key items)

### 4.1 Build / package pipeline

| File | Hardcode |
| --- | --- |
| `package.json` | All `manual-upload:*`, `build:gosaki-*`, paths, URLs |
| `build-gosaki-staging-admin-package.mjs` | `gosaki-piano-astro`, fixture, staging URL |
| `build-gosaki-production-package.mjs` | Uses `resolveGosakiPackageBuildProfile` |
| `gosaki-package-build-profile.mjs` | `GOSAKI_DEPLOY_PROFILES_REL`, path equality checks for `gosaki-piano` |
| `create-manual-upload-package.mjs` | Default `siteSlug`, `deployBase`, `stagingUrl` |
| `manual-upload-package.mjs` | `includeGosakiReadOnlyAdmin`, gosaki-piano.com in copy |
| `verify-manual-upload-package.mjs` | Default package dir, deployBase, zip name, month/discography assertions |
| `verify-g20i3-*` | Gosaki discography test strings, production URL |
| `static-public-artifact-verifier.mjs` | `detectGosakiReadOnlyAdminInPublicDir`, `includeGosakiReadOnlyAdmin` flag |

### 4.2 Config / paths / URLs

| Item | Value |
| --- | --- |
| `siteSlug` | `gosaki-piano` (deploy-profiles) vs `gosaki` (`gosaki.site-config.example.json`) — **inconsistent** |
| Staging URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano` |
| Production URL | `https://www.gosaki-piano.com` |
| Remote staging | `/cms-kit-staging/gosaki-piano/` |
| Remote production | `TBD_G-20i` |
| Supabase ref | `kmjqppxjdnwwrtaeqjta` (kit staging — OK for all kit sites) |

### 4.3 Astro generator hooks (always run for Gosaki convert)

```
gosaki-about-band-profiles.mjs
gosaki-about-content.mjs
gosaki-home-youtube-embed.mjs
gosaki-contact-hubspot-embed.mjs
gosaki-schedule-data-pages.mjs
gosaki-staging-read-only-admin.mjs
gosaki-footer-social.mjs
site-specific-overrides/gosaki-piano-overrides.mjs
wix-staging-visual-overrides.mjs (shared baseline + gosaki slug)
```

### 4.4 Supabase / CMS

| File | Note |
| --- | --- |
| `supabase-schedule-read.mjs` | `GOSAKI_SCHEDULE_SITE_CONFIG`, `fetchGosakiSchedulesFromSupabase` wrapper |
| `supabase-discography-read.mjs` | Gosaki-oriented |
| `gosaki-wix-schedule-extractor.mjs` | Wix HTML extraction — Gosaki-named |

### 4.5 Verifier / doc naming

- Pattern: `verify-g{N}{letter}-gosaki-{feature}.mjs` / `docs/gosaki-{feature}.md`
- ~47+ active verifiers with `gosaki` in filename (excluding full G-22 chain)
- Historical verifiers are **valuable audit trail** but not reusable for site #2

---

## 5. Classification

### 5.1 今すぐ一般化すべき (P0 — blocks 2nd site)

| Item | Why | Suggested slice |
| --- | --- | --- |
| `gosaki-package-build-profile.mjs` → site-neutral loader | 2nd site needs own `deploy-profiles.json` | **G-20u2** |
| `package.json` hardcoded paths | Every npm script names gosaki-piano | **G-20u2** |
| `build-gosaki-*` → `build-site-package.mjs --site` | Build script filename coupling | **G-20u3** |
| `verify-manual-upload-package.mjs` Gosaki assertions | Cannot verify non-Gosaki packages | **G-20u4** |
| `siteSlug` inconsistency (`gosaki` vs `gosaki-piano`) | DB + config drift risk | **G-20u2** (document canonical slug) |
| Site registry index | No `config/sites/index.json` listing active sites | **G-20u5** |

### 5.2 Gosaki案件中は残してよいが Kit化前に抽象化 (P1)

| Item | Why | Suggested slice |
| --- | --- | --- |
| `astro-generator.mjs` Gosaki hook imports | Works for Gosaki; needs plugin registry for #2 | **G-20u6** |
| `includeGosakiReadOnlyAdmin` flag naming | Semantics are kit-wide (read-only admin module) | **G-20u7** |
| `GOSAKI_SCHEDULE_SITE_CONFIG` | Generic loader exists; config wiring missing | **G-20u7** |
| Onboarding config → deploy profile merge | Two parallel config systems (G-23b + G-20h1) | **G-20u8** |
| `gosaki.site-config.example.json` vs `deploy-profiles.json` | Overlapping schemas | **G-20u8** |
| Freshness + safety preflight single command | Operator runs 3 npm scripts today | **G-20u9** |

### 5.3 Gosaki専用として残してよい (P2)

| Item | Reason |
| --- | --- |
| 343× `docs/gosaki-*.md` | Phase audit trail for Gosaki delivery |
| G-22 Schedule CMS chain verifiers | Closed PoC — do not generalize |
| `gosaki-piano-overrides.mjs` CSS | Site-specific visual parity |
| HubSpot form ID / YouTube video ID configs | Per-client content |
| `capture-gosaki-2026-08-public-url.mjs` | One-off capture tool |
| Wix production cutover docs (G-20j) | Gosaki production only |

### 5.4 セキュリティ / 運用事故リスク — 優先対応 (P0 safety)

| Risk | Current mitigation | Gap |
| --- | --- | --- |
| Stale package upload | G-20t6 freshness gate | Not auto-run before all upload paths; operator must remember |
| Staging/production mix-up | G-20t3 MANIFEST metadata | npm defaults still say `gosaki-piano` |
| Production path `TBD_G-20i` | CHECKLIST STOP | Still in deploy-profiles — OK if enforced |
| `includeGosakiReadOnlyAdmin` on production | G-20i3 verifier | Flag name implies Gosaki-only — cognitive risk |
| FTP auto-deploy | Suspended G-7f | Legacy scripts/docs still mention FTP |
| site_slug slug mismatch (`gosaki` vs `gosaki-piano`) | — | Could cause wrong DB rows for new sites |
| 160+ verifiers with old HEAD pins | NOTE-only in G-20t2+ | Noise but not blocking |

---

## 6. Answers to key questions

### 6.1 Site registry 化できるか？

**Yes — partially ready.**

- G-23b onboarding config + G-23c validator + G-23f preset registry already define site-agnostic shape.
- Missing: `config/sites/registry.json` (or derive from `config/sites/*.deploy-profiles.json` glob), unified loader used by build/package/verify CLIs.

### 6.2 Package profile を config 駆動にできるか？

**Yes — already 80% there.**

- `gosaki-piano.deploy-profiles.json` has staging/production profiles.
- Blocker: loader function names + npm scripts + path equality guards are Gosaki-specific.

### 6.3 URL / remote path / publicBaseUrl / site_slug 一元管理？

**Partially.**

| Source | Fields |
| --- | --- |
| `deploy-profiles.json` | deployBase, baseUrl, publicUrl, remotePath, siteSlug |
| `onboarding.gosaki-piano.example.json` | publicBaseUrl, intendedRemotePath, stagingDomain |
| `gosaki.site-config.example.json` | overlapping deploy/seo/output (different slug!) |

**Recommendation:** Single `config/sites/{siteSlug}.kit.json` merged view — onboarding config as input, deploy-profiles as build output.

### 6.4 Verifier を site 別に再利用できるか？

**Partially.**

| Reusable now | Site-specific |
| --- | --- |
| `validate-onboarding-config.mjs` | — |
| `package-upload-safety.mjs` | — |
| `verify-package-upload-freshness.mjs` | — |
| `verify-static-public-artifact.mjs` | — |
| — | `verify-manual-upload-package.mjs` (Gosaki HTML assertions) |
| — | `verify-g20i3` (Gosaki discography strings) |

**Pattern:** `verify-site-package.mjs --site X --profile staging|production` composing generic + site extension verifier.

### 6.5 Build script を汎用コマンドに寄せられるか？

**Yes.**

```txt
Target CLI:
  node scripts/build-site-package.mjs --site gosaki-piano --profile staging
  node scripts/build-site-package.mjs --site gosaki-piano --profile production

npm:
  npm run build:site-package -- --site gosaki-piano --profile staging
```

Thin wrappers `build-gosaki-*` can remain as aliases during transition.

---

## 7. Recommended next small phases

| Phase | Scope | Effort |
| --- | --- | --- |
| **G-20u2** | `site-package-build-profile.mjs` + site registry index + slug canonicalization doc | 0.5–1 day |
| **G-20u3** | `build-site-package.mjs` generic CLI; keep gosaki wrappers | 0.5 day |
| **G-20u4** | `verify-site-package.mjs` — split generic vs site extension | 1 day |
| **G-20u5** | npm scripts: `build:site`, `package:site`, `verify:package:* --site` | 0.5 day |
| **G-20u6** | Astro generator site hook registry (`config/sites/{slug}.hooks.json`) | 1–2 days |
| **G-20u7** | Rename `includeGosakiReadOnlyAdmin` → `includesReadOnlyAdmin`; wire from site config | 0.5 day |
| **G-20u8** | Merge onboarding config ↔ deploy-profiles generator | 1 day |
| **G-20u9** | `upload-preflight.mjs` — safety + freshness + profile in one command | 0.5 day |
| **G-20u10** | 2nd pilot site dry-run (fixture-only, no FTP) | 1–2 days |

**Do not** big-bang rename 300+ docs/verifiers.

---

## 8. musician-basic / lesson-studio-basic notes

| Preset | Kit readiness |
| --- | --- |
| `musician-basic` | Schedule CMS proven (Gosaki); discography read proven; others static JSON |
| `lesson-studio-basic` | Registry only (G-23f) — no pilot site |
| `shop-basic` | Registry only — no pilot site |

Gosaki = `musician-basic` reference implementation. Generalization priority: **package/build/config pipeline first**, then astro hooks, then admin CMS templates.

---

## 9. Not executed (G-20u1)

| Item | Status |
| --- | --- |
| Large refactor / rename | **no** |
| FTP / deploy | **no** |
| Package regen | **no** |
| DB write | **no** |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20u1-gosaki-hardcode-generalization-audit.mjs
```
