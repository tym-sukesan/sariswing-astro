# Gosaki ciao.jp final pre-cutover preview regeneration

**Phase:** `gosaki-ciao-jp-final-precutover-preview-regeneration`
**Status:** **COMPLETE / PASS (local package regenerated from clean HEAD · verified · FTP not executed)**
**Date:** 2026-08-19
**HEAD baseline:** `be2d64d029f251c1a7ab92c767cdf518b56252af` (= `origin/main`)
**Prior:** `gosaki-pre-cutover-residual-final-audit` (docs committed on this HEAD)
**Product:** PUBLIC_CUTOVER前の最終公開予定版 ciao-preview（September 17 + Home Option D hide）

| Check | Status |
| --- | --- |
| Working tree at generate | **clean** |
| Official `npm run build:gosaki:ciao-preview` | **PASS** (including `--verify-build`) |
| `sourceCommit` | `be2d64d029f251c1a7ab92c767cdf518b56252af` |
| Build-read published | **91** total · September **17** (`002`–`018`) · `001` **not** in bake |
| `/schedule/2026-09/` | **exists** · **17** event cards |
| Legacy `/2026-09/` | **exists** (stub → canonical) |
| Home stale THIS WEEK | **0** heading / March cards |
| Public `static.wixstatic.com` / `static.parastorage.com` | **0** / **0** |
| Localized assets | **14 / 14** · missing **0** |
| Freshness / preflight | **PASS** |
| Staging / production packages | **untouched** |
| FTP / remote / DB write / SQL / DNS / HubSpot / Secret / Edge / production package / commit | **no** |

---

## Gates

```txt
FINAL_PREVIEW_REGENERATION_RESULT: PASS
phase: gosaki-ciao-jp-final-precutover-preview-regeneration
generationHead: be2d64d029f251c1a7ab92c767cdf518b56252af
sourceCommit: be2d64d029f251c1a7ab92c767cdf518b56252af
PREVIEW_URL: https://gotosaki.ciao.jp/gosaki-piano/
deployBase: /gosaki-piano/
REMOTE_TARGET: /gosaki-piano/
UPLOAD_CONTENTS_RULE: public-dist/ contents only (not the public-dist folder itself)
fileCount: 46
includesAdmin: false
NOINDEX: true
ROBOTS_DISALLOW_ALL: true
PUBLISHED_TOTAL: 91
PUBLISHED_SEPTEMBER: 17
SCHEDULE_2026_09_ROUTE: present
LEGACY_2026_09_ROUTE: present
HOME_THIS_WEEK_REFS: 0
PUBLIC_WIXSTATIC_REFS: 0
PUBLIC_PARASTORAGE_REFS: 0
MISSING_LOCALIZED_ASSETS: 0
INTENTIONAL_WIXSITE_KEPT: true
CONTACT_HUBSPOT_EMBED: present
PACKAGE_FRESHNESS: PASS
READY_FOR_OPERATOR_FINAL_PREVIEW_UPLOAD: true
FTP_EXECUTED: false
DB_WRITE_EXECUTED: false
SQL_REEXECUTE_FORBIDDEN: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
RECOMMENDED_NEXT_PRIMARY: gosaki-ciao-jp-final-precutover-preview-manual-upload
```

**Supabase SoT:** staging Kit `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.
Build-time read used the existing package pipeline only. **No extra live SELECT.** **No INSERT / UPDATE / DELETE / RPC.** **Do not re-run** September forward SQL or rollback SQL.

---

## 1. Preflight

| Check | Result |
| --- | --- |
| HEAD | `be2d64d029f251c1a7ab92c767cdf518b56252af` = `origin/main` |
| Working tree at generate start | **clean** |
| Profile `ciao-preview` | `deployBase=/gosaki-piano/` · Admin off · noindex · robots Disallow |
| SoT | `kmjqppxjdnwwrtaeqjta` |
| Extra live SELECT / SQL | **not run** |
| Production package generate | **not run** |

Remote `https://gotosaki.ciao.jp/gosaki-piano/` remains the previous package (`sourceCommit` `7de25b35…`, no September / still shows Home THIS WEEK) until operator FileZilla overwrite.

---

## 2. Stale package lifecycle

Official relocate (no manual `rm` / delete):

```txt
from: output/manual-upload/gosaki-piano-ciao-preview
to:   output/manual-upload/_stale-backup/gosaki-piano-ciao-preview/2026-08-19T13-41-17-607Z-be2d64d
prior sourceCommit: 7de25b3550b882dbfaf40fd7b413779bb07c112d
prior generatedAt: 2026-08-18T13:18:47.180Z
prior fileCount: 44
```

The backup folder name uses **current HEAD** (`be2d64d`). The **contents** are the previous Wix-localized preview (`7de25b35`, 44 files, no `/schedule/2026-09/`). That backup is **not** an upload source.

---

## 3. Regeneration

```bash
cd tools/static-to-astro
npm run build:gosaki:ciao-preview
```

| Step | Result |
| --- | --- |
| git clean gate | `sourceTreeClean=true` |
| mutex | `no_operational_save_arm` · armedCount=0 |
| convert `--verify-build` / `astro build` | **success** (`npm install` + build) |
| Schedule bake | supabase **91** events |
| Discography | **4** releases / **34** tracks |
| YouTube | embedDataSource=supabase |
| static-public | **PASS** · excluded `admin` · 46 files · `safeForStaticFtp: true` |
| `verify:gosaki:ciao-preview` | **PASS** |
| `verify:package-freshness:gosaki:ciao-preview` | **PASS** (`sourceCommit` = HEAD) |
| `preflight:gosaki:ciao-preview` | **PASS** |
| runId | `68346a94-77eb-4074-9b39-643743dbb63c` |
| `generatedAt` | `2026-08-19T13:42:37.767Z` |

`fileCount` 44 → **46** = previous public files + `/schedule/2026-09/index.html` + legacy `/2026-09/index.html`.

Baked `src/data/gosaki-schedules.json` in the ciao-preview Astro out: **91** rows · September **17** · ids `schedule-2026-09-002` … `018` present · `schedule-2026-09-001` **absent**.

---

## 4. Content blockers in the generated package

### September

| Check | Result |
| --- | --- |
| `/schedule/2026-09/` | **present** |
| Event cards | **17** |
| Dates | 2026.09.01, 04, 05, 06, 07, 08, 11, 12, 16, 19, 23, 24, 25, 26, 27, 28, 30 |
| Hub `/schedule/` | first month link `2026.09` → `/gosaki-piano/schedule/2026-09/` |
| Legacy `/2026-09/` | **present** · stub “has moved” · canonical `/gosaki-piano/schedule/2026-09/` |
| `001` test row | **not** in bake JSON · **not** in month HTML |

### Home (Option D)

| Check | Result |
| --- | --- |
| `THIS WEEK` / `This Week` / `this week` | **0** |
| `#comp-m8y5bex0` / `#comp-m8y5l5fs` / `#comp-m8y53dj5` | **0** |
| March 25 / 27 / 31 card strings | **0** |
| `<!--GOSAKI_HOME_SCHEDULE_SLOT-->` | HTML **comment only** (not visible text) · immediately followed by YouTube section |
| leftover `#comp-m8y3dzb6.gosaki-home-this-week-hidden` | present · collapse CSS in `_astro/index.DCKaMHwm.css` (`min-height:0`, `height:auto`) |
| YouTube | `youtube-nocookie.com/embed/I-eY9YMq9GI` · heading **YouTube** kept |
| Header / KV / footer | `SITE_HEADER` · local KV `home-kv-250428-0179re.jpg` · `SITE_FOOTER` |

The leftover Wix mesh wrapper remains as a collapsed container. There is no empty THIS WEEK heading and no March flyer cards. Operator visual QA after upload should confirm no large blank band; CSS is the same Option D collapse already verified in source.

---

## 5. Wix / localized assets

| Check | Result |
| --- | --- |
| `static.wixstatic.com` public refs | **0** |
| `static.parastorage.com` public refs | **0** |
| `images/wix-local/` | **14** files, all expected names |
| missing | **0** |
| `https://gosakirikakotrio.wixsite.com/gosakirikakotrio` | **kept** (3 refs: Link + schedule pages) |

---

## 6. Usual preview gates

| Check | Result |
| --- | --- |
| `sourceCommit` | HEAD `be2d64d…` |
| freshness | **PASS** |
| `deployBase` | `/gosaki-piano/` |
| Preview URL | `https://gotosaki.ciao.jp/gosaki-piano/` |
| Admin HTML | **absent** (`includesAdmin: false`) |
| Primary-page robots meta | `noindex,nofollow,noarchive` |
| Legacy month stubs robots meta | `noindex,follow` (historical stub behavior; still noindex) |
| `robots.txt` | `User-agent: *` / `Disallow: /` |
| canonical / og:url | `https://gotosaki.ciao.jp/gosaki-piano/…` on all 20 HTML pages |
| Internal nav prefix | `/gosaki-piano/` Home / About / Schedule / Discography / Contact / Link |
| CSS prefix | `/gosaki-piano/_astro/` · **no** host-root `/_astro/` |
| Contact HubSpot | `js.hsforms.net/forms/embed/21392032.js` · `.hs-form-frame` · formId `57909d0c-9b9f-470a-8a18-e176d1d1a459` · `#gosaki-contact-hubspot-embed` |
| PoC / test markers | **0** (`G-6-*`, `CMS Kit staging`, `schedule-2026-09-001`) |
| weblike.jp | **0** |
| `www.gosaki-piano.com` in preview `<head>` | **0** |

Staging / production on-disk packages **not regenerated**:

| Package | `sourceCommit` | `generatedAt` | `fileCount` |
| --- | --- | --- | --- |
| staging `gosaki-piano` | `dc1c5b62…` | `2026-07-29T04:41:16.563Z` | 35 |
| production `gosaki-piano-production` | `1c1fb972…` | `2026-07-15T07:54:36.493Z` | 30 |

Newest staging/production files remain July timestamps. Ciao public-dist newest files are `2026-08-19T13:42:37Z`.

---

## 7. Wrong-package upload prevention

```txt
LOCAL_UPLOAD_SOURCE:
tools/static-to-astro/output/manual-upload/gosaki-piano-ciao-preview/public-dist/

REMOTE_TARGET:
/gosaki-piano/

UPLOAD_CONTENTS_RULE:
public-dist/ の中身を入れる（public-dist/ フォルダ自体は入れない）
```

Upload-source gates (all **PASS**):

| Gate | Result |
| --- | --- |
| path contains `gosaki-piano-ciao-preview` | **yes** |
| `images/wix-local/` exists | **yes** (14 files) |
| `admin/` exists | **no** |
| September route exists | **yes** (`schedule/2026-09/index.html`) |

**Do not** use `output/manual-upload/gosaki-piano/public-dist/` (staging tree, 35 files, Admin on, no ciao-preview in path, no 2026-09). That path still exists on disk and is **not** this upload source.

Do **not** use `_stale-backup/…/2026-08-19T13-41-17-607Z-be2d64d` (old 44-file package).

---

## 8. Not executed

- FTP / `--apply` / remote delete
- DB write / SQL mutation / September forward or rollback SQL
- DNS / SSL
- HubSpot mutation / form submit
- Secret / Edge
- production package generate
- commit / push

Cursor must **not** FTP in the next Primary either. Operator FileZilla overwrite only.

---

## 9. Next

**Primary:** `gosaki-ciao-jp-final-precutover-preview-manual-upload`

Operator overwrites remote `/gosaki-piano/` with the **contents** of `gosaki-piano-ciao-preview/public-dist/` (46 files). No delete of unrelated host paths. No `.ftpaccess` edit.
