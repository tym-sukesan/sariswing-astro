# Staging shell schedule site_slug time + price non-dry-run PoC planning (G-9g3c)

**Phase:** `G-9g3c-staging-shell-schedule-site-slug-time-price-non-dry-run-poc-planning`  
**Date:** 2026-06-17  
**Prior:** G-9g3b execution complete — commit `125d5d5`  
**Type:** planning only — **no implementation, no Save, no DB write, no Supabase SQL execution**

---

## 1. Background

G-9g3b proved the Gosaki `site_slug=gosaki-piano` staging-shell path for a multi-field non-dry-run slice with host hard gate, optimistic lock, and `changedFields` whitelist. G-9g3c is the next slice: **`open_time` + `start_time` + `price` only** on the same pilot row.

Parent planning: [staging-shell-schedule-site-slug-safe-fields-edit-planning.md](./staging-shell-schedule-site-slug-safe-fields-edit-planning.md)  
G-9g3b execution: [staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md](./staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-execution-result.md)

**This phase performed:** slice definition, payload/approval/env proposals, Save constraints, implementation outline, gates.  
**This phase did not:** implementation, Save click, UPDATE / INSERT / DELETE, Supabase SQL execution, FTP, workflow_dispatch, `/admin` changes.

---

## 2. Target fields

```txt
open_time
start_time
price
```

All three are nullable text on `public.schedules`. Bundle in **one Save** (G-6-g2 time-pair precedent + nullable `price`).

**Alternative (defer only if guards get messy):** split `price` to `G-9g3c2` — not recommended unless preview/Save gating fails in implementation.

---

## 3. Target row

```txt
id:         aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id:  schedule-2026-07-010
site_slug:  gosaki-piano
route:      /__admin-staging-shell/musician-basic/#schedule
section:    AdminStagingScheduleSiteSlugEditSection
```

---

## 4. Lock baseline

Post G-9g3b execution (planning baseline — **re-verify live before preflight / Save**):

```txt
updated_at: 2026-06-17T14:36:04.711395+00:00
```

Operator must record exact live `updated_at` in preflight via SELECT only on `static-to-astro-cms-staging`.

---

## 5. Expected beforeSnapshot (post G-9g3b)

Planning expectation for G-9g3c preflight / preview:

| Field | Expected |
| --- | --- |
| `id` | `aa440e29-5be8-402e-9190-0d81c48434c0` |
| `legacy_id` | `schedule-2026-07-010` |
| `site_slug` | `gosaki-piano` |
| `title` | `[CMS Kit staging] G-9g2 title PoC` |
| `venue` | `[CMS Kit staging] G-9g3b venue PoC` |
| `description` | `出演： [G-9g3b venue+description PoC]` |
| `open_time` | `NULL` |
| `start_time` | `NULL` |
| `price` | `NULL` |
| `updated_at` | `2026-06-17T14:36:04.711395+00:00` (verify live) |

**Must remain unchanged in G-9g3c Save:** `title`, `venue`, `description`.

---

## 6. Payload (PoC proposal)

```txt
open_time:  [CMS Kit staging] G-9g3c open PoC
start_time: [CMS Kit staging] G-9g3c start PoC
price:      [CMS Kit staging] G-9g3c price PoC
```

`changedFields` must be `open_time`, `start_time`, `price` only (order-independent).

---

## 7. Approval ID

```txt
G-9g3c-schedule-site-slug-time-price-non-dry-run-poc
```

Register in `SCHEDULE_WRITE_APPROVAL_IDS` during implementation. **Not** G-9g2 / G-9g3b / G-6 IDs.

---

## 8. Env arm

```txt
PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED=true
```

Plus standard staging write stack (inline env in execution — do not commit `.env` / `.env.local`):

| Env | Value |
| --- | --- |
| `ENABLE_ADMIN_STAGING_SHELL` | `true` |
| `ENABLE_ADMIN_STAGING_AUTH` | `true` |
| `ENABLE_ADMIN_STAGING_DATA_READ` | `true` |
| `ENABLE_ADMIN_STAGING_WRITE` | `true` |
| `PUBLIC_ADMIN_AUTH_PROVIDER` | `supabase` |
| `PUBLIC_ADMIN_DATA_PROVIDER` | `supabase` |
| `PUBLIC_ADMIN_WRITE_PROVIDER` | `supabase` |
| `PUBLIC_ADMIN_WRITE_MODULE` | `schedule` |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `G-9g3c-schedule-site-slug-time-price-non-dry-run-poc` |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | `false` |
| `PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK` | `true` |
| `PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED` | `true` |
| `PUBLIC_SUPABASE_URL` | staging URL — host `kmjqppxjdnwwrtaeqjta.supabase.co` |

**Routine dev default:** arm off, `ENABLE_ADMIN_STAGING_WRITE=false`, `PUBLIC_ADMIN_WRITE_DRY_RUN=true`.

---

## 9. Single-arm policy

Only one site_slug non-dry-run slice armed at a time. When G-9g3c armed, these must be **off**:

```txt
PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED
PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED
PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED
PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED
service_role key
production Supabase URL / keys
```

**Do not re-run G-9g2 or G-9g3b Save.**

---

## 10. Save constraints

### Payload whitelist

```txt
.update({ open_time, start_time, price })
```

- **Allowed keys only:** `open_time`, `start_time`, `price`
- **Forbidden in payload:** `title`, `venue`, `description`, `date`, `published`, `show_on_home`, `sort_order`, `updated_at`, etc.
- **Guard (planned):** `assertG9G3cTimePricePayloadOnly(payload)`

### UPDATE scope (adapter)

```txt
.update({ open_time, start_time, price })
.eq("id", "aa440e29-5be8-402e-9190-0d81c48434c0")
.eq("site_slug", "gosaki-piano")
.eq("legacy_id", "schedule-2026-07-010")
.eq("updated_at", expectedBeforeUpdatedAt)
```

`updated_at` is **not** in payload — `schedules_set_updated_at` trigger (G-6-f8) advances it after UPDATE.

### Save UI gating (mirror G-9g3b)

Save enabled only when **all** hold:

- Host gate passed (`activeHost === kmjqppxjdnwwrtaeqjta.supabase.co`)
- G-9g3c env arm + write gates satisfied
- Dry-run preview succeeded in same session
- `optimisticLock.stale === false`
- `changedFields === ["open_time", "start_time", "price"]` (order-independent)
- Time + price inputs match previewed values
- `title`, `venue`, `description` unchanged from loaded row
- Target `id` / `legacy_id` / `site_slug` match
- Staging admin signed in (execution phase)
- **Cursor / AI / Playwright must not click Save**

### Host hard gate

| Check | Pass criteria |
| --- | --- |
| `activeHost` | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| `hostGatePassed` | `true` |
| Sariswing production | **STOP** if `vsbvndwuajjhnzpohghh.supabase.co` |

---

## 11. Operator approval text (execution phase template)

Required **before** one manual Save in execution phase. **Not required for this planning phase.**

```txt
承認します。G-9g3c time+price non-dry-run PoC として、static-to-astro-cms-staging の public.schedules で、id=aa440e29-5be8-402e-9190-0d81c48434c0 / legacy_id=schedule-2026-07-010 / site_slug=gosaki-piano の1行について、open_time・start_time・price のみを PoC 値に更新します。active host が kmjqppxjdnwwrtaeqjta.supabase.co であること、dry-run preview と optimistic lock と host gate が成功している場合のみ1回だけ実行し、title・venue・description その他フィールド・他site・本番には触りません。
```

---

## 12. Implementation outline (G-9g3c-implementation — not this phase)

Mirror G-9g3b pattern; reuse G-9g3a multi-field dry-run preview (no new preview builder).

| File | Role |
| --- | --- |
| `staging-schedule-site-slug-config.ts` | G-9g3c constants, env name, PoC defaults |
| `staging-schedule-site-slug-time-price-poc-config.ts` | Env arm + host gate |
| `staging-schedule-site-slug-time-price-poc-save.ts` | `executeG9G3cTimePriceNonDryRunSave` |
| `schedule-write-guards.ts` | `assertG9G3cTimePricePayloadOnly` |
| `schedule-write-types.ts` | G-9g3c approval ID |
| `staging-schedule-site-slug-edit-binding.ts` | G-9g3c binding |
| `staging-schedule-site-slug-edit-ui.ts` | G-9g3c Save gating + `canEnableG9G3cSave` |
| `AdminStagingScheduleSiteSlugEditSection.astro` | Gated Save button (default disabled) |
| `verify-url-to-staging-pipeline.mjs` | G-9g3c assertions |

**Write path:** `executeG9G3cTimePriceNonDryRunSave` → `buildScheduleLockedWriteRequest` → `updateScheduleWrite` + `writeScope`.

**Frozen:** G-9g2 title Save path, G-9g3b venue+description Save path, G-6 PoCs.

---

## 13. Phase sequence after planning

```txt
G-9g3c-planning          ← this phase (complete)
G-9g3c-implementation    ← gated Save UI + adapter; no Save execution
G-9g3c-preflight         ← beforeSnapshot, rollback template, env stack
G-9g3c-execution         ← operator manual Save once only
```

---

## 14. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Production host via root `.env` | Host hard gate (G-9g3a); STOP on `vsbvndwuajjhnzpohghh` |
| Cross-site UPDATE | `writeScope.site_slug` + `legacy_id` + guards |
| Over-bundled payload | `assertG9G3cTimePricePayloadOnly`; UI `changedFields` whitelist |
| G-9g2 / G-9g3b markers overwritten | Payload guard rejects `title` / `venue` / `description` |
| Stale row | Optimistic lock + preview stale banner |
| G-9g3b / G-9g2 re-Save | Single-arm policy; do not re-arm prior slices |
| Dry-run `after` shows `""` for null fields | Display normalization only (G-9g3b lesson); `changedFields` is source of truth |
| Price + time bundle too wide | Split to G-9g3c2 only if implementation gating fails |

---

## 15. Verification (planning phase)

Docs-only. No new verifier required for planning.

Post-implementation (future):

```bash
cd tools/static-to-astro
node scripts/verify-url-to-staging-pipeline.mjs
```

---

## 16. Gates

```txt
stagingShellScheduleTimePricePocPlanningComplete: true
stagingShellScheduleTimePricePocImplementationComplete: false
stagingShellScheduleTimePricePocNotExecuted: true
readyForG9g3cImplementation: true
readyForG9g3cExecution: false
readyForG9g3bExecution: false
readyForAnyDbWrite: false
rollbackNeeded: false
```

---

## 17. Next

**G-9g3c-implementation** — gated Save UI + `executeG9G3cTimePriceNonDryRunSave` + guards. No Save / DB write in implementation phase.
