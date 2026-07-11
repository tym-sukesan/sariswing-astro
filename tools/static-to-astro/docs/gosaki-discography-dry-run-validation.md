# G-20u30 — Gosaki Discography dry-run validation

**Phase:** `G-20u30-gosaki-discography-dry-run-validation`  
**Status:** **complete** — browser-only Discography track list dry-run validation · **no Save / DB write / network write**  
**Date:** 2026-07-11  
**Base commit:** `7b44f24`  
**Prior:** G-20u29 Discography edit UI prototype · G-20u29b STG reflection (`2a5dc68`)

| Check | Status |
| --- | --- |
| Editable track list textarea | **yes** — per album |
| Dry-run validation button | **yes** — per album + all albums |
| Diff display | **browser-only** JSON (added / removed / changedLines / unchanged) |
| `wouldWrite` | **always false** |
| Save / network write | **disabled / not executed** |
| Production upload | **STOP** (G-20j) |
| Sitemap `/admin/` exclusion | **unchanged** |

---

## Gates

```txt
gosakiDiscographyDryRunValidationComplete: true
phase: G-20u30-gosaki-discography-dry-run-validation
discographyDryRunNetworkWrite: false
discographyDryRunSaveEnabled: false
cursorDbWriteExecuted: false
cursorFtpUploadExecuted: false
productionUploadStop: true
trackListUiPattern: multiline-textarea-per-album
```

---

## 1. Scope

Client-side dry-run validation for **Discography track list textarea** in staging read-only admin.

| Surface | Change |
| --- | --- |
| `GosakiStagingReadOnlyAdminPage.astro` | Editable textarea · dry-run buttons · result `<pre>` |
| `gosaki-staging-read-only-admin.ts` | `parseDiscographyTrackListLines` · `validateDiscographyTrackListDryRun` |
| `gosaki-staging-read-only-admin.mjs` | Same logic (verifier / build snapshot) |
| Editor snapshot JSON | `dryRunValidation: true` |

**Not in scope:** Save, Supabase mutation, Discography fetch POST, Edge Function, localStorage, production package.

---

## 2. Track list textarea policy (unchanged from G-20u29)

| Rule | Value |
| --- | --- |
| Layout | **One multiline textarea per album** |
| Line format | **1 line = 1 track title** |
| Fixed inputs | **Do not** create 34 separate `<input>` fields |
| Editability | **editable** (G-20u30) — for dry-run preview only |
| Persistence | **None** — no Save, no localStorage |
| Original baseline | `data-original-track-list` attribute (build-time snapshot) |

---

## 3. Dry-run validation UI

| Control | Behavior |
| --- | --- |
| Per-album button | `Dry-run validation（保存なし）` |
| All-albums button | `Validate changes — no save（全アルバム）` |
| Result area | `<pre data-disc-dry-run-result>` — JSON diff |
| Save buttons | **remain disabled** |

Safety banner: Dry-run only · Save disabled · No DB write · No network write · G-20j STOP.

---

## 4. Diff logic (normalization rules)

1. Split textarea by `\n` (supports `\r\n`)
2. **Trim** each line
3. **Drop blank lines** (`blankLinesIgnored: true`)
4. Treat each remaining line as **one track title** (no track IDs / order DB mapping in G-20u30)
5. Compare **before** (original snapshot) vs **after** (current textarea)

Output fields:

| Field | Meaning |
| --- | --- |
| `totalBefore` / `totalAfter` | Line counts after normalization |
| `added` | Titles present in after but not matched in before (multiset) |
| `removed` | Titles present in before but not matched in after |
| `unchanged` | Count of before titles matched in after (multiset) |
| `changedLines` | Positional line diff (added / removed / changed at line index) |
| `reordered` | `true` when multiset equal but line order differs |
| `wouldWrite` | **always `false`** |
| `networkWrite` | **always `false`** |

**Deferred:** track DB IDs, sort_order mapping, Edge Function payload design → next Save design phase.

---

## 5. Not executed

- DB write / SQL mutation / Supabase insert·update·delete·upsert
- Discography fetch POST (YouTube dry-run POST unchanged)
- Save enablement
- FTP / deploy / package upload
- localStorage

---

## 6. Next phase candidates

| ID | Candidate |
| --- | --- |
| A | Discography dry-run STG reflection |
| B | Discography Save design |
| C | Discography DB write SQL / Edge Function design |
| D | YouTube edit UI |
| E | About edit UI |

---

## 7. Verify

```bash
cd tools/static-to-astro
npm run verify:g20u30-gosaki-discography-dry-run-validation
npm run verify:current-active-regression
```
