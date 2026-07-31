# CMS Core v2 — Mio Supabase live SELECT-only preflight

- **Phase attempted:** `cms-core-v2-mio-supabase-live-select-only-pilot`
- **Phase recorded:** `cms-core-v2-mio-supabase-live-select-only-preflight`
- **Date:** 2026-08-01
- **Site:** `mio-kisaragi-jazz`
- **Verdict:** **STOP / BRANCH B** — Mio staging rows absent · live pilot **NOT COMPLETE**
- **DB write executed:** **false**
- **SQL migration executed:** **false**
- **Live pilot implementation:** **not started** (blocked on seed write gate)

---

## 1. Safety confirmation

| Check | Result |
| --- | --- |
| Staging ref | `kmjqppxjdnwwrtaeqjta` — **OK** (exact host gate via `assertStagingOnlySupabaseTarget`) |
| Production ref | `vsbvndwuajjhnzpohghh` — **not detected** |
| Key class | anon JWT-like only · `service_role` rejected by `resolveSupabaseAnonReadEnv` |
| Writes | none (head/count + limited SELECT only) |
| Secrets / PII in logs | none (counts / status / error codes only) |
| Package / FTP / production | not touched |

Empty-data SELECT success does **not** equal live pilot COMPLETE.

---

## 2. Read path used (inspection only)

| Helper | Role |
| --- | --- |
| `resolveSupabaseAnonReadEnv` | `.env.local` + process · anon only |
| `assertStagingOnlySupabaseTarget` / `evaluateStagingOnlySupabaseTarget` | staging-only URL gate |
| `@supabase/supabase-js` | `select('*', { count:'exact', head:true })` + column probes |
| Intended future build path (not enabled) | `loadSiteSupabaseDataForBuild` → schedule / discography / `site_embeds` / `site_page_fields` |

Registry today: `mio-kisaragi-jazz` `supabaseFeatures` all **false** (fixture inject path). No registry flip in this phase.

---

## 3. Target tables / columns / filters

| Surface | Table(s) | Site filter | Public filter | Sort (build loaders) | Required columns (Core) |
| --- | --- | --- | --- | --- | --- |
| Schedule | `public.schedules` | `site_slug` **required** | `published = true` | `date` ASC, `sort_order` ASC | `SCHEDULE_SELECT` (id, legacy_id, site_slug, date, year, month, title, venue, open_time, start_time, price, description, image_url, source_file, source_route, show_on_home, home_order, published, sort_order, updated_at) |
| Discography | `public.discography` + `public.discography_tracks` | `site_slug` **required** | releases `published = true` | releases `sort_order` ASC; tracks `discography_legacy_id`, `sort_order` | `DISCOGRAPHY_SELECT` + track fields (`discography_legacy_id`, `track_number`, `title`, `sort_order`, `site_slug`) |
| Videos | `public.site_embeds` | `site_slug` **required** | `provider = 'youtube'` · `published = true` | `sort_order` ASC | id, site_id, site_slug, provider, legacy_item_id, title, source_url, embed_url, published, sort_order, updated_at |
| About | `public.site_page_fields` | `site_slug` **required** | `page_key = 'about'` · `field_key = 'profile.lede'` · `published = true` | single non-empty lede | `SITE_PAGE_FIELDS_SELECT` (`value_text`, not `field_value`) |

Prerequisite for embeds / page_fields FK: `public.sites` row with `site_slug = 'mio-kisaragi-jazz'` (seed gate; not created here).

---

## 4. Mio row counts (staging anon SELECT)

`site_slug = 'mio-kisaragi-jazz'`

| Table / filter | Count | Error |
| --- | ---: | --- |
| `schedules` (all) | **0** | none |
| `schedules` published | **0** | none |
| `schedules` unpublished | **0** | none |
| `discography` (all) | **0** | none |
| `discography` published | **0** | none |
| `discography_tracks` | **0** | none |
| `site_embeds` (all) | **0** | none |
| `site_embeds` youtube published | **0** | none |
| `site_page_fields` (all) | **0** | none |
| `site_page_fields` about/`profile.lede` published | **0** | none |

Column probe notes:

- `schedules` / `discography` / `discography_tracks` / `site_embeds` SELECT of Core columns: **OK** (0 rows).
- Mistyped `field_value` on `site_page_fields` → Postgres `42703` (expected; real column is `value_text` per `SITE_PAGE_FIELDS_SELECT`). Head counts on the table still succeed.

---

## 5. RLS / anon SELECT result

| Check | Result |
| --- | --- |
| Mio empty tables under anon | **readable** (count 0, no RLS deny) |
| Gosaki sanity (same anon key) | `site_slug=gosaki-piano` · `schedules` published **74** · `discography` published **4** · `site_embeds` youtube published **1** — anon SELECT works on staging |
| Schema blocker for Mio empty state | none for head counts |
| Production URL | STOP would fire; not present |

---

## 6. Branch decision

```txt
BRANCH: B
REASON: no Mio rows for Schedule / Discography / Videos / About
LIVE_PILOT_COMPLETE: false
DB_WRITE_REQUIRED: true (separate approval gate)
NEXT: cms-core-v2-mio-supabase-live-select-only-seed-write-planning (docs) → human seed execution (NOT this phase)
```

Do **not** treat empty SELECT as multi-site live-read proof.

---

## 7. Fixture inventory (seed source — not DB)

Source: `fixtures/mio-kisaragi-jazz-data/` (fictional companion data)

| Surface | Fixture rows | Published | Notes |
| --- | ---: | ---: | --- |
| Schedule | 16 | 14 | 2 unpublished (draft/pending → `published=false`) |
| Discography releases | 5 | 4 | 1 unpublished |
| Discography tracks | 14 | n/a | fixture tracks lack `site_slug` → seed must set |
| Videos items | 6 | 5 | 3 parseable public · 1 shorts · 1 invalid · 1 unpublished |
| About page_fields Core | 1 | 1 | `profile.lede` only for Core; collaborators = extension |

---

## 8. Explicitly not done

- Registry `supabaseFeatures` flip
- Mio / Gosaki runtime adapter changes
- Contact provider changes
- Package / public-dist / FTP
- INSERT / UPDATE / DELETE / UPSERT / RPC / migration
- Browser live-pilot output
- Claiming `cms-core-v2-mio-supabase-live-select-only-pilot` COMPLETE

---

## 9. Gates

```txt
CMS_CORE_V2_MIO_SUPABASE_LIVE_SELECT_ONLY_PREFLIGHT_COMPLETE: true
CMS_CORE_V2_MIO_SUPABASE_LIVE_SELECT_ONLY_PILOT_COMPLETE: false
MIO_STAGING_DATA_PRESENT: false
BRANCH: B
DB_WRITE_EXECUTED: false
SQL_EXECUTED: false
RUNTIME_CHANGED: false
GOSAKI_UNCHANGED: true
CONTACT_PROVIDER_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
NEXT_PRIMARY_RECOMMENDED: cms-core-v2-mio-supabase-live-select-only-seed-write-gate
```

See also: `cms-core-v2-mio-supabase-live-select-only-seed-write-planning.md`.
