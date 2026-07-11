# G-20u33 — Gosaki Discography Save dry-run endpoint draft

**Phase:** `G-20u33-gosaki-discography-save-dry-run-endpoint-draft`  
**Status:** **complete** — Edge Function dry-run endpoint **design + non-deployable draft module only**  
**Date:** 2026-07-11  
**Base commit:** `f2aec2c`  
**Prior:** G-20u32 API schema · G-20u31 Save design · G-20u30 browser dry-run · G-20u30b STG (`00c8888`)

| Check | Status |
| --- | --- |
| Endpoint design doc | **yes** (this file) |
| Draft module | **yes** — `scripts/lib/gosaki-discography-save-dry-run-endpoint-draft.mjs` |
| Edge Function deployed | **no** — `supabase/functions/**` untouched |
| Save UI enabled | **no** |
| DB write / SQL | **not executed** |
| Discography fetch POST | **not added** |
| Production upload | **STOP** (G-20j) |

---

## Gates

```txt
gosakiDiscographySaveDryRunEndpointDraftComplete: true
phase: G-20u33-gosaki-discography-save-dry-run-endpoint-draft
saveEnabled: false
discographySaveDbWriteExecuted: false
discographyEdgeFunctionDeployed: false
didWriteAlwaysFalse: true
dbWrite: false
networkWrite: false
cursorDbWriteExecuted: false
cursorFtpUploadExecuted: false
productionUploadStop: true
serviceRoleBrowserExposure: false
anonKeyDirectWriteAllowed: false
```

---

## 1. Endpoint

| Item | Value |
| --- | --- |
| **Name** | `gosaki-discography-save-dry-run` |
| **Purpose** | Server-side Save preflight validation |
| **Environment** | **staging only** — production forbidden |
| **Deploy location (future)** | `supabase/functions/gosaki-discography-save-dry-run/` — **not created in G-20u33** |
| **Draft location (this phase)** | `tools/static-to-astro/scripts/lib/gosaki-discography-save-dry-run-endpoint-draft.mjs` |
| **Staging URL (future)** | `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run` |

### Purpose rules

| Rule | Value |
| --- | --- |
| `wouldWrite` | **May be `true`** when diff detects changes |
| `didWrite` | **Always `false`** |
| `dbWrite` | **Always `false`** |
| `networkWrite` | **Always `false`** (draft has no network) |
| `operation` | **`dryRun` only** — reject `save` |

---

## 2. Request (G-20u32 schema subset)

| Field | Required | Notes |
| --- | --- | --- |
| `operation` | yes | Must be `"dryRun"` |
| `siteSlug` | yes | **`gosaki-piano` only** |
| `legacyId` | yes | e.g. `discography-002` |
| `approvalId` | yes | Registry shape — see G-20u32 |
| `expectedBeforeUpdatedAt` | no | Optimistic lock (future) |
| `release` | yes | 10 metadata fields |
| `tracksText` | yes | 1 line = 1 track |
| `trackPolicy` | yes | blank ignore · dupes warn · empty block default |
| `clientDryRun` | yes | Browser snapshot · `wouldWrite: false` |

### Example request

```json
{
  "operation": "dryRun",
  "siteSlug": "gosaki-piano",
  "legacyId": "discography-002",
  "approvalId": "G-20u31-gosaki-discography-save-dry-run-endpoint",
  "expectedBeforeUpdatedAt": null,
  "release": {
    "title": "Continuous",
    "artist": "ごさきりかこTrio Feat.石川周之介",
    "release_date": "2023-07-26",
    "label": null,
    "catalog_number": "GSRT-0002",
    "published": true,
    "cover_image_url": "https://example.test/cover.png",
    "purchase_url": "https://gosakirikako.base.shop/",
    "streaming_url": null,
    "description": "personnel notes…"
  },
  "tracksText": "Nature Boy\nWaters Of March\nNew Track\n",
  "trackPolicy": {
    "oneLineOneTrack": true,
    "blankLinesIgnored": true,
    "allowDuplicateTitles": true,
    "allowEmptyTrackList": false
  },
  "clientDryRun": {
    "totalBefore": 8,
    "totalAfter": 9,
    "added": ["New Track"],
    "removed": [],
    "reordered": false,
    "wouldWrite": false
  }
}
```

---

## 3. Response

| Field | Type | G-20u33 |
| --- | --- | --- |
| `ok` | boolean | |
| `operation` | `"dryRun"` | always |
| `endpoint` | string | `gosaki-discography-save-dry-run` |
| `siteSlug` | string | `gosaki-piano` |
| `legacyId` | string | |
| `approvalId` | string | |
| `wouldWrite` | boolean | true when diff vs current baseline |
| `didWrite` | boolean | **always false** |
| `dbWrite` | boolean | **always false** |
| `networkWrite` | boolean | **always false** |
| `saveEnabled` | boolean | **always false** |
| `changedCounts` | object | releaseFields · tracksAdded/Removed/Reordered |
| `diff` | object | G-20u30 track diff + `releaseFieldsChanged` |
| `backupToken` | null | **Not issued in dry-run phase** |
| `backupPreview` | null | Design note only — issued before Save in G-20u36+ |
| `errors` | string[] | |
| `warnings` | string[] | duplicate titles etc. |
| `readBack` | null | Save phase only |
| `serverTime` | ISO-8601 | |

### Example response (wouldWrite true · no write)

```json
{
  "ok": true,
  "operation": "dryRun",
  "endpoint": "gosaki-discography-save-dry-run",
  "siteSlug": "gosaki-piano",
  "legacyId": "discography-002",
  "approvalId": "G-20u31-gosaki-discography-save-dry-run-endpoint",
  "wouldWrite": true,
  "didWrite": false,
  "dbWrite": false,
  "networkWrite": false,
  "saveEnabled": false,
  "changedCounts": {
    "releaseFields": [],
    "tracksAdded": 1,
    "tracksRemoved": 0,
    "tracksReordered": false
  },
  "diff": {
    "totalBefore": 2,
    "totalAfter": 3,
    "added": ["New Track"],
    "removed": [],
    "unchanged": 2,
    "reordered": false,
    "releaseFieldsChanged": []
  },
  "backupToken": null,
  "backupPreview": null,
  "errors": [],
  "warnings": [],
  "readBack": null,
  "serverTime": "2026-07-11T09:47:00.000Z"
}
```

---

## 4. Validation pipeline (draft)

| Step | Helper |
| --- | --- |
| 1. Reject `operation: save` | `validateDiscographySaveDryRunEndpointRequest` |
| 2. G-20u32 schema validation | `validateDiscographySaveRequest` |
| 3. Approval ID shape | `validateApprovalIdShape` |
| 4. Staging only | `assertDiscographySaveIsStagingOnly` |
| 5. No service_role in payload | `assertNoBrowserServiceRole` |
| 6. Parse tracksText | `parseDiscographyTrackListLines` |
| 7. Track diff | `validateDiscographyTrackListDryRun` |
| 8. Duplicate titles | warning (not block when `allowDuplicateTitles: true`) |
| 9. Empty track list | block unless `allowEmptyTrackList: true` |
| 10. Simulate response | `simulateDiscographySaveDryRunEndpoint` |

---

## 5. Current-data read (future Edge Function — not in G-20u33)

When deployed (future phase with operator approval):

```sql
-- Read-only SELECT (pseudo — not executable file in repo)
SELECT * FROM public.discography
 WHERE legacy_id = $1 AND site_slug = 'gosaki-piano';

SELECT * FROM public.discography_tracks
 WHERE discography_legacy_id = $1 AND site_slug = 'gosaki-piano'
 ORDER BY track_number;
```

G-20u33 draft accepts optional `currentSnapshot` in `simulateDiscographySaveDryRunEndpoint()` to model this without DB connection.

---

## 6. Auth (future deploy)

| Rule | Value |
| --- | --- |
| Auth | Supabase session JWT (staging operator) |
| `service_role` | Edge Function internal only — **never in browser/draft** |
| Anon direct write | **Forbidden** |
| RLS | Do not loosen for MVP |

---

## 7. Safety (G-20u33)

| Forbidden | Status |
| --- | --- |
| INSERT / UPDATE / DELETE / UPSERT | **not in draft** |
| SQL mutation | **not in draft** |
| Deno.serve / deploy code | **not in draft** |
| Supabase client creation | **not in draft** |
| Edge Function deploy | **not executed** |
| Production Supabase / FTP | **STOP** |
| Save UI enablement | **unchanged** |
| Approval state persistence | **not added** |
| localStorage | **not added** |

---

## 8. Rollback / backup

| Item | G-20u33 |
| --- | --- |
| `backupToken` | **null** — not issued at dry-run stage |
| `backupPreview` | **null** — design note for Save phase (G-20u36+) |
| Pre-Save snapshot | Documented in G-20u31 — executed in Save phase only |

---

## 9. Draft module API

| Function | Purpose |
| --- | --- |
| `validateDiscographySaveDryRunEndpointRequest()` | Endpoint-specific request validation |
| `buildDiscographySaveDryRunEndpointResponse()` | Response builder |
| `simulateDiscographySaveDryRunEndpoint()` | Pure simulation (no DB/network) |

---

## 10. Not executed in G-20u33

- Edge Function implementation under `supabase/functions/**`
- Deno.serve / deploy
- DB write / SQL execution
- Save button enablement
- Discography fetch POST in admin UI
- Approval state persistence
- `service_role` usage
- FTP / deploy / production changes

---

## 11. Next phases

| Phase | Scope |
| --- | --- |
| **G-20u34** | Save UI arm design (`PUBLIC_ADMIN_*` gate) |
| **G-20u35** | Staging DB write test plan + rollback drill |
| **G-20u36** | First controlled Save — one album (`discography-002`) |
| **G-20u3x deploy** | Edge Function deploy — **separate operator approval** |

---

## 12. Verify

```bash
cd tools/static-to-astro
npm run verify:g20u33-gosaki-discography-save-dry-run-endpoint-draft
npm run verify:current-active-regression
```
