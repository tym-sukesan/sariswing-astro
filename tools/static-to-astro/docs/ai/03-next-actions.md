Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9d2-gosaki-manual-preview-upload-planning` (planning complete — uncommitted)

**Docs:**
- `tools/static-to-astro/docs/gosaki-manual-preview-upload-planning.md` (**new**)
- `tools/static-to-astro/docs/gosaki-supabase-schedule-read-verification-preview-package.md`

**Awaiting:** operator commit/push approval (`Plan Gosaki manual preview upload`)

### G-9d2 planning summary

- Source: `output/manual-upload/gosaki-piano/public-dist/` (contents only)
- Destination: `/cms-kit-staging/gosaki-piano/` on preview host
- FTP safety rules, approval text, pre/post checklist, rollback policy documented
- **No FTP connection or upload in planning phase**

### Gates

```txt
gosakiManualPreviewUploadPlanningComplete: true
gosakiManualPreviewUploadChecklistReady: true
gosakiManualPreviewUploadSourceVerified: true
gosakiManualPreviewUploadDestinationScoped: true
gosakiManualPreviewUploadDeleteForbidden: true
readyForOperatorManualPreviewUpload: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **Commit G-9d2 planning** (operator approval)
2. **G-9d2 execution:** Operator manual upload with approval ID `G-9d2-gosaki-manual-preview-upload`

## 3. Do not

- FTP upload without explicit operator approval (section 6 of planning doc)
- Mirror / sync-delete on remote
- Use `service_role` / DB writes

## 4. Baseline

- Latest commit: `821caa0` (G-9d1)
- G-9d2: planning complete, pending commit
