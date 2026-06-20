# Gosaki Supabase project identity safety preflight (G-9j4.5)

**Phase:** `G-9j4.5-gosaki-supabase-project-identity-safety-preflight`  
**Status:** **complete** (read-only safety preflight — no Save, no DB write, no SQL execution)  
**Date:** 2026-06-20  
**Prior:** G-9j4 one-row preflight — commit `41e6739`  
**Type:** Supabase project identity verification + staging allowlist guard only

| Check | Status |
| --- | --- |
| DB write executed (this phase) | **no** |
| SQL mutation executed (this phase) | **no** |
| Rollback SQL executed | **no** |
| Save enabled | **no** |
| non-dry-run arm ON | **no** |
| `service_role` used | **no** |
| SQL Editor manual UPDATE | **no** |
| FTP / workflow_dispatch / deploy | **not executed** |

Prior docs:

- [gosaki-schedule-existing-event-update-one-row-preflight.md](./gosaki-schedule-existing-event-update-one-row-preflight.md) (G-9j4)

---

## Gates

```txt
gosakiSupabaseProjectIdentitySafetyPreflightComplete: true
readyForG9j5OneRowNonDryRunExecution: false
phase: G-9j4.5
readyForAnyDbWrite: false
dbWriteExecuted: false
saveEnabled: false
targetSupabaseProjectName: static-to-astro-cms-staging
targetProjectRef: kmjqppxjdnwwrtaeqjta
blockedProjects:
  - sari-site
  - liberta-site-platform
serviceRoleUsed: false
manualSqlUpdateAllowed: false
sqlEditorUpdateAllowed: false
allowedOperation: one-row UPDATE only in G-9j5
```

**Recommended next:** `G-9j5-gosaki-schedule-existing-event-update-one-row-non-dry-run-execution` (requires explicit operator approval + live reconfirmation)

---

## 1. Purpose

Before G-9j5 non-dry-run Save, confirm that all Gosaki schedule write paths target **only** the staging Supabase project `static-to-astro-cms-staging` — never Sariswing production `sari-site` or other org projects such as `liberta-site-platform`.

---

## 2. Active Supabase connection (read-only — G-9j4.5)

Verified from repo-root `.env` / `.env.local` merge on **2026-06-20** (keys not displayed):

```txt
SUPABASE_URL host: https://kmjqppxjdnwwrtaeqjta.supabase.co
project ref: kmjqppxjdnwwrtaeqjta
expected project name: static-to-astro-cms-staging
```

### How to confirm staging (operator)

1. Open repo-root `.env.local` (or dev shell env) — read **host only**, never paste keys into chat.
2. Extract project ref from `PUBLIC_SUPABASE_URL` host: `https://<ref>.supabase.co`.
3. Confirm ref equals `kmjqppxjdnwwrtaeqjta`.
4. In Supabase Dashboard, confirm project **name** is `static-to-astro-cms-staging`.
5. Run host gate + allowlist in dev UI (G-9j2 dry-run) — must pass before G-9j5.

### How to confirm NOT sari-site (operator)

| Check | Staging (OK) | sari-site (STOP) |
| --- | --- | --- |
| Project ref | `kmjqppxjdnwwrtaeqjta` | `vsbvndwuajjhnzpohghh` |
| Host | `kmjqppxjdnwwrtaeqjta.supabase.co` | `vsbvndwuajjhnzpohghh.supabase.co` |
| Project name | `static-to-astro-cms-staging` | `sari-site` |
| `supabase/.temp/linked-project.json` (local CLI) | may differ — **do not rely on link alone** | shows `sari-site` if linked to production |

**STOP immediately** if active host is `vsbvndwuajjhnzpohghh.supabase.co`.

### How to confirm NOT liberta-site-platform

- Allowlist permits **only** ref `kmjqppxjdnwwrtaeqjta`.
- Any other ref (including unknown / third org projects) fails `assertStaticToAstroCmsStagingSupabaseProject()`.
- Dashboard project name must not be `liberta-site-platform` when arming G-9j5.

---

## 3. Code guards (G-9j4.5)

| Guard | Location | Behavior |
| --- | --- | --- |
| Host gate | `evaluateSupabaseHostGate()` | Active host must equal `kmjqppxjdnwwrtaeqjta.supabase.co` |
| Staging allowlist | `assertStaticToAstroCmsStagingSupabaseProject()` | Project ref must equal `kmjqppxjdnwwrtaeqjta` only |
| G-9j config arm | `getG9jExistingEventUpdateConfig()` | Arm failures if host gate or allowlist fail |
| G-9j dry-run | `executeG9jExistingEventUpdateDryRun({ supabaseUrl })` | Throws into guardErrors if allowlist fails |
| G-9j operator UI | `gosaki-staging-schedule-operator-ui.ts` | Passes `PUBLIC_SUPABASE_URL` into dry-run |

Blocked refs (non-exhaustive — anything except staging ref is blocked):

```txt
vsbvndwuajjhnzpohghh  # sari-site (Sariswing production)
<any ref != kmjqppxjdnwwrtaeqjta>  # includes liberta-site-platform and unknown projects
```

---

## 4. service_role non-use (G-9j5 path)

Grep scope (2026-06-20):

```txt
src/lib/admin/staging-write/
src/lib/admin/staging-data/
tools/static-to-astro/templates/admin-cms/gosaki/
```

| Pattern | G-9j path hits |
| --- | --- |
| `service_role` | **none** (only unrelated PoC comment files outside G-9j modules) |
| `SERVICE_ROLE` | **none** |
| `supabaseServiceRole` | **none** |

G-9j dry-run safety object: `serviceRoleUsed: false` (hardcoded).

Writes use staging admin session + **anon key** only.

---

## 5. G-9j5 planned UPDATE safety (reconfirmed)

```txt
table: public.schedules
operation: UPDATE only
targetRows: 1
id: f687ebf3-407c-49d0-9ab8-58040c499b8e
site_slug: gosaki-piano
expectedBeforeUpdatedAt: 2026-06-16T16:03:41.551792+00:00
targetField: description
changedFields: ["description"]
payload keys: ["description"]
```

**Not in payload / changedFields:**

```txt
date, year, month, source_route, published, site_slug, legacy_id, updated_at, schedule_months
```

**UPDATE filter policy (G-9j5):** `id` + `site_slug` + optimistic lock (`expectedBeforeUpdatedAt`) — no broad WHERE.

---

## 6. Live row reconfirmation (read-only REST — G-9j4.5)

Fetched from staging project via anon key (SELECT only). **No mutation.**

| Field | Live value (2026-06-20) | G-9j4 preflight |
| --- | --- | --- |
| **id** | `f687ebf3-407c-49d0-9ab8-58040c499b8e` | match |
| **site_slug** | `gosaki-piano` | match |
| **title** | `<Duo>` | match |
| **date** | `2026-03-15` | match |
| **venue** | `川崎 ぴあにしも` | match |
| **description** | `出演：長谷川薫vo 後藤沙紀pf\n会場website: http://pubhpp.com/` | match |
| **updated_at** | `2026-06-16T16:03:41.551792+00:00` | match |

**expectedBeforeUpdatedAt match:** **yes** — live `updated_at` equals G-9j4 documented baseline.

Operator must re-run live SELECT immediately before G-9j5 Save.

---

## 7. Env / arm state (must remain until G-9j5 approval)

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED=false (OFF)
saveEnabled: false
readyForAnyDbWrite: false
```

---

## 8. G-9j5 still blocked until

1. Explicit operator approval (G-9j4 doc text)
2. Live row `updated_at` reconfirmed
3. Staging project ref + host reconfirmed
4. G-9j5 implementation phase (non-dry-run executor + Save enablement) — **not in G-9j4.5**

**Do not:**

- Arm non-dry-run env
- Run SQL Editor UPDATE
- Click Save (not enabled)

---

## 9. Completion statement

- G-9j4.5 safety preflight **complete**
- Staging allowlist guard added to G-9j execution path
- Live row matches G-9j4 baseline
- **No** DB write, SQL execution, Save, migration, or env arm in this phase
- **Next:** G-9j5 — blocked until explicit operator approval
