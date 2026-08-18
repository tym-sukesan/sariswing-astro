# Gosaki ciao.jp preview manual upload preflight

**Phase:** `gosaki-ciao-jp-preview-manual-upload-preflight`
**Status:** **COMPLETE (operator packet · Cursor FTP not executed)**
**Date:** 2026-08-18
**HEAD:** `0f84b2d1bf1e26da57a7ae6676751aa873931fc7` (= `origin/main`)
**Prior:** `gosaki-ciao-jp-preview-package-regeneration`

| Check | Status |
| --- | --- |
| Package freshness vs HEAD | **PASS** (`sourceCommit` = `0f84b2d1…`) |
| File count | **30** |
| `admin/` / `.ftpaccess` / `welcome.html` in package | **absent** |
| Cursor FTP / upload / delete | **no** |
| commit / push | **no** (would stale `sourceCommit`) |
| Browser QA | **not executed** |

---

## Gates

```txt
gosakiCiaoJpPreviewManualUploadPreflightComplete: true
phase: gosaki-ciao-jp-preview-manual-upload-preflight
sourceCommit: 0f84b2d1bf1e26da57a7ae6676751aa873931fc7
PREVIEW_URL: https://gotosaki.ciao.jp/gosaki-piano/
LOCAL_UPLOAD_SOURCE: tools/static-to-astro/output/manual-upload/gosaki-piano-ciao-preview/public-dist/
REMOTE_TARGET: /gosaki-piano/
UPLOAD_CONTENTS_RULE: public-dist/ contents only (not the folder itself)
fileCount: 30
OVERWRITE: ok if FileZilla asks for same names inside /gosaki-piano/
DELETE: never
FTPACCESS: do not edit or delete
READY_FOR_OPERATOR_MANUAL_UPLOAD: true
CURSOR_FTP_EXECUTED: false
COMMIT_BEFORE_UPLOAD: forbidden
READY_FOR_ANY_FUTURE_FTP_APPLY: false
RECOMMENDED_NEXT_PRIMARY: gosaki-ciao-jp-preview-manual-upload-execution
```

**Do not commit/push before this upload.** Uncommitted regeneration docs do **not** change HEAD; committing them would make freshness STOP.

Dirty `_stale-backup` tree (`c16af124`) is **not** an upload source.

---

## 1. Scope

```txt
LOCAL_UPLOAD_SOURCE:
tools/static-to-astro/output/manual-upload/gosaki-piano-ciao-preview/public-dist/

REMOTE_TARGET:
/gosaki-piano/

UPLOAD_CONTENTS_RULE:
public-dist/ の中身だけをアップロード
（public-dist フォルダ自体を remote に作らない）
```

FTP login root is `/`. Visible: `/gosaki-piano/` (operator-created, empty of this preview HTML), `/welcome.html`.

This HTML is **ciao-preview** (`deployBase=/gosaki-piano/`). It is **not** final production (`deployBase=/`) and **not** weblike staging.

Remote layout after a correct upload:

```txt
/gosaki-piano/index.html
/gosaki-piano/_astro/
/gosaki-piano/about/
/gosaki-piano/schedule/
/gosaki-piano/discography/
/gosaki-piano/contact/
/gosaki-piano/link/
/gosaki-piano/assets/
/gosaki-piano/robots.txt
```

Wrong: `/gosaki-piano/public-dist/index.html` or files at account root `/`.

---

## 2. Upload inventory (30 files)

Select **everything inside** local `public-dist/` (files + folders). Do not select the `public-dist` folder itself.

```txt
index.html
robots.txt
sitemap-0.xml
sitemap-index.xml
_astro/          (4 files: 2 CSS + 2 unreferenced hashed JS)
about/index.html
contact/index.html
discography/index.html
link/index.html
schedule/index.html
schedule/2026-03/ … schedule/2026-08/
2026-03/ … 2026-08/   (legacy stubs)
assets/about/bands/*.jpg  (5)
```

Not in package: `admin/` · `.ftpaccess` · `welcome.html` · README / MANIFEST / zip.

---

## 3. Safety gates (absolute)

| Gate | Rule |
| --- | --- |
| Remote cwd | exactly `/gosaki-piano/` |
| Not `/` | never upload to account root |
| Not staging | never `/cms-kit-staging/...` |
| Delete | **none** — no 同期削除 / mirror / `--delete` / remote rm |
| `.ftpaccess` | do not edit or delete |
| `welcome.html` | do not touch (lives at `/`, outside target) |
| Other sites | do not touch |
| Count | these **30** files only |
| Ambiguity | STOP — no retry / cleanup / extra upload by guess |

Overwrite of **same names already inside `/gosaki-piano/`**: OK (new preview folder; not production www root). Overwrite of files **outside** `/gosaki-piano/`: never.

---

## 4. Operator visual check (before transfer)

**Permanent (after 2026-08-18 near-miss).** Do not transfer until all three are true in the **local** pane:

| Gate | Must see | Must not be |
| --- | --- | --- |
| Folder name | path contains **`gosaki-piano-ciao-preview`** then `public-dist` | `.../manual-upload/gosaki-piano/public-dist/` (staging) |
| Localized assets | local `images/wix-local/` exists (14 files) | missing `images/wix-local/` |
| Admin | local `admin/` **absent** | `admin/` in the upload selection |

Wrong folder (`gosaki-piano` without `-ciao-preview`) is the staging package. It has **no** `images/wix-local/` and **does** include Admin HTML. Uploading it to ciao.jp preview breaks localized images and can expose Admin.

Then:

1. Left pane path ends at `.../gosaki-piano-ciao-preview/public-dist` — you see `index.html`, `_astro`, `about`, `schedule`, **`images/`** (not the parent `public-dist` folder as the only selected item, and not `_stale-backup`).
2. Right pane cwd is `/gosaki-piano/` (path bar / remote site manager).
3. Right pane is **not** `/` (must not see `welcome.html` as a sibling of the drop target).
4. `/gosaki-piano/` has no unexpected important files you did not create; if unsure, STOP.
5. Selection = contents listed in §2.
6. No Delete / 同期 / mirror in the pending action.
7. `.ftpaccess` is not in the local selection and not being overwritten.

---

## 5. FileZilla steps (operator)

1. Connect to the Lolipop account whose document preview is `gotosaki.ciao.jp` (not weblike staging).
2. Remote: open `/gosaki-piano/`. Confirm cwd. If you landed on `/`, go **into** `gosaki-piano`. Do not upload yet.
3. Local: open
   `tools/static-to-astro/output/manual-upload/gosaki-piano-ciao-preview/public-dist/`
4. In local pane, select **all items inside** `public-dist/` (`index.html`, `_astro`, `about`, …).
5. Upload / drag onto remote `/gosaki-piano/` (not onto `/`).
6. If overwrite dialog appears **only for names inside `/gosaki-piano/`**: Overwrite is OK. If the path shown is `/` or another folder: **Cancel** and STOP.
7. Wait until Transfer queue is empty and **Failed transfers = 0**.
8. Remote listing of `/gosaki-piano/` should show `index.html`, `_astro/`, `about/`, `schedule/`, `robots.txt`. Must **not** show a nested `public-dist/`. Must **not** have `admin/`.
9. Do not delete leftovers. Do not sync-delete extras.

Failure / timeout / disconnect / unclear listing:

```txt
stop immediately
do not retry
do not cleanup
do not run alternative commands
record incident
ask human
```

---

## 6. After-upload QA (not this phase)

Open (after operator upload, next execution/QA phase):

```txt
https://gotosaki.ciao.jp/gosaki-piano/
https://gotosaki.ciao.jp/gosaki-piano/about/
https://gotosaki.ciao.jp/gosaki-piano/schedule/
https://gotosaki.ciao.jp/gosaki-piano/schedule/2026-07/
https://gotosaki.ciao.jp/gosaki-piano/discography/
https://gotosaki.ciao.jp/gosaki-piano/contact/
```

Check: HTTP 200 · CSS applied · nav works · no missing assets · mobile · noindex · canonical/og:url = `https://gotosaki.ciao.jp/gosaki-piano/...` · no broken internal links · internal nav stays under `/gosaki-piano/` (must not jump to `www.gosaki-piano.com` for site chrome).

**Browser QA is not executed in this preflight.**

---

## 7. Forbidden (this phase)

FTP connect/upload/delete · remote ops · DNS/SSL · DB · package regen · commit/push · `.env.local` · `service_role` · auto FTP `--apply`.

---

## 8. Next

`gosaki-ciao-jp-preview-manual-upload-execution` — operator FileZilla once, with the gates above. Cursor must not FTP.
