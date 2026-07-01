# G-20f — Gosaki production release config / cutover preflight

**Phase:** `G-20f-gosaki-production-release-config-cutover-preflight`  
**Status:** **complete** — read-only inventory + cutover planning only; **no package build, no FTP, no DNS, no deploy**  
**Date:** 2026-07-01  
**Base commit:** `7ce6654`  
**Client:** 後藤沙紀さん（gosaki-piano / pianist personal site）  
**Prior:** [gosaki-production-release-readiness-inventory.md](./gosaki-production-release-readiness-inventory.md) (G-20a); [gosaki-production-test-text-cleanup-closure.md](./gosaki-production-test-text-cleanup-closure.md) (G-20e-closure)

| Check | Status |
| --- | --- |
| Production release config inventory | **yes** |
| Unresolved operator/client decisions | **documented** |
| URL / canonical / robots proposal | **yes** |
| Supabase strategy options | **yes** |
| Publish / reflection flow | **yes** |
| Cutover checklist | **yes** |
| Fastest-launch roadmap | **yes** |
| Package regen / FTP / DNS / DB write | **no** |

---

## Gates

```txt
gosakiProductionReleaseConfigCutoverPreflightComplete: true
phase: G-20f-gosaki-production-release-config-cutover-preflight
readyForG20gProductionConfigImplementationPlanning: true
readyForG20hProductionPackageLocalBuildPreflight: false
readyForG20iClientServerUploadPreflight: false
readyForG20jManualProductionUpload: false
readyForProductionFtpDeploy: false
readyForAnyFutureFtpApply: false
packageRegenExecuted: false
cursorPackageRegenExecuted: false
cursorFtpExecuted: false
cursorDbWriteExecuted: false
dnsChangeExecuted: false
sslChangeExecuted: false
deployExecuted: false
workflowDispatchExecuted: false
```

**Supabase — allowed staging Kit project:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta`.  
**STOP — never use Sariswing production:** `vsbvndwuajjhnzpohghh`.

---

## 1. Git state (verified)

| Item | Value |
| --- | --- |
| `HEAD` | `7ce6654` |
| `origin/main` | `7ce6654` |
| Working tree | clean at preflight start |

---

## 2. Current production release config inventory (read-only)

### 2.1 URLs and deploy paths

| Item | Staging (today) | Production (target) | Repo / script state |
| --- | --- | --- | --- |
| **Public URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` | `https://www.gosaki-piano.com/` | Wix live today at `www` |
| **deployBase** | `/cms-kit-staging/gosaki-piano/` | `/` (document root on client host) | Hardcoded in `build-gosaki-staging-admin-package.mjs` |
| **convert `--base-url`** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano` | **not implemented** — needs G-20g |
| **convert `--deploy-base`** | `/cms-kit-staging/gosaki-piano/` | `/` for production build | `isStagingSubdirBuild("/")` → production mode |
| **Local package output** | `output/manual-upload/gosaki-piano/public-dist/` | **same path today** — production package TBD (`G-20h`) |
| **Remote staging path** | `/cms-kit-staging/gosaki-piano/` | — | G-7g manual upload proven |
| **Remote production path** | — | **TBD** — client Lolipop document root (likely `/` or `public_html/`) | **not configured in repo** |

### 2.2 Site config files

| File | Role | Production state |
| --- | --- | --- |
| `config/sites/gosaki-piano.url-to-staging.json` | URL-to-staging orchestrator | `productionBaseUrl: https://www.gosaki-piano.com`; `deployBase` staging only |
| `config/sites/gosaki.site-config.example.json` | Kit template (`siteSlug: gosaki`) | `deploy.production.enabled: false`; `productionBaseUrl: https://www.gosaki-piano.com` |
| `config/sites/gosaki-piano-*.json` | YouTube / About / Contact / Discography static JSON | Used at convert time — no production-specific copies yet |

**Gap:** No committed `gosaki-piano.production.site-config.json` with `deployBase: /`, production FTP path, or production env profile.

### 2.3 SEO / canonical / robots (live HTTP scan — 2026-07-01)

**Staging** (`yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`):

| Check | Value |
| --- | --- |
| `noindex` meta | **yes** on `/`, `/discography/`, `/schedule/`, `/about/`, `/contact/` |
| `canonical` / `og:url` | staging origin + path (e.g. `…/gosaki-piano/discography/`) |
| `robots.txt` | `Disallow: /` |
| `sitemap-index.xml` | exists but URLs are **staging** — blocked by robots + noindex |
| Staging URL leak to production domain in SEO meta | **no** |

**Current Wix production** (`www.gosaki-piano.com`):

| Check | Value |
| --- | --- |
| `noindex` meta | **yes** (Wix) on sampled routes |
| `canonical` | `https://www.gosaki-piano.com/…` (no trailing slash on some paths) |
| `robots.txt` | Wix-managed `Allow: /` with Wix-specific rules |
| CMS Kit sitemap | **n/a** — Wix sitemap differs |

**Production Kit build must flip:**

- `deployBase` → `/` → `stagingNoindex: false`, `robotsDisallowAll: false`
- `canonical` / `og:url` → `https://www.gosaki-piano.com/…/` (trailing slash per Astro `always`)
- `robots.txt` → `Allow: /` + `Sitemap: https://www.gosaki-piano.com/sitemap-index.xml`
- **noindex removal** on all public HTML pages

Logic reference: `scripts/lib/seo-publish.mjs`, `scripts/lib/deploy-base.mjs` (`isStagingSubdirBuild`, `STAGING_CANONICAL_LEAK_PATTERN`).

### 2.4 Sitemap

| Item | Staging | Production (needed) |
| --- | --- | --- |
| Generator | Astro `@astrojs/sitemap` via convert | same |
| Index URL | `…/cms-kit-staging/gosaki-piano/sitemap-index.xml` | `https://www.gosaki-piano.com/sitemap-index.xml` |
| Routes | hub `/schedule/`, months `/2026-XX/`, `/discography/`, etc. | regenerate with production `--base-url` |
| Search Console | **do not submit** staging sitemap | submit **after** DNS cutover + noindex off |

### 2.5 OGP / assets

| Item | Staging | Production |
| --- | --- | --- |
| `og:url` | staging origin | `www.gosaki-piano.com` per route |
| `og:image` | Wix CDN + local assets in HTML | verify absolute URLs after production `--base-url` |
| `_astro/` CSS/JS | hash-named under `_astro/` | full package upload required on first deploy |
| Wix CDN images in body | cross-origin URLs remain | acceptable for v1; Storage CMS deferred |

### 2.6 Admin routes

| Route | State |
| --- | --- |
| `/__admin-staging-shell/musician-basic/` | **local dev only** (`DEV` + `ENABLE_ADMIN_STAGING_SHELL`) |
| `src/pages/admin/` (Sariswing) | **not connected** per AGENTS.md |
| Production hosted admin | **deferred** — operator-driven CMS updates for launch |
| Publish UI copy | still「本番反映 未開放」/「保存は準備中」in places — fix in G-20g+ |

### 2.7 Package generation scripts

| Script | Purpose | Production variant |
| --- | --- | --- |
| `build-gosaki-staging-admin-package.mjs` | Staging convert + build + manual-upload package | **staging only** today |
| `convert-static-to-astro.mjs` | `--base-url`, `--deploy-base` | production args **not wired** in dedicated script |
| `create-manual-upload-package.mjs` | Package manifest + zip | defaults to staging `deployBase` |
| `verify-static-public-artifact.mjs` | SEO flags, safeForStaticFtp | must pass production noindex-off checks in G-20h |
| `verify-manual-upload-package.mjs` | 27-file package verify | reuse with production manifest |
| `deploy-public-dist-ftp.mjs` | auto FTP | **G-7f1 suspended** — do not use `--apply` |

### 2.8 Staging output paths (reference)

```txt
tools/static-to-astro/output/gosaki-piano-astro/          # Astro project (gitignored)
tools/static-to-astro/output/static-public/gosaki-piano/public-dist/
tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/
tools/static-to-astro/output/manual-upload/gosaki-piano/gosaki-piano-manual-upload.zip
```

### 2.9 Content / blocker status (post G-20e-closure)

| G-20a blocker | Status |
| --- | --- |
| M1 Test title cleanup | **resolved** — G-20b–G-20e closed |
| M2 Production deployBase / canonical / OGP | **open** — this preflight |
| M3 robots / noindex flip | **open** — production build only |
| M4 Cutover preflight | **this phase** |
| M5 Client sign-off | **open** |
| M6 Supabase production strategy | **open** — §5 |

---

## 3. Unresolved decisions (operator + client — before G-20j)

| # | Topic | Questions | Risk if skipped |
| --- | --- | --- | --- |
| U1 | **Lolipop plan** | Which plan? PHP/version? disk quota? concurrent FTP? | upload failure / path limits |
| U2 | **独自ドメイン** | Domain registered where? Lolipop DNS or external registrar? | DNS lead time |
| U3 | **DNS cutover** | A/CNAME to Lolipop? TTL? apex `gosaki-piano.com` vs `www`? | downtime / wrong host |
| U4 | **SSL** | Lolipop free SSL for both apex and www? | browser warnings |
| U5 | **FTP user** | Dedicated FTP user scoped to site root only? IP allowlist? | G-7f-class incident |
| U6 | **公開ディレクトリ** | Exact document root path on client account (`/`, `/public_html/`, subdir?) | wrong target |
| U7 | **Wix migration timing** | Parallel preview subdomain first vs big-bang DNS? | downtime |
| U8 | **旧サイトバックアップ** | Wix export / screenshot archive before DNS switch? | rollback difficulty |
| U9 | **メール** | `@gosaki-piano.com` mail in use? MX records unaffected? | mail outage on DNS change |
| U10 | **www正規化** | Primary `www` (Wix today) vs apex redirect policy? | duplicate SEO |
| U11 | **Contact / HubSpot** | Production domain allowlist for HubSpot form? | form submit failure |
| U12 | **Client sign-off** | Visual parity vs Wix on mobile (G-12c checklist)? | post-launch rework |

---

## 4. Production URL / canonical proposal

### 4.1 Primary origin (recommended)

```txt
https://www.gosaki-piano.com/
```

**Rationale:** Wix live site already uses `www` in canonical; minimize redirect churn.

### 4.2 Apex `gosaki-piano.com`

| Option | Recommendation |
| --- | --- |
| A — `www` primary, apex 301 → `www` | **recommended** (match Wix, single canonical) |
| B — apex primary, `www` 301 → apex | possible but differs from current Wix |

Configure at **Lolipop / DNS layer** — not in Astro alone.

### 4.3 Canonical path design

| Item | Production rule |
| --- | --- |
| **trailingSlash** | `always` (existing Astro config) |
| **canonical** | `https://www.gosaki-piano.com{route}/` per page |
| **og:url** | same as canonical |
| **Schedule hub** | `/schedule/` |
| **Schedule months** | `/2026-07/` (Gosaki route — not Sariswing `/schedule/YYYY-MM/`) |
| **Staging URL in SEO meta** | **forbidden** — use `STAGING_CANONICAL_LEAK_PATTERN` verifier |

### 4.4 robots production settings

```txt
User-agent: *
Allow: /

Sitemap: https://www.gosaki-piano.com/sitemap-index.xml
```

### 4.5 noindex解除条件

All must pass before DNS cutover:

1. Production package built with `deployBase=/` and `--base-url https://www.gosaki-piano.com`
2. Local verifier: **no** `noindex` in generated HTML sample routes
3. `robots.txt` = Allow + production sitemap URL
4. `canonical` / `og:url` = `www.gosaki-piano.com` only (no `yskcreate.weblike.jp`)
5. Operator HTTP verify on **uploaded preview path** (before or after DNS — see §7)
6. Client sign-off (U12)

---

## 5. Supabase strategy

### 5.1 Options

| Option | Description | Pros | Cons |
| --- | --- | --- | --- |
| **A — Staging project as interim production SoT** | Keep `kmjqppxjdnwwrtaeqjta`; static site embeds same anon key | **Fastest**; data already seeded; proven Save paths | Name says "staging"; shared with Kit dev |
| **B — New Gosaki-only production project** | Fresh Supabase project; migrate seed | Clean isolation; clearer client ownership | Migration + RLS + auth setup; slower |
| **C — Promote staging → rename / split later** | Launch on A; plan B as phase 2 | Balances speed and cleanliness | Requires disciplined migration doc |

### 5.2 Recommendation — **Option A for fastest public launch**

Use `static-to-astro-cms-staging` (`kmjqppxjdnwwrtaeqjta`) as **interim production SoT** for gosaki-piano v1:

- `site_slug=gosaki-piano` rows already live (Schedule 60, Discography 34 tracks)
- RLS + anon read proven on staging shell
- `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` baked into static build (same as staging package today)
- Operator continues gated Save + reflection until hosted admin (G-20d+ product)

**Hard rule:** **Never** connect to Sariswing production `vsbvndwuajjhnzpohghh`.

### 5.3 Post-launch migration (if Option B later)

| Step | Scope |
| --- | --- |
| 1 | Export gosaki-piano rows only from staging |
| 2 | Apply schema + RLS to new project |
| 3 | Update production build env + one full regen + upload |
| 4 | Verify read paths; re-test Save slices on new project in staging shell first |

Defer until after public launch unless client requires separate billing/ownership now.

---

## 6. Publish / reflection flow (launch v1)

### 6.1 Initial public launch

```txt
Operator: production config (G-20g) → local production package build (G-20h)
       → upload preflight (G-20i) → manual FTP full package (G-20j)
       → HTTP verify (G-20k) → DNS/SSL cutover (separate operator phase)
```

| Rule | Policy |
| --- | --- |
| **FTP method** | FileZilla / Lolipop GUI — **manual overwrite** |
| **Auto FTP `--apply`** | **forbidden** until G-7f1 re-approval |
| **mirror / sync / `--delete`** | **forbidden** |
| **Recursive folder delete** | **forbidden** |
| **First upload scope** | Full `public-dist/` + `_astro/` (new production host) |
| **Later CMS updates** | 1-file minimal upload when CSS hash unchanged (G-14c pattern) |

### 6.2 CMS update reflection (post-launch)

| Step | Actor |
| --- | --- |
| Save (staging shell, local dev) | Operator |
| `build-gosaki-production-package.mjs` (future) | Operator |
| Local HTML verify | Operator / Cursor read-only |
| Manual FTP upload | Operator |
| HTTP verify | Operator / Cursor read-only |

**Deferred:** hosted admin on client server; auto deploy; workflow_dispatch to client FTP.

---

## 7. Cutover preflight checklist

### 7.1 Before cutover

- [ ] G-20g production config implemented (`deployBase=/`, production `--base-url`)
- [ ] G-20h production package built + local SEO verifier PASS
- [ ] G-20i upload preflight: exact local path, exact remote path, file count
- [ ] Client sign-off on staging preview URL (content + mobile)
- [ ] HubSpot contact form tested with target domain (U11)
- [ ] Wix backup captured (U8)
- [ ] FTP credentials scoped to target directory only (U5, U6)
- [ ] DNS TTL lowered 24–48h before switch (U3)
- [ ] MX records documented if mail in use (U9)
- [ ] Rollback plan agreed: revert DNS to Wix + keep static copy

### 7.2 Upload (G-20j — separate approval)

- [ ] Operator approval per G-7f1 form (exact command, paths, **no `--delete`**)
- [ ] Upload **full** production package first time
- [ ] **No** upload to FTP login root `/` without verified `cd`
- [ ] **No** mirror / sync / recursive delete

### 7.3 After upload HTTP verify (G-20k)

- [ ] `https://www.gosaki-piano.com/` → **200** (or preview URL before DNS)
- [ ] Sample routes: `/discography/`, `/schedule/`, `/about/`, `/contact/`
- [ ] **no** `noindex` in HTML
- [ ] **no** `yskcreate.weblike.jp` in canonical / og:url
- [ ] `robots.txt` Allow + sitemap line
- [ ] `_astro/*.css` → **200**
- [ ] Discography: production titles only (no `（テスト）`)
- [ ] Schedule: Supabase-backed months render

### 7.4 DNS / SSL (separate phase — not G-20f)

- [ ] SSL certificate active for `www` (+ apex if needed)
- [ ] DNS points to Lolipop (or client server)
- [ ] Apex → `www` redirect verified (if Option A)
- [ ] Propagation wait + re-verify HTTP

### 7.5 Rollback / fallback

| Trigger | Action |
| --- | --- |
| Broken layout after DNS | Revert DNS to Wix; static files remain on server for debug |
| Wrong FTP path | **stop** — do not delete remote; ask human (G-7f1) |
| SEO regression | Re-upload previous package snapshot if kept locally |
| Supabase read failure | static HTML still serves; fix env + re-upload |

### 7.6 Client sign-off

- [ ] 後藤さん visual approval (desktop + mobile)
- [ ] Schedule accuracy confirmed
- [ ] Contact form test message received
- [ ] Discography / YouTube / About content approved

---

## 8. Fastest public launch roadmap

| Phase | Scope | FTP? |
| --- | --- | --- |
| **G-20f** | This preflight — planning only | **no** |
| **G-20g** | Production config implementation planning — `gosaki-piano.production.json`, build script args, SEO verifier rules | **no** |
| **G-20h** | Production package local build + preflight — `deployBase=/`, noindex off, canonical production | **no** |
| **G-20i** | Client server upload preflight — remote path, credentials checklist, file manifest | **no** |
| **G-20j** | Operator manual production FTP upload (full package) — G-7f1 approval | **yes** (operator) |
| **G-20k** | Production HTTP verify + release result doc | **no** |
| **G-20l** (candidate) | DNS / SSL cutover execution + result | DNS operator |
| **G-21** | Kit generalization kickoff (site-config, publish CLI template) | — |

---

## 9. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Production package build | **no** |
| Staging package regen | **no** |
| FTP / upload / mirror / sync / delete | **no** |
| DNS / SSL change | **no** |
| deploy / workflow_dispatch | **no** |
| SQL / Save / DB write | **no** |
| Sariswing production (`vsbvndwuajjhnzpohghh`) | **no** |
| commit / push | **no** |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20f-gosaki-production-release-config-cutover-preflight.mjs
```
