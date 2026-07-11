# G-20u31 — Gosaki Discography Save design

**Phase:** `G-20u31-gosaki-discography-save-design`  
**Status:** **complete** — Save specification design only · **no Save enablement / DB write / Edge Function implementation**  
**Date:** 2026-07-11  
**Base commit:** `5143e45`  
**Prior:** G-20u30 dry-run validation · G-20u30b STG reflection (`00c8888`) · G-20u25 filtered read · G-20u24d `site_slug` migration

| Check | Status |
| --- | --- |
| Save design doc | **yes** (this file) |
| Save UI enabled | **no** — buttons remain disabled |
| DB write / SQL execution | **not executed** |
| Edge Function implementation | **not executed** — design only |
| Discography fetch POST | **not added** |
| Production upload | **STOP** (G-20j) |

---

## Gates

```txt
gosakiDiscographySaveDesignComplete: true
phase: G-20u31-gosaki-discography-save-design
saveEnabled: false
discographySaveDbWriteExecuted: false
discographyEdgeFunctionImplemented: false
cursorDbWriteExecuted: false
cursorFtpUploadExecuted: false
productionUploadStop: true
serviceRoleBrowserExposure: false
anonKeyDirectWriteAllowed: false
```

---

## 0. Inventory — current implementation (read-only baseline)

| Layer | Location | Notes |
| --- | --- | --- |
| Read loader | `scripts/lib/supabase-discography-read.mjs` | anon read · `DISCOGRAPHY_SELECT` / `DISCOGRAPHY_TRACKS_SELECT` |
| Site filter | `site-discography-loader.mjs` | `site_slug='gosaki-piano'` when `DISCOGRAPHY_SITE_SLUG_COLUMN_READY=true` |
| Admin UI | `GosakiStagingReadOnlyAdminPage.astro` | 4 album cards · 1 textarea/album · dry-run buttons |
| Dry-run (browser) | `validateDiscographyTrackListDryRun` in `.ts`/`.mjs` | added/removed/changedLines/reordered · `wouldWrite: false` |
| Staging DB | `static-to-astro-cms-staging` | **4** releases · **34** tracks · all `site_slug=gosaki-piano` |
| Album key | `discography.legacy_id` | e.g. `discography-001` … `discography-004` |
| Track link | `discography_tracks.discography_legacy_id` | FK-style string match to `legacy_id` |
| Track order | `track_number`, `sort_order` | both used on read; Save should normalize |

### Assumed columns (staging — verified G-20u24d / G-20u25)

**`public.discography`:** `legacy_id`, `title`, `artist`, `label`, `catalog_number`, `purchase_url`, `streaming_url`, `sort_order`, `published`, `release_date`, `description`, `cover_image_url`, `site_slug`

**`public.discography_tracks`:** `id` (uuid), `discography_legacy_id`, `track_number`, `title`, `sort_order`, `site_slug`

**Not in DB today:** `price`, structured `personnel[]` (personnel merged into `description` text per G-18b).

---

## A. Save scope (G-20u31 MVP target)

### A.1 Release metadata (in scope — staging admin Save slice)

| Field | UI (future) | Notes |
| --- | --- | --- |
| `title` | readonly → editable phase | Must stay aligned with Wix patch needle |
| `artist` | readonly → editable | Scalar |
| `release_date` | readonly → editable | ISO date string |
| `label` | readonly → editable | Nullable |
| `catalog_number` | readonly → editable | Nullable |
| `published` | readonly → editable | boolean |
| `cover_image_url` | text / URL only | **No upload** in MVP |
| `purchase_url` | readonly → editable | Normalize trailing `/` |
| `streaming_url` | readonly → editable | Nullable |
| `description` | textarea | Includes merged personnel text today |

### A.2 Tracks (in scope — primary MVP)

| Rule | Value |
| --- | --- |
| UI | **One textarea per album** (unchanged) |
| Format | **1 line = 1 track title** |
| `track_number` | **1-based line index** after normalization |
| `sort_order` | Same as `track_number` for MVP (or `track_number * 10`) |
| `discography_legacy_id` | Parent album `legacy_id` |
| `site_slug` | **`gosaki-piano` required** on every track row |

### A.3 Personnel / description

| Item | G-20u31 decision |
| --- | --- |
| Structured personnel | **Deferred** — no JSONB / separate table in MVP |
| `description` field | **In scope** as free text (operator edits personnel notes here) |
| Split personnel from description | **Later phase** (G-20u3x+) after G-18b design review |

---

## B. Out of scope / deferred

| Item | Reason |
| --- | --- |
| Cover image upload / Storage writes | Separate approval · storage RLS |
| Image auto-resize / CDN | Not MVP |
| `price` column / public price patch | No DB column (G-18b) |
| Multi-site generic Save UI | Gosaki pilot only; still require `site_slug` |
| Production Supabase / production package | **STOP** |
| Production FTP / G-20j upload | **STOP** |
| Anon-key direct INSERT/UPDATE from browser | **Forbidden** |
| `service_role` in admin static package | **Forbidden** |
| RLS / GRANT changes without dedicated phase | **Forbidden** in G-20u31 |
| 34 fixed `<input>` per track | Rejected UI pattern |

---

## C. Diff specification (Save preflight)

Reuse G-20u30 browser dry-run rules, extended for Save gate:

### C.1 Normalization (same as G-20u30)

1. Split on `\n` / `\r\n`
2. Trim each line
3. **Ignore blank lines**
4. Each remaining line = one track **title** (no track UUID in textarea)

### C.2 Diff outputs (required before Save)

| Field | Meaning |
| --- | --- |
| `totalBefore` / `totalAfter` | Line counts after normalization |
| `added` | Multiset titles new in after |
| `removed` | Multiset titles removed |
| `unchanged` | Matched title count |
| `changedLines` | Positional line diff |
| `reordered` | Same multiset, different order |
| `wouldWrite` | `true` only on server dry-run endpoint; browser stays `false` until armed |

### C.3 Track order re-numbering

After normalization, assign:

```txt
track_number = lineIndex + 1   // 1..N
sort_order   = track_number    // MVP: identical
```

### C.4 Edge cases

| Case | Policy |
| --- | --- |
| Duplicate titles (same album) | **Allow** but warn in dry-run (`duplicateTitles: string[]`) |
| Empty textarea (0 tracks) | **Block Save** by default — require explicit `allowEmptyTrackList: true` + approval ID |
| Full track list delete | Treated as empty — **blocked** unless override |
| `published=false` album | Save allowed on staging; public build filters `published=true` only |
| Whitespace-only lines | Ignored (blank) |
| Title length | Max **500** chars (validate server-side) |
| Special chars / HTML in title | Store plain text; reject `<` `>` in MVP validation |

---

## D. DB write policy

| Rule | Value |
| --- | --- |
| Target project | **staging only** (`static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta`) |
| `site_slug` | **`gosaki-piano` required** on all reads/writes |
| Scope filter | `WHERE legacy_id = $1 AND site_slug = 'gosaki-piano'` |
| Release + tracks | **Single logical operation** — one Save = one album atomic unit |
| Browser → Supabase | **No direct write** with anon key |
| `service_role` | **Edge Function internal only** |
| RLS | Do not loosen for MVP; use Edge Function + server validation |

### D.1 Tracks write strategy comparison

| Strategy | Pros | Cons | G-20u31 recommendation |
| --- | --- | --- | --- |
| **DELETE + INSERT** (scoped) | Simple; matches textarea snapshot | Loses stable track UUIDs | **Acceptable for MVP** if backup + approval |
| **UPSERT by position** | Keeps ids when titles stable | Hard with reorders/duplicates | Defer |
| **Diff-based PATCH** | Minimal writes | Complex; error-prone | Defer to post-MVP |

**Recommended MVP:** scoped `DELETE FROM discography_tracks WHERE discography_legacy_id = $1 AND site_slug = 'gosaki-piano'` then `INSERT` new rows in one transaction with release metadata `UPDATE`.

---

## E. Edge Function design (proposal — not implemented)

### E.1 Endpoints

| Endpoint | Purpose |
| --- | --- |
| `gosaki-discography-save-dry-run` | Server validation + diff + `wouldWrite: true/false` |
| `gosaki-discography-save` | Authorized write (staging only) |

Staging URL pattern (mirror YouTube):

```txt
https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run
https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save
```

### E.2 Request payload (example — documentation only)

```json
{
  "siteSlug": "gosaki-piano",
  "legacyId": "discography-001",
  "approvalId": "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice",
  "operationId": "G-20u36-gosaki-discography-album-save",
  "dryRun": true,
  "release": {
    "title": "Continuous",
    "artist": "ごさきりかこTrio Feat.石川周之介",
    "releaseDate": "2023-07-26",
    "label": null,
    "catalogNumber": "GSRT-0002",
    "published": true,
    "coverImageUrl": "https://…/cover.png",
    "purchaseUrl": "https://gosakirikako.base.shop/",
    "streamingUrl": null,
    "description": "personnel lines…"
  },
  "tracksText": "Nature Boy\nWaters Of March\n…",
  "expectedBeforeUpdatedAt": null
}
```

### E.3 Validation (server)

- Auth: Supabase session JWT (staging operator) — same pattern as YouTube dry-run
- `siteSlug === 'gosaki-piano'`
- `legacyId` exists and belongs to site
- `approvalId` in allowlist registry
- Track list normalization + diff
- Block empty track list unless override flag + approval
- Reject if production project ref detected

### E.4 Response payload (example)

```json
{
  "ok": true,
  "dryRun": true,
  "wouldWrite": true,
  "didWrite": false,
  "legacyId": "discography-001",
  "changedCounts": {
    "releaseFields": ["description"],
    "tracksAdded": 1,
    "tracksRemoved": 0,
    "tracksReordered": false
  },
  "diff": {
    "totalBefore": 9,
    "totalAfter": 10,
    "added": ["New Track"],
    "removed": [],
    "unchanged": 9,
    "reordered": false
  },
  "backupToken": "sha256:…",
  "error": null
}
```

### E.5 Save response (`dryRun: false`)

```json
{
  "ok": true,
  "dryRun": false,
  "wouldWrite": false,
  "didWrite": true,
  "legacyId": "discography-001",
  "changedCounts": { "tracksAdded": 1, "tracksRemoved": 0 },
  "afterSnapshot": { "release": { }, "tracks": [] },
  "updatedAt": "2026-07-11T06:00:00.000Z"
}
```

### E.6 Idempotency / concurrency

| Mechanism | MVP |
| --- | --- |
| `updated_at` on `discography` | **Recommend** add if missing (future migration phase) |
| Optimistic lock | Client sends `expectedBeforeUpdatedAt`; server rejects stale |
| Idempotency key | `operationId` + `legacyId` + content hash — log duplicates |
| Checksum | SHA-256 of normalized `tracksText` + release fields for audit log |

---

## F. Operator approval gates

Save must **not** bypass G-20u30-style safety culture.

| Step | Gate |
| --- | --- |
| 1 | Browser dry-run (G-20u30) — operator reviews JSON |
| 2 | Server dry-run POST — `wouldWrite: true` |
| 3 | Operator explicit Save click (armed UI only) |
| 4 | Server Save POST with registered `approvalId` |
| 5 | Read-back verify (SELECT) — counts + sample titles |
| 6 | Optional: regen staging package + manual FTP (separate phase) |

| Constraint | Value |
| --- | --- |
| Environment | **staging admin only** (`/__admin-staging-shell` not used; `/admin/` in staging package) |
| Production | **STOP** — no production Save |
| Cursor auto-click Save | **Forbidden** (same as Schedule PoC rules) |
| Vague approval | Insufficient — require explicit approval form per destructive-op rules |

Proposed approval IDs (register in implementation phase):

```txt
G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice   (first album pilot)
G-20u31-gosaki-discography-save-dry-run-endpoint               (server dry-run wiring)
```

---

## G. Rollback policy

### G.1 Pre-Save snapshot

Before any write, capture:

```json
{
  "legacyId": "discography-001",
  "siteSlug": "gosaki-piano",
  "capturedAt": "ISO-8601",
  "release": { },
  "tracks": [ { "id": "uuid", "title": "…", "track_number": 1 } ]
}
```

Store in Edge Function audit log (staging) — **not** in browser localStorage.

### G.2 Rollback options

| Method | When |
| --- | --- |
| **Restore JSON → Save** | Operator pastes backup into UI + explicit rollback approval |
| **Rollback SQL template** | Doc-only SQL in operator runbook (separate phase — not executable file in repo until approved) |
| **Edge Function `gosaki-discography-restore`** | Future — accepts backup token |

### G.3 Transaction / partial write

- Use **single Postgres transaction** per album Save:
  1. `UPDATE discography … WHERE legacy_id AND site_slug`
  2. `DELETE discography_tracks … scoped`
  3. `INSERT discography_tracks … batch`
- On any failure: **ROLLBACK** entire album operation
- Never leave release updated without matching tracks

### G.4 Tracks restore

Restore = re-INSERT rows from backup snapshot with original `id` values when possible; if IDs dropped (DELETE+INSERT MVP), new UUIDs OK for staging pilot — document in execution result.

---

## H. Security

| Rule | Enforcement |
| --- | --- |
| No `service_role` in browser / static admin | Env never in `PUBLIC_*` |
| No anon INSERT/UPDATE/DELETE on discography | RLS unchanged; Edge Function only |
| Auth required | Staging Supabase session (operator) |
| `approvalId` registry | Server-side allowlist |
| Edge deploy | **Separate phase** with operator approval |
| SQL migration files | **Separate phase** — not in G-20u31 |
| Production upload | **G-20j STOP** continues |
| Sitemap `/admin/` exclusion | Unchanged |

---

## I. Implementation phase split (recommended)

| Phase | Scope |
| --- | --- |
| **G-20u32** | Save API request schema + approval ID registry + verifier |
| **G-20u33** | Edge Function **draft** + `gosaki-discography-save-dry-run` (staging deploy — operator approval) |
| **G-20u34** | Save UI arm design (`PUBLIC_ADMIN_*` gate) — still no default enable |
| **G-20u35** | Staging DB write test plan + rollback drill (doc + operator) |
| **G-20u36** | First controlled Save — **one album** (`discography-002` recommended — 8 tracks) |
| **G-20u37+** | All albums · release metadata fields · read-back + package regen |

---

## J. Not executed in G-20u31

- DB write / SQL mutation / migration execution
- Save button enablement
- Discography fetch POST in admin UI
- Edge Function create/deploy/edit under `supabase/functions/**`
- Executable `.sql` migration files
- `service_role` usage
- FTP / deploy / production changes
- RLS / GRANT changes

---

## K. Verify

```bash
cd tools/static-to-astro
npm run verify:g20u31-gosaki-discography-save-design
npm run verify:current-active-regression
```
