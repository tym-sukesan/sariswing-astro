# G-16a-d2/d3 — Gosaki Discography artist local dry-run result + Save final preflight

**Phases:**

- `G-16a-d2-gosaki-discography-artist-local-dry-run-preview-result` — operator local dry-run **PASS**
- `G-16a-d3-gosaki-discography-artist-save-final-preflight` — Save execution final preflight **complete**

**Status:** **complete** — operator dry-run Preview recorded; live beforeSnapshot reconfirmed; Save env stack documented; **no Save / DB write in this phase**  
**Date:** 2026-06-29  
**Base commit:** `b19b9a2`  
**Prior:** G-16a (`gosaki-discography-g16a-next-field-save-preflight.md`)  
**Playbook:** [cms-kit-save-reflection-playbook.md](./cms-kit-save-reflection-playbook.md)

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
gosakiDiscographyG16aLocalDryRunResultComplete: true
gosakiDiscographyG16aSaveFinalPreflightComplete: true
phase: G-16a-d2-d3-gosaki-discography-artist-local-dry-run-result-and-save-final-preflight
readyForG16aDiscographyArtistSaveExecution: true
readyForG16aExecution: true
readyForG16aPublicReflection: false
readyForAnyDbWrite: false
readyForAnyFutureFtpApply: false
cursorPreviewExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
rollbackSqlExecuted: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Do not click Save** in this phase. **Do not execute rollback SQL** without separate explicit approval.

**Do not re-Save:**

- `discography-002` (G-15c-f `purchase_url` chain closed)
- `discography-003` (G-15e-f `artist` chain closed)

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: b19b9a2
origin/main: b19b9a2
branch: main...origin/main
```

G-16a artist Save preflight implementation committed at `b19b9a2`.

---

## 2. Staging project confirmation

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/admin/discography/
Save path: G-16a operator UI — artist slice on discography-001
service_role: not used
discography_tracks: not touched
```

---

## Part A — Local dry-run Preview result (G-16a-d2)

### A.1 Operator verification (manual)

**Route (local dev — routine stack, `PUBLIC_ADMIN_WRITE_DRY_RUN=true`):**

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/
```

**Target release:**

| Item | Value |
| --- | --- |
| **legacy_id** | `discography-001` |
| **id** | `00f4cd00-cfb6-43b3-991a-211b2d7c92ef` |
| **title** | `Continuous` |
| **field** | `artist` only |
| **before** | `ごさきりかこTrio Feat.石川周之介` |
| **after** | `ごさきりかこTrio feat.石川周之介` |
| **expectedBeforeUpdatedAt** | `2026-06-05T17:39:44.201802+00:00` |

**Clicked:** `変更を確認` (dry-run Preview) — **1回**

**Not clicked:**

```txt
更新する (Save)
discography-002 row Save (G-15b — closed)
discography-003 row Save (G-15d — closed)
その他の Save / Run 系ボタン
```

### A.2 Recorded dry-run Preview result (operator)

| Field | Value |
| --- | --- |
| `dryRunApprovalId` | `G-16a-gosaki-discography-artist-dry-run-slice` |
| `saveApprovalId` | `G-16a-gosaki-discography-existing-release-artist-non-dry-run` |
| `ok` | **true** |
| `dryRun` | **true** |
| `actualWrite` | **false** |
| `wouldWrite` | **true** |
| `target legacy_id` | `discography-001` |
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
before:  {"artist":"ごさきりかこTrio Feat.石川周之介"}
after:   {"artist":"ごさきりかこTrio feat.石川周之介"}
payload: {"artist":"ごさきりかこTrio feat.石川周之介"}
```

**Interpretation:**

- Single-field `artist` slice — matches G-16a design
- `ready_but_save_disabled` — routine dev Save gate off (expected for Preview-only phase)
- No Supabase UPDATE — Preview only
- Save button remained disabled (`更新する（保存無効）`)

### A.3 Post-Preview DB unchanged (read-only SELECT — verifier)

After operator Preview, staging row **must still** show before values. Verifier confirms `artist = ごさきりかこTrio Feat.石川周之介` and `updated_at` baseline unchanged.

**Do not re-click Preview** without documented reason.

---

## Part B — Save execution final preflight (G-16a-d3)

### B.1 Purpose

Final checks before the first **G-16a** non-dry-run Save on `discography-001` (`artist` field only).

Documents live beforeSnapshot, G-16a Save path, non-dry-run env stack, pre-Save Preview gates (armed dev), afterVerification SELECT, `updated_at` trigger live proof expectation, rollback template.

**Out of scope (this phase):** Save click, DB write, rollback SQL execution, public reflection, package regen, FTP.

### B.2 beforeSnapshot — read-only SELECT

**Method:** Supabase REST `GET /rest/v1/discography` — anon key only; staging `kmjqppxjdnwwrtaeqjta` only.

**Filters:**

```txt
legacy_id = discography-001
id = 00f4cd00-cfb6-43b3-991a-211b2d7c92ef
```

**Optimistic lock baseline for Save:** `updated_at = 2026-06-05T17:39:44.201802+00:00`

| Field | Live value (G-16a-d3 preflight) | Expected | Match |
| --- | --- | --- | --- |
| **legacy_id** | `discography-001` | `discography-001` | **yes** |
| **id** | `00f4cd00-cfb6-43b3-991a-211b2d7c92ef` | same | **yes** |
| **title** | `Continuous` | `Continuous` | **yes** |
| **artist** | `ごさきりかこTrio Feat.石川周之介` | `ごさきりかこTrio Feat.石川周之介` | **yes** |
| **purchase_url** | `null` | `null` | **yes** |
| **streaming_url** | `null` | `null` | **yes** |
| **release_date** | `2023-07-26` | unchanged | **yes** |
| **year** | `2023` | unchanged | **yes** |
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
WHERE legacy_id = 'discography-001'
  AND id = '00f4cd00-cfb6-43b3-991a-211b2d7c92ef';
```

**PoC / audit marker scan on `artist`:** **none**

**Excluded rows (do not select for G-16a Save):**

| legacy_id | reason |
| --- | --- |
| `discography-002` | G-15c-f `purchase_url` chain **closed** — do not re-Save |
| `discography-003` | G-15e-f `artist` chain **closed** — do not re-Save |

### B.3 Save target and change

| Item | Value |
| --- | --- |
| **operation** | G-16a artist Save (`updated_at` trigger live proof on row 001) |
| **legacy_id** | `discography-001` |
| **title** | `Continuous` |
| **field** | `artist` only |
| **before** | `ごさきりかこTrio Feat.石川周之介` |
| **after** | `ごさきりかこTrio feat.石川周之介` |
| **dry-run approvalId** | `G-16a-gosaki-discography-artist-dry-run-slice` |
| **Save approvalId** | `G-16a-gosaki-discography-existing-release-artist-non-dry-run` |
| **changedFields** | `["artist"]` |
| **rowsAffected** | must be `1` |

### B.4 Single-arm policy

| Arm | Execution phase |
| --- | --- |
| `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G16A_ARTIST_NON_DRY_RUN_ARMED` | **true** |
| `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED` | **off / unset** |
| `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED` | **off / unset** |
| `G16A_DISCOGRAPHY_SAVE_ENABLED` | **true** |
| `G15B_DISCOGRAPHY_SAVE_ENABLED` | **off / unset** |
| `G15D_DISCOGRAPHY_SAVE_ENABLED` | **off / unset** |

---

## 3. Non-dry-run dev env stack (G-16a-execution — not started here)

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
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-16a-gosaki-discography-existing-release-artist-non-dry-run \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G16A_ARTIST_NON_DRY_RUN_ARMED=true \
G16A_DISCOGRAPHY_SAVE_ENABLED=true \
npm run dev
```

### Required env summary

| Env | Execution value |
| --- | --- |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` |
| `PUBLIC_ADMIN_WRITE_MODULE` | `discography` |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-16a-gosaki-discography-existing-release-artist-non-dry-run` |
| `PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK` | `true` |
| `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G16A_ARTIST_NON_DRY_RUN_ARMED` | `true` |
| `G16A_DISCOGRAPHY_SAVE_ENABLED` | `true` |

### Explicitly OFF (must remain unset or false)

```txt
PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED — unset/false
PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED — unset/false
G15B_DISCOGRAPHY_SAVE_ENABLED — unset/false
G15D_DISCOGRAPHY_SAVE_ENABLED — unset/false
(all G-15b / G-15d re-Save arms — off)
```

**Single-arm policy:** G-16a arm ON ⇒ G-15b / G-15d arms **off**.

### Operator approval phrase (required once per Save session)

```txt
承認します。このDiscography CMS非dry-run操作を1回だけ実行してください。
```

---

## 4. Operator procedure (G-16a-execution — Save once)

| Step | Action |
| --- | --- |
| 1 | Start dev with §3 env stack |
| 2 | Open `/__admin-staging-shell/musician-basic/admin/discography/` |
| 3 | Sign in to staging admin if prompted |
| 4 | Select **Continuous** (`discography-001`) — default row |
| 5 | Set **artist** only: `ごさきりかこTrio Feat.石川周之介` → `ごさきりかこTrio feat.石川周之介` |
| 6 | Leave title / purchase_url / streaming_url / other fields **unchanged** |
| 7 | Click **`変更を確認`** once — verify §5 gates (`saveReadiness: ready_to_save`) |
| 8 | Click **`更新する`** once (operator only — not Cursor) |
| 9 | Record Save result for G-16a-execution result doc |
| 10 | Run §6 afterVerification SELECT — confirm `updated_at` advanced |
| 11 | Disarm env stack; restart routine dev with `PUBLIC_ADMIN_WRITE_DRY_RUN=true` |

**Do not** select `discography-002` / `discography-003` or re-Save closed fields.

---

## 5. Pre-Save G-16a Preview gates (armed dev — operator must verify)

After **`変更を確認`** on armed dev (re-run Preview immediately before Save):

| Check | Expected |
| --- | --- |
| `dryRun` | `true` |
| `actualWrite` | `false` |
| `wouldWrite` | `true` |
| `saveReadiness` | `ready_to_save` |
| `saveAllowed` | `true` |
| `changedFields` | `["artist"]` only |
| `payload` | `{ "artist": "ごさきりかこTrio feat.石川周之介" }` |
| `target.legacy_id` | `discography-001` |
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
WHERE legacy_id = 'discography-001'
  AND id = '00f4cd00-cfb6-43b3-991a-211b2d7c92ef';
```

### Expected after Save

| Field | Expected |
| --- | --- |
| **legacy_id** | `discography-001` (unchanged) |
| **title** | `Continuous` (unchanged) |
| **artist** | `ごさきりかこTrio feat.石川周之介` |
| **purchase_url** | `null` (unchanged) |
| **streaming_url** | `null` (unchanged) |
| **release_date** | `2023-07-26` (unchanged) |
| **year** | `2023` (unchanged) |
| **description** | unchanged |
| **published** | unchanged |
| **sort_order** | unchanged |
| **updated_at** | **> `2026-06-05T17:39:44.201802+00:00`** (new timestamp) |

---

## 7. updated_at trigger live proof expectation

Trigger `discography_set_updated_at` active on staging since G-15b-f8 (first live proof: G-15d on `discography-003`).

| Item | Expectation |
| --- | --- |
| **Prior live proof** | G-15d Save advanced `updated_at` on `discography-003` |
| **G-16a proof** | Second live proof on `discography-001` |
| **before Save** | `updated_at = 2026-06-05T17:39:44.201802+00:00` |
| **after Save** | `updated_at` strictly later (trigger-fired) |
| **If unchanged** | **STOP** — do not retry Save; investigate trigger / RLS / row match |

**Optimistic lock:** UPDATE uses `.eq("updated_at", expectedBeforeUpdatedAt)` — Save fails if row changed since Preview.

---

## 8. Rollback

**Rollback needed after successful Save:** **no** (typography normalization; easy revert if desired).

```sql
-- staging only — DO NOT EXECUTE without explicit operator approval
UPDATE public.discography
SET artist = 'ごさきりかこTrio Feat.石川周之介'
WHERE legacy_id = 'discography-001'
  AND id = '00f4cd00-cfb6-43b3-991a-211b2d7c92ef'
  AND artist = 'ごさきりかこTrio feat.石川周之介';
```

---

## 9. Public reflection

| Item | Value |
| --- | --- |
| Required after Save? | **Yes (later phase)** |
| Reason | `artist` appears in Wix Discography h2 on public `/discography/` for Continuous |
| Current hook | `patchGosakiDiscographySupabaseFields` — `purchase_url` + `artist` (G-15e) |
| This phase | No regen / no upload |
| Expected upload (later) | `discography/index.html` ×1 if CSS hash unchanged |

---

## 10. Stop conditions

Stop and ask human if:

- host is not `kmjqppxjdnwwrtae`
- `updated_at` baseline mismatch (stale)
- `artist` before value differs from `ごさきりかこTrio Feat.石川周之介`
- Save affects rows other than `discography-001`
- `discography_tracks` touched
- `updated_at` does not advance after Save
- production / Sariswing host detected
- G-15b / G-15d arm detected ON alongside G-16a arm

---

## 11. Next phase

**G-16a-execution** — operator manual Save once + read-only afterVerification SELECT + `updated_at` trigger proof.

**Then (optional):** G-16a-reflection — regen + minimal `discography/index.html` upload for Continuous artist line.

**Do not:** re-click Save without new approval; enable Save in routine dev without disarm plan; re-Save `discography-002` / `discography-003`.

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-g16a-gosaki-discography-local-dry-run-result-and-save-final-preflight.mjs
```
