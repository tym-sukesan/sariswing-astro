Last updated: 2026-06-16
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-9c0a-gosaki-schedule-canonical-route-implementation` (complete)

**Docs:**
- `tools/static-to-astro/docs/gosaki-schedule-route-canonical-planning.md`
- `tools/static-to-astro/docs/gosaki-schedule-canonical-route-implementation.md`

**G-9c on hold:** SQL planning artifacts exist locally but **must not commit** until route-aware `source_route` is decided/implemented.

### Gates

```txt
gosakiScheduleRouteCanonicalPlanningComplete: true
gosakiScheduleCanonicalRouteImplementationComplete: true
gosakiScheduleCanonicalMonthRoute: /schedule/YYYY-MM/
gosakiScheduleHubLinksUseCanonicalRoute: true
gosakiScheduleMonthPagesGeneratedUnderSchedule: true
gosakiLegacyMonthRouteStubDeferredToG9c0b: true
readyForG9c0bGosakiScheduleLegacyMonthRouteStub: true
readyForG9c0cRouteAwareSeedSqlRegeneration: true
readyForG9cCommit: false
gosakiScheduleSeedSqlPlanningComplete: true
gosakiScheduleSeedSqlTemplateReady: true (route values stale — /YYYY-MM/)
readyForG9cOperatorManualSqlExecutionPreflight: false
readyForAnyDbWrite: false
readyForAnyFtpApply: false
ftpAutoDeployStillDisabled: true
```

## 2. Next steps

1. **G-9c0b:** Implement legacy `/YYYY-MM/` compatibility stubs (`rel=canonical` to `/schedule/YYYY-MM/`) — no DB/FTP
2. **G-9c0c:** Regenerate seed SQL (`source_route` → `/schedule/YYYY-MM/`) + update G-9c planning doc
3. **G-9c commit:** Commit route-aware SQL templates (operator approval)
4. **G-9c-execution:** Operator preflight → resolve `schedule-2026-07-010` collision → manual INSERT
5. **G-9d:** Astro Supabase read + static fallback for schedule pages
6. **Operator re-upload:** `manual-upload:package` after G-9c0b

## 3. Do not

- Commit G-9c with `/YYYY-MM/` `source_route` if canonical decision stands
- DB write from Cursor/CI, FTP auto-apply, `/admin` changes
- Touch production gosaki-piano.com or Supabase production

## 4. Gosaki staging preview (baseline)

- Latest commit: `d0d0a6a` (G-9c + G-9c0 uncommitted)
- Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`
- Canonical month routes (implemented): `/schedule/2026-03/` … `/schedule/2026-07/`
- Legacy `/YYYY-MM/`: deferred to G-9c0b
- Deploy: manual upload package only
