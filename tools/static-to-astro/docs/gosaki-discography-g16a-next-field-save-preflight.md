# G-16a — Gosaki Discography next-field Save preflight (artist / discography-001)

Last updated: 2026-06-29  
Phase: `G-16a-gosaki-discography-existing-release-artist-non-dry-run`  
Status: **Save preflight complete — Save NOT executed**  
Base commit: `2d70001`  
Playbook: [cms-kit-save-reflection-playbook.md](./cms-kit-save-reflection-playbook.md)

## Gate

```txt
gosakiDiscographyG16aNextFieldSavePreflightComplete: true
readyForG16aDiscographyArtistSaveExecution: false
saveExecutedInThisPhase: false
dbWriteExecutedInThisPhase: false
cursorSaveExecuted: false
cursorDbWriteExecuted: false
ftpUploadExecuted: false
packageRegenExecuted: false
```

**Do not click Save in this phase.** Operator Save once in execution phase only (`G-16a-execution`).

**Supabase target:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **STOP** if host is `vsbvndwuajjhnzpohghh`.

---

## 1. Staging inventory (read-only SELECT — 2026-06-29)

| legacy_id | title | artist (DB) | year | release_date | updated_at |
| --- | --- | --- | ---: | --- | --- |
| discography-001 | Continuous | `ごさきりかこTrio Feat.石川周之介` | 2023 | 2023-07-26 | `2026-06-05T17:39:44.201802+00:00` |
| discography-002 | SKYLARK | 後藤沙紀 | 2023 | 2023-04-26 | `2026-06-05T17:39:44.201802+00:00` |
| discography-003 | About Us!! | `ごさきりかこTrio` | 2019 | 2019-01-11 | `2026-06-29T02:40:57.83085+00:00` |
| discography-004 | Ja-Jaaaaan! | 新谷健介オノマトペ | 2015 | 2015-03-21 | `2026-06-05T17:39:44.201802+00:00` |

**Closed rows (do not re-Save):**

| legacy_id | field | chain |
| --- | --- | --- |
| discography-002 | `purchase_url` | G-15c-f |
| discography-003 | `artist` | G-15e-f |

---

## 2. Candidate comparison (unclosed rows only)

| Row | Field | DB vs public / JSON | Natural diff? | Decision |
| --- | --- | --- | --- | --- |
| 001 | `title` | `Continuous` — aligned | no | defer |
| 001 | `year` | 2023 — aligned with release line | no | defer |
| 001 | `release_date` | `2023-07-26` — aligned | no | defer |
| **001** | **`artist`** | **`Feat.` → `feat.` typography** | **yes** | **selected** |
| 004 | `title` | `Ja-Jaaaaan!` — aligned | no | defer |
| 004 | `year` | 2015 — aligned | no | defer |
| 004 | `release_date` | `2015-03-21` — aligned | no | defer |
| 004 | `artist` | aligned with public h2 | no | defer |
| any | `streaming_url` | null on 001/002/004 — URL invention risk | no | **rejected** (G-15d lesson) |

**Note:** DB `label` is null on 004 while public HTML shows `Mardi Gras JAPAN Records` — deferred (`label` out of G-16a scope).

---

## 3. Selected target

| Item | Value |
| --- | --- |
| **legacy_id** | `discography-001` |
| **id** | `00f4cd00-cfb6-43b3-991a-211b2d7c92ef` |
| **title** | `Continuous` |
| **field** | `artist` only |
| **before** | `ごさきりかこTrio Feat.石川周之介` |
| **after** | `ごさきりかこTrio feat.石川周之介` |
| **expectedBeforeUpdatedAt** | `2026-06-05T17:39:44.201802+00:00` |
| dry-run `approvalId` | `G-16a-gosaki-discography-artist-dry-run-slice` |
| Save `approvalId` | `G-16a-gosaki-discography-existing-release-artist-non-dry-run` |
| `changedFields` | `["artist"]` only |
| `rowsAffected` | must be `1` |
| optimistic lock | `expectedBeforeUpdatedAt` required; UPDATE `.eq("updated_at", …)` |

---

## 4. Dry-run Preview expectation

| Check | Expected |
| --- | --- |
| `dryRun` | `true` |
| `actualWrite` | `false` |
| `wouldWrite` | `true` (when form artist = after value) |
| `changedFields` | `["artist"]` |
| `payload` | `{ "artist": "ごさきりかこTrio feat.石川周之介" }` |
| `saveReadiness` (routine dev) | `ready_but_save_disabled` |
| `saveAllowed` | `false` until G-16a env armed |

---

## 5. Save execution expectation (operator — not this phase)

| afterVerification field | Expected |
| --- | --- |
| `artist` | `ごさきりかこTrio feat.石川周之介` |
| `title` / `year` / `release_date` / `purchase_url` | unchanged |
| `updated_at` | **>** `2026-06-05T17:39:44.201802+00:00` (trigger live) |
| `rowsAffected` | `1` |

---

## 6. Single-arm policy

- G-16a arm: `PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G16A_ARTIST_NON_DRY_RUN_ARMED=true`
- G-15b / G-15d arms **must be off** when G-16a armed
- **Do not re-Save** `discography-002` or `discography-003`

### Env stack (inline — not committed)

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN=true
G16A_DISCOGRAPHY_SAVE_ENABLED=false
PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G16A_ARTIST_NON_DRY_RUN_ARMED=false
PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED=false
PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED=false
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=discography
PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK=true
```

Execution phase only (operator inline — not committed):

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN=false
G16A_DISCOGRAPHY_SAVE_ENABLED=true
PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G16A_ARTIST_NON_DRY_RUN_ARMED=true
PUBLIC_ADMIN_WRITE_APPROVAL_ID=G-16a-gosaki-discography-existing-release-artist-non-dry-run
```

---

## 7. Public reflection

| Item | Value |
| --- | --- |
| Required after Save? | **Yes (later phase)** — artist in Wix Discography h2 `「Continuous」/…` |
| Hook today | `patchGosakiDiscographySupabaseFields` — `purchase_url` + `artist` (G-15e) |
| This phase | No regen / no upload |
| Expected upload (later) | `discography/index.html` ×1 if CSS hash unchanged |

---

## 8. Rollback

```sql
-- staging only — doc-only; run only if operator requests rollback after G-16a execution
UPDATE public.discography
SET artist = 'ごさきりかこTrio Feat.石川周之介'
WHERE legacy_id = 'discography-001'
  AND id = '00f4cd00-cfb6-43b3-991a-211b2d7c92ef';
```

| Item | Value |
| --- | --- |
| `rollbackNeeded` (default) | **false** |
| `rollbackSqlExecuted` | **false** |

---

## 9. Implementation summary

| Module | Role |
| --- | --- |
| `gosaki-discography-g16a-next-field-types.ts` | constants |
| `gosaki-discography-g16a-artist-dry-run-guards.ts` | dry-run guards |
| `gosaki-discography-g16a-existing-release-artist-dry-run.ts` | `executeG16aDiscographyArtistDryRun` |
| `gosaki-discography-g16a-artist-save-config.ts` | Save enablement |
| `gosaki-discography-g16a-existing-release-artist-save.ts` | Save path (gated) |
| `gosaki-staging-discography-admin-ui.ts` | routes `discography-001` → G-16a |
| `AdminGosakiStagingDiscographyOperatorPage.astro` | default row `discography-001` |

---

## 10. Forbidden operations (this phase)

| Operation | Executed? |
| --- | --- |
| Save / DB write | **no** |
| FTP / upload / package regen | **no** |
| Production / Sariswing | **no** |
| `service_role` | **no** |

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-g16a-gosaki-discography-next-field-save-preflight.mjs
```

---

## 12. Next phase

**G-16a-d2/d3** — operator local dry-run Preview result + Save final preflight (optional)  
**G-16a-execution** — operator Save once (separate approval)
