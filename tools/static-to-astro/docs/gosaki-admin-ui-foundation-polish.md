# G-20u28 — Gosaki admin UI foundation polish

**Phase:** `G-20u28-gosaki-admin-ui-foundation-polish`  
**Status:** **complete** — staging read-only admin dashboard polish · **no DB write / Save / FTP / deploy**  
**Date:** 2026-07-10  
**Base commit:** `62e3367`  
**Prior:** G-20u27 staging post-upload final verification

| Check | Status |
| --- | --- |
| Admin UI dashboard | **yes** — section cards + status badges |
| Schedule / Discography stats | build-time snapshot (when Supabase bundles available) |
| Save / Publish / Deploy / FTP buttons | **disabled only** |
| Production upload | **STOP** (G-20j) — displayed on safety card |
| Sitemap `/admin/` exclusion | **unchanged** (G-20t1) |
| DB write / FTP / deploy | **not executed** |

---

## Gates

```txt
gosakiAdminUiFoundationPolishComplete: true
phase: G-20u28-gosaki-admin-ui-foundation-polish
saveEnabled: false
cursorDbWriteExecuted: false
cursorFtpUploadExecuted: false
productionUploadStop: true
```

---

## 1. Scope

UI foundation polish for **online staging read-only admin** (`/admin/` in staging package only).

| Surface | Path | Change |
| --- | --- | --- |
| Read-only admin page | `templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro` | Dashboard grid + safety banner |
| Dashboard snapshot | `buildReadOnlyAdminDashboardSnapshot` in `gosaki-staging-read-only-admin.mjs` | Schedule / discography build-time stats |
| Styles | `gosaki-staging-read-only-admin.css` | Dashboard cards, pills, safety list |
| Hook wiring | `site-generator-hooks.mjs` | Pass `scheduleBundle` / `discographyBundle` to admin apply |

**Not in scope:** local dev shell (`templates/admin-cms/gosaki/*`), Save enablement, production package.

---

## 2. Dashboard section cards

| Card | Status display | Actions |
| --- | --- | --- |
| Schedule | read-only · staging · N events / August cards | Read-only preview · 編集導線（予定） |
| Discography | read-only · filtered read · 4/34 (when bundled) | Read-only preview · 編集導線（予定） |
| YouTube | read-only · dry-run only | 詳細 · Save（無効） |
| About | read-only · char/image counts | Read-only preview |
| Contact | read-only · HubSpot meta | Read-only preview |
| Link | static | Read-only preview |
| Production readiness | production STOP · manual FTP · sitemap exclusion | info only |

---

## 3. Safety display

- **STAGING ONLY** / **READ-ONLY** / **Save disabled** header badges
- Banner: no Save · Publish · Deploy · FTP
- Production package excludes `/admin/`; sitemap excludes `/admin/`
- FTP manual only; G-20j production upload STOP

---

## 4. Not executed

- DB write / SQL mutation / Save enablement
- FTP / deploy / package upload
- Production changes

---

## 5. Next phase candidates

| ID | Candidate |
| --- | --- |
| A | Discography edit UI |
| B | YouTube edit UI |
| C | About edit UI |
| D | Schedule UI polish |

---

## 6. Verify

```bash
cd tools/static-to-astro
npm run verify:g20u28-gosaki-admin-ui-foundation-polish
npm run verify:current-active-regression
```
