# G-13d1c — Gosaki staging shell server gate injection

**Phase:** `G-13d1c-gosaki-staging-shell-server-gate-injection`  
**Status:** local implementation complete — **no Save / DB write in this phase**  
**Base commit:** `004c6a6`  
**Prior:** G-13d1b2 data-read config investigation

## Summary

Gosaki staging operator routes (`/__admin-staging-shell/musician-basic/…`) lacked G-6-d `#staging-shell-server-gates` injection. Client-side `getReadOnlyDataConfig()` / `mergeStagingShellEnv()` could not see non-PUBLIC `ENABLE_ADMIN_STAGING_DATA_READ`, blocking G-13c1 Preview. This phase adds server gate JSON to `AdminGosakiStagingShellLayout.astro` (same pattern as `musician-basic-admin-prototype.astro`).

**No Save / DB write / commit in this phase.**

---

## 1. Problem (G-13d1b2)

```txt
ENABLE_ADMIN_STAGING_DATA_READ + PUBLIC_ADMIN_DATA_PROVIDER=supabase required for Event A row read.
```

| Layer | Issue |
|-------|-------|
| G-13d1b | `resolveG13c1EventAPocCleanupTargetRow()` runs on **client** |
| `getReadOnlyDataConfig()` | Needs `ENABLE_ADMIN_STAGING_DATA_READ` via `mergeStagingShellEnv()` |
| Gosaki layout | No `#staging-shell-server-gates` → non-PUBLIC env undefined in browser |
| SSR row picker | Worked on server; client direct read did not |

---

## 2. Fix

**File:** `tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingShellLayout.astro`

Server reads `import.meta.env` at SSR and injects:

```html
<script id="staging-shell-server-gates" type="application/json">…</script>
```

Snapshot fields (`staging-shell-server-gates.ts`):

- `stagingShellEnabled` ← `ENABLE_ADMIN_STAGING_SHELL`
- `stagingAuthFlag` ← `ENABLE_ADMIN_STAGING_AUTH`
- `stagingDataReadFlag` ← `ENABLE_ADMIN_STAGING_DATA_READ`
- `stagingWriteFlag` ← `ENABLE_ADMIN_STAGING_WRITE`

Client `mergeStagingShellEnv()` merges these into gate checks for read/write/auth config.

---

## 3. G-13c1 effect

With execution env (`ENABLE_ADMIN_STAGING_DATA_READ=true`, `PUBLIC_ADMIN_DATA_PROVIDER=supabase`, Supabase URL/anon):

| Step | Before G-13d1c | After G-13d1c |
|------|----------------|---------------|
| Preview click | `supabaseDataEnabled=false` | `supabaseDataEnabled=true` (when gates pass) |
| `loadScheduleRowForSiteSlugRead` | Not reached | Event A direct SELECT (read-only) |
| Save gate | `mergeStagingShellEnv` write flags false on client | `ENABLE_ADMIN_STAGING_WRITE` visible when armed |

Save still requires existing G-13c1 arm + compile gate + approval — **unchanged**.

---

## 4. Scope

| Item | In scope |
|------|----------|
| Event A G-13c1 Preview / Save gate client diagnostics | **yes** (via shared layout) |
| Event B | **not modified** |
| `/admin` Sariswing production | **not touched** |
| New PUBLIC env vars | **none** |

---

## 5. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiStagingShellServerGateInjectionComplete` | **true** |
| `readyForG13d1EventAPocCleanupExecutionRetry` | **true** |
| `cursorSaveExecuted` | **false** |
| `cursorPreviewButtonClicked` | **false** |
| `eventBTouched` | **false** |

---

## 6. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13d1c-gosaki-staging-shell-server-gate-injection.mjs
```

---

## 7. Next

`G-13d1-event-a-poc-cleanup-execution-retry` — operator execution env → G-13c1 Preview → Save once (separate approval).

---

## 8. References

- [staging-env-gate-client-fix.md](./staging-env-gate-client-fix.md) (G-6-d)
- [gosaki-schedule-event-a-poc-cleanup-selectable-row-investigation.md](./gosaki-schedule-event-a-poc-cleanup-selectable-row-investigation.md) (G-13d1b2)
