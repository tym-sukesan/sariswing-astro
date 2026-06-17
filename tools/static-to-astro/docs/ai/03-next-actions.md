Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9d2-gosaki-manual-preview-upload-execution-result` (recorded — uncommitted)

**Docs:**
- `tools/static-to-astro/docs/gosaki-manual-preview-upload-execution-result.md` (**new**)
- `tools/static-to-astro/docs/gosaki-manual-preview-upload-planning.md`

**Awaiting:** operator commit/push approval (`Record Gosaki manual preview upload result`)

### G-9d2 execution summary

- Operator manually uploaded `public-dist/` contents → `/cms-kit-staging/gosaki-piano/` on `yskcreate.weblike.jp`
- Live QA: schedule hub, canonical month pages, legacy stubs, robots, sitemap — PASS
- Cursor/AI/CI: no FTP operations
- Rollback: not executed

### Gates

```txt
gosakiManualPreviewUploadExecutionRecorded: true
gosakiManualPreviewUploadSucceeded: true
gosakiPreviewScheduleRoutesLiveVerified: true
gosakiPreviewLegacyStubLiveVerified: true
gosakiPreviewRobotsTxtVerified: true
gosakiPreviewSitemapCanonicalOnlyVerified: true
readyForG9d3PreviewReviewOrNextImplementation: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **Commit G-9d2 execution result** (operator approval)
2. **G-9d3:** Client preview review or next implementation phase

## 3. Do not

- Cursor/CI FTP operations
- DB writes / `service_role`
- FTP auto-apply (`readyForAnyFtpApply: false`)

## 4. Baseline

- Latest commit: `25497a5` (G-9d2 planning)
- G-9d2 execution: recorded, pending commit
