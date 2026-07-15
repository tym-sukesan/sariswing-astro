# G-20u36f — Gosaki Discography marker title restore handler implementation

**Phase:** `G-20u36f-discography-marker-title-restore-handler-implementation`  
**Status:** **complete** — local implementation only · **no Edge deploy / Save / SQL / package / FTP**  
**Date:** 2026-07-15  
**Prior:** [marker-title-restore-planning](./gosaki-discography-g20u36f-marker-title-restore-planning.md)

| Check | Status |
| --- | --- |
| Local implementation | **yes** |
| Edge deploy | **no** |
| Save executed | **no** |
| SQL executed | **no** |
| DB write | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| service_role | **not used** |
| Production changed | **no** |

---

## Gates

```txt
gosakiDiscographyMarkerTitleRestoreHandlerImplemented: true
phase: G-20u36f-discography-marker-title-restore-handler-implementation
localImplementationOnly: true
edgeDeployExecuted: false
saveExecuted: false
sqlExecuted: false
dbWriteExecuted: false
packageGenerationExecuted: false
ftpUploadExecuted: false
serviceRoleUsed: false
productionChanged: false
allowlistApproach: true
g20u36eForwardSupported: true
g20u36fRestoreSupported: true
recommendedNextPhase: G-20u36f-discography-marker-title-restore-edge-deploy-prep
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

---

## 1. Implementation summary

Controlled Save path refactored to an **explicit allowlist** (`CONTROLLED_SAVE_SLICE_ALLOWLIST`). No unlisted slices permitted. Request fields must match an allowlist entry exactly before any DB access.

**Files changed:**

| File | Change |
| --- | --- |
| `supabase/functions/gosaki-discography-save-dry-run/handler.ts` | Allowlist · `resolveControlledSaveSlice` · slice-scoped UPDATE/readBack |
| `supabase/functions/gosaki-discography-save-dry-run/index.ts` | Header comment only |

**Unchanged:** dryRun path · OPTIONS/CORS · anon readBack · `handleDiscographyEdgeDryRunHttp` sync rejection of save.

---

## 2. Allowlist entries

### A. G-20u36e forward (existing)

| Field | Value |
| --- | --- |
| approvalId | `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` |
| sliceId | `G-20u36e1-discography-002-track-1-title-staging-marker` |
| beforeTitle | `On a Clear Day` |
| afterTitle | `On a Clear Day [CMS Kit staging G-20u36e]` |

### B. G-20u36f restore (new)

| Field | Value |
| --- | --- |
| approvalId | `G-20u36f-gosaki-discography-marker-title-restore` |
| sliceId | `G-20u36f-discography-002-track-1-title-restore` |
| siteSlug | `gosaki-piano` |
| legacyId | `discography-002` |
| targetRowId | `e30c5ea9-2857-492b-8a78-58cbfcbe7929` |
| trackNumber | **1** |
| beforeTitle | `On a Clear Day [CMS Kit staging G-20u36e]` |
| afterTitle | `On a Clear Day` |
| trackCount | **8** |
| track7Title | `Like a Lover` |

---

## 3. UPDATE constraints (both slices)

```txt
.update({ title: slice.afterTitle })
.eq("site_slug", slice.siteSlug)
.eq("discography_legacy_id", slice.legacyId)
.eq("track_number", slice.trackNumber)
.eq("id", slice.targetRowId)
.eq("title", slice.beforeTitle)
```

- **title column only** · no `updated_at` / other columns
- **updatedRows === 1** required · 0 or >1 → error
- Pre-UPDATE DB track 1 must equal `slice.beforeTitle`
- Post-save readBack: `targetTitle === slice.afterTitle` · `trackCount === 8` · `track_7_title === Like a Lover` · `targetRowCount === 1` · `noAddedRemoved === true`

---

## 4. G-20u36f restore request body (for execution phase)

```json
{
  "operation": "save",
  "siteSlug": "gosaki-piano",
  "legacyId": "discography-002",
  "discographyLegacyId": "discography-002",
  "approvalId": "G-20u36f-gosaki-discography-marker-title-restore",
  "sliceId": "G-20u36f-discography-002-track-1-title-restore",
  "targetRowId": "e30c5ea9-2857-492b-8a78-58cbfcbe7929",
  "trackNumber": 1,
  "beforeTitle": "On a Clear Day [CMS Kit staging G-20u36e]",
  "afterTitle": "On a Clear Day"
}
```

Requires operator JWT + `is_admin()` + temporary permission open (separate phase).

---

## 5. Not executed in this phase

| Item | Status |
| --- | --- |
| Edge deploy | **no** |
| Save / operation=save HTTP | **no** |
| SQL / GRANT / POLICY | **no** |
| DB write | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| service_role | **not used** |
| Production change | **no** |

---

## 6. Next

```txt
recommendedNextPhase: G-20u36f-discography-marker-title-restore-edge-deploy-prep
```

Deploy updated handler to staging Edge, then pre-restore SELECT → permission open → controlled Save → close → package regen → manual FTP → UI verify.
