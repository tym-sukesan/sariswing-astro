Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9c0b-gosaki-schedule-legacy-month-route-stub` (complete)

**Docs:**
- `tools/static-to-astro/docs/gosaki-schedule-route-canonical-planning.md`
- `tools/static-to-astro/docs/gosaki-schedule-canonical-route-implementation.md`
- `tools/static-to-astro/docs/gosaki-schedule-legacy-month-route-stub.md`

**G-9c on hold:** SQL template artifacts exist locally but **must not commit** until G-9c0c route-aware regeneration.

### Gates

```txt
gosakiScheduleLegacyMonthRouteStubComplete: true
gosakiLegacyMonthRoutesGenerated: true
gosakiLegacyMonthRoutesNoindex: true
gosakiLegacyMonthRoutesCanonicalToSchedule: true
gosakiLegacyMonthRoutesExcludedFromSitemap: true
gosakiScheduleCanonicalMonthRouteStill: /schedule/YYYY-MM/
readyForG9c0cRouteAwareSeedSqlRegeneration: true
readyForG9cCommit: false
gosakiScheduleSeedSqlPlanningComplete: true
gosakiScheduleSeedSqlTemplateReady: true (route values stale — regenerate in G-9c0c)
readyForG9cOperatorManualSqlExecutionPreflight: false
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **G-9c0c:** Regenerate seed SQL (`source_route` → `/schedule/YYYY-MM/`) + verifier SQL artifact tests
2. **G-9c commit:** Commit route-aware SQL templates (operator approval)
3. **G-9c-execution:** Operator preflight → resolve `schedule-2026-07-010` collision → manual INSERT
4. **G-9d:** Astro Supabase read + static fallback for schedule pages
5. **Operator re-upload:** `manual-upload:package` after G-9c0b commit

## 3. Do not

- Commit G-9c SQL templates before G-9c0c regeneration
- DB write from Cursor/CI, FTP auto-apply, `/admin` changes
- Touch production gosaki-piano.com or Supabase production

## 4. Gosaki staging preview (baseline)

- Latest commit: `acc834c` (G-9c0 planning doc; G-9c0a `c385a7f`; G-9c0b uncommitted)
- Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- Canonical month routes: `/schedule/2026-03/` … `/schedule/2026-07/`
- Legacy stubs (G-9c0b, local): `/2026-03/` … `/2026-07/` — noindex + canonical to schedule month
- Deploy: manual upload package only
