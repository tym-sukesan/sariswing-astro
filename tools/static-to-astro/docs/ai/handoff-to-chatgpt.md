Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-7-url-to-staging-automation-sprint-planning (completed — planning only)
Latest completed phase: G-7-url-to-staging-automation-sprint-planning
Latest commit: 1be0a27 — Record G-6-g2 schedule time-fields non-dry-run execution success.
Recommended next phase: G-7a-crawl-static-site-implementation
```

---

## 3. Current state summary

Development focus shifted from G-6-g3 (price slice) to **URL → staging semi-automation**. Goal: operator enters URL → crawl → Astro → build → staging deploy on Lolipop. First real case: gosaki-piano.com. Not full SaaS.

**Already proven (gosaki):** convert, build, static-public artifact, FTP to `yskcreate.weblike.jp/cms-kit-staging/gosaki/`.

**Main gap:** no crawl CLI (workflow step 1 is manual).

G-6 Schedule CMS work paused; G-6-g1/g2 execution succeeded.

---

## 4. G-7 MVP scope (2–3 days)

| Day | Phase | Deliverable |
| --- | --- | --- |
| 1 | G-7a | `crawl-static-site.mjs` |
| 2 | G-7b | `url-to-staging-run.mjs` orchestrator |
| 3 | G-7c/d | site config bootstrap + gosaki pilot prep |

**Deferred for MVP:** Supabase, seed, Storage, Admin CMS writes.

---

## 5. Gate state

```txt
urlToStagingAutomationSprintPlanningComplete: true
readyForG7aCrawlStaticSiteImplementation: true
g6g3PriceSliceDeferred: true
scheduleTimeFieldsNonDryRunSliceExecutionSucceeded: true
rollbackNeeded: false
ftpDeployInPlanning: false
productionTouched: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/url-to-staging-automation-sprint-planning.md
tools/static-to-astro/docs/gosaki-staging-runbook.md
tools/static-to-astro/docs/staging-generation-plan.md
tools/static-to-astro/config/sites/gosaki.site-config.example.json
tools/static-to-astro/README.md
tools/static-to-astro/docs/ai/00-current-state.md
```
