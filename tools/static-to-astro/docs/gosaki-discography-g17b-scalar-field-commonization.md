# G-17b — Gosaki Discography scalar field commonization (minimal implementation)

**Phase:** `G-17b-gosaki-discography-scalar-field-commonization`  
**Status:** **complete** — registry + generic config/guards + adapter lookup + public patch registry; no new Save  
**Date:** 2026-06-29  
**Base commit:** `5161eaa`  
**Prior:** G-17a audit (`gosaki-discography-g17a-commonization-audit.md`)

| Check | Status |
| --- | --- |
| Scalar slice registry (3 closed entries) | **yes** |
| Generic Save config builder | **yes** |
| Generic scalar guards | **yes** |
| Adapter approvalId → registry lookup | **yes** |
| Public patch registry (`purchase_url`, `artist`) | **yes** |
| Legacy dedicated modules preserved (wrappers) | **yes** |
| New field Save | **no** |
| Cursor Save / DB write / FTP | **no** |

---

## Gates

```txt
gosakiDiscographyG17bScalarFieldCommonizationComplete: true
phase: G-17b-gosaki-discography-scalar-field-commonization
readyForG17cDiscographyRegistryNativeFieldSlice: true
readyForAnyDbWrite: false
readyForAnyFutureFtpApply: false
cursorDbWriteExecuted: false
cursorFtpExecuted: false
cursorSaveExecuted: false
```

**Supabase staging target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. What was implemented

| Component | File |
| --- | --- |
| Registry | `discography-scalar-field-slice-registry.ts` |
| Generic Save config | `discography-scalar-field-save-config.ts` |
| Generic guards | `discography-scalar-field-guards.ts` |
| Adapter lookup | `discography-write-adapter.ts` |
| Public patch registry | `supabase-discography-read.mjs` |

**Wrappers (behavior unchanged):** `gosaki-discography-purchase-url-save-config.ts`, `gosaki-discography-artist-save-config.ts`, `gosaki-discography-g16a-artist-save-config.ts`, `discography-write-guards.ts`

---

## 2. Registry entries (closed)

| sliceId | legacy_id | title | field | closed |
| --- | --- | --- | --- | --- |
| `g15b-purchase-url` | `discography-002` | SKYLARK | `purchase_url` | **true** |
| `g15d-artist` | `discography-003` | About Us!! | `artist` | **true** |
| `g16a-artist` | `discography-001` | Continuous | `artist` | **true** |

Each entry includes: `approvalId`, `dryRunApprovalId`, `armedEnvName`, `enabledEnvName`, `expectedBeforeUpdatedAt`, `expectedBefore` / `expectedAfter`, `publicPatchField`.

---

## 3. Compatibility

- G-15b / G-15d / G-16a **public APIs unchanged** (same export names + types).
- Save arm gates + single-arm mutual exclusion **unchanged** (now via `collectOtherDiscographyScalarSliceEnvArmFailures`).
- `patchGosakiDiscographySupabaseFields` output shape **unchanged** (`purchasePatches`, `artistPatches`, `patches`).
- Closed chains: **do not re-Save** / **do not re-upload** (unchanged policy).

---

## 4. Public patch registry

```txt
DISCOGRAPHY_PUBLIC_PATCH_REGISTRY
  purchase_url → patchDiscographyItemPurchaseUrl
  artist       → patchDiscographyItemArtist

DISCOGRAPHY_PUBLIC_PATCH_FIELD_ORDER = ["purchase_url", "artist"]
```

G-17c+ adds handlers here for `title`, `year`, `release_date`, etc.

---

## 5. Next: G-17c

Add **one registry entry** for `discography-004` / Ja-Jaaaaan! / first scalar field (`title` or `year` recommended). No new per-slice config/guard files.

**Estimated dev work (G-17c planning + preflight):** ~0.5 day (vs ~2–3 days pre-G-17b).

---

## 6. Verifier

```bash
node tools/static-to-astro/scripts/verify-g17b-gosaki-discography-scalar-field-commonization.mjs
```
