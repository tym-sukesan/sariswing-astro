# G-15e-f — Gosaki Discography artist public reflection closure

**Phase:** `G-15e-f-gosaki-discography-artist-public-reflection-closure`  
**Status:** **complete** — G-15d / G-15e Discography CMS `artist` chain **closed** (Save preflight → dry-run → Save → public reflection); documentation / verification only  
**Date:** 2026-06-29  
**Base commit:** `6dc81c3`  
**Operator:** 戸山（G-15d Save once; G-15e-upload manual upload once）

| Check | Status |
| --- | --- |
| G-15d / G-15e `artist` chain | **closed** |
| Save preflight (G-15d) | **complete** |
| Local dry-run Preview (G-15d-d2/d3) | **complete** |
| DB Save (G-15d-execution) | **complete** |
| `updated_at` trigger live proof | **success** (G-15d Save) |
| Public staging reflection (G-15e-upload) | **complete** |
| HTTP verify (live `/discography/`) | **PASS** |
| G-15c SKYLARK `purchase_url` reflection | **maintained** |
| `discography/index.html` re-upload needed | **no** |
| Rollback needed | **no** |
| Continuous / SKYLARK / Ja-Jaaaaan! | **untouched** (G-15d) |
| `discography-002` | **untouched** (G-15d) |
| Cursor FTP / Save / DB write (this phase) | **no** |

---

## Gates

```txt
gosakiDiscographyArtistPublicReflectionClosureComplete: true
gosakiDiscographyArtistChainComplete: true
phase: G-15e-f-gosaki-discography-artist-public-reflection-closure
readyForG15eDiscographyArtistReUpload: false
readyForG15eDiscographyArtistReflectionReUpload: false
readyForG15dSameRowReSave: false
readyForG15DiscographyArtistReExecution: false
rollbackNeeded: false
rollbackExecutedInThisPhase: false
discography002Touched: false
skylarkReleaseTouched: false
continuousReleaseTouched: false
jaJaaaaanReleaseTouched: false
skylarkPurchaseUrlReflectionMaintained: true
cursorFtpExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorPackageRegenExecuted: false
```

**Do not re-click** G-15d Save on `discography-003` / `artist`. **Do not re-upload** `discography/index.html` without new approval ID and documented reason.

**Also closed (separate chain):** G-15c-f `purchase_url` on `discography-002` — do not re-Save or re-upload for that field.

**Routine dev:** disarm all G-15d non-dry-run arms; restart with `PUBLIC_ADMIN_WRITE_DRY_RUN=true`.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Closure scope

### In scope (Discography CMS MVP PoC #2 — `artist` only)

| Item | Value |
| --- | --- |
| **Row id** | `d17653b4-f83d-4548-9936-d3fcc218906e` |
| **legacy_id** | `discography-003` |
| **title** | `About Us!!` |
| **route** | `/discography/` |
| **dry-run approval_id** | `G-15d-gosaki-discography-artist-dry-run-slice` |
| **Save approval_id** | `G-15d-gosaki-discography-existing-release-artist-non-dry-run` |
| **Save path** | staging shell `/__admin-staging-shell/musician-basic/admin/discography/` |
| **Field changed** | `artist` only |
| **Project** | `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only |

### Out of scope (deferred)

| Item | Status |
| --- | --- |
| Other discography fields (title, year, streaming_url, …) | **not in this chain** |
| `discography_tracks` CMS | **deferred** |
| Cover image upload / Storage | **deferred** (G-10f) |
| Full Discography DB-driven page regen | **deferred** |
| Continuous / SKYLARK / Ja-Jaaaaan! rows | **not modified in G-15d** |
| `discography-002` `purchase_url` | **closed in G-15c-f** — not re-touched |
| Sariswing production / `/admin` | **not touched** |
| Full 27-file package re-upload | **not required** |
| `_astro/` re-upload | **not required** (CSS/JS hash unchanged) |

---

## 2. Phase chain (completed)

### Planning / Save preflight

| Phase | Doc | Note |
| --- | --- | --- |
| **G-15 inventory** | `gosaki-discography-cms-mvp-inventory-and-plan.md` | 4 releases mapped |
| **G-15a read binding** | `gosaki-discography-admin-supabase-read-binding.md` | admin → Supabase |
| **G-15d preflight** | `gosaki-discography-next-field-save-preflight.md` | `artist` selected; `streaming_url` rejected |

### Dry-run Preview

| Phase | Doc | Note |
| --- | --- | --- |
| **G-15d-d2/d3** | `gosaki-discography-artist-local-dry-run-result-and-save-final-preflight.md` | dry-run Preview PASS |

### Save execution

| Phase | Doc | Commit / note |
| --- | --- | --- |
| **G-15d-execution** | `gosaki-discography-artist-save-result.md` | `db0ae06`; Save **succeeded**; `updated_at` trigger live proof **success** |

### Public reflection

| Phase | Doc | Commit / note |
| --- | --- | --- |
| **G-14c playbook** | `gosaki-public-reflection-operation-standardization.md` | reflection standard |
| **G-15e preflight** | `gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight.md` | `566d714`; hook + 1-file upload plan |
| **G-15e-upload** | `gosaki-discography-artist-public-reflection-upload-result.md` | `6dc81c3` |
| **G-15e-f closure** | `gosaki-discography-artist-public-reflection-closure.md` | (this doc) |

---

## 3. Completed outcomes (summary)

### Product path confirmation

- **Discography CMS existing-row Save** succeeded on staging admin shell (second field after G-15b `purchase_url`)
- **approval_id:** `G-15d-gosaki-discography-existing-release-artist-non-dry-run`
- **Save clicks:** **1** successful (G-15d-execution)
- **Optimistic lock:** `expectedBeforeUpdatedAt` used on Save path
- **`updated_at` trigger:** live proof **succeeded** on this Save (unlike G-15b-retry which predated trigger)

### DB (G-15d-execution)

| Item | Value |
| --- | --- |
| **rowsAffected** | **1** |
| **changedFields** | `artist` only |
| **before** | `ごさきりかこtrio` |
| **after** | `ごさきりかこTrio` |
| **updated_at after Save** | `2026-06-29T02:40:57.83085+00:00` |
| **rollbackNeeded** | **false** |

### Public reflection hook (G-15e)

- **Module:** `scripts/lib/supabase-discography-read.mjs`
- **Behavior:** `patchGosakiDiscographySupabaseFields` — `purchase_url` (G-15c) + `artist` (G-15e) at convert
- **Artist patch rule:** Wix h2 `「{title}」/{artist}` within repeater item matched by album `title`
- **Marker:** `discographyDataSource=supabase` in built HTML
- **Regen:** `build-gosaki-staging-admin-package.mjs` — PASS; 4 purchase_url + 1 artist patch
- CSS hash unchanged: `index.YcHrHZH4.css`

### Manual upload (G-15e-upload)

- **1 file** overwrite: `discography/index.html`
- Local: `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html`
- Remote: `/cms-kit-staging/gosaki-piano/discography/index.html`
- No `_astro/` upload; no mirror / sync / delete

### HTTP verify (closure re-check)

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`

| Check | Result |
| --- | --- |
| HTTP | **200** |
| About Us!! | **present** |
| About Us item `ごさきりかこTrio` | **present** |
| About Us item `ごさきりかこtrio` | **absent** |
| Page `ごさきりかこtrio` | **absent** |
| `discographyDataSource=supabase` | **present** |
| `https://gosakirikako.base.shop/` (page) | **present** (G-15c maintained) |
| `https://gosaakiii.base.shop/` (page) | **absent** |
| SKYLARK item new URL | **present** |
| SKYLARK item old URL | **absent** |
| `Continuous` / `SKYLARK` / `Ja-Jaaaaan!` | **present** |
| Audit markers (`[CMS Kit staging]`, `PoC`, `dry-run`) | **absent** |
| CSS hash on page | `index.YcHrHZH4.css` **present** |

---

## 4. Discography CMS MVP — current state

### Proven end-to-end (admin Save → public staging)

| Row | Field | Chain | Status |
| --- | --- | --- | --- |
| `discography-002` / SKYLARK | `purchase_url` | G-15b → G-15c-upload → G-15c-f | **closed** |
| `discography-003` / About Us!! | `artist` | G-15d → G-15e-upload → G-15e-f | **closed** |

### Infrastructure in place

| Capability | Status |
| --- | --- |
| Admin Supabase read (4 albums) | **live** |
| Dry-run Preview per-field slices | **pattern proven** |
| Existing-row UPDATE Save + optimistic lock | **proven** |
| `discography_set_updated_at` trigger | **live**; proven on G-15d Save |
| `GRANT UPDATE` on `public.discography` | **applied** (G-15b-grant) |
| Convert hook (`purchase_url` + `artist`) | **live** |
| G-14c reflection playbook | **documented** |

### Rows not yet edited via CMS Save

| legacy_id | Title | Notes |
| --- | --- | --- |
| `discography-001` | Continuous | no Save slice yet |
| `discography-004` | Ja-Jaaaaan! | no Save slice yet |

---

## 5. Re-execution policy

| Policy | Value |
| --- | --- |
| `readyForG15DiscographyArtistReExecution` | **false** |
| Same row `discography-003` re-Save | **forbidden** without new approval + fresh preflight |
| `discography/index.html` re-upload | **forbidden** without new approval |
| G-15d non-dry-run env in routine dev | **must be off** — use `PUBLIC_ADMIN_WRITE_DRY_RUN=true` |
| `discography-002` re-Save | **forbidden** (G-15c-f closed) |

### Next Discography edit start conditions

A **new** field or row edit requires:

1. New planning + approval ID (do not reuse G-15d / G-15b approval IDs)
2. Dry-run Preview → final preflight → operator Save once
3. If public field: G-14c-style regen + minimal upload scope doc
4. Disarm prior non-dry-run env before routine dev
5. Use a **different** closed row or unclosed row — not `discography-002` or `discography-003` re-Save

---

## 6. Remaining gaps (post-closure)

| Gap | Priority | Notes |
| --- | --- | --- |
| **Other editable scalar fields** | **high** | `title`, `year`, `release_date`, `published`, `sort_order`, `label`, `catalog_number`, `description` — no Save slices yet |
| **`streaming_url` public patch** | **medium** | DB column exists; G-15d rejected Save (null on 001/002/004; 003 already correct on public) — needs row + URL inventory before slice |
| **Public reflection beyond `purchase_url` / `artist`** | **medium** | hook pattern exists; extend per field as Save slices land |
| **Kit reusable playbook** | **medium** | merge Schedule (G-14c) + Discography (G-15 ×2) into CMS Kit checklist |
| **Tracks / personnel / price** | **low** | 16 DB tracks vs 34 JSON lines; personnel in `description`; `price` Wix-only — schema decision first |
| **Cover images** | **low** | Wix CDN on public; Storage URLs in DB — G-10f |
| **Full DB-driven Discography page** | **low** | defer until enough fields have hooks |
| **`site_slug` Kit generalization** | **low** | template exists |

---

## 7. Next phase recommendations (priority order)

### 1. **A — Discography CMS field expansion** (recommended first)

Extend **one field at a time** on an **unclosed row** (`discography-001` or `discography-004`):

| Suggested order | Field | Rationale |
| --- | --- | --- |
| A1 | `title` or `year` / `release_date` | scalar text/date; clear dry-run diff; G-15d deferred these as higher-visibility than artist casing |
| A2 | `published` / `sort_order` | visibility / order; may not need public HTML patch |
| A3 | `streaming_url` | **only after** row + URL inventory — G-15d rejected due to null URLs on 001/002/004 |

**Do not re-Save** `discography-002` or `discography-003`.

### 2. **B — Discography public reflection generalization** (after A1+)

Extend `patchGosakiDiscographySupabaseFields` as new Save slices land:

- `title` → h3 heading patch
- `year` / `release_date` → release line patch
- `streaming_url` → link patch (when Save slice exists)

Do not big-bang full DB-driven Discography page yet — keep Wix HTML pass-through + targeted patches.

### 3. **C — Save / Reflection playbook化** (parallel, low risk)

Document Kit-general checklist from G-14 Schedule + G-15 Discography (two closed chains):

```txt
inventory → admin read → dry-run slice → Save preflight → operator Save once
→ (optional trigger/grant) → convert hook → local regen → minimal upload doc
→ operator 1-file upload → HTTP verify → closure
```

Doc-only phase — no DB/FTP. Accelerates next customer onboarding.

### 4. **D — Tracks / personnel / price** (defer)

Requires inventory refresh before schema work:

- Track count mismatch (DB vs JSON)
- Personnel merged in `description` on public HTML
- `price` not in DB column — Wix-only today

Planning / inventory only — no implementation in next sprint.

---

## 8. Forbidden operations (this phase)

| Operation | Executed? |
| --- | --- |
| Cursor FTP / upload | **no** |
| Package regen | **no** |
| DB write / Save | **no** |
| `workflow_dispatch` / deploy | **no** |
| Production / Sariswing | **no** |

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-g15e-f-gosaki-discography-artist-public-reflection-closure.mjs
```
