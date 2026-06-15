Last updated: 2026-06-15
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Latest completed phase:** `G-7-url-to-staging-automation-sprint-planning`

Development focus shifted from G-6-g3 price slice to URL → staging semi-automation. Planning doc covers gosaki-piano.com as first real case, 2–3 day MVP scope, and implementation phase split.

**Doc:** `tools/static-to-astro/docs/url-to-staging-automation-sprint-planning.md`

**Recommended next phase:** `G-7a-crawl-static-site-implementation`

## 2. G-7 sprint goal

```txt
URL input → crawl → Astro → build → static-public → FTP staging → QA
```

Semi-automatic operator tool (not full SaaS). First customer: gosaki-piano.com.

## 3. What exists vs gap

| Exists (gosaki proven) | Gap (G-7 MVP) |
| --- | --- |
| convert-static-to-astro | crawl-static-site.mjs |
| verify-build / static-public | url-to-staging-run.mjs orchestrator |
| deploy-public-dist-ftp (gated) | site config bootstrap from URL |
| gosaki-staging-runbook | — |

CMS / Supabase: **deferred** for staging MVP.

## 4. G-6 Schedule CMS (paused)

```txt
G-6-g1 / G-6-g2 execution: DONE
G-6-g3 price slice: DEFERRED
routine dev: PUBLIC_ADMIN_WRITE_DRY_RUN=true
```

## 5. Phased next steps

| Phase | Status |
| --- | --- |
| G-7 planning | **DONE** |
| G-7a crawl CLI | **Next** |
| G-7b pipeline orchestrator | Pending |
| G-7c site config bootstrap | Pending |
| G-7d gosaki URL→staging pilot | Pending |
| G-6-g3 price slice | Paused |

## 6. Safety (G-7)

- No production DNS / gosaki-piano.com deploy
- FTP / workflow_dispatch only with explicit approval
- `.env.local` / secrets never committed
- Staging: noindex + robots Disallow + deploy-base canonical

## 7. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.
