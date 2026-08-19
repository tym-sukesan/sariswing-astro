# Gosaki pre-cutover residual final audit

Phase: `gosaki-pre-cutover-residual-final-audit`
Date: 2026-08-19
HEAD: `fb6c567e2bf24a3f1b512edb12c02410a0d35f4f` (= `origin/main`)
Source tree: **clean**. Dirty files = uncommitted audit docs / AI SoT only.

```txt
RESIDUAL_FINAL_AUDIT_RESULT: COMPLETE
NEW_PUBLIC_CUTOVER_BLOCKERS: none
NOW_ACTIONABLE_BEFORE_ADMIN: 0
NO_MORE_LOCAL_PRE_CUTOVER_WORK: true
READY_FOR_DOCS_COMMIT_PUSH: true
READY_FOR_FINAL_PREVIEW_REGENERATION: true
PACKAGE_GENERATE_EXECUTED: false
RECOMMENDED_NEXT_PRIMARY: gosaki-pre-cutover-audits-docs-commit-push
```

This audit looks for **new pre-public leaks**, not a recap of closed work. Known Lolipop / HubSpot / client gates are **not** re-discovered.

---

## Scope / safety

Read-only: repo · production/ciao/staging `--dry-run` · `verify:gosaki-home-stale-this-week-hide` (69 passed, live SELECT) · inspect existing **stale** local packages (not upload sources).

**Not executed:** source change · package 本生成 · FTP · DB write · DNS/SSL · HubSpot mutation · Secret/Edge · commit/push.

---

## 1. Production profile / public artifact (source)

`npm run build:gosaki:production:dry-run` → **DRY-RUN PASS**.

| Check | Source / profile fact |
| --- | --- |
| origin | `https://www.gosaki-piano.com` |
| deployBase | `/` |
| Admin | `includeReadOnlyAdmin: false` |
| indexable | `productionIndexable: true` · `stagingNoindex: false` |
| robots | production: `Allow: /` + sitemap URL (stale package matches profile; HEAD convert uses same SEO flags) |
| sitemap | production host in `sitemap-index.xml` |
| canonical / og:url | production verifier requires `www.gosaki-piano.com` |
| favicon | Wix `pfavico` → `/images/wix-local/favicon.ico` on crawl pages (HEAD localization) |
| localized images | 14 files in manifest; rewrite + package `verifyPublicDistWixCdnMediaAbsent` |
| internal nav | convert + staging/production content extensions (Schedule link) |
| Schedule hub / 2026-09 / legacy `/2026-09/` | hide-verifier live bake: published **91**, September **17**, hub + canonical month + legacy stub **written** |
| Home THIS WEEK hidden | Option D in convert `applyPostGenerate` · verifier **69 passed** |
| Contact embed | same HubSpot v3 all profiles |

On-disk `output/.../gosaki-piano-production` is **stale** (pre-localization, no 2026-09). Do **not** treat it as HEAD production HTML. `wixstatic` there is **not** a HEAD source leak.

---

## 2. SEO residual (source-fixable vs nice-to-have)

Present on crawl pages (ciao localized tree, same convert SEO path): title, description (most), canonical, robots, og:title, og:description, og:url, twitter:card, local favicon.

| Finding | Class |
| --- | --- |
| Preview noindex vs production indexable are **profile-split** (verifiers fail-closed on mix) | NO_ACTION |
| **og:image** / **twitter:image** absent sitewide (Wix source had none; convert only emits if present) | **POST_LAUNCH** (share cards). Not a display blocker |
| Schedule hub / some generated pages: empty description; hub `favicon=""` | **NON_BLOCKING** |
| No JSON-LD | **NON_BLOCKING** (Wix export had none in Kit HTML) |
| Legacy month stubs keep **noindex** in production (intentional; not in sitemap) | NO_ACTION |

No new **DO_BEFORE_CUTOVER** SEO source fix.

---

## 3. External dependency inventory (HEAD convert)

| Dependency | Class |
| --- | --- |
| HubSpot `js.hsforms.net` (Contact) | **REQUIRED_EXTERNAL_DEPENDENCY** |
| YouTube nocookie iframe | **REQUIRED_EXTERNAL_DEPENDENCY** |
| `youtube.com/watch` “YouTubeで見る” | **INTENTIONAL_EXTERNAL_LINK** |
| `gosakirikakotrio.wixsite.com` | **INTENTIONAL_EXTERNAL_LINK** (keep list) |
| SNS + venue sites (Facebook, X, Instagram, tabelog, jazz bars, …) | **INTENTIONAL_EXTERNAL_LINK** |
| Local `_astro` CSS/JS, `/images/wix-local/*` | first-party |
| Wix `static.wixstatic.com` / `pfavico` parastorage | **removed on HEAD convert** (stale production tree still has them) |
| Google Fonts / gtag / analytics | **none observed** |
| Wix proprietary webfonts | stripped (system stacks) |

No **UNEXPECTED_DEPENDENCY** that would blank the site if Wix account dies. HubSpot + YouTube are expected third parties.

---

## 4. Routes / 404 / redirect

Generateable at HEAD (hide-verifier + fixture/convert + ciao tree for `/link/`):

`/` `/about/` `/schedule/` `/schedule/2026-09/` `/2026-09/` `/discography/` `/contact/` `/link/`

| Check | Result |
| --- | --- |
| `/admin/` in production | **excluded** (profile + g20i3) |
| `/home` 301 unimplemented | **not** a cutover blocker (existing planning). No new contradiction |
| Dummy / archive 80 | still **POST_LAUNCH**; do not invent redirects |
| Redirect loop | no new fact vs DirectorySlash note on `/home/` |

---

## 5. Content residual

Live SELECT via hide-verifier (2026-08-19): published **91**, September **17** (`002`–`018`), `001` **not** in bake. Discography test-suffix titles already stripped in production verifier. No new public PoC strings found in convert/config.

Live ciao-preview HTML is **stale vs HEAD** (no Home hide, no `/2026-09/`). That is **package**, not a source leak.

---

## 6. Deployment workflow residual

Existing gates still hold: clean HEAD bake · `sourceCommit` · freshness preflight · `public-dist/` **contents** · no delete · no `.ftpaccess` · no FTP `--apply` · Admin off for production.

Ciao near-miss (staging `gosaki-piano/` vs `gosaki-piano-ciao-preview/`): ciao verifier **requires folder name** + `images/wix-local/`. Production README says “not staging `gosaki-piano/`” but **does not name ciao-preview**. Different **hosts**, still a mix-up if ciao HTML (`deployBase=/gosaki-piano/`) is uploaded to www root.

**Not NOW_ACTIONABLE** (no source change this phase). Carry into package-phase checklist:

- Local folder **`gosaki-piano-production`** (not `gosaki-piano`, not `gosaki-piano-ciao-preview`)
- `deployBase=/` · canonical host `www.gosaki-piano.com`
- `images/wix-local/` present · `admin/` absent
- Confirm `/schedule/2026-09/` + Home hide in **that** package before upload

`intendedRemotePath: TBD_G-20i` remains an operator path gate (known).

---

## 7. Supabase operational residual

Public bake SoT stays **`kmjqppxjdnwwrtaeqjta`**. Dedicated production project is **not** a cutover delay.

Rules to keep (PACKAGE_AND_UPLOAD / ops — not architecture):

- After PUBLIC_CUTOVER this project is **public HTML SoT**, not a scratch staging DB
- Do not `published=true` test / PoC rows
- Before production package bake: SELECT-only publication check (counts + markers). Hide-verifier already saw 91/17 today; re-check at bake time if anything was written since

---

## 8. Classification

### A. NOW_ACTIONABLE_BEFORE_ADMIN

**0**

### B. OPERATOR_PANEL_REQUIRED (known only)

Lolipop: www → `/gosaki-piano/` mapping · SSL · DNS targets · EMAIL_USAGE
HubSpot: www allow / unrestricted · thank-you vs non-staging redirect

### C. CLIENT_CONFIRMATION (known)

Production go-live signoff

### D. PACKAGE_AND_UPLOAD_PHASE

Docs commit → clean HEAD → optional ciao regen → production package from **that** HEAD · mix-up checklist · 2026-09 + Home hide in artifact · publication SELECT before bake · do not ship stale on-disk production tree

### E. POST_LAUNCH

`/home` 301 · archive 80 · og:image · generated-page favicon polish · www HubSpot smoke submit · client URL decisions

### F. NO_ACTION

Closed content/DNS/HubSpot-source/redirect-blocker work. DNS still on Wix (planned).

```txt
NO_MORE_LOCAL_PRE_CUTOVER_WORK: true
```

---

## 9. Next

```txt
RECOMMENDED_NEXT_PRIMARY: gosaki-pre-cutover-audits-docs-commit-push
READY_FOR_DOCS_COMMIT_PUSH: true
READY_FOR_FINAL_PREVIEW_REGENERATION: true
```

Preview regen is **allowed after** docs commit (clean HEAD). It is **not** this next Primary. After docs commit: **operator panel wait** (Lolipop / HubSpot / client) in parallel with any later preview regen.
