# Gosaki Wix external assets localization

**Phase:** `gosaki-wix-external-assets-localization`
**Status:** **COMPLETE (local source + verify · no package / FTP / commit)**
**Date:** 2026-08-18
**Prior Primary (deferred):** `gosaki-production-cutover-docs-commit-push`
**Next Primary:** `gosaki-wix-assets-localization-commit-push`

| Check | Status |
| --- | --- |
| Wix asset HTTP GET / download | **yes** (14 files, bytes as-is) |
| Local source rewrite | **yes** |
| Local verify | **yes** |
| ciao-preview package regen | **no** |
| FTP / remote mutate | **no** |
| DNS / SSL / DB / Secret / Edge | **no** |
| Wix-side delete/change | **no** |
| production deploy | **no** |
| commit / push | **no** |

Existing uncommitted preview/cutover docs were **kept**.

---

## Gates

```txt
gosakiWixExternalAssetsLocalizationComplete: true
LOCALIZATION_RESULT: PASS
PUBLIC_WIX_CDN_MEDIA_REFS_AFTER: 0
MISSING_LOCALIZED_ASSETS: 0
INTENTIONAL_WIXSITE_KEPT: true
READY_FOR_COMMIT_PUSH: true
READY_FOR_PREVIEW_REGENERATION: false
CIAO_PREVIEW_REMOTE_STALE_AFTER_THIS_SOURCE_CHANGE: true
CURSOR_FTP_EXECUTED: false
RECOMMENDED_NEXT_PRIMARY: gosaki-wix-assets-localization-commit-push
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```

---

## 1. Inventory (public HTML facts)

Source of truth for “what public HTML references” = ciao-preview `public-dist` (HEAD `0f84b2d1` package, now stale after this source change) plus About JSON SoT.

| Class | Unique | In public HTML? | Action |
| --- | --- | --- | --- |
| `static.wixstatic.com/media/…` | 13 media IDs / 26 src+srcset URL variants | **yes** | localize 1 file per media id (largest fill) |
| `static.parastorage.com/client/pfavico.ico` | 1 | **yes** (icon + apple-touch-icon) | localize `favicon.ico` |
| `gosakirikakotrio.wixsite.com/gosakirikakotrio` | 1 | **yes** (Link page + Aug schedule body) | **keep** (not an asset) |
| Fixture-only Thunderbolt / parastorage JS+CSS | many | **no** (convert strips scripts; not in public-dist) | leftover crawl source; do not localize |
| About band photos | 5 | local `assets/about/bands/` | already local; unchanged |
| Wix `@font-face` / woff | 0 | — | already stripped |

Query/size variants (1x/2x, `w_46` vs `w_92`, etc.) collapse to the **same media id** → one file.

### Media map

| Media id | Role | Public pages | Local file | Downloaded fill |
| --- | --- | --- | --- | --- |
| `26e086_0cea05e5…` | Home KV | Home | `home-kv-250428-0179re.jpg` | w_2680 × h_1240 |
| `26e086_88579f85…` | Home flyer | Home | `home-flyer-20260327.png` | w_518 |
| `26e086_4175ba4f…` | Home flyer | Home | `home-flyer-20260327-shop.png` | w_518 |
| `26e086_d05d239c…` | Home NO PHOTO | Home | `home-flyer-no-photo.png` | w_518 |
| `26e086_5ceeb19a…` | About portrait | About (+ About JSON SoT) | `about-portrait-250428-1002.jpg` | w_524 × h_788 |
| `26e086_4b20b9f6…` | Contact photo | Contact | `contact-photo-250428-0280.jpg` | w_418 × h_550 |
| `26e086_3b3d0279…` | Discography Continuous | Discography | `discography-continuous.png` | w_520 |
| `26e086_48d2ee5d…` | Discography SKYLARK | Discography | `discography-skylark.jpg` | w_520 |
| `26e086_87f0b671…` | Discography About Us | Discography | `discography-about-us.jpg` | w_520 |
| `26e086_646cc6a5…` | Discography Ja-Jaaaaan | Discography | `discography-ja-jaaaaan.jpg` | w_315 (max referenced) |
| `11062b_0bec1cad…` | Footer SNS Facebook | all HTML | `footer-sns-facebook.png` | w_92 |
| `11062b_d742af69…` | Footer SNS X | all HTML | `footer-sns-x.png` | w_92 |
| `11062b_94a6580a…` | Footer SNS Instagram | all HTML | `footer-sns-instagram.png` | w_92 |
| `pfavico` | Favicon | head | `favicon.ico` | parastorage ico |

Downloads used Wix fill URLs **without** `enc_avif` negotiate; sniff = JPEG/PNG/ICO (no recompress).

---

## 2. Localization design

- **SoT binaries:** `tools/static-to-astro/assets/gosaki-piano/wix-local/` (git-tracked; not the gitignored crawl fixture)
- **Manifest:** `config/sites/gosaki-piano-wix-local-assets.json`
- **Convert:** gosaki `applyPostGenerate` copies into generated `public/images/wix-local/` then rewrites `.astro`/`.html`/`.json`
- **deployBase:** Astro `import.meta.env.BASE_URL + "images/wix-local/…"` (no `/gosaki-piano/` hard-code)
  - preview `BASE_URL=/gosaki-piano/` → `/gosaki-piano/images/wix-local/…`
  - production `BASE_URL=/` → `/images/wix-local/…`
- **`generateFooter` HTML baseline is unchanged.** Footer CDN `<img>` are rewritten only after files are written (postGenerate), so `verify-cms-core-v2-gosaki-site-generator-hooks-html-baseline` stays exact.
- Hidden `#LnkBr2` Wix icons are still rewritten so public HTML has **0** `static.wixstatic.com`.
- Core `astro-generator.mjs` does **not** import gosaki localization (adapter isolation).
- Admin / CMS templates (`templates/admin-cms`) **not** changed.

---

## 3. Source changes

- Convert hook: `scripts/lib/gosaki-site-generator-hooks-adapter.mjs` `applyPostGenerate`
- Library: `scripts/lib/gosaki-wix-local-assets.mjs`
- About JSON SoT portrait URLs → `/images/wix-local/about-portrait-250428-1002.jpg`
- `home-schedule-sync.mjs` INDEX hero (legacy template) → local BASE_URL path
- Package verifier fail-closed: `verifyPublicDistWixCdnMediaAbsent` on staging / production / ciao-preview
- npm: `verify:gosaki-wix-assets-localization`

---

## 4. Verification (this phase)

| Check | Result |
| --- | --- |
| `npm run verify:gosaki-wix-assets-localization` | **30 passed, 0 failed** |
| HTML baseline (`generateFooter` exact) | **81 passed, 0 failed** |
| Site-package extension decoupling | **54 passed** |
| `build:gosaki:staging:dry-run` | **DRY-RUN PASS** (`deployBase=/cms-kit-staging/gosaki-piano/`) |
| `build:gosaki:production:dry-run` | **DRY-RUN PASS** (`deployBase=/`) |
| `build:gosaki:ciao-preview:dry-run` | **DRY-RUN PASS** (`deployBase=/gosaki-piano/`) |
| Stale public-dist HTML rewrite map | **PUBLIC_WIX_CDN_MEDIA_REFS_AFTER = 0**; wixsite kept |
| `verify:gosaki:ciao-preview` on **stale** on-disk package | **not run** (fail-closed until regen) |
| Package generate / FTP / public browser QA | **not run** |

After commit/push from clean HEAD: regenerate ciao-preview, then FileZilla re-upload, then public QA.

---

## 5. Stale remote

Live ciao-preview at `https://gotosaki.ciao.jp/gosaki-piano/` still hotlinks Wix CDN. It will stay visually OK until Wix media is removed. This source change does **not** update remote.

```txt
READY_FOR_PREVIEW_REGENERATION: false
```

Regeneration is the **next** phase after commit/push.

---

## 6. Forbidden (held)

FTP, remote delete, DNS/SSL, DB write, Secret, Edge, Wix-side change, production deploy, package generate, commit/push.
