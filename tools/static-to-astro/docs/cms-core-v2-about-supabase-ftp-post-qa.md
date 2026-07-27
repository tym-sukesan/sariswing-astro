# CMS Core v2 — About Supabase FTP post QA (operator)

- **Phase:** post-manual-FTP QA checklist for About dual-path packages
- **Staging URL base:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- **FTP:** operator manual upload only · `readyForAnyFutureFtpApply: false`
- **Cursor:** do not FTP / do not click Save / do not deploy Edge

---

## A. Default package (Contents / JSON — no About Supabase cutover)

After uploading `public-dist/` to `/cms-kit-staging/gosaki-piano/`:

### Admin QA

1. Open `/admin/about/` — login works
2. Confirm write backend is Contents (path flag off): dry-run uses `gosaki-about-content-dry-run`
3. Save button remains disabled (Contents arm false)
4. Live-read / preview still works (G-12a path)
5. Schedule / Discography / YouTube admin still OK

### Public QA

1. `/about/` HTTP 200
2. Profile lede text visible: `後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。`
3. Bands / Projects section OK
4. noindex / robots / canonical still PASS
5. Home YouTube / Schedule / Discography unchanged

**PASS:** Contents About path intact · no blank About · Save disabled

---

## B. After Edge deploy + Admin path package

Prerequisites: Edge `gosaki-about-supabase-save-dry-run` deployed · post-deploy QA **PASS** · package baked with `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED=true` · Save arms **false** · server `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` **unset**

See [admin-path-package-preflight](./cms-core-v2-about-supabase-admin-path-package-preflight.md) · [post-deploy QA result](./cms-core-v2-about-supabase-save-dry-run-edge-post-deploy-qa-result.md).

**Result (2026-07-28):** **PASS** — [admin-path staging FTP post-QA result](./cms-core-v2-about-supabase-admin-path-staging-ftp-post-qa-result.md)

| # | Check | Result |
| --- | --- | --- |
| 1 | `/admin/about/` shows `data-gosaki-about-write-backend=supabase` | **PASS** (`writeBackend: "supabase"`) |
| 2 | Dry-run against Supabase endpoint returns plan for `profile.lede` only (no DB write) | **PASS** (Edge post-deploy QA prior · this FTP QA: **DB writeなし**) |
| 3 | Save still disabled (`save_not_armed` / UI armed false · expect `ok:false` on Save probe) | **PASS** (`saveDisabled: true` · remote arm **unset**) |
| 3b | `value_text_required` not visible in normal UI | **PASS** (`valueTextRequiredVisible: false`) |
| 4 | Toggle path flag off package → Contents path still works (rollback) | retained in code · not re-tested this FTP |
| 5 | Schedule / Discography / YouTube admin still OK | public pages overall **PASS** · route-by-route not blocking |
| 6 | Public `/about/` lede visible (JSON SoT until build-read phase) | **PASS** (JSON · build-read **false**) |

Package: `sourceCommit` **`a876e1ebd4523d96b09d1ea46fd35748de27977e`** · operator FileZilla full `public-dist/` overwrite · stale-backup + external `PACKAGE_RUN` marker **worked** · production **unchanged**.

**STOP:** Edge 404 / CORS / auth errors → leave Contents default package live

---

## C. After build-read package (future)

Prerequisites: `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ=true` **or** `registry.sitePageFields=true` · anon read env for staging

1. Public `/about/` first profile paragraph matches staged `site_page_fields` lede
2. If DB empty/error simulated → JSON fallback still shows About (no blank)

---

## Rollback

- Re-upload prior package without About Supabase flags
- Keep Contents G-12a Edges
- Do not run SQL rollback unless separate AGENTS approval
