# CMS Core v2 — build-read envelope skeleton helper

- **Phase:** `cms-core-v2-build-read-envelope-skeleton`
- **Date:** 2026-07-30
- **Status:** **COMPLETE**
- **SoT:** `scripts/lib/build-read-envelope-utils.mjs`
- **Consumers:** `site-cms-features.mjs` — `loadSiteEmbedsDataForBuild` · `loadSitePageFieldsDataForBuild` / `finalizeSitePageFieldsLoadResult`
- **Behavior:** public return keys/values unchanged (deep-equality fixtures)
- **Package / FTP / DB / Save / Edge:** none

---

## Gates

```txt
phase: cms-core-v2-build-read-envelope-skeleton
CMS_CORE_V2_BUILD_READ_ENVELOPE_SKELETON_COMPLETE: true
RUNTIME_BEHAVIOR_CHANGED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
GOSAKI_CLIENT_SHARE_READY_MAINTAINED: true
deployedPackageSourceCommitUnchanged: dc1c5b62a58d0462ad6629db4847256d316d4a38
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## API

| Export | Role |
| --- | --- |
| `buildReadRowCount(rows)` | `Array.isArray` length else `0` |
| `createBuildReadEnvelope(input)` | assemble `{ [dataSourceKey], fallbackReason, [rowsKey], siteSlug, rowCount, ...extra }` |
| `createBuildReadSuccessEnvelope(input)` | `fallbackReason: null` · default `dataSource: "supabase"` |
| `createBuildReadFallbackEnvelope(input)` | empty/blocked/error/not-configured · default `rows: []` |

Caller owns: `dataSourceKey` / `rowsKey` / reason strings / feature extras (`profileLede`, `fieldCount`).

---

## Not in Core

fetch · anon env · registry · production ref · reason selection · row validation · logging · UI

---

## Verify

```bash
npm run verify:cms-core-v2-build-read-envelope
npm run verify:cms-core-v2-safety-suite
```
