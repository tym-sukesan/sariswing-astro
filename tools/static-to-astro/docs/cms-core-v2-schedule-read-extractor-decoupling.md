# CMS Core v2 — schedule-read ↔ Gosaki Wix extractor decoupling

- **Phase:** `cms-core-v2-schedule-read-extractor-decoupling`
- **Date:** 2026-07-30
- **Status:** **COMPLETE**
- **Package generate / FTP:** **not executed**

---

## Gates

```txt
phase: cms-core-v2-schedule-read-extractor-decoupling
CMS_CORE_V2_SCHEDULE_READ_EXTRACTOR_DECOUPLING_COMPLETE: true
CORE_GOSAKI_WIX_EXTRACTOR_IMPORT_REMOVED: true
RUNTIME_BEHAVIOR_CHANGED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
GOSAKI_CLIENT_SHARE_READY_MAINTAINED: true
deployedPackageSourceCommitUnchanged: dc1c5b62a58d0462ad6629db4847256d316d4a38
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## Separation

**Before:** `supabase-schedule-read.mjs` → `gosaki-wix-schedule-extractor.mjs`
**After:**
- Core `supabase-schedule-read.mjs` → `site-registry` only (`GOSAKI_SITE_KEY` for pilot config)
- Adapter `gosaki-schedule-read-adapter.mjs` → extractor + Core (`loadGosakiScheduleDataForBuild`, `gosakiScheduleStaticFallback`)
- `site-aware-supabase-loaders` imports adapter for Gosaki path

Return shapes / SELECT / fallback reasons unchanged.

---

## Verify

```bash
npm run verify:cms-core-v2-schedule-read-extractor-decoupling
npm run verify:cms-core-v2-safety-suite
```
