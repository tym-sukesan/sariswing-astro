# Discography site-owner authz — Slice B planning (existing-release UPDATE)

- **Phase:** `discography-site-owner-authz-slice-b-planning`
- **Date:** 2026-08-16
- **Status:** **COMPLETE (read-only planning · no implementation)**
- **HEAD:** `ee302fd2c949fb2c339febefea3a26a4f6e6faf5`
- **Prior:** `discography-site-owner-authz-slice-a-live-can-write-site-probe-result` (Slice A **CLOSED / COMPLETE / PASS**)
- **This phase:** plan site-owner **existing release UPDATE** authz · **no** TS/SQL implementation · **no** migration apply · **no** GRANT/REVOKE · **no** Secret · **no** Edge deploy · **no** real Save · **no** production · **no** commit/push by Cursor

**Forbidden:** owner → `admin_users` · `service_role` · production `vsbvndwuajjhnzpohghh` · copy Schedule INSERT-only RLS · mix in `discography-musician-basic-live-read-wiring-fix`.

Staging only: `kmjqppxjdnwwrtaeqjta`.

---

## 0. Gates

```txt
phase: discography-site-owner-authz-slice-b-planning
DISCOGRAPHY_SITE_OWNER_AUTHZ_SLICE_B_PLANNING_COMPLETE: true
SLICE_A_CLOSED: true
CURRENT_UPDATE_AUTHZ_PATH: edge_can_write_site_then_definer_rpc
DIRECT_TABLE_WRITE_REQUIRED: false
RPC_CHANGE_REQUIRED: false
RLS_CHANGE_REQUIRED: false
GRANT_CHANGE_REQUIRED: false
REAL_SAVE_REQUIRED_FOR_PROOF: true
READY_FOR_SLICE_B_IMPLEMENTATION: false
UI_READ_WIRING_IN_SCOPE: false
OWNER_TO_ADMIN_USERS_FORBIDDEN: true
OWNER_ADDED_TO_ADMIN_USERS: false
DB_WRITE_EXECUTED: false
MIGRATION_EXECUTED: false
CODE_IMPLEMENTATION_EXECUTED: false
ARMS_OFF: true
PRODUCTION_UNCHANGED: true
COMMIT_READY: true
STOP_REASONS: none
RECOMMENDED_NEXT_PHASE: discography-site-owner-authz-slice-b-operational-save-preflight
DEFERRED_FINDING: discography-musician-basic-live-read-wiring-fix
DEFERRED_POSTGREST_OWNER_UPDATE: discography-site-owner-authz-postgrest-update-rls-deferred
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```

`READY_FOR_SLICE_B_IMPLEMENTATION: false` means **no new Edge/RPC/RLS/GRANT code** is required to authorize owner operational UPDATE. Next is a **Save preflight packet**, not an implementation slice.

Original 2026-08-12 planning named Slice B as site-writer **UPDATE RLS + GRANT**. This doc **supersedes that for Slice B**. Those table policies remain a later optional widening (`DEFERRED_POSTGREST_OWNER_UPDATE`), not required to close owner existing-release UPDATE via the operational RPC.

---

## 1. CURRENT_UPDATE_AUTHZ_PATH

Two write families exist. Slice B authorizes **(A)** only.

### A. Operational Save (album scalars + track replace · atomic) — Slice B target

```txt
musician-basic / package Discography UI
  → POST gosaki-discography-save-dry-run  operation=save
  → Edge arm / approval / payload gates
  → createUserJwtSupabaseClient (caller JWT, anon key bootstrap)
  → assertCanWriteSiteForSiteSlug (sites singleton + rpc can_write_site)
  → PostgREST SELECT discography + discography_tracks  (writer SELECT RLS · Slice A)
  → frozen-field / allowlist / optimistic lock / no_change
  → rpc('gosaki_discography_operational_save', …)
  → SECURITY DEFINER:
       can_write_site again
       SELECT … FOR UPDATE (site_slug + legacy_id)
       UPDATE discography (editable columns + updated_at)
       optional DELETE+INSERT discography_tracks (same TX, site_slug bound)
```

Evidence: `handler.ts` `handleOperationalDiscographySaveHttp` · RPC template applied on staging (`CURRENT_RPC_FP: f4d50563…`).

### B. Direct PostgREST UPDATE (out of Slice B)

| Path | Write |
| --- | --- |
| Client scalar slices (`updateDiscographyWrite`) | `from("discography").update(payload)` |
| Edge controlled label (G-20u43) | `from("discography").update({ label })` after `can_write_site` |
| Edge controlled track title | `from("discography_tracks").update({ title })` after `can_write_site` |

These need **table UPDATE GRANT + UPDATE RLS**. Authenticated table UPDATE grants are **0**. RLS write is `*_admin_all` (`is_admin`). Owner **cannot** use them today. Slice B must **not** open them.

---

## 2. CURRENT_UPDATE_RLS

Staging catalog after Slice A (`POLICY_COUNT: 6` · `CURRENT_POLICY_FP: fa62157c08cffc8b49c38256ad8dfe26`):

| Policy | Table | Cmd | Who |
| --- | --- | --- | --- |
| `discography_public_select` | `discography` | SELECT | published / anon+auth |
| `discography_tracks_public_select` | `discography_tracks` | SELECT | published / anon+auth |
| `discography_site_writer_select` | `discography` | SELECT | `can_write_site` via `sites.site_slug` |
| `discography_tracks_site_writer_select` | `discography_tracks` | SELECT | same |
| `discography_admin_all` | `discography` | ALL | legacy `is_admin()` |
| `discography_tracks_admin_all` | `discography_tracks` | ALL | legacy `is_admin()` |

No site-writer UPDATE/INSERT/DELETE policies. Public selects unchanged. `*_admin_all` **retained** (platform/legacy admin PostgREST compatibility — **not** an owner substitute).

DEFINER RPC DML **does not consult** these policies (table owner rights). RLS still applies to Edge **pre-RPC SELECT** (Slice A writer SELECT is why owner live probe reached `release_read_failed` instead of `admin_required`).

---

## 3. CURRENT_GRANTS

From Slice A apply (`CURRENT_GRANTS_FP: 88986aa562aad21b7defa89648288083` · G-20u36a REVOKE retained):

| Privilege | authenticated | anon |
| --- | --- | --- |
| table SELECT `discography` / `discography_tracks` | yes | yes (published via RLS) |
| table UPDATE / INSERT / DELETE | **0** | **0** |
| `gosaki_discography_operational_save` EXECUTE | **yes** | **denied** |

No Slice B GRANT is required for path A. Adding table UPDATE GRANT would re-open PostgREST writes under `*_admin_all` for `is_admin` and, if UPDATE RLS were added, for owners — **out of minimal Slice B**.

---

## 4. SECURITY_DEFINER_IMPACT

`gosaki_discography_operational_save` is `SECURITY DEFINER` + `search_path = pg_catalog, public`.

| Consequence | Slice B implication |
| --- | --- |
| Caller table UPDATE/INSERT/DELETE GRANT unused | `GRANT_CHANGE_REQUIRED: false` |
| Caller UPDATE RLS unused for RPC DML | `RLS_CHANGE_REQUIRED: false` |
| Authz **must** live inside the function | already `can_write_site` after exact `sites` resolve (Slice A) |
| Track DELETE+INSERT stays one TX | do **not** split to client PostgREST |
| Edge still needs SELECT | writer SELECT already applied |

Owner JWT already passed the **internal** RPC gate (staging apply probe: `legacy_id_mismatch` **400** before row lock). Live Edge probe passed **Edge** `can_write_site` then stopped on absent `discography-999` **before** RPC (`RPC_REACHED: false`).

---

## 5. SITE_OWNER_UPDATE_BLOCKER

For **operational** existing-release UPDATE, SQL authz is **not** the remaining blocker.

| Layer | Owner (`can_write_site=true` · `is_admin=false`) |
| --- | --- |
| Edge `assertCanWriteSiteForSiteSlug` | **PASS** (Slice A live probe) |
| Writer SELECT existing row | **PASS** for real ids `001`–`004` (999 absent by design) |
| RPC `can_write_site` | **PASS** (non-mutating RPC probe) |
| RPC row UPDATE | **unproven** (`DATA_WRITE: false`) |
| Table PostgREST UPDATE | **blocked** (no GRANT · admin_all only) — **not Slice B** |
| UI live-read / Edit button | **blocked** by wiring finding — **not Slice B** |

`SITE_OWNER_UPDATE_BLOCKER` = unproven **operational DATA_WRITE** (needs separate Save preflight + explicit approval + Secret/arms), **not** missing UPDATE RLS.

---

## 6. can_write_site enforcement (keep; do not add a third copy)

| Location | Status |
| --- | --- |
| Edge before mutate | **required · already** |
| RPC body (DEFINER) | **required · already** |
| RLS writer SELECT | **required · already** (pre-RPC read) |
| RLS UPDATE | **not required** for path A |
| Client UX | optional later; UI wiring is a different slice |

Platform admin: `can_write_site` already ORs `is_platform_admin()`. Keep `*_admin_all`. Do **not** add owners to `admin_users`.

---

## 7. Atomicity

Operational Save must remain **one RPC TX**:

1. `SELECT … FOR UPDATE` on `discography` (`site_slug` + `legacy_id`)
2. `UPDATE discography` editable columns + `updated_at`
3. If tracks changed: `DELETE` then `INSERT` `discography_tracks` with `site_slug` on every row

Do not introduce a client two-round-trip album UPDATE + track replace. Slice C track INSERT/DELETE RLS is only if retiring DEFINER replace — **not Slice B**.

---

## 8. MINIMAL_SLICE_B_SCOPE

**In:**

- Treat operational DEFINER RPC as the **only** owner existing-release UPDATE path
- Confirm no RPC/RLS/GRANT change required after Slice A
- Next phase: owner operational Save **preflight** on a **real** `discography-00N` (not `999`)
- Keep album+tracks atomicity, arms, approval IDs, optimistic lock, Secret unset discipline
- Keep UI live-read wiring **out of scope**

**Out:**

- `discography_site_writer_update` / `discography_tracks_site_writer_update`
- table or column UPDATE/INSERT/DELETE GRANT
- RPC body rewrite
- Edge handler rewrite
- Slice C track INSERT/DELETE RLS
- Album CREATE/DELETE
- Controlled PostgREST `.update()` owner enablement
- musician-basic live-read deps fix
- real Save in this planning phase

---

## 9. ROLLBACK_PLAN

Slice B planning adds **no** DB objects. If a later Save execution writes data:

```txt
1. stop immediately · do not retry · do not ad-hoc cleanup
2. restore the one targeted release + tracks from beforeSnapshot (staging SQL Editor · SELECT-only first)
3. do not DROP Slice A writer SELECT or redefine RPC back to is_admin unless a separate incident requires it
4. do not REVOKE/GRANT table writes (none added)
5. Secret unset if it was ON
6. record incident · ask human
```

Never rollback by adding the owner to `admin_users`. Never touch production.

Historical Slice A RPC rollback template remains: `gosaki-discography-operational-save-rpc-is-admin-rollback.template.sql` (not part of Slice B).

---

## 10. STAGING_VERIFICATION_PLAN (later phases · not now)

1. SELECT-only: policies still **6** · grants fp `88986aa5…` · RPC fp `f4d50563…` · albums **4** / tracks **34** / `discography-999=0`
2. Confirm `authenticated` table UPDATE/INSERT/DELETE still **0**
3. Owner fixture: `can_write_site=true` · `is_admin=false` · staging host only
4. Dry-run / arm-OFF Save → `save_not_armed` · no RPC write
5. **Separate approval:** Secret ON → **one** operational Save on **one** existing `gosaki-piano` release → Secret unset
6. After: `updated_at` advanced · `changed_fields` allowlisted · track count stable unless tracks were the intended change · public 4/34 identity retained
7. Non-member JWT: Save denied
8. Wrong `site_slug`: denied
9. Platform admin path still via `can_write_site` (no `admin_users` add)

`REAL_SAVE_REQUIRED_FOR_PROOF: true` for **persisted UPDATE**. Gate-level owner authz is already proven (Slice A).

---

## 11. RISKS

| Risk | Mitigation |
| --- | --- |
| Adding UPDATE RLS+GRANT “because Schedule did” | Rejected — DEFINER path does not need it; GRANT reopens PostgREST |
| Track DELETE power | Keep inside RPC TX only |
| Real Save mutates 4/34 baseline | One-shot · beforeSnapshot · rollback SQL · no retry |
| UI Edit disabled → operator uses wrong path | Console/Edge operational packet; do not click broken UI Save |
| Controlled Edge `.update()` looks “aligned” after `can_write_site` | Still fails owner PostgREST; do not treat as Slice B |
| Re-using `discography-999` | Forbidden for Save proof (absent by design) |
| Secret left ON | Unset immediately; arm-OFF `save_not_armed` |

---

## 12. BLOCKERS

| ID | Blocker | For |
| --- | --- | --- |
| B1 | Explicit operator approval for Secret + one DATA_WRITE | Save execution |
| B2 | Choose exact existing `legacy_id` + `expectedBeforeUpdatedAt` | Preflight |
| B3 | UI live-read wiring | Edit UI only — **not** Slice B |
| B4 | Linked CLI project is production — `--project-ref kmjqppxjdnwwrtaeqjta` required | Secrets later |

**Non-blockers for this planning:** Edge/RPC `can_write_site` · writer SELECT · EXECUTE grant · DEFINER atomicity · production untouched.

---

## 13. Why not copy Schedule INSERT-only

| Schedule CREATE | Discography operational UPDATE |
| --- | --- |
| Table INSERT + site-writer INSERT RLS | DEFINER RPC UPDATE + track replace |
| Caller needs INSERT GRANT | Caller needs EXECUTE only |
| No DELETE | Tracks DELETE inside RPC |
| Single table | Parent + child one TX |

Closest references: Slice A RPC/Edge (already applied/deployed), not `cms-core-v2-schedules-site-writer-rls.template.sql` INSERT policies.

---

## 14. Explicit non-actions (this phase)

- No CREATE/DROP POLICY · no GRANT/REVOKE · no RPC redefine
- No Edge deploy · no Secret · no owner POST · no UI Save
- No live-read wiring fix
- No commit/push unless operator separately requests

---

## 15. Next

**`discography-site-owner-authz-slice-b-operational-save-preflight`**

Lock one existing staging album, beforeSnapshot, rollback SQL, Secret ON/OFF commands (`unset`), one operational Save packet. **Do not** implement UPDATE RLS templates.

Deferred:

- `discography-musician-basic-live-read-wiring-fix`
- `discography-site-owner-authz-postgrest-update-rls-deferred` (only if product requires owner PostgREST scalar/track `.update()`)
