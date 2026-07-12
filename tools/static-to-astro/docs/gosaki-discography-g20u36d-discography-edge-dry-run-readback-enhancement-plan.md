# G-20u36d — Gosaki Discography Edge dry-run readBack enhancement plan

**Phase:** `G-20u36d-discography-edge-dry-run-readback-enhancement-planning`  
**Status:** **planning only** — no Edge edit · no deploy · no SQL · no Save  
**Date:** 2026-07-12  
**Doc HEAD:** `f31165f`  
**Prior:** G-20u36c admin dry-run fetch POST + STG browser QA PASS (`c2fcdb8` package on STG)

| Check | Status |
| --- | --- |
| Planning doc | **this phase** |
| Edge Function edit | **not in this phase** |
| Edge deploy | **not in this phase** |
| SQL execution | **not in this phase** |
| DB write | **not in this phase** |
| Save enablement | **not in this phase** |
| Admin UI change | **not in this phase** |
| FTP upload | **not in this phase** |

---

## Gates

```txt
gosakiDiscographyEdgeDryRunReadBackEnhancementPlanPrepared: true
phase: G-20u36d-discography-edge-dry-run-readback-enhancement-planning
planningOnly: true
edgeFunctionEdited: false
edgeDeployExecuted: false
cursorSqlExecuted: false
cursorDbWriteExecuted: false
saveEnabled: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleImplementationInPlan: false
proceedToReadBackImplementation: true
proceedToSave: false
```

---

## 1. Problem statement

G-20u36c completed the full path: Edge dry-run endpoint (deployed + live verify) → admin fetch POST → clientDryRun contract fix → STG browser QA **PASS**.

### STG browser QA (operator-confirmed)

| Field | Value |
| --- | --- |
| `httpStatus` | **200** |
| `ok` | **true** |
| `operation` | **dryRun** |
| `authIssue` | **false** (unauthenticated) |
| `wouldWrite` | **true** |
| `tracksAdded` | **9** |
| Write flags | **all false** |

### Why readBack is needed

Current handler `resolveCurrentSnapshot()` returns `{}` — **schema-only baseline** (`SUPABASE_SERVICE_ROLE_CONNECTED=false` in deployed handler).

```typescript
// supabase/functions/gosaki-discography-save-dry-run/handler.ts (current)
export function resolveCurrentSnapshot(_legacyId: string): CurrentSnapshot {
  return {};
}
```

Effect:

- `hasCurrentBaseline` is false unless empty-object edge cases apply
- `wouldWrite` / `tracksAdded` reflect **payload vs empty snapshot**, not **payload vs DB reality**
- STG QA `wouldWrite=true` / `tracksAdded=9` is **safe** (write flags false) but **inaccurate** as a DB diff signal
- First controlled Save must not proceed until dry-run diff is DB-grounded

---

## 2. readBack purpose

| Goal | Detail |
| --- | --- |
| **SELECT-only** | Read current release + tracks from staging DB inside Edge dry-run handler |
| **Scope** | `site_slug = gosaki-piano` + `legacy_id = request.legacyId` |
| **Compare** | Request `release` + `tracksText` vs DB snapshot |
| **Output** | Accurate `wouldWrite`, `changedCounts`, `diffSummary` |
| **Write flags** | `didWrite` / `dbWrite` / `networkWrite` / `saveEnabled` remain **false** |
| **operation=save** | Still **rejected** on this endpoint |

---

## 3. Recommended approach — anon SELECT first

### Prefer anon SELECT (not service_role)

| Reason | Detail |
| --- | --- |
| Grants | G-20u36a remediation verified **anon SELECT** on `public.discography` + `public.discography_tracks` |
| RLS | RLS enabled; public read policies exist for published discography data |
| Data scope | readBack needs **published discography read** only — same class as public site + admin build-time read |
| Safety | Avoids `service_role` in Edge runtime for readBack |
| Baseline | Staging: **4 releases / 34 tracks** · target row e.g. `discography-002` / **8 tracks** |

### service_role policy for this plan

| Item | Policy |
| --- | --- |
| **This planning phase** | **Do not implement** service_role readBack |
| **If anon SELECT fails** (403 / empty / RLS block) | **STOP** → separate approval phase for service_role re-review |
| **Future Save phase** | May need different auth — **not in G-20u36d scope** |

---

## 4. readBack query design (SELECT-only)

### Tables

**`public.discography`**

- `legacy_id`, `site_slug`, `title`, `artist`, `release_date`, `year`, `label`, `catalog_number`, `description`, `cover_image_url`, `purchase_url`, `streaming_url`, `sort_order`, `published`

**`public.discography_tracks`**

- `release_id`, `track_number`, `title`, `duration`, `sort_order`, `site_slug`

### Query conditions (draft)

```sql
-- Release (single row expected)
SELECT id, legacy_id, site_slug, title, artist, release_date, year, label,
       catalog_number, description, cover_image_url, purchase_url, streaming_url,
       sort_order, published
FROM public.discography
WHERE site_slug = 'gosaki-piano'
  AND legacy_id = :legacyId
LIMIT 1;

-- Tracks (ordered)
SELECT track_number, title, duration, sort_order
FROM public.discography_tracks
WHERE site_slug = 'gosaki-piano'
  AND release_id = :releaseId
ORDER BY track_number ASC NULLS LAST, sort_order ASC NULLS LAST;
```

### In-handler mapping

| Step | Action |
| --- | --- |
| 1 | SELECT release by `site_slug` + `legacy_id` |
| 2 | If not found → `readBack.releaseFound: false` · warn · compare against empty baseline |
| 3 | SELECT tracks by `release_id` + `site_slug` |
| 4 | Build `tracksText` baseline: one line per track title (same parser as client) |
| 5 | Map release row → handler `release` snapshot shape |
| 6 | Pass to existing `simulateDiscographySaveDryRunEndpoint` / diff logic |

**No** INSERT / UPDATE / DELETE / UPSERT / RPC mutation.

---

## 5. Response shape — sanitized readBack summary

Current response sets `readBack: null`. After enhancement:

### readBack (summary only — not full rows)

```json
{
  "enabled": true,
  "source": "supabase-select",
  "releaseFound": true,
  "trackCount": 8,
  "legacyId": "discography-002",
  "siteSlug": "gosaki-piano"
}
```

**Do not return:** full DB rows, internal UUIDs (optional omit), JWT, keys, service_role hints.

### Existing fields (unchanged semantics except accuracy)

| Field | Note |
| --- | --- |
| `diffSummary` | DB-grounded added/removed/reordered |
| `changedCounts` | DB-grounded releaseFields + track counts |
| `wouldWrite` | true only when request differs from **DB** snapshot |
| `errors` / `warnings` | e.g. release not found, anon read failed |
| Write flags | always false |

### Admin UI / verifier follow-up (future phase)

G-20u36c UI sanitizer and live verify currently treat non-null `readBack` as blocked. **Future admin sanitizer update** must allow **sanitized readBack summary fields only** — not raw rows. **Not in this planning implementation phase.**

---

## 6. Auth / env plan (values not logged)

| Candidate | Use |
| --- | --- |
| Edge runtime `SUPABASE_URL` | Staging project URL (ref `kmjqppxjdnwwrtaeqjta`) |
| Edge runtime `SUPABASE_ANON_KEY` | Supabase client with anon role for SELECT |
| Incoming `Authorization: Bearer` (anon) | May align with existing dry-run auth — verify in implementation |
| `SUPABASE_SERVICE_ROLE_KEY` | **Not used** in G-20u36d plan |

**Production STOP:** ref `vsbvndwuajjhnzpohghh` must never appear in client config or queries.

---

## 7. Current code touchpoints (read-only analysis)

| Location | Current state |
| --- | --- |
| `supabase/functions/gosaki-discography-save-dry-run/handler.ts` | `resolveCurrentSnapshot()` → `{}` · `readBack: null` |
| `tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts` | tools draft mirror — **implement here first** |
| `buildDryRunEndpointResponse()` | Sets `readBack: null` — extend for summary object |
| G-20u36a permissions | anon SELECT grants preserved · write grants 0 |

---

## 8. STOP conditions

Stop and ask operator if:

| Condition | Action |
| --- | --- |
| `service_role` required for readBack | STOP → separate approval phase |
| anon SELECT returns 403 / policy block | STOP → RLS/grant investigation; no silent fallback to service_role |
| `operation=save` must be accepted on dry-run endpoint | STOP — out of scope |
| INSERT/UPDATE/DELETE/UPSERT/RPC needed | STOP |
| Any write flag becomes true | STOP |
| Secrets in response / logs / UI | STOP |
| Production ref `vsbvndwuajjhnzpohghh` in config | STOP |
| readBack returns full raw rows | STOP — summary only |
| Save button enablement needed | STOP — G-20u36e+ only |

---

## 9. Next phase candidates

| Phase | Scope |
| --- | --- |
| **G-20u36d-readback-implementation-in-tools-draft** | Implement `resolveCurrentSnapshot` + anon Supabase client in `tools/static-to-astro/scripts/edge-functions/...` only |
| **G-20u36d-readback-root-placement** | Copy to `supabase/functions/gosaki-discography-save-dry-run/` (scope exception) |
| **G-20u36d-readback-edge-deploy** | Staging Edge redeploy (operator approval) |
| **G-20u36d-readback-live-verify** | Live HTTP: valid dryRun with DB-grounded diff · `wouldWrite` accuracy |
| **G-20u36d-readback-admin-sanitizer-update** | Allow sanitized readBack summary in admin UI display |
| **G-20u36e-controlled-save-planning** | First controlled Save — **only after readBack stable** |

Recommended order: tools-draft implementation → root placement → deploy → live verify → (optional admin sanitizer) → G-20u36e Save planning.

---

## 10. Not executed in this phase

| Item | Status |
| --- | --- |
| `supabase/functions/**` edit | **not executed** |
| Edge deploy / Supabase CLI deploy | **not executed** |
| SQL mutation | **not executed** |
| DB write | **not executed** |
| Save enablement | **not executed** |
| Admin UI change | **not executed** |
| FTP upload | **not executed** |
| service_role implementation | **not planned for implementation** |

---

## Verify

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:g20u36d-discography-edge-dry-run-readback-enhancement-plan
npm run verify:g20u36c-admin-discography-dry-run-stg-browser-qa-result
```

Historical verifier — not in active regression suite.
