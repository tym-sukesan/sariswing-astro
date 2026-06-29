# G-15c-f — Gosaki Discography public reflection closure

**Phase:** `G-15c-f-gosaki-discography-public-reflection-closure`  
**Status:** **complete** — G-15 Discography CMS MVP `purchase_url` chain **closed** (inventory → Save → public reflection); documentation / verification only  
**Date:** 2026-06-28  
**Base commit:** `4fea4f2`  
**Operator:** 戸山（G-15b-retry Save once; G-15c-upload manual upload once）

| Check | Status |
| --- | --- |
| G-15 `purchase_url` chain | **closed** |
| Admin Supabase read (G-15a) | **complete** |
| Dry-run Preview (G-15a2) | **complete** |
| DB Save (G-15b-retry) | **complete** |
| Public staging reflection | **complete** |
| HTTP verify (live `/discography/`) | **PASS** |
| `discography/index.html` re-upload needed | **no** |
| Rollback needed | **no** |
| Continuous / About Us!! / Ja-Jaaaaan! | **untouched** |
| Cursor FTP / Save / DB write (this phase) | **no** |

---

## Gates

```txt
gosakiDiscographyPublicReflectionClosureComplete: true
gosakiDiscographyPurchaseUrlChainComplete: true
phase: G-15c-f-gosaki-discography-public-reflection-closure
readyForG15cDiscographyReUpload: false
readyForG15cDiscographyReflectionReUpload: false
readyForG15bSameRowReSave: false
readyForG15DiscographyPurchaseUrlReExecution: false
rollbackNeeded: false
rollbackExecutedInThisPhase: false
continuousReleaseTouched: false
aboutUsReleaseTouched: false
jaJaaaaanReleaseTouched: false
cursorFtpExecuted: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
cursorPackageRegenExecuted: false
```

**Do not re-click** G-15b Save on `discography-002` / `purchase_url`. **Do not re-upload** `discography/index.html` without new approval ID and documented reason.

**Routine dev:** disarm all G-15b non-dry-run arms; restart with `PUBLIC_ADMIN_WRITE_DRY_RUN=true`.

---

## 1. Closure scope

### In scope (Discography CMS MVP PoC #1 — `purchase_url` only)

| Item | Value |
| --- | --- |
| **Row id** | `ed59d236-881a-45ce-ab9f-de5427e39dad` |
| **legacy_id** | `discography-002` |
| **title** | `SKYLARK` |
| **route** | `/discography/` |
| **approval_id** | `G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run` |
| **Save path** | staging shell `/__admin-staging-shell/musician-basic/admin/discography/` |
| **Field changed** | `purchase_url` only |
| **Project** | `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only |

### Out of scope (deferred)

| Item | Status |
| --- | --- |
| Other discography fields (title, artist, streaming_url, …) | **not in this chain** |
| `discography_tracks` CMS | **deferred** |
| Cover image upload / Storage | **deferred** (G-10f) |
| Full Discography DB-driven page regen | **deferred** |
| Continuous / About Us!! / Ja-Jaaaaan! rows | **not modified** |
| Sariswing production / `/admin` | **not touched** |
| Full 27-file package re-upload | **not required** |
| `_astro/` re-upload | **not required** (CSS/JS hash unchanged) |

---

## 2. Phase chain (completed)

### Inventory / admin read

| Phase | Doc | Note |
| --- | --- | --- |
| **G-15 inventory** | `gosaki-discography-cms-mvp-inventory-and-plan.md` | 4 releases mapped |
| **G-15a read binding** | `gosaki-discography-admin-supabase-read-binding.md` | admin → Supabase |

### Dry-run Preview

| Phase | Doc | Note |
| --- | --- | --- |
| **G-15a2** | `gosaki-discography-dry-run-preview-implementation-and-preflight.md` | `purchase_url` slice Preview |

### Save execution

| Phase | Doc | Note |
| --- | --- | --- |
| **G-15b preflight** | `gosaki-discography-save-slice-final-preflight.md` | Save slice planned |
| **G-15b-fail** | `gosaki-discography-save-permission-failure-and-investigation.md` | permission denied |
| **G-15b-grant** | `gosaki-discography-update-grant-apply-result.md` | `GRANT UPDATE` applied |
| **G-15b-retry** | `gosaki-discography-save-retry-result-and-updated-at-investigation.md` | Save **succeeded** |
| **G-15b-f8** | `gosaki-discography-updated-at-trigger-final-preflight.md` | trigger preflight |
| **G-15b-f8-execution** | `gosaki-discography-updated-at-trigger-apply-result.md` | `discography_set_updated_at` live |

### Public reflection

| Phase | Doc | Commit / note |
| --- | --- | --- |
| **G-14c playbook** | `gosaki-public-reflection-operation-standardization.md` | reflection standard |
| **G-15c preflight** | `gosaki-discography-public-reflection-local-regen-and-upload-preflight.md` | hook + 1-file upload plan |
| **G-15c-upload** | `gosaki-discography-public-reflection-upload-result.md` | `4fea4f2` |
| **G-15c-f closure** | `gosaki-discography-public-reflection-closure.md` | (this doc) |

---

## 3. Completed outcomes (summary)

### Product path confirmation

- **Discography CMS existing-row Save** succeeded on staging admin shell
- **approval_id:** `G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run`
- **Save clicks:** **1** successful (G-15b-retry; G-15b initial attempt failed at permission)
- **Optimistic lock:** `expectedBeforeUpdatedAt` used on Save path

### DB (G-15b-retry)

| Item | Value |
| --- | --- |
| **rowsAffected** | **1** |
| **changedFields** | `purchase_url` only |
| **before** | `https://gosaakiii.base.shop/` |
| **after** | `https://gosakirikako.base.shop/` |
| **updated_at at Save** | `2026-06-05T17:39:44.201802+00:00` (**unchanged** — trigger applied **after** Save) |
| **rollbackNeeded** | **false** |

**Trigger note:** `discography_set_updated_at` is live (G-15b-f8-execution). **Next** discography Save on any row should advance `updated_at` — not proven in this chain.

### Public reflection hook (G-15c)

- **Module:** `scripts/lib/supabase-discography-read.mjs`
- **Behavior:** read Supabase `discography` at convert; patch Wix repeater `purchase_url` by album `title`
- **Marker:** `discographyDataSource=supabase` in built HTML
- **Regen:** `build-gosaki-staging-admin-package.mjs` — PASS; 1 patch (SKYLARK)
- CSS hash unchanged: `index.YcHrHZH4.css`

### Manual upload (G-15c-upload)

- **1 file** overwrite: `discography/index.html`
- Local: `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html`
- Remote: `/cms-kit-staging/gosaki-piano/discography/index.html`
- No `_astro/` upload; no mirror / sync / delete

### HTTP verify (closure re-check)

**URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`

| Check | Result |
| --- | --- |
| HTTP | **200** |
| `SKYLARK` | **present** |
| `discographyDataSource=supabase` | **present** |
| `https://gosakirikako.base.shop/` (page) | **present** |
| `https://gosaakiii.base.shop/` (page) | **absent** |
| SKYLARK item new URL | **present** |
| SKYLARK item old URL | **absent** |
| `Continuous` / `About Us!!` / `Ja-Jaaaaan!` | **present** |
| Audit markers (`[CMS Kit staging]`, `PoC`, `dry-run`) | **absent** |
| CSS hash on page | `index.YcHrHZH4.css` **present** |

---

## 4. Re-execution policy

| Policy | Value |
| --- | --- |
| `readyForG15DiscographyPurchaseUrlReExecution` | **false** |
| Same row `discography-002` re-Save | **forbidden** without new approval + fresh preflight |
| `discography/index.html` re-upload | **forbidden** without new approval |
| G-15b non-dry-run env in routine dev | **must be off** — use `PUBLIC_ADMIN_WRITE_DRY_RUN=true` |

### Next Discography edit start conditions

A **new** field or row edit requires:

1. New planning + approval ID (do not reuse `G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run`)
2. Dry-run Preview → final preflight → operator Save once
3. If public field: G-14c-style regen + minimal upload scope doc
4. Disarm prior non-dry-run env before routine dev

---

## 5. Remaining gaps (post-closure)

| Gap | Priority | Notes |
| --- | --- | --- |
| **Other editable fields** | **high** | title, artist, year, streaming_url, published, sort_order — no Save slices yet |
| **`updated_at` live proof** | **medium** | trigger live; awaits **next** Save on any row |
| **Public reflection beyond `purchase_url`** | **medium** | hook exists; extend per field as Save slices land |
| **Tracks / personnel / price** | **low** | JSON vs DB track count mismatch; `price` not in DB column |
| **Cover images** | **low** | Wix CDN on public; Storage URLs in DB — G-10f |
| **`site_slug` on discography** | **low** | Kit generalization — template exists |
| **Kit reusable playbook** | **medium** | merge Schedule (G-14c) + Discography patterns |

---

## 6. Next phase recommendations (priority order)

### 1. **A — Discography CMS MVP completion** (recommended first)

Extend **one field at a time** (Schedule G-14b1 / G-15b pattern):

| Suggested order | Field | Rationale |
| --- | --- | --- |
| A1 | `streaming_url` | link field; mirrors `purchase_url` slice |
| A2 | `title` or `artist` | text; needs public reflection planning |
| A3 | `published` / `sort_order` | visibility / order |

**Side benefit:** first post-trigger Save proves `discography_set_updated_at` on a real UPDATE (use a **different** row or new approval — not `discography-002` re-Save).

### 2. **D — Save / Reflection reusable pattern** (parallel, low risk)

Document Kit-general checklist from G-14c + G-15:

```txt
admin read → dry-run → Save slice → (optional trigger/grant) → convert hook → regen → 1-file upload → HTTP verify → closure
```

No DB/FTP in doc-only phase. Accelerates next customer onboarding.

### 3. **B — Public reflection generalization** (after A1+)

Extend `supabase-discography-read.mjs` as new Save slices land — do not big-bang DB-driven Discography page yet.

### 4. **C — Tracks / personnel / price** (defer)

Requires inventory refresh: 16 DB tracks vs 34 JSON lines; personnel merged in `description`; `price` only in Wix HTML. Schema decision before implementation.

---

## 7. Forbidden operations (this phase)

| Operation | Executed? |
| --- | --- |
| Cursor FTP / upload | **no** |
| Package regen | **no** |
| DB write / Save | **no** |
| `workflow_dispatch` / deploy | **no** |
| Production / Sariswing | **no** |

---

## 8. Verifier

```bash
node tools/static-to-astro/scripts/verify-g15c-f-gosaki-discography-public-reflection-closure.mjs
```
