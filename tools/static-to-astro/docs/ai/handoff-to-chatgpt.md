Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9d2-gosaki-manual-preview-upload-planning (planning complete — uncommitted)
Latest commit: 821caa0 (G-9d1)
```

## Summary

G-9d2 planning: operator checklist for manual preview upload of G-9d1 package.

- **Source:** `output/manual-upload/gosaki-piano/public-dist/` (contents only)
- **Destination:** `/cms-kit-staging/gosaki-piano/` (not production root)
- **Approval ID:** `G-9d2-gosaki-manual-preview-upload`
- **FTP / upload:** NOT executed in planning phase

**Doc:** `tools/static-to-astro/docs/gosaki-manual-preview-upload-planning.md`

## Gates

```txt
gosakiManualPreviewUploadPlanningComplete: true
gosakiManualPreviewUploadChecklistReady: true
readyForOperatorManualPreviewUpload: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Safety

- No FTP, no DB writes, no service_role
- Mirror / sync-delete forbidden

## Next

- Commit G-9d2 planning
- Operator upload with explicit approval
