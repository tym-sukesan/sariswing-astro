Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9d1-gosaki-supabase-schedule-read-verification-preview-package (verification complete — uncommitted)
Latest commit: 6103250 (G-9d)
```

## Summary

G-9d1 verified Gosaki schedule Supabase read + static fallback:

- **Static-fallback** convert/build: PASS (`scheduleDataSource=static-fallback`, 60 events)
- **Supabase read** (read-only, anon): PASS (60 rows, canonical `source_route`)
- **Manual-upload package** generated at `output/manual-upload/gosaki-piano/` — not uploaded
- **Legacy stubs** + **sitemap canonical-only**: PASS

**Doc:** `tools/static-to-astro/docs/gosaki-supabase-schedule-read-verification-preview-package.md`

## Gates

```txt
gosakiSupabaseScheduleReadVerificationPreviewPackageComplete: true
gosakiScheduleStaticFallbackVerified: true
gosakiScheduleSupabaseReadVerified: true
gosakiManualUploadPackageGenerated: true
readyForG9d2ManualPreviewUpload: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Safety

- No DB writes, no FTP, no manual upload in G-9d1
- `service_role` not used

## Next

- Commit G-9d1
- G-9d2 operator manual preview upload (separate approval)
