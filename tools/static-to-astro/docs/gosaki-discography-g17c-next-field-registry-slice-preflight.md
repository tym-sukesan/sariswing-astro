# G-17c — Gosaki Discography registry-based next field slice preflight (`label` / discography-004)

Last updated: 2026-06-29  
Phase: `G-17c-gosaki-discography-existing-release-label-non-dry-run`  
Status: **preflight complete — dry-run Preview wired; Save NOT executed**  
Base commit: `397f245` (G-17b scalar commonization)  
Prior: G-17b (`gosaki-discography-g17b-scalar-field-commonization.md`)

## Gate

```txt
gosakiDiscographyG17cNextFieldRegistrySlicePreflightComplete: true
readyForG17cDiscographyLabelDryRunPreview: true
readyForG17dDiscographyLabelSaveExecution: false
saveExecutedInThisPhase: false
dbWriteExecutedInThisPhase: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
ftpUploadExecuted: false
packageRegenExecuted: false
```

**Do not click Save in this phase.** Operator Save once in G-17d execution only.

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Staging inventory (read-only SELECT — 2026-06-29)

| legacy_id | title | label (DB) | year | release_date | catalog_number | artist | updated_at |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| discography-001 | Continuous | — | 2023 | 2023-07-26 | — | `ごさきりかこTrio feat.石川周之介` | `2026-06-05T17:39:44.201802+00:00` |
| discography-002 | SKYLARK | — | 2023 | 2023-04-26 | — | 後藤沙紀 | `2026-06-05T17:39:44.201802+00:00` |
| discography-003 | About Us!! | — | 2019 | 2019-01-11 | — | `ごさきりかこTrio` | `2026-06-29T02:40:57.83085+00:00` |
| **discography-004** | **Ja-Jaaaaan!** | **null** | **2015** | **2015-03-21** | **OMP-001** | **新谷健介オノマトペ** | **`2026-06-05T17:39:44.201802+00:00`** |

**Row id (004):** `32b83506-8766-4cf6-9de7-40defbfc0b38`

**Closed rows (do not re-Save):**

| legacy_id | field | chain |
| --- | --- | --- |
| discography-001 | `artist` | G-16b-f |
| discography-002 | `purchase_url` | G-15c-f |
| discography-003 | `artist` | G-15e-f |

---

## 2. Cross-source comparison (`discography-004`)

| Source | label | title | year | release_date | catalog_number | artist |
| --- | --- | --- | ---: | --- | --- | --- |
| Supabase staging | **null** | Ja-Jaaaaan! | 2015 | 2015-03-21 | OMP-001 | 新谷健介オノマトペ |
| `discography.seed.json` | **Mardi Gras JAPAN Records** | Ja-Jaaaaan! | 2015 | 2015-03-21 | OMP-001 | 新谷健介オノマトペ |
| Public staging HTML (`/cms-kit-staging/gosaki-piano/discography/`) | **Mardi Gras JAPAN Records** (Release line) | Ja-Jaaaaan! | 2015.03.21 | — | OMP-001 | 新谷健介オノマトペ |

---

## 3. Candidate field comparison (unclosed row `discography-004`)

| Field | Priority | DB vs JSON / public | Natural diff? | Decision |
| --- | --- | --- | --- | --- |
| `title` | high | `Ja-Jaaaaan!` — aligned | no | defer |
| `year` | high | 2015 — aligned | no | defer |
| `release_date` | high | `2015-03-21` — aligned | no | defer |
| `catalog_number` | high | `OMP-001` — aligned | no | defer |
| **`label`** | **(seed/public)** | **DB null vs `Mardi Gras JAPAN Records`** | **yes** | **selected** |
| `artist` | medium | aligned with public h2 | no | defer |
| `purchase_url` | medium | null; public shows venue text not URL | no | defer |
| `description` | low | multi-block Wix HTML — complex | no | defer |
| `streaming_url` | avoid | null; no canonical URL | no | **rejected** |
| `published` / `sort_order` | avoid | operational — out of scope | — | **rejected** |

**Selection rationale:** Among user high-priority fields (`title`, `year`, `release_date`, `catalog_number`), all are already aligned across DB / seed / public. The only clear, low-risk scalar gap on the unclosed row is **`label`** — same pattern as prior slices (DB behind Wix-derived public/seed truth). No URL invention risk (unlike `streaming_url`).

---

## 4. Selected target

| Item | Value |
| --- | --- |
| **legacy_id** | `discography-004` |
| **id** | `32b83506-8766-4cf6-9de7-40defbfc0b38` |
| **title** | `Ja-Jaaaaan!` |
| **field** | `label` only |
| **before** | `null` / empty |
| **after** | `Mardi Gras JAPAN Records` |
| **expectedBeforeUpdatedAt** | `2026-06-05T17:39:44.201802+00:00` |
| dry-run `approvalId` | `G-17c-gosaki-discography-label-dry-run-slice` |
| Save `approvalId` | `G-17c-gosaki-discography-existing-release-label-non-dry-run` |
| `changedFields` | `["label"]` only |
| `rowsAffected` | must be `1` |
| optimistic lock | `expectedBeforeUpdatedAt` required |

---

## 5. Registry entry (`g17c-label`)

| Key | Value |
| --- | --- |
| `sliceId` | `g17c-label` |
| `phase` | `G-17c-gosaki-discography-existing-release-label-non-dry-run` |
| `phaseLabel` | `G-17c` |
| `legacyId` | `discography-004` |
| `rowId` | `32b83506-8766-4cf6-9de7-40defbfc0b38` |
| `field` | `label` |
| `approvalId` | `G-17c-gosaki-discography-existing-release-label-non-dry-run` |
| `dryRunApprovalId` | `G-17c-gosaki-discography-label-dry-run-slice` |
| `armedEnvName` | `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G17C_LABEL_NON_DRY_RUN_ARMED` |
| `enabledEnvName` | `G17C_DISCOGRAPHY_SAVE_ENABLED` |
| `closed` | `false` |
| `publicPatchField` | `label` |

**File:** `src/lib/admin/staging-write/discography-scalar-field-slice-registry.ts`

---

## 6. Generic layer (G-17b reuse)

| Concern | Implementation |
| --- | --- |
| Dry-run Preview | `executeDiscographyScalarSliceDryRun()` in `discography-scalar-field-dry-run.ts` |
| Guards | `assertDiscographyScalarSlice*` in `discography-scalar-field-guards.ts` |
| Save config | `getDiscographyScalarSliceSaveConfig()` in `discography-scalar-field-save-config.ts` |
| G-17c wrapper | `gosaki-discography-g17c-label-save-config.ts` (thin delegate) |
| Admin UI | `gosaki-staging-discography-admin-ui.ts` — registry lookup; `g17c-label` → generic dry-run |
| Save path | **blocked** in preflight (`runSave` alerts until G-17d) |

No new per-field guard file. No new per-field dry-run executor copy.

---

## 7. Dry-run Preview expectation

| Check | Expected |
| --- | --- |
| `dryRun` | `true` |
| `actualWrite` | `false` |
| `wouldWrite` | `true` (when form label = `Mardi Gras JAPAN Records`) |
| `changedFields` | `["label"]` |
| `payload` | `{ "label": "Mardi Gras JAPAN Records" }` |
| `saveReadiness` (routine dev) | `ready_but_save_disabled` |
| `saveAllowed` | `false` until G-17c env armed |

**Routine dev:** `PUBLIC_ADMIN_WRITE_DRY_RUN=true` (default).  
**Dry-run only** — no G-17c arm required for Preview.

---

## 8. Save execution expectation (G-17d — not this phase)

| Env | Value |
| --- | --- |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` |
| `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G17C_LABEL_NON_DRY_RUN_ARMED` | `true` |
| `G17C_DISCOGRAPHY_SAVE_ENABLED` | `true` |
| Other slice arms | all **off** (single-arm rule) |

---

## 9. Public reflection estimate

| Item | Estimate |
| --- | --- |
| **Needed after Save?** | **yes** — public Release line shows label; DB is null today |
| **Hook change** | Add `label` handler to `DISCOGRAPHY_PUBLIC_PATCH_REGISTRY` in `supabase-discography-read.mjs` |
| **Regen** | `npm run manual-upload:package` (or gosaki staging package script) |
| **Upload scope** | Likely `discography/index.html` ×1 (same pattern as G-15c / G-16b artist) |
| **Effort** | ~0.5 day after G-17d Save (reflection preflight + operator upload) |
| **This phase** | **no** regen / upload |

---

## 10. G-17b commonization reduction (this slice)

| Old pattern (G-15b–G-16a) | G-17c |
| --- | --- |
| Dedicated dry-run executor file | **reused** `discography-scalar-field-dry-run.ts` |
| Dedicated guard file per field | **reused** generic guards |
| Dedicated save-config copy | thin wrapper only |
| Admin UI hard-coded slice map | registry `getDiscographyScalarSliceEntryByLegacyId` |
| New files per slice | ~4 TS (+ doc + verifier) vs ~8–12 historically |

---

## 11. Rollback SQL (staging — not executed)

```sql
-- G-17c label rollback (execute only if Save applied and rollback needed)
UPDATE public.discography
SET label = NULL
WHERE legacy_id = 'discography-004'
  AND site_slug = 'gosaki-piano';
```

---

## 12. Safety confirmation (this phase)

| Operation | Executed? |
| --- | --- |
| Save / Run (non-dry-run) | **no** |
| DB UPDATE / INSERT / DELETE | **no** |
| `service_role` | **no** |
| FTP / upload / deploy | **no** |
| Public reflection regen | **no** |
| Commit / push | **no** |
