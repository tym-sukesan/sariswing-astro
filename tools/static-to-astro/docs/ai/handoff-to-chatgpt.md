Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9d2-gosaki-manual-preview-upload-execution-result (recorded — uncommitted)
Latest commit: 25497a5 (G-9d2 planning)
```

## Summary

G-9d2 execution: Operator manually uploaded G-9d1 preview package to staging.

- **Live URL:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- **Schedule:** hub + canonical `/schedule/YYYY-MM/` live; legacy `/YYYY-MM/` stubs OK
- **Sitemap:** canonical schedule routes only; bare legacy months excluded
- **robots.txt:** `Disallow: /` (staging OK)
- **Cursor/AI/CI:** did NOT perform FTP

**Doc:** `tools/static-to-astro/docs/gosaki-manual-preview-upload-execution-result.md`

## Gates

```txt
gosakiManualPreviewUploadExecutionRecorded: true
gosakiManualPreviewUploadSucceeded: true
gosakiPreviewScheduleRoutesLiveVerified: true
readyForG9d3PreviewReviewOrNextImplementation: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Safety

- Operator manual upload only
- No FTP auto-deploy, no DB writes

## Next

- Commit execution result doc
- G-9d3 preview review or next CMS work
