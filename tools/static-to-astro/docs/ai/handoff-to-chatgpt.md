Paste this file at the start of a new ChatGPT thread.

---

## Current phase

```txt
Current phase: G-9a-gosaki-cms-scope-and-schedule-youtube-planning (complete — planning only)
Latest commit: 77b57b8
Prior: G-8g2〜G-8g8 gosaki staging preview fixes (committed)
```

## Summary

G-9a: Gosaki CMS MVP scope planning — Schedule CMS, Top YouTube embed CMS, About Bands/Projects priority. Staging preview is client-ready (static Wix HTML + manual upload). Next implementation track starts with schedule data seed (Wix repeater extractor + `site_slug` migration plan).

**Doc:** `tools/static-to-astro/docs/gosaki-cms-scope-and-schedule-youtube-planning.md`

## CMS MVP priority

```txt
1. Schedule CMS — read Supabase → write staging shell (routes: /schedule/ hub, /YYYY-MM/ months)
2. Top YouTube embed — site_embeds table, URL normalize to youtube-nocookie embed
3. Bands/Projects — keep static JSON for now (Phase 3)
```

## Key technical decisions (G-9a)

```txt
- Reuse public.schedules schema on static-to-astro-cms-staging (G-6-e1 compatible)
- Add site_slug = gosaki-piano (migration in G-9b — not executed yet)
- Wix repeater parser needed (schedule-seed-extractor currently .schedule-card only)
- YouTube: site_embeds table (not instagram_posts); Kit write without service_role
- Admin: /__admin-staging-shell/musician-basic/ only — not /admin
- schedule_months: read-only derived — never CMS write
```

## Gates

```txt
gosakiCmsScopeAndScheduleYoutubePlanningComplete: true
readyForG9bGosakiScheduleDataSeedPlanning: true
readyForG9bGosakiYoutubeEmbedCmsPlanning: true
readyForGosakiClientPreview: true
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## Recommended next phase

```txt
G-9b-gosaki-schedule-data-seed-planning
```

## Safety (always)

```txt
No production touch
No Supabase production project
No service_role in Kit staging write
No FTP / workflow_dispatch
No /admin changes
PUBLIC_ADMIN_WRITE_DRY_RUN=true default for routine dev
```
