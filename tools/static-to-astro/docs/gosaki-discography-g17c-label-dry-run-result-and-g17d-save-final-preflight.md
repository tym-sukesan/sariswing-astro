# G-17c-d2 / G-17d-d3 — Gosaki Discography label local dry-run result + Save final preflight

**Phases:**

- `G-17c-d2-gosaki-discography-label-local-dry-run-preview-result` — operator local dry-run **PASS**
- `G-17d-d3-gosaki-discography-label-save-final-preflight` — Save execution final preflight **complete**

**Status:** **complete** — operator dry-run Preview recorded; live beforeSnapshot reconfirmed; Save env stack documented; **no Save / DB write in this phase**  
**Date:** 2026-06-29  
**Base commit:** `9475286`  
**Prior:** G-17c (`gosaki-discography-g17c-next-field-registry-slice-preflight.md`)  
**Playbook:** [cms-kit-save-reflection-playbook.md](./cms-kit-save-reflection-playbook.md)

| Check | Status |
| --- | --- |
| Operator local dry-run Preview | **PASS** (operator manual — **1回**) |
| Generic registry dry-run path | **PASS** (`executeDiscographyScalarSliceDryRun` / `g17c-label`) |
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
gosakiDiscographyG17cLocalDryRunResultComplete: true
gosakiDiscographyG17dSaveFinalPreflightComplete: true
phase: G-17c-d2-d3-gosaki-discography-label-local-dry-run-result-and-save-final-preflight
readyForG17dDiscographyLabelSaveImplementation: true
readyForG17dDiscographyLabelSaveExecution: false
readyForG17dPublicReflection: false
readyForAnyDbWrite: false
readyForAnyFutureFtpApply: false
cursorPreviewExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
rollbackSqlExecuted: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Do not click Save** in this phase. **Do not execute rollback SQL** without separate explicit approval.

**Prerequisite before G-17d-execution:** Admin UI `runSave` still blocks `g17c-label` with preflight alert — remove block and wire generic scalar Save in **G-17d-implementation** phase. Adapter + registry + generic guards already support `G-17c-gosaki-discography-existing-release-label-non-dry-run` at `discography-write-adapter.ts` level.

**Do not re-Save:**

- `discography-001` (G-16b-f `artist` chain closed)
- `discography-002` (G-15c-f `purchase_url` chain closed)
- `discography-003` (G-15e-f `artist` chain closed)

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: 9475286
origin/main: 9475286
branch: main...origin/main
```

G-17c label registry slice preflight committed at `9475286`.

---

## 2. Staging project confirmation

```txt
Supabase project: static-to-astro-cms-staging
Supabase host: kmjqppxjdnwwrtaeqjta.supabase.co
Route: /__admin-staging-shell/musician-basic/admin/discography/
Dry-run path: G-17c registry — `g17c-label` → `executeDiscographyScalarSliceDryRun`
Save path (execution): G-17d — label slice on discography-004 (implementation pending UI unblock)
service_role: not used
discography_tracks: not touched
```

---

## Part A — Local dry-run Preview result (G-17c-d2)

### A.1 Operator verification (manual)

**Route (local dev — routine stack, `PUBLIC_ADMIN_WRITE_DRY_RUN=true`):**

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/
```

**Target release:**

| Item | Value |
| --- | --- |
| **legacy_id** | `discography-004` |
| **id** | `32b83506-8766-4cf6-9de7-40defbfc0b38` |
| **title** | `Ja-Jaaaaan!` |
| **field** | `label` only |
| **before** | `null` / empty |
| **after** | `Mardi Gras JAPAN Records` |
| **expectedBeforeUpdatedAt** | `2026-06-05T17:39:44.201802+00:00` |

**Clicked:** `変更を確認` (dry-run Preview) — **1回**

**Not clicked:**

```txt
更新する (Save)
discography-001 / 002 / 003 row Save (closed chains)
その他の Save / Run 系ボタン
```

### A.2 Recorded dry-run Preview result (operator)

| Field | Value |
| --- | --- |
| `dryRunApprovalId` | `G-17c-gosaki-discography-label-dry-run-slice` |
| `saveApprovalId` | `G-17c-gosaki-discography-existing-release-label-non-dry-run` |
| `ok` | **true** |
| `dryRun` | **true** |
| `actualWrite` | **false** |
| `wouldWrite` | **true** |
| `target legacy_id` | `discography-004` |
| `changedFields` | `label` |
| `payloadKeys` | `label` |
| `expectedBeforeUpdatedAt` | `2026-06-05T17:39:44.201802+00:00` |
| `stale` | **false** |
| `hostGatePassed` | **true** |
| `saveReadiness` | `ready_but_save_disabled` |
| `saveAllowed` | **false** |
| `guardErrors` | none |

**before / after / payload:**

```json
before:  {"label":null}
after:   {"label":"Mardi Gras JAPAN Records"}
payload: {"label":"Mardi Gras JAPAN Records"}
```

**Interpretation:**

- Single-field `label` slice — matches G-17c registry design (`g17c-label`)
- Routed through G-17b generic layer (`executeDiscographyScalarSliceDryRun` + registry entry + generic guards)
- `ready_but_save_disabled` — routine dev Save gate off (expected for Preview-only phase)
- No Supabase UPDATE — Preview only
- Save button remained disabled (`更新する（保存無効）`)

### A.3 G-17b registry / generic layer confirmation

| Layer | Used for G-17c dry-run |
| --- | --- |
| Registry entry | `g17c-label` in `discography-scalar-field-slice-registry.ts` |
| Dry-run executor | `executeDiscographyScalarSliceDryRun()` in `discography-scalar-field-dry-run.ts` |
| Guards | `assertDiscographyScalarSlice*` in `discography-scalar-field-guards.ts` |
| Save config (gate only) | `getDiscographyScalarSliceSaveConfig()` via registry |
| Admin UI slice resolve | `getDiscographyScalarSliceEntryByLegacyId("discography-004")` |

No dedicated G-17c dry-run executor copy — first registry-native slice using generic path end-to-end.

### A.4 Post-Preview DB unchanged (read-only SELECT — verifier)

After operator Preview, staging row **must still** show `label = null` and `updated_at` baseline unchanged.

**Do not re-click Preview** without documented reason.

---

## Part B — Save execution final preflight (G-17d-d3)

### B.1 Purpose

Final checks before the first **G-17d** non-dry-run Save on `discography-004` (`label` field only).

Documents live beforeSnapshot, G-17d Save path expectation, non-dry-run env stack, pre-Save Preview gates (armed dev), afterVerification SELECT, `updated_at` trigger live proof expectation, rollback template.

**Out of scope (this phase):** Save click, DB write, rollback SQL execution, public reflection, package regen, FTP, `runSave` UI unblock (G-17d-implementation).

### B.2 beforeSnapshot — read-only SELECT

**Method:** Supabase REST `GET /rest/v1/discography` — anon key only; staging `kmjqppxjdnwwrtaeqjta` only.

**Filters:**

```txt
legacy_id = discography-004
id = 32b83506-8766-4cf6-9de7-40defbfc0b38
```

**Optimistic lock baseline for Save:** `updated_at = 2026-06-05T17:39:44.201802+00:00`

| Field | Live value (G-17d-d3 preflight) | Expected | Match |
| --- | --- | --- | --- |
| **legacy_id** | `discography-004` | `discography-004` | **yes** |
| **id** | `32b83506-8766-4cf6-9de7-40defbfc0b38` | same | **yes** |
| **title** | `Ja-Jaaaaan!` | `Ja-Jaaaaan!` | **yes** |
| **label** | `null` | `null` | **yes** |
| **artist** | `新谷健介オノマトペ` | unchanged | **yes** |
| **year** | `2015` | unchanged | **yes** |
| **release_date** | `2015-03-21` | unchanged | **yes** |
| **catalog_number** | `OMP-001` | unchanged | **yes** |
| **purchase_url** | `null` | unchanged | **yes** |
| **streaming_url** | `null` | unchanged | **yes** |
| **updated_at** | `2026-06-05T17:39:44.201802+00:00` | same | **yes** |

**Reference SQL (operator reconfirm — read-only):**

```sql
SELECT
  id,
  legacy_id,
  title,
  label,
  artist,
  release_date,
  year,
  catalog_number,
  description,
  purchase_url,
  streaming_url,
  published,
  sort_order,
  updated_at
FROM public.discography
WHERE legacy_id = 'discography-004'
  AND id = '32b83506-8766-4cf6-9de7-40defbfc0b38';
```

**PoC / audit marker scan on `label`:** **none**

**Excluded rows (do not select for G-17d Save):**

| legacy_id | reason |
| --- | --- |
| `discography-001` | G-16b-f `artist` chain **closed** — do not re-Save |
| `discography-002` | G-15c-f `purchase_url` chain **closed** — do not re-Save |
| `discography-003` | G-15e-f `artist` chain **closed** — do not re-Save |

### B.3 Save target and change

| Item | Value |
| --- | --- |
| **operation** | G-17d label Save (`updated_at` trigger live proof on row 004) |
| **legacy_id** | `discography-004` |
| **title** | `Ja-Jaaaaan!` |
| **field** | `label` only |
| **before** | `null` |
| **after** | `Mardi Gras JAPAN Records` |
| **dry-run approvalId** | `G-17c-gosaki-discography-label-dry-run-slice` |
| **Save approvalId** | `G-17c-gosaki-discography-existing-release-label-non-dry-run` |
| **changedFields** | `["label"]` |
| **rowsAffected** | must be `1` |

### B.4 Single-arm policy

| Arm | Execution phase |
| --- | --- |
| `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G17C_LABEL_NON_DRY_RUN_ARMED` | **true** |
| `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G16A_ARTIST_NON_DRY_RUN_ARMED` | **off / unset** |
| `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED` | **off / unset** |
| `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED` | **off / unset** |
| `G17C_DISCOGRAPHY_SAVE_ENABLED` | **true** |
| `G16A_DISCOGRAPHY_SAVE_ENABLED` | **off / unset** |
| `G15B_DISCOGRAPHY_SAVE_ENABLED` | **off / unset** |
| `G15D_DISCOGRAPHY_SAVE_ENABLED` | **off / unset** |

---

## 3. Non-dry-run dev env stack (G-17d-execution — not started here)

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
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-17c-gosaki-discography-existing-release-label-non-dry-run \
PUBLIC_ADMIN_WRITE_DRY_RUN=false \
PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK=true \
PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G17C_LABEL_NON_DRY_RUN_ARMED=true \
G17C_DISCOGRAPHY_SAVE_ENABLED=true \
npm run dev
```

### Required env summary

| Env | Execution value |
| --- | --- |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` |
| `PUBLIC_ADMIN_WRITE_MODULE` | `discography` |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-17c-gosaki-discography-existing-release-label-non-dry-run` |
| `PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK` | `true` |
| `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G17C_LABEL_NON_DRY_RUN_ARMED` | `true` |
| `G17C_DISCOGRAPHY_SAVE_ENABLED` | `true` |

### Explicitly OFF (must remain unset or false)

```txt
PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G16A_ARTIST_NON_DRY_RUN_ARMED — unset/false
PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED — unset/false
PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED — unset/false
G16A_DISCOGRAPHY_SAVE_ENABLED — unset/false
G15B_DISCOGRAPHY_SAVE_ENABLED — unset/false
G15D_DISCOGRAPHY_SAVE_ENABLED — unset/false
(all closed-chain re-Save arms — off)
```

**Single-arm policy:** G-17c arm ON ⇒ G-15b / G-15d / G-16a arms **off**.

### Operator approval phrase (required once per Save session)

```txt
承認します。このDiscography CMS非dry-run操作を1回だけ実行してください。
```

---

## 4. Operator procedure (G-17d-execution — Save once)

**Requires G-17d-implementation** (remove `runSave` g17c-label block; wire generic scalar Save).

| Step | Action |
| --- | --- |
| 1 | Complete G-17d-implementation (Save UI path) |
| 2 | Start dev with §3 env stack |
| 3 | Open `/__admin-staging-shell/musician-basic/admin/discography/` |
| 4 | Sign in to staging admin if prompted |
| 5 | Select **Ja-Jaaaaan!** (`discography-004`) |
| 6 | Set **label** only: empty → `Mardi Gras JAPAN Records` |
| 7 | Leave title / artist / year / release_date / catalog_number / other fields **unchanged** |
| 8 | Click **`変更を確認`** once — verify §5 gates (`saveReadiness: ready_to_save`) |
| 9 | Click **`更新する`** once (operator only — not Cursor) |
| 10 | Record Save result for G-17d-execution result doc |
| 11 | Run §6 afterVerification SELECT — confirm `updated_at` advanced |
| 12 | Disarm env stack; restart routine dev with `PUBLIC_ADMIN_WRITE_DRY_RUN=true` |

**Do not** select `discography-001` / `002` / `003` or re-Save closed fields.

---

## 5. Pre-Save G-17d Preview gates (armed dev — operator must verify)

After **`変更を確認`** on armed dev (re-run Preview immediately before Save):

| Check | Expected |
| --- | --- |
| `dryRun` | `true` |
| `actualWrite` | `false` |
| `wouldWrite` | `true` |
| `saveReadiness` | `ready_to_save` |
| `saveAllowed` | `true` |
| `changedFields` | `["label"]` only |
| `payload` | `{ "label": "Mardi Gras JAPAN Records" }` |
| `target.legacy_id` | `discography-004` |
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
  label,
  artist,
  release_date,
  year,
  catalog_number,
  description,
  purchase_url,
  streaming_url,
  published,
  sort_order,
  updated_at
FROM public.discography
WHERE legacy_id = 'discography-004'
  AND id = '32b83506-8766-4cf6-9de7-40defbfc0b38';
```

### Expected after Save

| Field | Expected |
| --- | --- |
| **legacy_id** | `discography-004` (unchanged) |
| **title** | `Ja-Jaaaaan!` (unchanged) |
| **label** | `Mardi Gras JAPAN Records` |
| **artist** | `新谷健介オノマトペ` (unchanged) |
| **year** | `2015` (unchanged) |
| **release_date** | `2015-03-21` (unchanged) |
| **catalog_number** | `OMP-001` (unchanged) |
| **purchase_url** | `null` (unchanged) |
| **streaming_url** | `null` (unchanged) |
| **description** | unchanged |
| **published** | unchanged |
| **sort_order** | unchanged |
| **updated_at** | **> `2026-06-05T17:39:44.201802+00:00`** (new timestamp) |

---

## 7. updated_at trigger live proof expectation

Trigger `discography_set_updated_at` active on staging since G-15b-f8 (live proofs: G-15d on `discography-003`, G-16a on `discography-001`).

| Item | Expectation |
| --- | --- |
| **Prior live proofs** | G-15d (`003`), G-16a (`001`) |
| **G-17d proof** | Third live proof on `discography-004` |
| **before Save** | `updated_at = 2026-06-05T17:39:44.201802+00:00` |
| **after Save** | `updated_at` strictly later (trigger-fired) |
| **If unchanged** | **STOP** — do not retry Save; investigate trigger / RLS / row match |

**Optimistic lock:** UPDATE uses `.eq("updated_at", expectedBeforeUpdatedAt)` — Save fails if row changed since Preview.

---

## 8. Rollback

**Rollback needed after successful Save:** **no** (seed/public-aligned label fill; easy revert if desired).

```sql
-- staging only — DO NOT EXECUTE without explicit operator approval
UPDATE public.discography
SET label = NULL
WHERE legacy_id = 'discography-004'
  AND id = '32b83506-8766-4cf6-9de7-40defbfc0b38'
  AND label = 'Mardi Gras JAPAN Records';
```

---

## 9. Public reflection

| Item | Value |
| --- | --- |
| Required after Save? | **Yes (later phase)** |
| Reason | Public `/discography/` Release line for Ja-Jaaaaan! already shows `Mardi Gras JAPAN Records` from Wix HTML; DB is null — reflection aligns CMS truth with public after hook |
| Current hook | `DISCOGRAPHY_PUBLIC_PATCH_REGISTRY` — `purchase_url` + `artist` only (G-17b) |
| `label` patch | **not yet** — add in G-17e reflection preflight |
| This phase | No regen / no upload |
| Expected upload (later) | `discography/index.html` ×1 if CSS hash unchanged |

---

## 10. Stop conditions

Stop and ask human if:

- host is not `kmjqppxjdnwwrtae`
- `updated_at` baseline mismatch (stale)
- `label` before value is not `null`
- Save affects rows other than `discography-004`
- `discography_tracks` touched
- `updated_at` does not advance after Save
- production / Sariswing host detected
- G-15b / G-15d / G-16a arm detected ON alongside G-17c arm

---

## 11. Next phase

1. **G-17d-implementation** — unblock `runSave` for `g17c-label`; wire generic scalar Save executor (adapter already registry-aware).
2. **G-17d-execution** — operator manual Save once + read-only afterVerification SELECT + `updated_at` trigger proof.
3. **G-17e-reflection** (optional) — add `label` to public patch registry; regen + minimal `discography/index.html` upload.

**Do not:** re-click Save without new approval; enable Save in routine dev without disarm plan; re-Save closed rows.

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-g17c-g17d-gosaki-discography-label-dry-run-result-and-save-final-preflight.mjs
```
