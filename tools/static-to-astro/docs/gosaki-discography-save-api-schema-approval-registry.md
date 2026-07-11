# G-20u32 — Gosaki Discography Save API schema & approval registry

**Phase:** `G-20u32-gosaki-discography-save-api-schema-approval-registry`  
**Status:** **complete** — schema / approval registry / validation helpers only  
**Date:** 2026-07-11  
**Base commit:** `c40b88e`  
**Prior:** G-20u31 Save design · G-20u30 dry-run validation · G-20u30b STG reflection (`00c8888`)

| Check | Status |
| --- | --- |
| Request/response schema module | **yes** — `scripts/lib/gosaki-discography-save-schema.mjs` |
| Approval ID registry module | **yes** — `scripts/lib/gosaki-discography-save-approval-registry.mjs` |
| Save UI enabled | **no** — buttons remain disabled |
| Edge Function implementation | **not executed** — design only |
| DB write / SQL execution | **not executed** |
| Discography fetch POST | **not added** |
| Approval state persistence | **not added** (no localStorage / DB / file) |
| Production upload | **STOP** (G-20j) |

---

## Gates

```txt
gosakiDiscographySaveApiSchemaApprovalRegistryComplete: true
phase: G-20u32-gosaki-discography-save-api-schema-approval-registry
saveEnabled: false
discographySaveDbWriteExecuted: false
discographyEdgeFunctionImplemented: false
cursorDbWriteExecuted: false
cursorFtpUploadExecuted: false
productionUploadStop: true
serviceRoleBrowserExposure: false
anonKeyDirectWriteAllowed: false
serverDryRunRequiredBeforeSave: true
```

---

## 1. Scope (this phase)

| In scope | Out of scope |
| --- | --- |
| Request/response schema constants | Edge Function deploy |
| `validateDiscographySaveRequest()` | Save button enablement |
| `validateDiscographySaveResponse()` | fetch POST in admin UI |
| `validateApprovalIdShape()` | Supabase insert/update/delete |
| Approval ID registry (definitions) | Approval token issuance |
| Staging-only guards | Production DB / FTP |
| Sample payloads for verifiers | Executable SQL files |

---

## 2. Modules

| Module | Path |
| --- | --- |
| Schema + validation | `scripts/lib/gosaki-discography-save-schema.mjs` |
| Approval registry | `scripts/lib/gosaki-discography-save-approval-registry.mjs` |
| Track line parse (reuse) | `scripts/lib/gosaki-staging-read-only-admin.mjs` |

---

## 3. Request schema

### 3.1 Top-level fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `operation` | `"dryRun"` \| `"save"` | yes | Save requires prior server dry-run |
| `siteSlug` | `"gosaki-piano"` | yes | **Required** — staging pilot only |
| `legacyId` | string | yes | e.g. `discography-002` |
| `approvalId` | string | yes | Registry shape — see §5 |
| `expectedBeforeUpdatedAt` | string \| null | no | Optimistic lock (future) |
| `release` | object | yes | See §3.2 |
| `tracksText` | string | yes | 1 line = 1 track |
| `trackPolicy` | object | yes | See §3.3 |
| `clientDryRun` | object | yes | Browser snapshot — `wouldWrite: false` |

### 3.2 `release` object

| Field | Type |
| --- | --- |
| `title` | string |
| `artist` | string |
| `release_date` | string \| null |
| `label` | string \| null |
| `catalog_number` | string \| null |
| `published` | boolean |
| `cover_image_url` | string \| null |
| `purchase_url` | string \| null |
| `streaming_url` | string \| null |
| `description` | string |

### 3.3 `trackPolicy`

| Field | Default | Notes |
| --- | --- | --- |
| `oneLineOneTrack` | `true` | Required true |
| `blankLinesIgnored` | `true` | Required true |
| `allowDuplicateTitles` | `true` | Warn if duplicates |
| `allowEmptyTrackList` | `false` | Block empty unless override |

### 3.4 `clientDryRun`

| Field | Notes |
| --- | --- |
| `totalBefore` / `totalAfter` | From G-20u30 browser dry-run |
| `added` / `removed` | string arrays |
| `reordered` | boolean |
| `wouldWrite` | **Must be `false`** in browser |

### 3.5 Example request (dryRun)

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
  "tracksText": "Nature Boy\nWaters Of March\n",
  "trackPolicy": {
    "oneLineOneTrack": true,
    "blankLinesIgnored": true,
    "allowDuplicateTitles": true,
    "allowEmptyTrackList": false
  },
  "clientDryRun": {
    "totalBefore": 8,
    "totalAfter": 8,
    "added": [],
    "removed": [],
    "reordered": false,
    "wouldWrite": false
  }
}
```

---

## 4. Response schema

| Field | Type | Notes |
| --- | --- | --- |
| `ok` | boolean | |
| `operation` | `"dryRun"` \| `"save"` | |
| `siteSlug` | string | Must be `gosaki-piano` |
| `legacyId` | string | |
| `approvalId` | string | |
| `wouldWrite` | boolean | `true` when server detects changes |
| `didWrite` | boolean | **`false` in G-20u32** — Save not implemented |
| `changedCounts` | object | `releaseFields`, `tracksAdded`, `tracksRemoved`, `tracksReordered` |
| `diff` | object | Same shape as G-20u30 + server extensions |
| `backupToken` | string \| null | Pre-write snapshot reference (future) |
| `errors` | string[] | |
| `warnings` | string[] | |
| `readBack` | object \| null | Post-Save SELECT (future) |
| `serverTime` | string | ISO-8601 |

### 4.1 Example response (dryRun — no write)

```json
{
  "ok": true,
  "operation": "dryRun",
  "siteSlug": "gosaki-piano",
  "legacyId": "discography-002",
  "approvalId": "G-20u31-gosaki-discography-save-dry-run-endpoint",
  "wouldWrite": true,
  "didWrite": false,
  "changedCounts": {
    "releaseFields": [],
    "tracksAdded": 0,
    "tracksRemoved": 0,
    "tracksReordered": false
  },
  "diff": {
    "totalBefore": 8,
    "totalAfter": 8,
    "added": [],
    "removed": [],
    "unchanged": 8,
    "reordered": false
  },
  "backupToken": null,
  "errors": [],
  "warnings": [],
  "readBack": null,
  "serverTime": "2026-07-11T09:36:00.000Z"
}
```

**G-20u32 rule:** `operation: "save"` requests may pass schema validation, but **`didWrite` must remain `false`** until Edge Function implementation (G-20u33+).

---

## 5. Approval ID specification

### 5.1 Shape

| Pattern | Example |
| --- | --- |
| Phase-style | `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` |
| Registry prefix | `GOSAKI_DISCOGRAPHY_SAVE__ALBUM_002_TRACKLIST` |

### 5.2 Required attributes (when issued in future phase)

| Attribute | Value |
| --- | --- |
| `environment` | **staging only** |
| `siteSlug` | **`gosaki-piano`** (required) |
| `legacyId` | **required** |
| `operation` | `dryRun` or `save` |
| `generatedAt` | ISO-8601 |
| `expiresAt` | ISO-8601 (default TTL 24h) |
| Human confirmation | **required** before Save |

### 5.3 Registered entries (definitions only — not issued)

| approvalId | operation | status |
| --- | --- | --- |
| `G-20u31-gosaki-discography-save-dry-run-endpoint` | dryRun | planned |
| `G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice` | save | planned |

### 5.4 Forbidden

- Approval state in localStorage / DB / file (G-20u32)
- Automatic issuance without operator
- Production Save approval
- Save without prior **server** dry-run

---

## 6. Validation helpers

| Function | Purpose |
| --- | --- |
| `validateDiscographySaveRequest()` | Full request schema check |
| `validateDiscographySaveResponse()` | Response shape; blocks `didWrite: true` in G-20u32 |
| `validateApprovalIdShape()` | Approval ID + registry policy |
| `assertDiscographySaveIsStagingOnly()` | Rejects wrong `siteSlug` / production project |
| `assertNoBrowserServiceRole()` | Rejects `service_role` in env/payload |

All helpers return `{ ok, errors, warnings }`. **No DB · no network · no Supabase client.**

---

## 7. Security & write policy

| Rule | G-20u32 |
| --- | --- |
| Staging only | **yes** — `site_slug=gosaki-piano` required |
| `service_role` in browser | **Forbidden** |
| Anon key direct write | **Forbidden** |
| Edge Function | **Not implemented** — design from G-20u31 |
| Server dry-run before Save | **Required** (gate documented) |
| Rollback / `backupToken` | Documented — not executed |
| Production upload | **STOP** (G-20j) |

---

## 8. Rollback / backupToken (design carry-forward)

From G-20u31 — unchanged in G-20u32:

- Pre-Save snapshot JSON (release + tracks)
- `backupToken` in response references audit log entry (future Edge Function)
- Single transaction per album Save
- No browser localStorage for backup

---

## 9. Not executed in G-20u32

- DB write / SQL mutation
- Save button enablement
- Discography fetch POST
- Edge Function create/deploy under `supabase/functions/**`
- Executable `.sql` files
- Approval state persistence
- `service_role` usage
- FTP / deploy / production changes

---

## 10. Next phases

| Phase | Scope |
| --- | --- |
| **G-20u33** | Edge Function draft + `gosaki-discography-save-dry-run` (staging deploy — operator approval) |
| **G-20u34** | Save UI arm design (`PUBLIC_ADMIN_*` gate) |
| **G-20u35** | Staging DB write test plan + rollback drill |
| **G-20u36** | First controlled Save — one album (`discography-002`) |

---

## 11. Verify

```bash
cd tools/static-to-astro
npm run verify:g20u32-gosaki-discography-save-api-schema-approval-registry
npm run verify:current-active-regression
```
