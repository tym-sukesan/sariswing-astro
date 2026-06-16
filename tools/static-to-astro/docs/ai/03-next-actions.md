Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9d1-gosaki-supabase-schedule-read-verification-preview-package` (verification complete — uncommitted)

**Docs:**
- `tools/static-to-astro/docs/gosaki-supabase-schedule-read-verification-preview-package.md` (**new**)
- `tools/static-to-astro/docs/gosaki-astro-supabase-schedule-read-with-static-fallback.md`

**Awaiting:** operator commit/push approval (`Verify Gosaki Supabase schedule read preview package`)

### G-9d1 verification summary

- Static-fallback pipeline: PASS (60 rows, 5 months, `scheduleDataSource=static-fallback`)
- Supabase read: PASS (60 rows, month counts 13/10/12/11/14, read-only)
- Manual-upload package: generated, `verify:manual-upload` PASS
- Legacy stubs + sitemap canonical-only: PASS

### Gates

```txt
gosakiSupabaseScheduleReadVerificationPreviewPackageComplete: true
gosakiScheduleStaticFallbackVerified: true
gosakiScheduleSupabaseReadVerified: true
gosakiManualUploadPackageGenerated: true
gosakiScheduleRoutesVerified: true
gosakiLegacyStubsVerified: true
gosakiScheduleSitemapCanonicalOnlyVerified: true
readyForG9d2ManualPreviewUpload: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **Commit G-9d1** (operator approval)
2. **G-9d2:** Operator manual preview upload from `output/manual-upload/gosaki-piano/public-dist/` (separate approval — no FTP auto-apply)

## 3. Do not

- Execute SQL from Cursor/CI
- FTP upload without explicit G-9d2 approval
- Use `service_role`

## 4. Baseline

- Latest commit: `6103250` (G-9d)
- G-9d1: verification complete, pending commit
