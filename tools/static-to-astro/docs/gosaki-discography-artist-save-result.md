# G-15d-execution — Gosaki Discography artist Save execution result

**Phase:** `G-15d-execution-gosaki-discography-artist-save-result`  
**Status:** **complete** — operator manual G-15d artist Save **succeeded**; `updated_at` trigger live proof **succeeded**; documentation only (no re-Save, no DB write in this phase)  
**Date:** 2026-06-29  
**Operator:** manual Save once  
**Base commit:** `da6e954`  
**Prior:** G-15d-d2/d3 (`gosaki-discography-artist-local-dry-run-result-and-save-final-preflight.md`)

| Check | Status |
| --- | --- |
| G-15d artist Save executed | **yes** (operator manual — **once**) |
| G-15d operator UI path used | **yes** |
| Cursor / AI clicked Save / Preview | **no** |
| DB write in this phase | **no** |
| `service_role` used | **no** |
| Sariswing production touched | **no** |
| `discography-002` touched | **no** |
| FTP / workflow_dispatch / deploy / package regen | **not executed** |
| rollback SQL executed | **no** |
| Public reflection | **pending** (G-15e) |

---

## Gates

```txt
gosakiDiscographyArtistSaveSuccess: true
gosakiDiscographyArtistSaveExecutionComplete: true
gosakiDiscographyUpdatedAtTriggerLiveProofSuccess: true
phase: G-15d-execution-gosaki-discography-artist-save-result
readyForG15eDiscographyArtistPublicReflectionPreflight: true
readyForG15dArtistSaveReExecution: false
readyForG15dPublicReflection: false
readyForAnyDbWrite: false
readyForAnyFutureFtpApply: false
cursorClickedSave: false
cursorClickedPreview: false
cursorDbWriteExecuted: false
rollbackNeeded: false
rollbackSqlExecuted: false
discography002Touched: false
```

**Do not re-click G-15d Save** on `discography-003` without new approval and fresh preflight.

**Do not re-Save `discography-002`** (G-15c-f `purchase_url` chain closed).

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

```txt
git status --short: (empty)
HEAD: da6e954
origin/main: da6e954
branch: main...origin/main
```

---

## 2. Success summary

Gosaki staging shell **G-15d Discography artist** Save on `static-to-astro-cms-staging` **succeeded** — **`artist` field only** in one UPDATE.

| Policy | Result |
| --- | --- |
| Path | G-15d operator UI → `変更を確認` → `更新する` |
| Operation | existing release UPDATE only |
| Field | `artist` only |
| Target | `discography-003` **one row only** |
| `approval_id` | `G-15d-gosaki-discography-existing-release-artist-non-dry-run` |
| Auth path | anon client + staging admin session |
| `service_role` | **not used** |
| Project | `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` |
| `rowsAffected` | **1** |
| Save clicks | **1** (no additional clicks) |

**Not used:** G-15b `discography-002` purchase_url Save (closed).

---

## 3. Target row

| Field | Value |
| --- | --- |
| **id** | `d17653b4-f83d-4548-9936-d3fcc218906e` |
| **legacy_id** | `discography-003` |
| **title** | `About Us!!` |
| **site_slug** | `gosaki-piano` |
| **public page** | `/discography/` (Wix repeater item for About Us!!) |

**`discography-002` (SKYLARK) — not touched.**

---

## 4. beforeSnapshot / afterSnapshot

### beforeSnapshot (pre-Save)

| Field | Value |
| --- | --- |
| `artist` | `ごさきりかこtrio` |
| `updated_at` | `2026-06-05T17:39:44.201802+00:00` |
| `title` | `About Us!!` |
| `purchase_url` | `null` |
| `streaming_url` | `https://www.tunecore.co.jp/artists/gosakirikakotrio?lang=ja` |

### afterSnapshot (operator afterVerification SELECT)

| Field | Value |
| --- | --- |
| `id` | `d17653b4-f83d-4548-9936-d3fcc218906e` |
| `legacy_id` | `discography-003` |
| `title` | `About Us!!` |
| `artist` | `ごさきりかこTrio` |
| `purchase_url` | `null` |
| `streaming_url` | `https://www.tunecore.co.jp/artists/gosakirikakotrio?lang=ja` |
| `updated_at` | `2026-06-29T02:40:57.83085+00:00` |

**Reference SQL (operator executed — read-only verification):**

```sql
SELECT
  id,
  legacy_id,
  title,
  artist,
  purchase_url,
  streaming_url,
  updated_at
FROM public.discography
WHERE legacy_id = 'discography-003'
  AND id = 'd17653b4-f83d-4548-9936-d3fcc218906e';
```

---

## 5. Field change summary

| Field | before | after | changed |
| --- | --- | --- | --- |
| **artist** | `ごさきりかこtrio` | `ごさきりかこTrio` | **yes** |
| **title** | `About Us!!` | `About Us!!` | no |
| **purchase_url** | `null` | `null` | no |
| **streaming_url** | TuneCore URL | TuneCore URL | no |
| **updated_at** | `2026-06-05T17:39:44.201802+00:00` | `2026-06-29T02:40:57.83085+00:00` | **yes** |

**changedFields:** `["artist"]` only (as designed).

---

## 6. updated_at trigger live proof

| Check | Result |
| --- | --- |
| Trigger | `discography_set_updated_at` (active since G-15b-f8) |
| Baseline `updated_at` | `2026-06-05T17:39:44.201802+00:00` |
| After Save `updated_at` | `2026-06-29T02:40:57.83085+00:00` |
| Advanced from baseline | **yes** |
| Live proof on G-15d Save | **success** |

**Contrast:** G-15b-retry Save did not advance `updated_at` (trigger applied after that Save). G-15d is the **first successful live proof** that the trigger fires on Discography UPDATE.

**Optimistic lock:** Save used `expectedBeforeUpdatedAt = 2026-06-05T17:39:44.201802+00:00` — matched at Save time.

---

## 7. Unchanged fields (operator + design)

Confirmed unchanged by afterVerification:

```txt
title: About Us!!
purchase_url: null
streaming_url: https://www.tunecore.co.jp/artists/gosakirikakotrio?lang=ja
```

Other fields not in slice (`release_date`, `year`, `description`, `published`, `sort_order`) — **not targeted**; no evidence of change.

---

## 8. Rollback

| Item | Value |
| --- | --- |
| **rollbackNeeded** | **no** |
| **rollbackSqlExecuted** | **no** |
| Rationale | Cosmetic artist casing fix; intentional branding consistency |

Template (doc-only — do not execute without separate approval):

```sql
-- staging only — DO NOT EXECUTE without explicit operator approval
UPDATE public.discography
SET artist = 'ごさきりかこtrio'
WHERE legacy_id = 'discography-003'
  AND id = 'd17653b4-f83d-4548-9936-d3fcc218906e'
  AND artist = 'ごさきりかこTrio';
```

---

## 9. Public reflection

| Item | Value |
| --- | --- |
| **Status** | **pending** |
| **Reason** | `artist` appears in Wix Discography h2 for About Us!! |
| **Current hook** | `supabase-discography-read.mjs` patches `purchase_url` only |
| **Live staging `/discography/`** | likely still shows `ごさきりかこtrio` until G-15e reflection |
| **This phase** | No regen / no upload |

---

## 10. Next phase — G-15e public reflection preflight (recommended)

**Phase:** `G-15e-gosaki-discography-artist-public-reflection-preflight`

**Goals:**

1. Extend convert-time hook (`supabase-discography-read.mjs`) to patch **`artist`** for matched repeater items (mirror G-15c `purchase_url` pattern).
2. Local package regen — verify About Us!! artist = `ごさきりかこTrio` in `discography/index.html`; SKYLARK / Continuous / Ja-Jaaaaan! unchanged.
3. Document minimal upload scope (likely `discography/index.html` ×1 if CSS/JS hash unchanged — follow G-15c).
4. HTTP verify plan for staging `/cms-kit-staging/gosaki-piano/discography/`.

**Out of scope for G-15e preflight:** FTP apply, operator upload, Save re-execution.

**Standard:** [gosaki-public-reflection-operation-standardization.md](./gosaki-public-reflection-operation-standardization.md) (G-14c).

---

## 11. Stop conditions (post-execution)

Stop and ask human if:

- `discography-003` `artist` reverts without documented rollback
- `discography-002` `purchase_url` changes
- additional Save clicks occur without new approval
- production host involved

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-g15d-gosaki-discography-artist-save-result.mjs
```
