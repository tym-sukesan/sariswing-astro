# G-17d — Gosaki Discography label Save path enablement

**Phase:** `G-17d-gosaki-discography-label-save-path-enablement`  
**Status:** **implementation complete — Save path enabled; Save NOT executed**  
**Date:** 2026-06-29  
**Base commit:** `d1eefb8`  
**Prior:** G-17c-d2/d3 (`gosaki-discography-g17c-label-dry-run-result-and-g17d-save-final-preflight.md`)

| Check | Status |
| --- | --- |
| `g17c-label` Save block removed | **yes** |
| Generic scalar Save executor | **yes** (`discography-scalar-field-save.ts`) |
| Registry + generic guards + adapter | **yes** |
| Closed chains (G-15b/G-15d/G-16a) | **unchanged** |
| Cursor Save / DB write | **no** |

---

## Gates

```txt
gosakiDiscographyG17dLabelSavePathEnablementComplete: true
phase: G-17d-gosaki-discography-label-save-path-enablement
readyForG17dDiscographyLabelSaveExecution: true
readyForG17dPublicReflection: false
readyForAnyDbWrite: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
ftpUploadExecuted: false
packageRegenExecuted: false
```

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

**Do not click Save in this phase.** Operator Save once in **G-17d-execution** only.

---

## 1. What was implemented

| Component | File | Role |
| --- | --- | --- |
| Generic Save executor | `discography-scalar-field-save.ts` | `executeDiscographyScalarSliceSave()` |
| Admin UI unblock | `gosaki-staging-discography-admin-ui.ts` | `g17c-label` → generic Save |
| Adapter rollback hint | `discography-write-adapter.ts` | G-17c label rollback message |

**Unchanged (closed chains):**

- `gosaki-discography-existing-release-save.ts` (G-15b)
- `gosaki-discography-existing-release-artist-save.ts` (G-15d)
- `gosaki-discography-g16a-existing-release-artist-save.ts` (G-16a)

---

## 2. Save target

| Item | Value |
| --- | --- |
| **legacy_id** | `discography-004` |
| **id** | `32b83506-8766-4cf6-9de7-40defbfc0b38` |
| **title** | `Ja-Jaaaaan!` |
| **field** | `label` only |
| **before** | `null` |
| **after** | `Mardi Gras JAPAN Records` |
| **expectedBeforeUpdatedAt** | `2026-06-05T17:39:44.201802+00:00` |
| dry-run `approvalId` | `G-17c-gosaki-discography-label-dry-run-slice` |
| Save `approvalId` | `G-17c-gosaki-discography-existing-release-label-non-dry-run` |
| `armedEnvName` | `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G17C_LABEL_NON_DRY_RUN_ARMED` |
| `enabledEnvName` | `G17C_DISCOGRAPHY_SAVE_ENABLED` |

---

## 3. Save enabled conditions (strict)

All must pass for `saveEnabled` / Save button:

| Gate | Requirement |
| --- | --- |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` |
| `PUBLIC_ADMIN_WRITE_MODULE` | `discography` |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-17c-gosaki-discography-existing-release-label-non-dry-run` |
| `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G17C_LABEL_NON_DRY_RUN_ARMED` | `true` |
| `G17C_DISCOGRAPHY_SAVE_ENABLED` | `true` |
| `PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK` | `true` |
| Host gate | staging `kmjqppxjdnwwrtaeqjta` |
| Single-arm | G-15b / G-15d / G-16a arms **off** |
| Dry-run Preview | `ok: true`, `stale: false`, `saveReadiness: ready_to_save` |
| Target | `legacy_id = discography-004` |
| `changedFields` | `["label"]` only |
| Auth | staging admin signed in |
| Slice not closed | `g17c-label` `closed: false` |

Enforced by: `getDiscographyScalarSliceSaveConfig()` + `assertDiscographyScalarSliceGuards()` + `executeDiscographyScalarSliceSave()`.

---

## 4. G-17b generic layer flow

```txt
Admin UI runSave (g17c-label)
  → executeDiscographyScalarSliceSave(entry from registry)
    → getDiscographyScalarSliceSaveConfig(entry)
    → assertDiscographyScalarSliceNotClosedForReSave(entry)
    → assertDiscographyScalarSliceGuards(entry, …)
    → updateDiscographyWrite(approvalId from registry)
      → getDiscographyScalarSliceEntryByApprovalId(approvalId)
      → assertDiscographyScalarSliceWriteGuards(entry, …)
```

No per-field Save executor copy for G-17c.

---

## 5. Non-dry-run dev env stack (G-17d-execution)

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

Use existing `.env` / `.env.local` for Supabase URL / anon key (do not change).

### Operator approval phrase (required once per Save session)

```txt
承認します。このDiscography CMS非dry-run操作を1回だけ実行してください。
```

---

## 6. Operator procedure (G-17d-execution)

| Step | Action |
| --- | --- |
| 1 | Start dev with §5 env stack |
| 2 | Open `/__admin-staging-shell/musician-basic/admin/discography/` |
| 3 | Sign in to staging admin |
| 4 | Select **Ja-Jaaaaan!** (`discography-004`) |
| 5 | Set **label** only: empty → `Mardi Gras JAPAN Records` |
| 6 | Click **`変更を確認`** once — verify §7 gates |
| 7 | Click **`更新する`** once (operator only — not Cursor) |
| 8 | Run §8 afterVerification SELECT |
| 9 | Disarm env; restart routine dev with `PUBLIC_ADMIN_WRITE_DRY_RUN=true` |

**Do not** select `discography-001` / `002` / `003`.

---

## 7. Armed dev Preview gates (operator must verify before Save)

| Check | Expected |
| --- | --- |
| `target legacy_id` | `discography-004` |
| `changedFields` | `label` |
| `payload` | `{"label":"Mardi Gras JAPAN Records"}` |
| `stale` | `false` |
| `saveReadiness` | `ready_to_save` |
| `saveAllowed` | `true` |
| `guardErrors` | none |
| Save button | **enabled** |

---

## 8. afterVerification SELECT (post-Save — read-only)

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
| **label** | `Mardi Gras JAPAN Records` |
| **title** / **artist** / **year** / **release_date** / **catalog_number** | unchanged |
| **purchase_url** / **streaming_url** | `null` (unchanged) |
| **description** / **published** / **sort_order** | unchanged |
| **updated_at** | **> `2026-06-05T17:39:44.201802+00:00`** |
| **rowsAffected** | `1` |

---

## 9. updated_at trigger expectation

Trigger `discography_set_updated_at` active on staging (G-15b-f8). Prior proofs: G-15d (`003`), G-16a (`001`). G-17d = third proof on `004`.

If `updated_at` unchanged after Save → **STOP**; do not retry.

---

## 10. Public reflection

| Item | Value |
| --- | --- |
| Required after Save? | **Yes (later — G-17e)** |
| `label` in public patch registry? | **not yet** |
| This phase | No regen / no upload |

---

## 11. Closed chain impact

| legacy_id | chain | Impact |
| --- | --- | --- |
| `discography-001` | G-16b-f `artist` | **none** — dedicated G-16a Save path unchanged |
| `discography-002` | G-15c-f `purchase_url` | **none** — dedicated G-15b Save path unchanged |
| `discography-003` | G-15e-f `artist` | **none** — dedicated G-15d Save path unchanged |

`assertDiscographyScalarSliceNotClosedForReSave` blocks re-Save on closed registry entries if arms were mistakenly enabled.

---

## 12. Rollback (doc-only — not executed)

```sql
-- staging only — DO NOT EXECUTE without explicit operator approval
UPDATE public.discography
SET label = NULL
WHERE legacy_id = 'discography-004'
  AND id = '32b83506-8766-4cf6-9de7-40defbfc0b38'
  AND label = 'Mardi Gras JAPAN Records';
```

---

## 13. Verifier

```bash
node tools/static-to-astro/scripts/verify-g17d-gosaki-discography-label-save-path-enablement.mjs
```
