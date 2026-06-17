Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9d3-gosaki-preview-review-and-next-implementation-planning (planning complete — uncommitted)
Latest commit: 467f226 (G-9d2 execution result)
```

## Summary

G-9d3: Preview review synthesis + next implementation roadmap for Gosaki CMS Kit.

- **Live preview:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- **Schedule stack:** G-9b→G-9d2 complete (DB seed, Supabase read+fallback, live upload)
- **Recommended next:** G-9e `site_slug` read generalization after optional client visual review
- **Defer:** Production cutover planning until preview + CMS path proven

**Doc:** `tools/static-to-astro/docs/gosaki-preview-review-and-next-implementation-planning.md`

## Gates

```txt
gosakiPreviewReviewPlanningComplete: true
gosakiNextImplementationOptionsDocumented: true
readyForG9eNextImplementation: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Safety

- Planning only — no FTP, no DB writes

## Next

- Commit G-9d3 planning
- G-9e site_slug schedule read generalization
