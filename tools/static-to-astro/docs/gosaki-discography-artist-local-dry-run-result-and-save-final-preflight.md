# G-15d-d2/d3 — Gosaki Discography artist local dry-run result + Save final preflight

**Phases:**

- `G-15d-d2-gosaki-discography-artist-local-dry-run-preview-result` — operator local dry-run **PASS**
- `G-15d-d3-gosaki-discography-artist-save-final-preflight` — Save execution final preflight **complete**

**Status:** **complete** — operator dry-run Preview recorded; live beforeSnapshot reconfirmed; Save env stack documented; **no Save / DB write in this phase**  
**Date:** 2026-06-28  
**Base commit:** `355a96c`  
**Prior:** G-15d (`gosaki-discography-next-field-save-preflight.md`)

| Check | Status |
| --- | --- |
| Operator local dry-run Preview | **PASS** (operator manual — **1回**) |
| Cursor Preview / Save | **no** |
| DB write / Save | **no** |
| Live beforeSnapshot SELECT | **yes** — values match baseline |
| Save env stack documented | **yes** |
| afterVerification SELECT documented | **yes** (doc-only) |
| `updated_at` trigger live proof expectation | **yes** |
| Rollback SQL template (doc-only) | **yes** |
| FTP / package regen / reflection | **no** |

---

## Gates

```txt
gosakiDiscographyArtistLocalDryRunResultComplete: true
gosakiDiscographyArtistSaveFinalPreflightComplete: true
phase: G-15d-d2-d3-gosaki-discography-artist-local-dry-run-result-and-save-final-preflight
readyForG15dDiscographyArtistSaveExecution: true
readyForG15dExecution: true
readyForG15dPublicReflection: false
readyForAnyDbWrite: false
readyForAnyFutureFtpApply: false
cursorPreviewExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
rollbackSqlExecuted: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Do not click Save** in this phase. **Do not execute rollback SQL** without separate explicit approval.

**Do not re-Save `discography-002`** (G-15c-f `purchase_url` chain closed).

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: 355a96c
origin/main: 355a96c
branch: main...origin/main
```

G-15d artist Save preflight implementation committed at `355a96c`.

---

## 2. Staging project confirmation

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/admin/discography/
Save path: G-15d operator UI — artist slice on discography-003
service_role: not used
discography_tracks: not touched
```

---

## Part A — Local dry-run Preview result (G-15d-d2)

### A.1 Operator verification (manual)

**Route (local dev — routine stack, `PUBLIC_ADMIN_WRITE_DRY_RUN=true`):**

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/
```

**Target release:**

| Item | Value |
| --- | --- |
| **legacy_id** | `discography-003` |
| **id** | `d17653b4-f83d-4548-9936-d3fcc218906e` |
| **title** | `About Us!!` |
| **field** | `artist` only |
| **before** | `ごさきりかこtrio` |
| **after** | `ごさきりかこTrio` |
| **expectedBeforeUpdatedAt** | `2026-06-05T17:39:44.201802+00:00` |

**Clicked:** `変更を確認` (dry-run Preview) — **1回**

**Not clicked:**

```txt
更新する (Save)
discography-002 row Save (G-15b — closed)
その他の Save / Run 系ボタン
```

### A.2 Recorded dry-run Preview result (operator)

| Field | Value |
| --- | --- |
| `dryRunApprovalId` | `G-15d-gosaki-discography-artist-dry-run-slice` |
| `saveApprovalId` | `G-15d-gosaki-discography-existing-release-artist-non-dry-run` |
| `ok` | **true** |
| `dryRun` | **true** |
| `actualWrite` | **false** |
| `wouldWrite` | **true** |
| `target legacy_id` | `discography-003` |
| `changedFields` | `artist` |
| `payloadKeys` | `artist` |
| `expectedBeforeUpdatedAt` | `2026-06-05T17:39:44.201802+00:00` |
| `stale` | **false** |
| `hostGatePassed` | **true** |
| `saveReadiness` | `ready_but_save_disabled` |
| `saveAllowed` | **false** |
| `guardErrors` | none |

**before / after / payload:**

```json
before:  {"artist":"ごさきりかこtrio"}
after:   {"artist":"ごさきりかこTrio"}
payload: {"artist":"ごさきりかこTrio"}
```

**Interpretation:**

- Single-field `artist` slice — matches G-15d design
- `ready_but_save_disabled` — routine dev Save gate off (expected for Preview-only phase)
- No Supabase UPDATE — Preview only
- Save button remained disabled (`更新する（保存無効）`)

### A.3 Post-Preview DB unchanged (read-only SELECT — verifier)

After operator Preview, staging row **must still** show before values. Verifier confirms `artist = ごさきりかこtrio` and `updated_at` baseline unchanged.

**Do not re-click Preview** without documented reason.

---

## Part B — Save execution final preflight (G-15d-d3)

### B.1 Purpose

Final checks before the first **G-15d** non-dry-run Save on `discography-003` (`artist` field only).

Documents live beforeSnapshot, G-15d Save path, non-dry-run env stack, pre-Save Preview gates (armed dev), afterVerification SELECT, `updated_at` trigger live proof expectation, rollback template.

**Out of scope (this phase):** Save click, DB write, rollback SQL execution, public reflection, package regen, FTP.

### B.2 beforeSnapshot — read-only SELECT

**Method:** Supabase REST `GET /rest/v1/discography` — anon key only; staging `kmjqppxjdnwwrtaeqjta` only.

**Filters:**

```txt
legacy_id = discography-003
id = d17653b4-f83d-4548-9936-d3fcc218906e
```

**Optimistic lock baseline for Save:** `updated_at = 2026-06-05T17:39:44.201802+00:00`

| Field | Live value (G-15d-d3 preflight) | Expected | Match |
| --- | --- | --- | --- |
| **legacy_id** | `discography-003` | `discography-003` | **yes** |
| **id** | `d17653b4-f83d-4548-9936-d3fcc218906e` | same | **yes** |
| **title** | `About Us!!` | `About Us!!` | **yes** |
| **artist** | `ごさきりかこtrio` | `ごさきりかこtrio` | **yes** |
| **purchase_url** | `null` | `null` | **yes** |
| **streaming_url** | TuneCore URL (see live) | unchanged | **yes** |
| **updated_at** | `2026-06-05T17:39:44.201802+00:00` | same | **yes** |

**Reference SQL (operator reconfirm — read-only):**

```sql
SELECT
  id,
  legacy_id,
  title,
  artist,
  release_date,
  year,
  description,
  purchase_url,
  streaming_url,
  published,
  sort_order,
  updated_at
FROM public.discography
WHERE legacy_id = 'discography-003'
  AND id = 'd17653b4-f83d-4548-9936-d3fcc218906e';
```

**PoC / audit marker scan on `artist`:** **none**

**Excluded rows (do not select for G-15d Save):**

| legacy_id | reason |
| --- | --- |
| `discography-002` | G-15c-f `purchase_url` chain **closed** — do not re-Save |

### B.3 Save target and change

| Item | Value |
| --- | --- |
| **operation** | G-15d artist Save (first `updated_at` trigger live proof) |
| **legacy_id** | `discography-003` |
| **title** | `About Us!!` |
| **field** | `artist` only |
| **before** | `ごさきりかこtrio` |
| **after** | `ごさきりかこTrio` |
| **dry-run approvalId** | `G-15d-gosaki-discography-artist-dry-run-slice` |
| **Save approvalId** | `G-15d-gosaki-discography-existing-release-artist-non-dry-run` |
| **changedFields** | `["artist"]` |
| **rowsAffected** | must be `1` |

### B.4 Single-arm policy

| Arm | Execution phase |
| --- | --- |
| `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED` | **true** |
| `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED` | **off / unset** |
| `G15B_DISCOGRAPHY_SAVE_ENABLED` | **off / unset** |

---

## 3. Non-dry-run dev env stack (G-15d-execution — not started here)

From repo root. **Do not start dev in this preflight phase.**

Use existing `.env` / `.env.local` for `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` (do not print or change).

```bash
cd /path/to/sariswing-astro
ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_AUTH=true \
ENABLE_ADMIN_STAGING_DATA_READ=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
PUBLIC_ADMIN_DATA_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
PUBLIC_ADMIN_WRITE_MODULE=discography \
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-15d-gosaki-discography-existing-release-artist-non-dry-run \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED=true \
G15D_DISCOGRAPHY_SAVE_ENABLED=true \
npm run dev
```

### Required env summary

| Env | Execution value |
| --- | --- |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` |
| `PUBLIC_ADMIN_WRITE_MODULE` | `discography` |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-15d-gosaki-discography-existing-release-artist-non-dry-run` |
| `PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK` | `true` |
| `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED` | `true` |
| `G15D_DISCOGRAPHY_SAVE_ENABLED` | `true` |

### Explicitly OFF (must remain unset or false)

```txt
PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED — unset/false
G15B_DISCOGRAPHY_SAVE_ENABLED — unset/false
(all G-15b purchase_url re-Save arms — off)
```

**Single-arm policy:** G-15d arm ON ⇒ G-15b arm **off**.

### Operator approval phrase (required once per Save session)

```txt
承認します。このDiscography CMS非dry-run操作を1回だけ実行してください。
```

---

## 4. Operator procedure (G-15d-execution — Save once)

| Step | Action |
| --- | --- |
| 1 | Start dev with §3 env stack |
| 2 | Open `/__admin-staging-shell/musician-basic/admin/discography/` |
| 3 | Sign in to staging admin if prompted |
| 4 | Select **About Us!!** (`discography-003`) — default row |
| 5 | Set **artist** only: `ごさきりかこtrio` → `ごさきりかこTrio` |
| 6 | Leave title / purchase_url / streaming_url / other fields **unchanged** |
| 7 | Click **`変更を確認`** once — verify §5 gates (`saveReadiness: ready_to_save`) |
| 8 | Click **`更新する`** once (operator only — not Cursor) |
| 9 | Record Save result for G-15d-execution result doc |
| 10 | Run §6 afterVerification SELECT — confirm `updated_at` advanced |
| 11 | Disarm env stack; restart routine dev with `PUBLIC_ADMIN_WRITE_DRY_RUN=true` |

**Do not** select `discography-002` or re-Save `purchase_url`.

---

## 5. Pre-Save G-15d Preview gates (armed dev — operator must verify)

After **`変更を確認`** on armed dev (re-run Preview immediately before Save):

| Check | Expected |
| --- | --- |
| `dryRun` | `true` |
| `actualWrite` | `false` |
| `wouldWrite` | `true` |
| `saveReadiness` | `ready_to_save` |
| `saveAllowed` | `true` |
| `changedFields` | `["artist"]` only |
| `payload` | `{ "artist": "ごさきりかこTrio" }` |
| `target.legacy_id` | `discography-003` |
| `expectedBeforeUpdatedAt` | `2026-06-05T17:39:44.201802+00:00` |
| `optimisticLockStale` | `false` |
| `hostGatePassed` | `true` |
| Save button | **enabled** |

**Abort Save** if any check fails.

---

## 6. afterVerification SELECT (operator — post-Save, read-only)

Run in Supabase SQL Editor (staging `kmjqppxjdnwwrtaeqjta` only):

```sql
SELECT
  legacy_id,
  title,
  artist,
  release_date,
  year,
  description,
  purchase_url,
  streaming_url,
  published,
  sort_order,
  updated_at
FROM public.discography
WHERE legacy_id = 'discography-003'
  AND id = 'd17653b4-f83d-4548-9936-d3fcc218906e';
```

### Expected after Save

| Field | Expected |
| --- | --- |
| **legacy_id** | `discography-003` (unchanged) |
| **title** | `About Us!!` (unchanged) |
| **artist** | `ごさきりかこTrio` |
| **purchase_url** | `null` (unchanged) |
| **streaming_url** | TuneCore URL (unchanged) |
| **release_date** | unchanged |
| **year** | unchanged |
| **description** | unchanged |
| **published** | unchanged |
| **sort_order** | unchanged |
| **updated_at** | **> `2026-06-05T17:39:44.201802+00:00`** (new timestamp) |

---

## 7. updated_at trigger live proof expectation

Trigger `discography_set_updated_at` active on staging since G-15b-f8.

| Item | Expectation |
| --- | --- |
| **First live proof** | G-15d Save is the intended first proof after trigger apply |
| **G-15b history** | G-15b-retry Save did not advance `updated_at` (trigger applied after that Save) |
| **before Save** | `updated_at = 2026-06-05T17:39:44.201802+00:00` |
| **after Save** | `updated_at` strictly later (trigger-fired) |
| **If unchanged** | **STOP** — do not retry Save; investigate trigger / RLS / row match |

**Optimistic lock:** UPDATE uses `.eq("updated_at", expectedBeforeUpdatedAt)` — Save fails if row changed since Preview.

---

## 8. Rollback

**Rollback needed after successful Save:** **no** (cosmetic casing fix; easy revert if desired).

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
| Required after Save? | **Yes (later phase)** |
| Reason | `artist` appears in Wix Discography h2 on public `/discography/` |
| Current hook | `supabase-discography-read.mjs` patches `purchase_url` only |
| This phase | No regen / no upload |

---

## 10. Stop conditions

Stop and ask human if:

- host is not `kmjqppxjdnwwrtae`
- `updated_at` baseline mismatch (stale)
- `artist` before value differs from `ごさきりかこtrio`
- Save affects rows other than `discography-003`
- `discography_tracks` touched
- `updated_at` does not advance after Save
- production / Sariswing host detected
- G-15b arm detected ON alongside G-15d arm

---

## 11. Next phase

**G-15d-execution** — operator manual Save once + read-only afterVerification SELECT + `updated_at` trigger proof.

**Then (optional):** G-15d-reflection — extend convert hook for `artist`; minimal `discography/index.html` upload.

**Do not:** re-click Save without new approval; enable Save in routine dev without disarm plan; re-Save `discography-002`.

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-g15d-gosaki-discography-artist-local-dry-run-result-and-save-final-preflight.mjs
```
