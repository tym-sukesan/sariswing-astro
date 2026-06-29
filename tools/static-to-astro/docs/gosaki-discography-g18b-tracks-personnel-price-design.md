# G-18b — Gosaki Discography tracks / personnel / price design

**Phase:** `G-18b-gosaki-discography-tracks-personnel-price-design`  
**Status:** **complete** — read-only inventory + design; **no schema migration, Save, or public reflection**  
**Date:** 2026-06-29  
**Base commit:** `7e73c2d`  
**Prior:** G-18a (`gosaki-discography-g18a-next-scalar-field-selection.md`)

| Check | Status |
| --- | --- |
| Staging `discography` + `discography_tracks` SELECT | **yes** |
| Seed / admin JSON / fixture / live public compared | **yes** |
| Track count gap documented (16 vs 34) | **yes** |
| Schema migration executed | **no** |
| Save / DB write | **no** |

---

## Gates

```txt
gosakiDiscographyG18bTracksPersonnelPriceDesignComplete: true
phase: G-18b-gosaki-discography-tracks-personnel-price-design
readyForG18cTracksInventoryCompletionPlan: true
readyForG18cPriceColumnMigrationPreflight: false
readyForG18cPersonnelStructureSaveSlice: false
readyForG18cTracksSaveSlice: false
schemaMigrationExecuted: false
saveExecutedInThisPhase: false
dbWriteExecutedInThisPhase: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
ftpUploadExecuted: false
packageRegenExecuted: false
```

**Recommendation:** **Option 1** — `G-18c` tracks inventory completion / seed-to-DB gap plan (read-only planning + operator-approved backfill preflight). **Do not** open tracks Save or price DDL until inventory gap is closed.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Data sources

| Source | Path / URL | Role |
| --- | --- | --- |
| Supabase staging | `public.discography`, `public.discography_tracks` | DB (read-only SELECT) |
| Inventory seed | `data/gosaki/discography.seed.json` | 33 tracks + personnel + price |
| Admin JSON | `config/sites/gosaki-piano-discography.json` | Admin reference (not public SoT) |
| Wix fixture | `fixtures/gosaki-piano/discography.html` | Crawled HTML — matches public structure |
| Live public | `…/discography/` | HTTP GET — Wix-derived display |
| Public patch hook | `scripts/lib/supabase-discography-read.mjs` | Scalar fields only today |
| Admin read | `src/lib/admin/staging-write/staging-discography-read.ts` | Loads tracks into operator UI |
| Admin UI | `gosaki-staging-discography-admin-ui.ts` | `tracks` textarea (newline titles); `description` text |

---

## 2. Scalar Save MVP context (closed — do not re-open)

| Chain | Row | Field |
| --- | --- | --- |
| G-15c-f | discography-002 | `purchase_url` |
| G-15e-f | discography-003 | `artist` |
| G-16b-f | discography-001 | `artist` |
| G-17e-f | discography-004 | `label` |

G-18a: **no further scalar Save slice** on current 4 releases.

---

## 3. `discography` row inventory (complex fields)

| legacy_id | title | description (DB) | price (public/fixture) | purchase pattern |
| --- | --- | --- | --- | --- |
| discography-001 | Continuous | personnel lines merged (6 roles → compressed text) | `3,500 (tax in)` | BASE shop URL (scalar done) |
| discography-002 | SKYLARK | `後藤沙紀 / piano,pianica` | `2,000 (tax in)` | BASE shop URL |
| discography-003 | About Us!! | 3 personnel lines | `2,500 (tax in)` | SOLD OUT — no URL |
| discography-004 | Ja-Jaaaaan! | personnel + `ライブ会場でご購入いただけます` | `2,000 (tax in)` | venue-only — no URL |

**DB has no `price` column.** Price exists only in Wix Release line + seed/admin JSON.

---

## 4. `discography_tracks` inventory (staging SELECT)

| legacy_id | DB count | Seed/JSON count | Fixture count | Missing from DB (seed titles) |
| --- | ---: | ---: | ---: | --- |
| discography-001 | **5** | **9** | **9** | Ain't She Sweet, Boplicity, Double Rainbow, Verrazano Moon |
| discography-002 | **4** | **8** | **8** | My Blue Heaven, How Deep Is The Ocean, Set Sail, Like a Lover |
| discography-003 | **4** | **9** | **9** | Darn That Dream, The Old Country, The Sweetest Sounds, Samba De Cafe Terrasse, I'd Climb The Highest Mountain |
| discography-004 | **3** | **8** | **8** | Nearer My God To Thee, A Fool Such As I, Si Tu Vois Ma Mere, St. Phillip Street Break Down, Girl Of My Dream |
| **Total** | **16** | **34** | **34** | **18 rows missing** |

### DB track rows (current — partial seed)

**discography-001:** Nature Boy, Waters Of March, With a Song In My Heart, Here Comes The Sun, Continuous  

**discography-002:** On a Clear Day, Skylark, What a Wonderful World, The Water Is Wide  

**discography-003:** 白玉Bluse, The Lady Is A Tramp, Honeysuckle Rose, The Look Of Love  

**discography-004:** Mary Ann, Shreveport Stomp, Bourbon Street Parade  

**Schema (live):** `discography_legacy_id`, `track_number`, `title`, `sort_order`, `created_at` — no `duration`, no `published` on tracks.

**Observation:** DB rows are a **strict prefix subset** of seed/fixture/public lists (same order for stored rows; titles match where present). **Not safe as SoT today.**

---

## 5. Seed / JSON / fixture / public comparison

| Field | Seed + admin JSON | Fixture + live public | DB |
| --- | --- | --- | --- |
| Track list | 34 titles (structured arrays) | Same titles (Wix Track List block) | 16 rows (partial) |
| Personnel | `personnel[]` per release (1–6 lines) | Personnel `<p>` block per item | `description` text (lossy merge) |
| Price | `price` string per release | Release line inline | **no column** |
| Purchase text | `purchaseText` | SOLD OUT / venue / shop copy | partly in `description` (004) |
| Purchase URL | scalar field | link or absent | `purchase_url` (scalar done) |

**Canonical source for planning (pre-Save):** **fixture HTML = live public = seed JSON** for tracks, personnel, and price display. DB tracks and `description` are **behind**.

---

## 6. Tracks — design

### 6.1 Can `discography_tracks` be SoT today?

**No.** 16/34 rows; every album incomplete. Existing rows match seed order/titles but omit trailing tracks. (Seed metadata `trackCountJson: 33` is stale; `trackListJson` arrays sum to **34**.)

### 6.2 MVP scope (after inventory backfill)

| Priority | Capability | Rationale |
| ---: | --- | --- |
| P1 | **Title edit** (one track, one album) | Smallest Save slice; mirrors scalar pattern |
| P2 | **Reorder** (`sort_order` / `track_number`) | Admin UI already shows ordered list |
| P3 | **Add** missing rows | Needs INSERT approval + gap plan |
| P4 | **Delete** | Highest risk; defer |

### 6.3 Public reflection

- Add `patchDiscographyItemTracks(segment, tracks[])` in `supabase-discography-read.mjs`
- Within repeater item bounds: replace Track List `<ul>` inner `<li>` sequence (Wix structure is fixed per item)
- Regen + likely `discography/index.html` upload (same playbook as scalars)
- **Do not implement in G-18b**

### 6.4 First PoC candidate

**None in G-18b.** First PoC **after G-18c backfill plan:**

- Target: `discography-002` / track 1 / title typo fix — **only after** DB has all 8 SKYLARK tracks matching public.

### 6.5 Design criteria (tracks)

| Criterion | Assessment |
| --- | --- |
| A. Minimal practical | **Yes** after backfill + title-edit slice |
| B. Kit generalizable | **Yes** — `discography_tracks` table already generic |
| C. Won't break public HTML | **Risky** until patch bounds tested per album |
| D. Rollback | Per-track UPDATE/INSERT rollback SQL feasible |
| E. Operator UX | Newline `tracks` textarea exists — extend with dry-run |
| F. DB natural | **Yes** — table already exists |
| G. Public reflection | Feasible but **new hook**; not trivial |

---

## 7. Personnel — design

### 7.1 Representation options

| Option | Pros | Cons | Recommendation |
| --- | --- | --- | --- |
| **A. Keep `description` only** | No DDL | Mixed with purchase notes (004); not structured; hard to patch Personnel block | **interim read-only** |
| **B. `personnel jsonb` on `discography`** | Matches admin JSON; one row per album | Migration; parse for public patch | **recommended medium-term** |
| **C. `personnel_lines text[]`** | Simple | Less structured than JSON | acceptable alternative |
| **D. `discography_personnel` table** | Normalized | Overkill for 4 albums; more Save complexity | **defer** |

### 7.2 Public reflection

- Patch Personnel block: replace inner `<p>` lines between `Personnel` heading and `Release` line within repeater item
- Separate from `description` once structured column exists

### 7.3 First PoC candidate

**Defer** until tracks inventory closed. Personnel Save without structured column risks overwriting purchase notes in `description`.

### 7.4 Design criteria (personnel)

| Criterion | Assessment |
| --- | --- |
| A. Minimal | **No** — needs schema or careful description split |
| B. Kit | JSONB array of strings aligns with `gosaki-piano-discography.json` |
| C. Public HTML | Fixed Personnel block — patchable like label |
| D. Rollback | Easy with dedicated column |
| E. Operator UX | Array editor in admin (future) |
| F. DB | JSONB on `discography` is natural next DDL |
| G. Public reflection | Feasible after structure split from purchase text |

---

## 8. Price — design

### 8.1 Representation options

| Option | Assessment |
| --- | --- |
| **Add `price text` column** | **Recommended** — mirrors admin JSON `price` (`3,500 (tax in)`) |
| **Add `purchase_display_text text`** | Optional — for SOLD OUT / venue copy separate from `purchase_url` |
| **Store in `description`** | **Reject** — already overloaded |
| **Infer from public only** | **Reject** — no invention |

### 8.2 Known price values (fixture / seed / public)

| legacy_id | price |
| --- | --- |
| discography-001 | `3,500 (tax in)` |
| discography-002 | `2,000 (tax in)` |
| discography-003 | `2,500 (tax in)` |
| discography-004 | `2,000 (tax in)` |

### 8.3 Relationship to purchase

| Pattern | `purchase_url` | display text |
| --- | --- | --- |
| Continuous / SKYLARK | BASE URL (scalar done) | オンラインショップ… |
| About Us!! | `null` | Thank you SOLD OUT! |
| Ja-Jaaaaan! | `null` | ライブ会場でご購入… |

Price editing is **orthogonal** to `purchase_url` scalar chain.

### 8.4 Public reflection

- Extend Release line patch (near `catalog_number` / label handlers) to inject `price` from DB
- **DDL required before Save slice**

### 8.5 First PoC candidate

**G-18e (future):** `price` column migration preflight + backfill from seed — **after G-18c tracks inventory**.

### 8.6 Design criteria (price)

| Criterion | Assessment |
| --- | --- |
| A. Minimal | **Yes** — single nullable text column |
| B. Kit | Matches admin JSON field |
| C. Public | Release line patch — same repeater bounds |
| D. Rollback | `UPDATE price = …` trivial |
| E. Operator | Single text field |
| F. DB | Documented in `gosaki-discography-schema.template.sql` already |
| G. Public reflection | Straightforward once column populated |

---

## 9. Recommended next phase

### **Option 1 (selected): G-18c tracks inventory completion / seed-to-DB gap plan**

| Item | Detail |
| --- | --- |
| Goal | Document exact 18 missing `discography_tracks` rows; operator-approved **one-time backfill** preflight |
| Why first | Table exists; no DDL; blocks honest tracks SoT; DB subset is deterministic |
| Deliverable | Gap matrix + INSERT preflight (not executed in G-18c planning) |
| After | G-18d tracks title-edit Save slice planning; G-18e price DDL preflight; G-18f personnel JSONB design |

### Options not selected

| Option | Reason |
| --- | --- |
| **2 — price column now** | DDL + backfill before tracks SoT; price is display-only and lower risk than wrong track lists |
| **3 — personnel structure now** | Needs schema decision; `description` conflated with purchase copy on 004 |
| **4 — defer to Schedule CMS** | Discography complex-field gap is now documented; tracks backfill is bounded and high value |
| **5 — other** | Combined mega-migration rejected — violates one-field slice safety |

---

## 10. Implementation sequence (proposed)

```txt
G-18c  tracks inventory gap plan + backfill preflight (INSERT — operator approval)
G-18d  tracks title-edit Save slice planning (one track, one album)
G-18e  price column migration preflight + seed backfill plan
G-18f  personnel JSONB (or text[]) migration + Save slice planning
G-18g+ public reflection hooks (tracks, then price, then personnel)
```

**Out of scope until design phases complete:** `discography_tracks` DELETE, cover images (G-10f), full page regen.

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g18b-gosaki-discography-tracks-personnel-price-design.mjs
```
