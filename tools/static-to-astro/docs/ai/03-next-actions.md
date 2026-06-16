Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9a-gosaki-cms-scope-and-schedule-youtube-planning` (complete — planning only)

**Doc:** `tools/static-to-astro/docs/gosaki-cms-scope-and-schedule-youtube-planning.md`

### Gates

```txt
gosakiCmsScopeAndScheduleYoutubePlanningComplete: true
readyForG9bGosakiScheduleDataSeedPlanning: true
readyForG9bGosakiYoutubeEmbedCmsPlanning: true
readyForGosakiClientPreview: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **G-9b:** `gosaki-schedule-data-seed-planning` — Wix repeater extractor, `site_slug` migration doc, seed JSON from `fixtures/gosaki-piano`
2. **Parallel (after G-9b or G-9f):** YouTube `site_embeds` schema migration planning
3. **Do not:** DB write, FTP, `/admin` changes, workflow_dispatch without explicit phase approval

## 3. Gosaki staging preview (baseline)

- Latest commit: `77b57b8`
- Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- Deploy: manual upload package only
- CMS MVP priority: Schedule → Top YouTube embed → Bands/Projects (defer)
