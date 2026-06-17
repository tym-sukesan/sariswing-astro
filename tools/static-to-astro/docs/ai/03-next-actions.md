Last updated: 2026-06-17
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9d3-gosaki-preview-review-and-next-implementation-planning` (planning complete — uncommitted)

**Docs:**
- `tools/static-to-astro/docs/gosaki-preview-review-and-next-implementation-planning.md` (**new**)

**Awaiting:** operator commit/push approval (`Plan Gosaki preview review next implementation`)

### G-9d3 summary

- Live preview: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- Compared next options A–E (visual review, admin UI, site_slug generalization, production plan, other CMS)
- **Recommended:** short client review → **G-9e site_slug read generalization** → staging shell CMS → production plan last

### Gates

```txt
gosakiPreviewReviewPlanningComplete: true
gosakiPreviewLiveUrlRecorded: true
gosakiSchedulePreviewAccepted: true
gosakiNextImplementationOptionsDocumented: true
readyForG9eNextImplementation: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **Commit G-9d3 planning**
2. **Optional:** Client visual review on live preview (候補 A)
3. **G-9e:** `site_slug` schedule read generalization (recommended next code phase)

## 3. Do not

- FTP auto-apply / production deploy without new approval stack
- DB writes / `service_role`
- `/admin` changes

## 4. Baseline

- Latest commit: `467f226` (G-9d2 execution result)
- G-9d3: planning complete, pending commit
