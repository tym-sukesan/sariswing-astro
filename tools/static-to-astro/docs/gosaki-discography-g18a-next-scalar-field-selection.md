# G-18a — Gosaki Discography next scalar field selection

**Phase:** `G-18a-gosaki-discography-next-scalar-field-selection`  
**Status:** **complete** — read-only inventory; **no Save slice selected**  
**Date:** 2026-06-29  
**Base commit:** `8fecb44`  
**Prior:** G-17e-f (`gosaki-discography-g17e-label-public-reflection-closure.md`)

| Check | Status |
| --- | --- |
| Staging DB SELECT (4 rows) | **yes** |
| Live public `/discography/` GET | **yes** |
| Seed + admin JSON compared | **yes** |
| Completed chains respected | **yes** |
| Save / DB write | **no** |
| FTP / package regen | **no** |

---

## Gates

```txt
gosakiDiscographyG18aNextScalarFieldSelectionComplete: true
phase: G-18a-gosaki-discography-next-scalar-field-selection
gosakiDiscographyScalarSaveMvpComplete: true
readyForG18bDiscographyScalarSaveSlice: false
selectedOption: Option2-scalar-save-pause-tracks-design
saveExecutedInThisPhase: false
dbWriteExecutedInThisPhase: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
ftpUploadExecuted: false
packageRegenExecuted: false
```

**Recommendation:** **Option 2** — no safe scalar Save diff remains on the 4 releases; pause scalar Save slices; proceed to **tracks / personnel / price design**.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Data sources

| Source | Path / URL | Role |
| --- | --- | --- |
| **Supabase staging** | `public.discography` on `kmjqppxjdnwwrtaeqjta` | DB SoT (read-only SELECT) |
| **Live public staging** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/` | HTTP GET — reflected HTML |
| **Inventory seed** | `tools/static-to-astro/data/gosaki/discography.seed.json` | G-15 merged inventory reference |
| **Admin JSON** | `tools/static-to-astro/config/sites/gosaki-piano-discography.json` | Admin UI reference (not public build SoT) |
| **Local package HTML** | `output/manual-upload/.../discography/index.html` | Matches live post G-17e-upload |

---

## 2. Completed practical chains (do not re-Save)

| Chain | Row | Field | Status |
| --- | --- | --- | --- |
| G-15c-f | `discography-002` / SKYLARK | `purchase_url` | **closed** |
| G-15e-f | `discography-003` / About Us!! | `artist` | **closed** |
| G-16b-f | `discography-001` / Continuous | `artist` | **closed** |
| G-17e-f | `discography-004` / Ja-Jaaaaan! | `label` | **closed** |

---

## 3. Four-release inventory (Supabase staging — 2026-06-29)

| legacy_id | title | artist | release_date | year | label | catalog_number | purchase_url | streaming_url | sort_order | published | updated_at |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- | ---: | --- | --- |
| discography-001 | Continuous | ごさきりかこTrio feat.石川周之介 | 2023-07-26 | 2023 | null | GSRT-0002 | `https://gosakirikako.base.shop/` | null | 1 | true | 2026-06-29T05:05:20.905888+00:00 |
| discography-002 | SKYLARK | 後藤沙紀 | 2023-04-26 | 2023 | null | STU-001 | `https://gosakirikako.base.shop/` | null | 2 | true | 2026-06-05T17:39:44.201802+00:00 |
| discography-003 | About Us!! | ごさきりかこTrio | 2019-01-11 | 2019 | null | GSRT-0001 | null | `https://www.tunecore.co.jp/artists/gosakirikakotrio?lang=ja` | 3 | true | 2026-06-29T02:40:57.83085+00:00 |
| discography-004 | Ja-Jaaaaan! | 新谷健介オノマトペ | 2015-03-21 | 2015 | Mardi Gras JAPAN Records | OMP-001 | null | null | 4 | true | 2026-06-29T07:36:49.044397+00:00 |

---

## 4. Live public staging comparison (HTTP GET)

| legacy_id | title | artist | release (display) | catalog | label | purchase_url | streaming_url | vs DB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 001 | Continuous | feat.石川周之介 | 2023.7.26 | GSRT-0002 | — | gosakirikako | — | **aligned** |
| 002 | SKYLARK | 後藤沙紀 | 2023.4.26 | STU-001 | — | gosakirikako | — | **aligned** |
| 003 | About Us!! | ごさきりかこTrio | 2019.01.11 | GSRT-0001 | — | — (SOLD OUT) | TuneCore URL | **aligned** |
| 004 | Ja-Jaaaaan! | 新谷健介オノマトペ | 2015.03.21 | OMP-001 | Mardi Gras JAPAN Records | — (venue text) | — | **aligned** |

**Note on `release_date` display:** Wix HTML uses dotted dates with optional zero-padding (`2019.01.11` / `2015.03.21`) while DB stores ISO `YYYY-MM-DD`. **Semantically identical** — not a Save candidate.

---

## 5. Field-by-field summary

| Field | 001 | 002 | 003 | 004 | Notes |
| --- | --- | --- | --- | --- | --- |
| **title** | C | C | C | C | All match DB / public / seed |
| **artist** | C | C | C | C | 001/003 closed chains; 002/004 aligned |
| **release_date** | C | C | B | B | ISO vs display dots only — cosmetic |
| **year** | C | C | C | C | Matches |
| **catalog_number** | C | C | C | C | Matches (public GSRT-0001 on 003; IMG-* is cover asset noise) |
| **label** | C | C | C | C | null×3 aligned; 004 closed G-17e |
| **purchase_url** | C | C | C | C | 001/002 closed; 003 SOLD OUT null; 004 venue-only null |
| **streaming_url** | C | C | C | C | 003 DB+public TuneCore aligned; others null |
| **sort_order** | defer | defer | defer | defer | DB 1–4 vs JSON order 10–40 — consistent mapping; no user-facing diff |
| **published** | defer | defer | defer | defer | All `true`; no diff |

**Out of scope (design defer):** `description`, tracks, personnel, price — not Save candidates in this phase.

---

## 6. Candidate classification

### A. Next Save slice — **none**

No field on any row meets all criteria:

- clear DB before/after
- public/seed ground truth
- one field only
- no URL/label invention
- not already closed

### B. Defer

| Item | Reason |
| --- | --- |
| `release_date` display formatting | Cosmetic Wix dots vs ISO — no DB correction needed |
| `sort_order` / `published` | Operational; no public diff; out of scalar MVP scope |
| Public patch for `release_date` format | Low value; would be display-only regen |

### C. Diff none / chain complete

| Item | Rows |
| --- | --- |
| `purchase_url` | 001, 002 (G-15c); 003/004 null aligned with public |
| `artist` | 001 (G-16b), 003 (G-15e); 002/004 aligned |
| `label` | 004 (G-17e); 001–003 null aligned |
| `title`, `year`, `catalog_number` | all 4 releases |
| `streaming_url` (003) | DB + public already match (seed/import — not a new slice) |

### D. Reject

| Item | Reason |
| --- | --- |
| `streaming_url` on 001 / 002 / 004 | null in DB and public — **no canonical URL to add** |
| `purchase_url` on 003 | SOLD OUT — no shop URL on public |
| `purchase_url` on 004 | venue-only purchase text — no URL |
| Re-Save any closed field | forbidden |

---

## 7. Selected next phase

### **Option 2 (selected)**

```txt
Discography scalar Save MVP is complete for the current 4 releases.
No safe scalar diff remains for G-18b Save slice.
Next: tracks / personnel / price design (G-18b planning).
```

### Option 1 (not selected)

No `legacy_id` + single `field` pair qualifies for G-18b Save preflight at this time.

---

## 8. Scalar Save MVP — proven end-to-end summary

| Row | Field | Chain |
| --- | --- | --- |
| discography-002 | `purchase_url` | G-15c |
| discography-003 | `artist` | G-15e |
| discography-001 | `artist` | G-16b |
| discography-004 | `label` | G-17c–G-17e (G-17b registry first) |

**Registry + generic scalar layer (G-17b):** proven on `label`. Prior fields used dedicated or early hooks.

---

## 9. Next phase recommendations (after G-18a)

| Priority | Phase | Content |
| ---: | --- | --- |
| **1** | **G-18b** | Discography **tracks / personnel / price** design — DB gap vs Wix HTML; no Save yet |
| 2 | Public patch registry | `release_date` / `title` / `catalog_number` patch rules when future slices need them |
| 3 | Save operation logging | Operator Save timestamp + SELECT afterVerification (G-17d lesson) |
| 4 | Seed JSON refresh | Update stale `Feat.` / `trio` casing in `discography.seed.json` (inventory only — not Save) |
| 5 | FTP automation | Deferred — manual upload continues |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18a-gosaki-discography-next-scalar-field-selection.mjs
```
