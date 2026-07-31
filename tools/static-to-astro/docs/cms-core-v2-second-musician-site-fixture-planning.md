# CMS Core v2 — Second musician site fixture planning

- **Phase (planning):** `cms-core-v2-second-musician-site-fixture-planning` — **COMPLETE**
- **Phase (scaffold):** `cms-core-v2-mio-static-fixture-scaffold` — **COMPLETE**
- **Phase (registry noop):** `cms-core-v2-mio-registry-noop-pilot` — **COMPLETE**
- **Phase (data fixtures):** `cms-core-v2-mio-data-fixtures` — **COMPLETE**
- **Phase (thin adapter):** `cms-core-v2-mio-hooks-adapter-thin` — **COMPLETE**
- **Phase (schedule read-render):** `cms-core-v2-mio-schedule-read-render` — **COMPLETE**
- **Phase (discography read-render):** `cms-core-v2-mio-discography-read-render` — **COMPLETE** (2026-07-31)
- **Phase (about read-render):** `cms-core-v2-mio-about-read-render` — **COMPLETE** (2026-07-31)
- **Status:** Fixture + data + Videos/footer + Schedule + Discography + About · Contact/Admin/Save **not** started · package **not** started
- **Package generate / FTP / DB:** **not executed**

---

## Gates

```txt
phase: cms-core-v2-mio-about-read-render
CMS_CORE_V2_SECOND_MUSICIAN_SITE_FIXTURE_PLANNING_COMPLETE: true
CMS_CORE_V2_MIO_STATIC_FIXTURE_SCAFFOLD_COMPLETE: true
CMS_CORE_V2_MIO_REGISTRY_NOOP_PILOT_COMPLETE: true
CMS_CORE_V2_MIO_DATA_FIXTURES_COMPLETE: true
CMS_CORE_V2_MIO_HOOKS_ADAPTER_THIN_COMPLETE: true
CMS_CORE_V2_MIO_SCHEDULE_READ_RENDER_COMPLETE: true
CMS_CORE_V2_MIO_DISCOGRAPHY_READ_RENDER_COMPLETE: true
CMS_CORE_V2_MIO_ABOUT_READ_RENDER_COMPLETE: true
ADAPTER_CREATED: true
ADAPTER_SCOPE: videos+footer_sns+schedule_read+discography_read+about_read
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
DB_WRITE_EXECUTED: false
CORE_MIO_HARDCODE_ADDED: false
GOSAKI_CLIENT_SHARE_READY_MAINTAINED: true
deployedPackageSourceCommitUnchanged: dc1c5b62a58d0462ad6629db4847256d316d4a38
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

### About read-render result (step 7)

| Item | Value |
| --- | --- |
| Helper | `scripts/lib/mio-about-data-page.mjs` |
| Hook | `applyPostGenerate` → `applyMioAboutPage` |
| Inject | `aboutBundle` / `siteAboutBundle` via convert (`buildMioInjectAboutBundle`); Core forwards site-neutral keys only |
| Content | JA short / JA long / EN · main photo · no-photo block · collaborators ×3 |
| Photos | local `images|assets` only · external URL rejected · alt required |
| Markup | `mio-about-*` · `/gosaki/i` 0 · no BandProfiles |
| Verifier | `verify:cms-core-v2-mio-about-read-render` (+ safety-suite) · 88 PASS |

**Next:** `cms-core-v2-mio-read-render-browser-baseline`

### Discography read-render result (step 6)

| Item | Value |
| --- | --- |
| Helper | `scripts/lib/mio-discography-data-page.mjs` |
| Hook | `patchDiscographyPageMainHtml` |
| Inject | `discographyBundle` via convert (`buildMioInjectDiscographyBundle`) |
| Public | 4 releases · unpublished live excluded |
| Tracks | album-01×10 / album-02×2 / single-01×1 / album-03×0 |
| Markup | `mio-discography-*` · `/gosaki/i` 0 |
| Verifier | `verify:cms-core-v2-mio-discography-read-render` (+ safety-suite) |

**Next:** superseded by About read-render (step 7)

### Schedule read-render result (step 5)

| Item | Value |
| --- | --- |
| Helper | `scripts/lib/mio-schedule-data-pages.mjs` |
| Inject | `scheduleBundle` via convert options (`buildMioInjectScheduleBundle`) |
| Public | 14 events · draft/pending hidden |
| Months | Aug 7 / Sep 6 on `schedule-2026-0{8,9}/` · Jul 1 on hub only |
| Jul decision | No `schedule-2026-07` fixture page → hub archive section (no new month page) |
| Markup | `mio-schedule-*` only · `/gosaki/i` 0 |
| Verifier | `verify:cms-core-v2-mio-schedule-read-render` (+ safety-suite) |
### Thin hooks adapter result (step 4)

| Item | Value |
| --- | --- |
| Adapter | `scripts/lib/mio-site-generator-hooks-adapter.mjs` |
| Helpers | `mio-footer-social.mjs` · `mio-videos-page-embed.mjs` (+ schedule helper above) |
| Registry | `generatorHooksAdapter` → Mio adapter |
| Videos | published watch/youtu.be/embed ×3 · nocookie · shorts/invalid/unpublished omitted |
| Footer | Instagram + YouTube · X omitted · `mio-footer-social-links` |
| Data inject | verifier/convert `embedsBundle` (no Core fixture import; no adapter hardcoded data path) |
| Verifier | `verify:cms-core-v2-mio-hooks-adapter-thin` (+ safety-suite) |
| Gosaki HTML baseline | 80 PASS |
### Data fixtures result (step 3)

| Item | Value |
| --- | --- |
| Root | `fixtures/mio-kisaragi-jazz-data/` |
| Schedule | 16 rows (14 public) |
| Discography | 5 releases (4 public) + tracks |
| Videos | 6 items (3 embed / 1 shorts fail-closed / 1 hidden / 1 invalid fail-closed) |
| About | JA short+long / EN / photo / no-photo / collaborators×3 + `profile.lede` |
| Expected | `expected/*.json` deep-eq locked |
| Verifier | `verify:cms-core-v2-mio-data-fixtures` (+ safety-suite) |
### Registry noop pilot result (step 2)

| Item | Value |
| --- | --- |
| siteKey | `mio-kisaragi-jazz` |
| fixtureDir | `fixtures/mio-kisaragi-jazz` |
| generatorHooksAdapter | **omitted** (noop hooks) |
| deploy profiles | `config/sites/mio-kisaragi-jazz.deploy-profiles.json` (staging only) |
| staging deployBase | `/cms-kit-staging/mio-kisaragi-jazz/` |
| production profile | **none** |
| verifier | `verify-cms-core-v2-mio-registry-noop-pilot` (+ safety-suite step) |
| Known Core note | Schedule markup uses site-neutral `schedule-*` classes; first-customer adapter sets `scheduleClassPrefix: "gosaki-schedule"` |
---

## 1. Purpose

Design a **fictional second jazz-vocalist site fixture** so CMS Core can be proven portable beyond Gosaki / the generic noop pilot (`pilot-sample-static`).

| Item | Value |
| --- | --- |
| Working title | **Mio Kisaragi Jazz Vocal** |
| Recommended `siteKey` | `mio-kisaragi-jazz` |
| Character | Fictional Japanese jazz vocalist (synthetic copy/images only) |
| Phase 1 posture | **Static HTML fixture + read-only generation** (noop or thin adapter) |
| Out of scope now | Supabase write · Save UI · HubSpot production · FTP · real-person assets |

This is **not** a production customer site. It is a Kit verification asset: richer than `sample-static-site`, deliberately **different** from Gosaki’s Wix crawl shape, without copying Gosaki HTML.

---

## 2. Relation to existing sites

| Site | Role | Musician surfaces |
| --- | --- | --- |
| `gosaki-piano` | First CMS customer / full hooks adapter | Home YT · About · Schedule hub/months · Discography · Contact HubSpot · Admin |
| `pilot-sample-static` | Noop registry proof (G-20u8/u9) | Home · About · Service · Contact — **no** Schedule/Disco/Videos |
| `mio-kisaragi-jazz` (planned) | **Second musician fixture** | Full musician page set + adversarial CMS data cases |

---

## 3. Recommended site specification

### Brand / IA

- **Display name:** Mio Kisaragi Jazz Vocal
- **Tone:** intimate jazz vocalist site (not piano-trio clone of Gosaki)
- **Nav:** Home · About · Schedule · Discography · Videos · Contact
- **Language:** Japanese primary; About also carries a short English profile block
- **Assets:** original placeholder SVG/JPEG under `fixtures/mio-kisaragi-jazz/images/` (no scraped production photos)

### Route map (fixture HTML → intended Astro routes)

| Page | Fixture file (proposed) | Public route | Notes |
| --- | --- | --- | --- |
| Home | `index.html` | `/` | Optional “This week” / embed slot for future YouTube inject |
| About | `about.html` | `/about/` | Bio + photo slot + collaborators list (static in phase 1) |
| Schedule hub | `schedule.html` **or** generated hub | `/schedule/` | Prefer hub page in fixture; months as siblings |
| Schedule month | `schedule-2026-08.html`, `schedule-2026-09.html`, … | `/schedule/2026-08/` etc. | Use **kit-friendly** `schedule-YYYY-MM` naming (not Gosaki live `YYYY-MM.html`) |
| Discography | `discography.html` | `/discography/` | Album cards + track lists |
| Videos | `videos.html` | `/videos/` | **New vs Gosaki** — dedicated page (Gosaki uses Home YouTube only) |
| Contact | `contact.html` | `/contact/` | Generic form / iframe placeholder — **not** HubSpot allowlist |

Deploy base (future staging only, not in this phase):
`/cms-kit-staging/mio-kisaragi-jazz/`

---

## 4. Gosaki — common vs different

### Common (musician CMS Kit)

- Musician IA: Home / About / Schedule / Discography / Contact (+ Videos)
- Schedule as month-oriented listing + event cards (date, title, venue, times, price, description)
- Discography as releases + optional tracks
- YouTube-like embeds with published gating
- Registry-driven `siteKey`, staging package profile pattern
- Core loaders already siteSlug-aware for schedules / discography / embeds

### Different (intentional)

| Area | Gosaki | Mio (planned) |
| --- | --- | --- |
| Source HTML | Wix live crawl | **Hand-authored static fixture** (not Wix mesh dump) |
| Month filenames | Live `2026-MM.html` | Kit `schedule-YYYY-MM.html` |
| YouTube surface | Home inject only | **Dedicated `/videos/`** (+ optional later Home slot) |
| Contact | HubSpot fixed allowlist (`gosaki-piano`) | **Generic** form/embed candidate |
| About bands | `BandProfilesSection` + JSON | Lightweight **collaborators** block (different markup/ids) |
| Footer SNS | Wix `#LnkBr2` + Gosaki inject | Simple footer link list (partial SNS missing cases) |
| Admin | Gosaki staging read-only admin | **Deferred** (phase 1: no admin) |
| Data | Staging Supabase + crawl fallback | Phase 1: **JSON/static fixtures only**; Supabase later optional |

---

## 5. Fixture data inventory

All IDs / copy are **fictional**. No real-site text or images.

### 5.1 Pages (static HTML)

| ID | File | Must include |
| --- | --- | --- |
| `page-home` | `index.html` | Brand H1, short lede, nav, empty/marker region for future embed |
| `page-about` | `about.html` | JA profile, EN profile, photo + no-photo variant section, collaborators |
| `page-schedule-hub` | `schedule.html` | Links to month pages |
| `page-schedule-2026-08` | `schedule-2026-08.html` | Event cards (mix of cases below) |
| `page-schedule-2026-09` | `schedule-2026-09.html` | Cross-month / TBD / dual-show cases |
| `page-disco` | `discography.html` | 3–5 release blocks |
| `page-videos` | `videos.html` | Embed list placeholders |
| `page-contact` | `contact.html` | Generic form or iframe slot + SNS partial |

Supporting: `css/`, `images/` placeholders, optional `manifest.json` for convert tooling.

### 5.2 Schedule events (JSON companion — phase 1 static; future Supabase seed)

Target **16 events** (within 12–20). Suggested `legacy_id` prefix: `mio-sched-`.

| # | legacy_id | Intent | Key fields |
| --- | --- | --- | --- |
| 1 | `mio-sched-2026-08-01` | Published · upcoming · paid · image | `published: true`, future date, `price` set, `image_url` set |
| 2 | `mio-sched-2026-08-02` | Published · upcoming · free | `price: "無料"` or empty+flag in description |
| 3 | `mio-sched-2026-08-03` | Published · upcoming · price TBD | `price: ""` / “料金未定” in description |
| 4 | `mio-sched-2026-08-04a` | Dual show · matinee | Same date, `open_time`/`start_time` afternoon, `sort_order` |
| 5 | `mio-sched-2026-08-04b` | Dual show · evening | Same date, evening times |
| 6 | `mio-sched-2026-08-05` | Multi performer | `description` lists guest names |
| 7 | `mio-sched-2026-08-06` | Venue + address + booking URL | description lines for 住所 / 会場website |
| 8 | `mio-sched-2026-08-07` | Long title | title ≥ 80 chars JA |
| 9 | `mio-sched-2026-07-20` | Past · published | past date (still listed on month page) |
| 10 | `mio-sched-2026-09-01` | Date TBD | `date` null/empty if Core allows; else sentinel + “日付未定” title |
| 11 | `mio-sched-2026-08-10` | Draft | `published: false` — **must not** appear on public read |
| 12 | `mio-sched-2026-08-11` | Pending / hold | Represent as `published: false` + note in description (Core has no pending enum) |
| 13 | `mio-sched-2026-08-12` | No image | `image_url: ""` |
| 14 | `mio-sched-2026-09-15` | Cross-month listing | lives on Sep month; hub links both months |
| 15 | `mio-sched-2026-08-15` | External booking only | description with `https://` reservation URL |
| 16 | `mio-sched-2026-08-16` | Show on home candidate | `show_on_home: true` (Home display deferred until inject exists) |

**Expected public display (when Supabase/static read is wired):**

- Only `published: true` rows on month/hub (Core `.eq("published", true)`).
- Draft/pending (#11–12) absent from public.
- Dual shows (#4–5) both visible, ordered by time/`sort_order`.
- TBD (#10): define explicit Core-compatible representation in implementation phase (see risks).
- Booking URL linkified only if absolute `http(s)` (Gosaki schedule list already has venue-website linkify pattern — Mio adapter may reuse or stay plain HTML in phase 1).

### 5.3 Discography (3–5 releases)

| # | legacy_id | Intent |
| --- | --- | --- |
| 1 | `mio-disco-album-01` | Full album · many tracks · streaming + purchase · release_date set · cover |
| 2 | `mio-disco-album-02` | EP · few tracks · purchase only · no streaming |
| 3 | `mio-disco-single-01` | Single · 1 track · streaming only |
| 4 | `mio-disco-album-03` | **No tracks** · long credit/`description` · release_date unknown |
| 5 | `mio-disco-live-01` (optional) | Live recording · unpublished (`published: false`) — public omit |

Tracks: varying `track_number` / titles; album 01 ≥ 8 tracks; album 03 track list empty.

### 5.4 Videos / embeds

Companion JSON (phase 1) — not HubSpot; not Gosaki Home-only.

| # | id | URL form | published | Expected |
| --- | --- | --- | --- | --- |
| 1 | `mio-yt-01` | `youtube.com/watch?v=` | true | Embed via Core `parseYoutubeVideoId` |
| 2 | `mio-yt-02` | `youtu.be/` | true | Embed |
| 3 | `mio-yt-03` | `/embed/{id}` | true | Embed |
| 4 | `mio-yt-04` | `youtube.com/shorts/` | true | **Risk:** Core parser may **not** accept shorts today → expect fail/skip until Core or adapter extends |
| 5 | `mio-yt-05` | watch URL | **false** | Hidden |
| 6 | `mio-yt-06` | malformed / not YouTube | true | Rejected / not rendered |

### 5.5 About

| Block | Content |
| --- | --- |
| JA short intro | 2–3 sentences |
| JA long profile | 400+ chars |
| EN profile | Short parallel bio |
| Photo | One placeholder portrait |
| No-photo branch | Text-only section for layout test |
| Collaborators | 3 fictional co-performers (name + role) — **not** Gosaki band JSON schema |

### 5.6 Contact / SNS

| Item | Spec |
| --- | --- |
| Form | Generic HTML form **or** `iframe` to a **placeholder** external form URL (documented fake) — **do not** hard-require HubSpot |
| SNS present | Instagram + YouTube channel (fictional handles) |
| SNS missing | X/Twitter intentionally omitted (partial SNS) |
| Footer | Same SNS subset; prove “missing network” does not break layout |

---

## 6. Expected display results (acceptance sketch)

| Surface | Phase 1 (static + noop convert) | Later (read overlay) |
| --- | --- | --- |
| All pages | HTTP-shaped Astro routes; nav works; no Gosaki classes required | — |
| Schedule | Month HTML cards as authored | Published-only; draft hidden; dual shows ordered |
| Discography | Static cards | Supabase patch optional; unpublished album hidden |
| Videos | Static placeholders | Published embeds only; invalid/shorts per policy |
| About | Static JA/EN/photo | Optional `page_fields` later — not required for Mio MVP |
| Contact | Static form/iframe | No HubSpot allowlist |

---

## 7. What current Core already covers

Reusable **without** Gosaki HTML copy:

| Capability | Module / mechanism |
| --- | --- |
| Registry siteKey + staging profile pattern | `config/sites/registry.json` |
| Noop hooks / no adapter load for non-Gosaki | `site-generator-hooks.mjs` + G-20u8 proof |
| Convert/build/static-public pipeline | `astro-generator`, package core |
| Schedule normalize + `published` filter + `site_slug` | `supabase-schedule-read.mjs` |
| Discography + tracks + `published` releases | `supabase-discography-read.mjs` |
| YouTube id parse (watch / youtu.be / embed) + nocookie URL | `youtube-url-utils.mjs` |
| Feature flags opt-in | `cmsFeatures` / `supabaseFeatures` |
| Lazy `generatorHooksAdapter` | ensure API (Gosaki pattern to mirror) |

Phase 1 can mirror **pilot**: register `mio-kisaragi-jazz`, point `fixtureDir`, **no** adapter, all feature flags **false**, prove convert/package isolation from Gosaki.

---

## 8. Where a new site adapter is needed

| Need | Why Core/noop is not enough |
| --- | --- |
| Schedule data pages / hub markup | Gosaki `applyGosakiScheduleDataPages` is site-specific |
| Footer SNS inject | Gosaki `#LnkBr2` / `gosaki-footer-social` |
| Home YouTube inject | Gosaki `#comp-m8y53dj5` + templates |
| About band/content inject | Gosaki mesh selectors + BandProfiles |
| Contact HubSpot | Hard-coded `gosaki-piano` allowlist |
| Discography HTML patch | Wix repeater ids (`comp-llexymga…`) Gosaki-specific |
| Staging read-only admin | Gosaki admin chrome |

**Mio adapter (future):** `mio-kisaragi-jazz-site-generator-hooks-adapter.mjs` (name TBD) registered via `generatorHooksAdapter` — only after static fixture exists. Should target **Mio markup anchors**, not Gosaki Wix ids.

---

## 9. Gaps / unsupported risks (do not implement in this phase)

| Risk | Detail | STOP / defer |
| --- | --- | --- |
| **Shorts URLs** | `parseYoutubeVideoId` does not handle `/shorts/` | Document as expected fail; extend Core later with approval |
| **Draft vs pending** | Core only has boolean `published` | Map both to `published: false` for public; no new enum without schema phase |
| **Date TBD** | `date` empty may break month routing / sort | Define sentinel strategy before Supabase seed |
| **Videos page** | No Core “videos page” generator | Phase 1 static HTML; inject later |
| **Generic contact** | No Core contact CMS | Static only; do not reuse HubSpot adapter |
| **About page_fields** | Optional Core path; Gosaki flag off | Don’t block Mio on About Save |
| **Copying Gosaki HTML** | Would fake portability | **STOP** if implementation starts from Gosaki crawl paste |
| **Real assets** | Copyright / likeness | **STOP** if real photos/bios appear |
| **Write/Save** | Out of scope | **STOP** if Save arm / Edge write appears in early phases |
| **Production / FTP** | Kit rules | **STOP** |

---

## 10. Pass criteria (fixture planning → later implementation)

### Planning phase (this doc)

- [x] Site identity + `siteKey` chosen
- [x] Page list + data matrices defined
- [x] Core reuse vs adapter vs gaps classified
- [x] Phased implementation plan + STOP conditions
- [x] Docs-only; no runtime/package/FTP

### Future implementation gates

1. **M1 — Static fixture lands:** **DONE**
2. **M2 — Registry + staging profile (noop pilot):** **DONE** (`mio-kisaragi-jazz` registered; convert + offline verifier PASS).
3. **M3 — Schedule/Disco JSON read overlay (optional):** published filtering matches matrix; draft hidden. **DONE** (`fixtures/mio-kisaragi-jazz-data/` + offline verifier)
4. **M4 — Thin Mio adapter (optional):** Videos embed + footer SNS without HubSpot/Gosaki selectors. **DONE**
5. **M5 — Verifier:** dedicated `verify-mio-kisaragi-jazz-…` locks routes + matrices offline.

---

## 11. Implementation phases (3–5 steps)

| Step | Phase id (candidate) | Scope | Touch files (minimal candidates) |
| --- | --- | --- | --- |
| **1** | `…-mio-static-fixture-scaffold` | **DONE** — `fixtures/mio-kisaragi-jazz/**` HTML/CSS/images + `fixture-meta.json`; **no** registry | `fixtures/mio-kisaragi-jazz/**` |
| **2** | `…-mio-registry-noop-pilot` | **DONE** — registry + staging deploy-profiles; noop hooks; offline verifier; no package | `registry.json`, `mio-kisaragi-jazz.deploy-profiles.json`, `verify-cms-core-v2-mio-registry-noop-pilot.mjs` |
| **3** | `…-mio-data-fixtures` | Add `fixtures/mio-kisaragi-jazz-data/` for schedule/disco/videos/about matrices (read-only) | **DONE** |
| **4** | `…-mio-hooks-adapter-thin` | Optional adapter: Videos + footer only; register `generatorHooksAdapter` | **DONE** |
| **5** | `…-mio-schedule-read-render` | Schedule read overlay from data fixtures | **DONE** |
| **6** | `…-mio-discography-read-render` | Discography read overlay from data fixtures | **DONE** |
| **7** | `…-mio-about-read-render` | About read overlay from data fixtures | **DONE** |
| **8** | `…-mio-read-render-browser-baseline` | Browser / visual baseline across Mio read surfaces (next) | pending |

**First implementation phase should touch the smallest set:** fixture HTML under `fixtures/mio-kisaragi-jazz/` only (step 1). Registry can wait for step 2 so Core stays untouched.

---

## 12. STOP conditions

Stop and ask human if:

- Production / Gosaki production package / FTP `--apply` appears in scope
- Implementation proposes copying `fixtures/gosaki-piano` HTML or Wix component ids
- Supabase INSERT/Save/Edge write enters early phases
- `service_role` or Secrets changes requested
- Real artist photos/text scraped from the web
- HubSpot portal hard-coded for Mio without a generic contact design
- Core schedule schema change (pending enum, TBD dates) without a dedicated migration plan
- Ambiguous outcome after convert/package (same rule as Kit destructive ops)

---

## 13. Explicit non-goals (scaffold phase)

- No registry.json / Core / adapter
- No package / public-dist / output
- No DB / FTP / Edge
- No commit/push unless operator requests later

---

## Verify (scaffold)

```bash
# fixture + docs only; no runtime verifier committed
git diff --check
rg -i gosaki tools/static-to-astro/fixtures/mio-kisaragi-jazz || true
```
