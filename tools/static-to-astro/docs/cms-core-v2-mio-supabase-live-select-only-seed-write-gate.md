# CMS Core v2 — Mio Supabase live SELECT-only seed write gate

- **Phase:** `cms-core-v2-mio-supabase-live-select-only-seed-write-gate`
- **Date:** 2026-08-01
- **Prior:** `cms-core-v2-mio-supabase-live-select-only-preflight` (Branch B) · seed-write-planning
- **Verdict:** **GATE COMPLETE / NOT READY TO APPLY**
- **SQL executed:** **false**
- **DB write executed:** **false**
- **Cursor judgment:** **do not run seed SQL yet**
- **Staging only:** `kmjqppxjdnwwrtaeqjta`
- **STOP production:** `vsbvndwuajjhnzpohghh`
- **Artifact:** `scripts/supabase/cms-core-v2-mio-kisaragi-jazz-live-select-seed.template.sql` (blocks A–E)
- **Generator:** `scripts/generate-mio-kisaragi-jazz-live-select-seed-sql.mjs` (offline)

---

## 1. Confirmed fixture counts (`fixtures/mio-kisaragi-jazz-data/`)

| Surface | Total | Published | Other |
| --- | ---: | ---: | --- |
| `sites` (to create) | **1** | status `active` | — |
| `schedules` | **16** | **14** | unpublished **2** (= draft `mio-sched-2026-08-10` + pending `mio-sched-2026-08-11`; Core has no pending enum → `published=false`) |
| `discography` releases | **5** | **4** | unpublished **1** (`mio-disco-live-01`) |
| `discography_tracks` | **14** | n/a | on published releases **13** · on unpublished release **1** |
| `site_embeds` (from videos) | **6** | **5** | unpublished **1** · Kit-parseable public **3** (watch / youtu.be / embed) · shorts+invalid fail-closed |
| `site_page_fields` About lede | **1** | **1** | collaborators / jaLong / en = **not seeded** (extensions) |

---

## 2. tracks 14 vs 13

- Fixture tracks array length = **14** (seed all 14 with `site_slug='mio-kisaragi-jazz'`).
- Tracks whose parent release `published=true` = **13**.
- The remaining **1** track belongs to unpublished `mio-disco-live-01` (still inserted; public discography read filters parent `published`).

---

## 3. Schema / FK / unique (from migrations + staging audits)

| Table | Insert notes | Unique / FK |
| --- | --- | --- |
| `sites` | `site_slug`, `display_name`, `status in ('active','suspended')` | UNIQUE `site_slug` · composite UNIQUE `(id, site_slug)` for child FKs |
| `schedules` | omit `id`/`updated_at` · **`date` NOT NULL** | UNIQUE **`legacy_id` global** (`schedules_legacy_id_key`) · no FK to sites |
| `discography` | set `site_slug` · omit extensions | UNIQUE **`legacy_id` global** |
| `discography_tracks` | `discography_legacy_id`, `track_number`, `title`, `sort_order`, `site_slug` · **no** `duration` / `release_id` | no DB FK to releases (logical join) |
| `site_embeds` | `site_id`+`site_slug` from sites · `source_url`/`embed_url` **NOT NULL** · provider `youtube` | UNIQUE `(site_id, provider, legacy_item_id)` · FK → sites RESTRICT |
| `site_page_fields` | `value_text` (not `field_value`) · about/`profile.lede` | UNIQUE `(site_id, page_key, field_key)` · FK → sites |

**Insert order:** sites → schedules → discography → discography_tracks → site_embeds → site_page_fields.

**UUID policy:** DB `gen_random_uuid()` defaults · fixture fake string ids are **not** inserted as PK.

**published / sort:** preserve fixture booleans and sort_order / videos `sortOrder`.

---

## 4. Collision guard

Inside seed transaction (block B1):

- Count `sites` / `schedules` / `discography` / `discography_tracks` / `site_embeds` / `site_page_fields` where `site_slug='mio-kisaragi-jazz'`.
- If **any ≠ 0** → `RAISE EXCEPTION` · refuse overwrite.
- **No** `ON CONFLICT` upsert on content or sites.

---

## 5. Transaction / rollback

- Seed = **one** `BEGIN … COMMIT` with final Option A count assert (B8).
- Mid-failure or assert failure → **full ROLLBACK** (no partial seed).
- Rollback (block D) = separate transaction · `site_slug='mio-kisaragi-jazz'` **and** seed prefixes (`mio-sched-%` / `mio-disco-%` / `mio-yt-%` / about lede) · child→parent · final left-count assert 0.
- Never deletes `gosaki-piano` or other sites.

---

## 6. GATE BLOCKER — why apply is refused

Staging audit: `schedules.date` is **NOT NULL**.
Fixture row `mio-sched-2026-09-01` is **published** with **`date=null`** (日付未定).

Therefore Option A counts (**16 / 14**) cannot be inserted as-is.
Current block B inserts **15** dated schedules then **B8 RAISE** → intentional ROLLBACK so a mistaken apply cannot leave a partial Mio seed.

**Resolution path (locked by planning — sentinel rejected):**

See `cms-core-v2-schedule-tbd-date-contract-planning.md`:

1. Contract helpers (**COMPLETE**) → Gosaki read compat (**COMPLETE**) → Admin/Save planning (**COMPLETE** · docs)
2. Staging migration gate/apply: nullable `date` + `date_status` (`confirmed`/`tbd`) + CHECKs
3. Regenerate Mio seed SQL (include TBD row · no fictional day)
4. Human seed apply → Branch A live SELECT pilot

**Admin/Save planning:** TBD Save must not enable before migration · UI = dateStatus radio + conditional inputs · null-date list filters must change with UI connect.

**Do not** use a sentinel calendar day for `mio-sched-2026-09-01`.

**Helper sort (locked):** month ASC → same-month confirmed before tbd → confirmed `date→sortOrder→legacyId` → tbd `sortOrder→legacyId` → month-unknown tbd last. Mio TBD (`sort_order=5`) sits **after** confirmed 2026-09 peers; TBD-to-TBD uses `sortOrder=5` deterministically. Not `month → sort_order → date NULLS LAST`.

**Gosaki read compat:** `normalizeScheduleRecord` validates dated rows as confirmed via date-contract · **no** `date_status` in SELECT · **no** TBD comparator on Gosaki public sort yet.

Also noted (handled in SQL without schema change):

- `site_embeds.embed_url` NOT NULL → shorts/invalid use `https://example.invalid/mio-fail-closed-embed` while keeping original `source_url`.
- Fictional YouTube ids parse in Kit but fail in browser (acceptable for SELECT pilot).

---

## 7. SQL artifacts (A–E)

Full copy/paste blocks live in:

`scripts/supabase/cms-core-v2-mio-kisaragi-jazz-live-select-seed.template.sql`

| Block | Purpose | Write? |
| --- | --- | --- |
| **A** | SELECT-only preflight counts | no |
| **B** | Seed transaction + collision + Option A assert | **yes (forbidden until ready)** |
| **C** | Post-write SELECT expect table | no |
| **D** | Scoped rollback transaction | **yes (separate approval)** |
| **E** | Post-rollback SELECT (all 0) | no |

Regenerate after fixture edits:

```bash
node tools/static-to-astro/scripts/generate-mio-kisaragi-jazz-live-select-seed-sql.mjs
```

---

## 8. Success / failure conditions

### Success (apply phase — not now)

| Bucket | Expect |
| --- | ---: |
| sites | 1 |
| schedules / published / unpublished | 16 / 14 / 2 |
| discography / published | 5 / 4 |
| discography_tracks / on published releases | 14 / 13 |
| site_embeds / published | 6 / 5 |
| about profile.lede published | 1 |
| gosaki schedules published | unchanged |

### Failure

- Any collision (pre-existing Mio rows)
- Count mismatch vs table above
- Partial insert (transaction must roll back)
- Production ref / wrong project
- Touching Gosaki / other `site_slug`
- Upsert overwrite
- Running while TBD blocker unresolved (current B8 always fails)

---

## 9. Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| TBD date NOT NULL | **blocks apply** | B8 ROLLBACK · documented |
| Global `legacy_id` UNIQUE collide | medium | `mio-*` prefixes ≠ Gosaki |
| Operator removes B8 and commits 15 schedules | high | docs + verifier mark NOT READY · treat as FAIL |
| Fictional YT browser errors | low | SELECT pilot OK |
| Privileged SQL role misuse | high | staging only · explicit approval form |
| Rollback misses non-prefixed rows | low | prefix + site_slug + left-count assert |

---

## 10. Gates

```txt
CMS_CORE_V2_MIO_SUPABASE_LIVE_SELECT_ONLY_SEED_WRITE_GATE_COMPLETE: true
READY_FOR_MIO_SEED_APPLY: false
MIO_SEED_SQL_EXECUTED: false
DB_WRITE_EXECUTED: false
GATE_BLOCKER: schedules.date_NOT_NULL_vs_fixture_TBD_null
TBD_CONTRACT_PLANNING: cms-core-v2-schedule-tbd-date-contract-planning
TBD_CONTRACT_HELPERS: cms-core-v2-schedule-tbd-date-contract-helpers (COMPLETE)
TBD_GOSAKI_READ_COMPAT: cms-core-v2-schedule-tbd-date-gosaki-read-compat (COMPLETE · later phase)
SENTINEL_DATE_REJECTED: true
DATE_STATUS_IN_DB_QUERY: false
RUNTIME_CHANGED: false
REGISTRY_CHANGED: false
CONTACT_PROVIDER_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
TBD_ADMIN_SAVE_PLANNING: cms-core-v2-schedule-tbd-date-admin-save-planning (COMPLETE · docs)
TBD_ADMIN_STATE_SAVE_PAYLOAD_HELPERS: cms-core-v2-schedule-tbd-admin-state-save-payload-helpers (COMPLETE · offline)
TBD_STAGING_MIGRATION_GATE: cms-core-v2-schedule-tbd-staging-migration-gate (COMPLETE)
TBD_STAGING_MIGRATION_FINAL_REVIEW: cms-core-v2-schedule-tbd-staging-migration-final-review (COMPLETE)
READY_FOR_SCHEDULE_TBD_STAGING_MIGRATION_APPLY: true
NEXT_AFTER_BLOCKER_RESOLVED: cms-core-v2-schedule-tbd-staging-migration-apply → seed regen/apply
```

Required approval form (future apply only):

```txt
承認します。この操作を1回だけ実行してください。
approval ID: cms-core-v2-mio-supabase-live-select-seed-apply
project: kmjqppxjdnwwrtaeqjta
site_slug: mio-kisaragi-jazz
```
