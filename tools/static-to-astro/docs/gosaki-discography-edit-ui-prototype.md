# G-20u29 — Gosaki Discography edit UI prototype

**Phase:** `G-20u29-gosaki-discography-edit-ui-prototype`  
**Status:** **complete** — Discography Editor Prototype in staging read-only admin · **no Save / DB write / FTP / deploy**  
**Date:** 2026-07-11  
**Base commit:** `11eadf5`  
**Prior:** G-20u28 admin UI foundation polish · G-20u28b STG reflection (`f03122b`)

| Check | Status |
| --- | --- |
| Discography Editor Prototype section | **yes** — album cards + readonly fields |
| Track list UI | **multiline textarea** per album (1 line = 1 track) |
| Fixed 34 track inputs | **no** — rejected by design |
| Save / Publish / Deploy / FTP | **disabled only** |
| Production upload | **STOP** (G-20j) |
| DB write / Supabase mutation | **not executed** |
| Sitemap `/admin/` exclusion | **unchanged** (G-20t1) |

---

## Gates

```txt
gosakiDiscographyEditUiPrototypeComplete: true
phase: G-20u29-gosaki-discography-edit-ui-prototype
discographyEditorSaveEnabled: false
cursorDbWriteExecuted: false
cursorFtpUploadExecuted: false
productionUploadStop: true
trackListUiPattern: multiline-textarea-per-album
```

---

## 1. Scope

UI prototype for **Discography editing** inside staging read-only admin (`/admin/`).

| Surface | Path | Change |
| --- | --- | --- |
| Admin page | `GosakiStagingReadOnlyAdminPage.astro` | `#gra-discography-editor` section |
| Editor snapshot | `buildDiscographyEditorPrototypeSnapshot` | Build-time JSON from discography bundle |
| Data JSON | `gosaki-read-only-admin-discography-editor.json` | 4 albums / 34 tracks when Supabase bundled |
| Read SELECT | `supabase-discography-read.mjs` | Added `release_date`, `description`, `cover_image_url` (read-only) |
| Dashboard link | Discography card | Anchor `#gra-discography-editor` |

**Not in scope:** Save enablement, dry-run validation, localStorage, DB writes, production package.

---

## 2. Track list textarea policy

| Rule | Value |
| --- | --- |
| Layout | **One multiline textarea per album** |
| Line format | **1 line = 1 track title** |
| Fixed inputs | **Do not** create 34 separate `<input>` fields |
| Editability | `readonly` (prototype preview — paste-friendly layout for future phase) |
| Persistence | **None** — no Save, no localStorage in G-20u29 |
| Label | Includes `1 line = 1 track` and `Save disabled` |

---

## 3. Album card fields (readonly prototype)

- title, artist, release_date
- label / catalog_number
- published
- cover_image_url (text + small preview when URL present)
- purchase_url, streaming_url
- description / personnel (readonly textarea — personnel may be merged in DB description)
- track list textarea

---

## 4. Safety display

- Section badges: read-only prototype · STAGING ONLY · Save disabled
- Banner: no DB write · production admin excluded · G-20j STOP
- Per-album and section-level Save buttons: **disabled** with “future phase” label

---

## 5. Not executed

- DB write / SQL mutation / Supabase insert·update·delete·upsert
- Save enablement / Edge Function changes
- FTP / deploy / package upload
- localStorage persistence

---

## 6. Next phase candidates

| ID | Candidate |
| --- | --- |
| A | Discography dry-run validation |
| B | Discography Save design |
| C | YouTube edit UI |
| D | About edit UI |

---

## 7. Verify

```bash
cd tools/static-to-astro
npm run verify:g20u29-gosaki-discography-edit-ui-prototype
npm run verify:current-active-regression
```
